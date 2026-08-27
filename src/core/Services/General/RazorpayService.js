import Razorpay from 'razorpay';
import crypto from 'crypto';
import { withRetry } from '@/core/Helpers/resilience.js';
import { getAppConfig } from '@/core/Lib/appConfig.js';

const safeCompare = (expected, received) => {
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};

/**
 * RazorpayService - Centralized service for payment operations using Razorpay.
 */
class RazorpayService {
    constructor() {
        this.razorpay = null;
    }

    async getCredentials(dynamicConfig = null) {
        if (dynamicConfig?.key_id && dynamicConfig?.key_secret) {
            return { key_id: dynamicConfig.key_id, key_secret: dynamicConfig.key_secret };
        }

        const appConfig = await getAppConfig();
        const keyId = appConfig?.razorpay?.key_id || process.env.RAZORPAY_KEY_ID;
        const keySecret = appConfig?.razorpay?.key_secret || process.env.RAZORPAY_KEY_SECRET;

        if (keyId && keySecret) {
            return { key_id: keyId, key_secret: keySecret };
        }

        throw new Error('Razorpay credentials are not configured in environment or appConfig.');
    }

    async getClient(dynamicConfig = null) {
        const credentials = await this.getCredentials(dynamicConfig);
        if (dynamicConfig?.key_id && dynamicConfig?.key_secret) {
            return new Razorpay(credentials);
        }

        if (!this.razorpay) {
            this.razorpay = new Razorpay(credentials);
        }

        return this.razorpay;
    }

    async createOrder(amount, receipt, notes = {}, dynamicConfig = null) {
        if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
            throw new Error('A valid positive payment amount is required.');
        }

        const client = await this.getClient(dynamicConfig);
        const options = {
            amount: Math.round(Number(amount) * 100),
            currency: "INR",
            receipt: String(receipt || '').slice(0, 40),
            payment_capture: 1,
            notes: typeof notes === 'object' ? notes : {},
        };

        try {
            return await withRetry(async () => {
                return await client.orders.create(options);
            }, {
                maxRetries: 3,
                baseDelayMs: 500,
                shouldRetry: (err) => !err?.error?.code?.includes('BAD_REQUEST')
            });
        } catch (error) {
            throw new Error(error?.error?.description || error?.message || 'Unable to create Razorpay order.');
        }
    }

    async verifySignature(orderId, paymentId, signature, dynamicConfig = null) {
        if (!orderId || !paymentId || !signature) return false;

        const { key_secret: secret } = await this.getCredentials(dynamicConfig);
        const body = `${orderId}|${paymentId}`;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        return safeCompare(expectedSignature, signature);
    }

    async createRefund(paymentId, amount, dynamicConfig = null) {
        if (!paymentId) throw new Error('Payment id is required to create a refund.');
        if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
            throw new Error('A valid positive refund amount is required.');
        }

        const client = await this.getClient(dynamicConfig);
        const options = {
            amount: Math.round(Number(amount) * 100),
            notes: { reason: "Admin initiated refund via platform" }
        };

        try {
            return await withRetry(async () => {
                return await client.payments.refund(paymentId, options);
            }, {
                maxRetries: 3,
                baseDelayMs: 500,
                shouldRetry: (err) => !err?.error?.code?.includes('BAD_REQUEST')
            });
        } catch (error) {
            throw new Error(error?.error?.description || error?.message || 'Unable to create Razorpay refund.');
        }
    }

    async verifyWebhookSignature(body, signature, secret = null) {
        if (!signature) return false;

        const appConfig = await getAppConfig();
        const webhookSecret = secret || appConfig?.razorpay?.webhook_secret || process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) throw new Error('Razorpay webhook secret is not configured.');

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(typeof body === 'string' ? body : JSON.stringify(body))
            .digest('hex');

        return safeCompare(expectedSignature, signature);
    }

    async getPaymentDetails(paymentId, dynamicConfig = null) {
        if (!paymentId) throw new Error('Payment id is required.');
        const client = await this.getClient(dynamicConfig);
        try {
            return await client.payments.fetch(paymentId);
        } catch (error) {
            throw new Error(error?.error?.description || error?.message || 'Unable to fetch payment details.');
        }
    }

    async getOrderDetails(orderId, dynamicConfig = null) {
        if (!orderId) throw new Error('Order id is required.');
        const client = await this.getClient(dynamicConfig);
        try {
            return await client.orders.fetch(orderId);
        } catch (error) {
            throw new Error(error?.error?.description || error?.message || 'Unable to fetch order details.');
        }
    }

    async getRefundDetails(refundId, dynamicConfig = null) {
        if (!refundId) throw new Error('Refund id is required.');
        const client = await this.getClient(dynamicConfig);
        try {
            return await client.refunds.fetch(refundId);
        } catch (error) {
            throw new Error(error?.error?.description || error?.message || 'Unable to fetch refund details.');
        }
    }

    // ==========================================
    // RAZORPAY X (PAYOUTS) INTEGRATION
    // ==========================================

    /**
     * Create a Contact in RazorpayX (Step 1 for Payouts)
     */
    async createContact(data, dynamicConfig = null) {
        const credentials = await this.getCredentials(dynamicConfig);
        const auth = Buffer.from(`${credentials.key_id}:${credentials.key_secret}`).toString('base64');
        try {
            const response = await fetch('https://api.razorpay.com/v1/contacts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${auth}`
                },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    contact: data.contact, // phone number
                    type: data.type || "vendor",
                    reference_id: data.reference_id,
                    notes: data.notes || {}
                })
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error?.description || result.error?.message || 'Unable to create RazorpayX contact.');
            }
            return result;
        } catch (error) {
            throw new Error(error.message || 'Unable to create RazorpayX contact.');
        }
    }

    /**
     * Create a Fund Account for a Contact (Step 2 for Payouts)
     * account_type can be 'bank_account' or 'vpa' (UPI)
     */
    async createFundAccount(data, dynamicConfig = null) {
        const credentials = await this.getCredentials(dynamicConfig);
        const auth = Buffer.from(`${credentials.key_id}:${credentials.key_secret}`).toString('base64');
        try {
            const response = await fetch('https://api.razorpay.com/v1/fund_accounts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${auth}`
                },
                body: JSON.stringify({
                    contact_id: data.contact_id,
                    account_type: data.account_type, 
                    bank_account: data.bank_account, // pass if account_type is 'bank_account'
                    vpa: data.vpa // pass if account_type is 'vpa'
                })
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error?.description || result.error?.message || 'Unable to create RazorpayX fund account.');
            }
            return result;
        } catch (error) {
            throw new Error(error.message || 'Unable to create RazorpayX fund account.');
        }
    }

    /**
     * Create a Payout to the Fund Account (Step 3 for Payouts)
     * account_number is your RazorpayX account number 
     * mode can be NEFT, RTGS, IMPS, UPI
     */
    async createPayout(data, dynamicConfig = null) {
        if (!Number.isFinite(Number(data.amount)) || Number(data.amount) <= 0) {
            throw new Error('A valid positive payout amount is required.');
        }
        
        const credentials = await this.getCredentials(dynamicConfig);
        const auth = Buffer.from(`${credentials.key_id}:${credentials.key_secret}`).toString('base64');
        try {
            const response = await fetch('https://api.razorpay.com/v1/payouts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${auth}`
                },
                body: JSON.stringify({
                    account_number: data.account_number, 
                    fund_account_id: data.fund_account_id,
                    amount: Math.round(Number(data.amount) * 100),
                    currency: "INR",
                    mode: data.mode || "IMPS",
                    purpose: data.purpose || "payout",
                    queue_if_low_balance: data.queue_if_low_balance !== undefined ? data.queue_if_low_balance : true,
                    reference_id: data.reference_id,
                    narration: data.narration || "Vendor Payout",
                    notes: data.notes || {}
                })
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error?.description || result.error?.message || 'Unable to create RazorpayX payout.');
            }
            return result;
        } catch (error) {
            throw new Error(error.message || 'Unable to create RazorpayX payout.');
        }
    }
}

export default new RazorpayService();
