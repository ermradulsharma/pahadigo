import mongoose from "mongoose";
import Notification from "@/core/Models/Notification.js";
import { getNotificationsBy } from "@/core/Helpers/queryHelpers.js";
import AppError from "../AppError.js";

export async function getNotifications(options = {}) {
    try {
        const { userId, page = 1, limit = 10 } = options;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) throw AppError.unauthorized("Valid user ID is required");
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const skip = (page - 1) * limit;
        const pipeline = [
            { $match: { recipient: userObjectId, isDeleted: false } },
            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $project: {
                                _id: 0,
                                id: '$_id',
                                title: 1,
                                message: 1,
                                imageUrl: 1,
                                isRead: 1,
                                createdAt: 1
                            }
                        }
                    ],
                    totalCount: [{ $count: 'count' }],
                }
            }
        ];
        const [result] = await Notification.aggregate(pipeline);
        const notifications = result?.data || [];
        const total = result?.totalCount?.[0]?.count || 0;
        return {
            notifications,
            pagination: {
                total,
                page: page,
                limit: limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        throw error;
    }
}

export default { getNotifications };