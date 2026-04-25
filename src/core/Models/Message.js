import mongoose from 'mongoose';
import User from './User.js';
import { DEFAULTS } from '../Constants/index.js';

// Backward compatibility: Register Admin model if not exists (using User schema)
if (!mongoose.models.Admin) {
  mongoose.model('Admin', User.schema);
}

const MessageSchema = new mongoose.Schema({
  disputeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispute', required: DEFAULTS.TRUE, unique: DEFAULTS.TRUE },
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, refPath: 'senderModel', required: DEFAULTS.TRUE },
    senderModel: { type: String, required: DEFAULTS.TRUE, enum: ['User', 'Vendor', 'Admin'] },
    message: { type: String, required: DEFAULTS.TRUE },
    target: { type: String, enum: ['traveller', 'vendor', 'all'], default: 'all' },
    attachments: [String],
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

if (mongoose.models.Message) {
  delete mongoose.models.Message;
}

export default mongoose.model('Message', MessageSchema);
