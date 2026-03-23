import mongoose from 'mongoose';

const DisputeSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        index: true
    },
    raisedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true,
        index: true
    },
    reason: {
        type: String,
        required: true,
        enum: [
            'vendor_no_show',
            'quality_issue',
            'safety_concern',
            'wrong_information',
            'other'
        ]
    },
    description: {
        type: String,
        required: true
    },
    evidenceUrls: [{
        url: String,
        publicId: String
    }],
    status: {
        type: String,
        enum: ['open', 'investigating', 'resolved_refunded', 'resolved_rejected'],
        default: 'open',
        index: true
    },
    adminNotes: {
        type: String
    },
    resolvedAt: {
        type: Date
    }
}, { timestamps: true });

export default mongoose.models.Dispute || mongoose.model('Dispute', DisputeSchema);
