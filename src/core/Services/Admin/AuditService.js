import AuditLog from '@/models/AuditLog.js';
import { getRequestMetadata } from '@/helpers/requestUtils.js';
import { redactSensitiveData } from '@/helpers/security.js';

/**
 * AuditService (Admin Role)
 * Centralized logging and auditing for administrative actions and system modifications.
 */
class AuditService {
    /**
     * Log an administrative action to the AuditLog collection.
     */
    async logAction(userId, action, target, targetId, details = {}, req = null) {
        try {
            if (req) req._auditLogged = true; // Flag to prevent duplicate logging in apiHandler
            const { ipAddress, userAgent } = getRequestMetadata(req);
            const logData = {
                userId,
                action: action.toUpperCase(),
                target: target.toUpperCase(),
                targetId: String(targetId),
                details: redactSensitiveData(details),
                ipAddress,
                userAgent
            };
            await AuditLog.create(logData);
        } catch (error) {
            console.error("[AuditLog] Failed to log:", error.message);
        }
    }

    /**
     * Retrieve and filter system audit logs.
     */
    async getAuditLogs(filter = {}, page = 1, limit = 20) {
        const query = {};
        if (filter.userId) query.userId = filter.userId;
        if (filter.adminId) query.userId = filter.adminId; // Backwards compatibility
        if (filter.action) query.action = filter.action.toUpperCase();
        if (filter.target) query.target = filter.target.toUpperCase();
        if (filter.startDate) query.createdAt = { $gte: new Date(filter.startDate) };

        const total = await AuditLog.countDocuments(query);
        const logs = await AuditLog.find(query)
            .populate('userId', 'name email role')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        return { 
            logs, 
            total, 
            totalPages: Math.ceil(total / limit) 
        };
    }
}

export default new AuditService();
