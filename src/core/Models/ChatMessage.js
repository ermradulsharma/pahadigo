import mongoose from 'mongoose';
import { DEFAULTS, USER_ROLES } from '../Constants/index.js';

const ChatMessageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: DEFAULTS.TRUE },
  senderModel: { type: String, required: DEFAULTS.TRUE, enum: Object.values(USER_ROLES) },
  message: { type: String, required: DEFAULTS.TRUE },
  attachments: [{ type: String }],
  isRead: { type: Boolean, default: DEFAULTS.FALSE }
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

export default mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
