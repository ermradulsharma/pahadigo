import mongoose from "mongoose";
import AppError from "../appError.js";
import { Package } from "../../Models/Package/Package.js";
import { getAppConfig, getUserById } from "../queryHelpers.js";
import InventoryService from "@/core/Services/Vendor/InventoryService.js";
import Booking from "@/core/Models/Booking";
import { bookingPayload } from "../bookingHelper";
import NotificationService from "@/core/Services/General/NotificationService.js";

const generateNumericOTP = () => randomInt(100000, 1000000).toString();
const generateBookingCode = () => `PH-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${randomBytes(4).toString('hex').toUpperCase()}`;

export const initiateBooking = async ({ userId, body, itemId }) => {
    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
        throw AppError.notFound(RESPONSE_MESSAGES.PACKAGE.NOT_FOUND);
    }
    const targetItemId = new mongoose.Types.ObjectId(itemId);

    const session = await mongoose.startSession();
    let finalResponse;

    try {
        await session.withTransaction(async () => {
            const config = await getAppConfig();
            const checkInDate = new Date(body.startDate);
            const checkOutDate = new Date(body.endDate);
            if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
                throw AppError.badRequest("Invalid startDate or endDate format. Use YYYY-MM-DD.");
            }

            // All schema keys in Package model
            const schemaKeys = [
                'homestay', 'hotel', 'camping', 'trekking', 'rafting',
                'bungeeJumping', 'vehicleRental', 'chardhamTour', 'customTrip',
                'skiing', 'paragliding'
            ];

            // Single MongoDB Aggregation Pipeline to fetch Package Item + Vendor + BankDetails
            const pipeline = [
                // Stage 1: Indexed match across all categories
                {
                    $match: {
                        $or: schemaKeys.map(key => ({ [`${key}._id`]: targetItemId }))
                    }
                },
                // Stage 2: Extract target item and attach its category key
                {
                    $project: {
                        vendor: 1,
                        matchedItem: {
                            $concatArrays: schemaKeys.map(key => ({
                                $map: {
                                    input: {
                                        $filter: {
                                            input: { $ifNull: [`$${key}`, []] },
                                            as: "sub",
                                            cond: { $eq: ["$$sub._id", targetItemId] }
                                        }
                                    },
                                    as: "it",
                                    in: {
                                        $mergeObjects: [
                                            "$$it",
                                            { category: key }
                                        ]
                                    }
                                }
                            }))
                        }
                    }
                },
                { $unwind: "$matchedItem" },
                // Stage 3: Ensure item is active
                {
                    $match: {
                        "matchedItem.isActive": { $ne: false }
                    }
                },
                // Stage 4: Lookup Vendor details + BankDetails for payout
                {
                    $lookup: {
                        from: 'vendors',
                        localField: 'vendor',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $project: {
                                    _id: 1,
                                    businessName: 1,
                                    ownerName: 1,
                                    isOperating: 1,
                                    isApproved: 1,
                                    bankDetails: 1
                                }
                            }
                        ],
                        as: 'vendorDoc'
                    }
                },
                { $unwind: "$vendorDoc" },
                // Stage 5: Final Clean Projection
                {
                    $project: {
                        _id: 0,
                        catalogId: { $toString: "$_id" },
                        category: "$matchedItem.category",
                        item: {
                            _id: "$matchedItem._id",
                            title: "$matchedItem.title",
                            photos: { $ifNull: ["$matchedItem.photos", []] },
                            pricing: "$matchedItem.pricing",
                            isActive: "$matchedItem.isActive"
                        },
                        business: {
                            id: { $toString: "$vendorDoc._id" },
                            businessName: "$vendorDoc.businessName",
                            ownerName: "$vendorDoc.ownerName",
                            isOperating: "$vendorDoc.isOperating",
                            bankDetails: "$vendorDoc.bankDetails"
                        }
                    }
                }
            ];

            const [packageData] = await Package.aggregate(pipeline).session(session);
            if (!packageData || !packageData.item) {
                throw AppError.notFound(RESPONSE_MESSAGES.PACKAGE.NOT_FOUND);
            }

            const { catalogId, category, business, item: packageItem } = packageData;
            if (!business?.id || business.isOperating === false) {
                throw AppError.notFound(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
            }
            const businessId = business.id;

            // Traveller User lookup via queryHelper
            const travellerProfile = await getUserById(userId, '', null, { session });
            if (!travellerProfile) throw AppError.notFound(RESPONSE_MESSAGES.USER.NOT_FOUND);

            const pricingRules = packageItem.pricing || {};

            // Price logic
            let itemBaseprice = pricingRules.basePrice || 0;

            let itemGST = 0;
            if (pricingRules.gst) {
                itemGST = parseFloat(pricingRules.gst);
            } else if (pricingRules.gst !== undefined && pricingRules.gst !== null && pricingRules.gst !== '') {
                const taxKey = `tax_${category.replace(/-/g, '_')}`;
                itemGST = parseFloat(config.tax[taxKey] || 0);
            }

            let itemServiceTax = 0;
            if (pricingRules.serviceTax) {
                itemServiceTax = parseFloat(pricingRules.serviceTax);
            } else if (pricingRules.serviceTax !== undefined && pricingRules.serviceTax !== null && pricingRules.serviceTax !== '') {
                itemServiceTax = parseFloat(config.tax.service_tax || 0);
            }

            const adultsCount = parseInt(body.adults) || 1;
            const childrenCount = parseInt(body.children) || 0;
            const isSelfIncluded = body.includeMe === 'true' || body.includeMe === true;
            const guestDetails = body.guestDetails || [];

            const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
            const totalNights = Math.max(1, Math.round(timeDiff / (1000 * 60 * 60 * 24)));
            const requestedUnits = parseInt(body.units) > 0 ? parseInt(body.units) : 1;

            let calculatedSubTotal = 0;
            let requiredUnits = requestedUnits;

            const STAY_CATEGORIES = ['homestay', 'hotel', 'camping'];
            const ACTIVITY_CATEGORIES = ['trekking', 'rafting', 'bungeeJumping'];
            const RENTAL_CATEGORIES = ['bike-scooter-rental', 'chardham-tour', 'vehicleRental', 'chardhamTour'];

            if (STAY_CATEGORIES.includes(category)) {
                if (category === 'homestay') {
                    requiredUnits = 1;
                } else {
                    const maxCapacityPerUnit = parseInt(pricingRules.maxAdults) > 0 ? parseInt(pricingRules.maxAdults) : 2;
                    requiredUnits = Math.max(requestedUnits, Math.ceil(adultsCount / maxCapacityPerUnit));
                }
                calculatedSubTotal = itemBaseprice * totalNights * requiredUnits;
            } else if (ACTIVITY_CATEGORIES.includes(category)) {
                const maxFreeChildren = parseInt(pricingRules.maxChildren) || 0;
                const childRate = pricingRules.childPrice || 0;
                const chargeableChildren = childrenCount > maxFreeChildren ? childrenCount - maxFreeChildren : 0;
                calculatedSubTotal = (itemBaseprice * adultsCount) + (childRate * chargeableChildren);
                requiredUnits = adultsCount + childrenCount;
            } else {
                const isRentalOrTour = RENTAL_CATEGORIES.includes(category);
                const durationMultiplier = isRentalOrTour ? totalNights : 1;
                calculatedSubTotal = itemBaseprice * requiredUnits * durationMultiplier;
            }

            const toCent = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

            calculatedSubTotal = toCent(calculatedSubTotal);
            let d = pricingRules.discountType;
            let discountAmount = 0;
            if (d === "percentage") {
                discountAmount = calculatedSubTotal * ((pricingRules.discount || 0) / 100);
            } else if (d === "flat") {
                discountAmount = pricingRules.discount || 0;
            }

            const appliedDiscount = toCent(discountAmount);
            const taxableAmount = Math.max(0, toCent(calculatedSubTotal - appliedDiscount));

            let tax = 0;
            if (itemGST) tax = taxableAmount * (itemGST / 100);
            const calculatedTax = toCent(tax);

            let serviceFee = 0;
            if (itemServiceTax) {
                const baseServiceFee = taxableAmount * (itemServiceTax / 100);
                const gstOnServiceFee = baseServiceFee * ((config?.tax?.gst || 18) / 100);
                serviceFee = baseServiceFee + gstOnServiceFee;
            }
            const appliedServiceFee = toCent(serviceFee);

            const baseAmount = itemBaseprice || 0;
            const appliedCouponCode = null;
            const appliedCouponAmount = 0;
            const appliedTaxRate = itemGST || 0;
            const grandTotal = Math.max(0, toCent(calculatedSubTotal + calculatedTax + appliedServiceFee - appliedDiscount - appliedCouponAmount));

            // Inventory check
            const availabilityStatus = await InventoryService.checkAvailabilityRange(businessId, itemId, category, checkInDate, checkOutDate, requiredUnits);
            if (!availabilityStatus.available) throw AppError.badRequest(RESPONSE_MESSAGES.BOOKING.SLOTS_NOT_AVAILABLE);

            let itemUrl = '';
            if (Array.isArray(packageItem.photos) && packageItem.photos.length > 0) {
                itemUrl = packageItem.photos[0].url || packageItem.photos[0] || '';
            }
            if (typeof itemUrl !== 'string') itemUrl = '';

            let newBooking;
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                try {
                    const bookingCode = generateBookingCode();
                    const [createdBooking] = await Booking.create([{
                        bookingCode,
                        user: userId,
                        vendor: business.id,
                        package: catalogId,
                        item: {
                            itemId: packageItem._id,
                            itemType: category,
                            title: packageItem.title,
                            url: itemUrl
                        },
                        traveller: {
                            name: travellerProfile.name,
                            phone: travellerProfile.phone,
                            email: travellerProfile.email
                        },
                        startDate: checkInDate,
                        endDate: checkOutDate,
                        occupancy: {
                            adults: adultsCount,
                            children: childrenCount,
                            includeMe: isSelfIncluded,
                            guestDetails,
                            units: requiredUnits
                        },
                        pricing: {
                            basePrice: baseAmount,
                            subTotal: calculatedSubTotal,
                            discount: appliedDiscount,
                            coupon: appliedCouponCode,
                            couponAmount: Math.round(appliedCouponAmount),
                            taxRate: appliedTaxRate,
                            serviceFee: appliedServiceFee,
                            tax: calculatedTax,
                            total: grandTotal
                        },
                        payout: {
                            amount: 0,
                            bankDetails: {
                                accountHolderName: business.bankDetails?.accountHolderName || null,
                                accountNumber: business.bankDetails?.accountNumber || null,
                                ifscCode: business.bankDetails?.ifscCode || null,
                                bankName: business.bankDetails?.bankName || null,
                                razorpayContactId: business.bankDetails?.razorpayContactId || null,
                                razorpayFundAccountId: business.bankDetails?.razorpayFundAccountId || null
                            },
                            businessName: business.businessName,
                            ownerName: business.ownerName
                        },
                        status: BOOKING_STATUS.PENDING,
                        paymentStatus: PAYMENT_STATUS.UNPAID,
                        timeline: [{
                            status: 'Booking Initiated',
                            remarks: `Booking record ${bookingCode} created for ${requiredUnits} units. Awaiting payment.`,
                            actor: userId
                        }]
                    }], { session });

                    newBooking = createdBooking;
                    break;
                } catch (err) {
                    if (err.code === 11000 && err.message.includes('bookingCode')) {
                        attempts++;
                        if (attempts >= maxAttempts) {
                            throw AppError.internal('Unable to generate a unique booking code. Please try again.');
                        }
                    } else {
                        throw err;
                    }
                }
            }

            const finalCheck = await InventoryService.checkAvailabilityRange(businessId, itemId, category, checkInDate, checkOutDate, requiredUnits, session, newBooking._id);
            if (!finalCheck.available) throw AppError.conflict(`Inventory Conflict: Slots became unavailable.`);

            NotificationService.notifyBookingStatus(newBooking._id, 'created');

            const bookingObj = newBooking.toObject ? newBooking.toObject() : newBooking;
            bookingObj.user = travellerProfile;
            bookingObj.vendor = business;
            finalResponse = bookingPayload(bookingObj);
        });

        return finalResponse;
    } catch (error) {
        throw (error instanceof AppError ? error : AppError.badRequest(error.message || 'Booking failed'));
    } finally {
        session.endSession();
    }
}

export default { initiateBooking };