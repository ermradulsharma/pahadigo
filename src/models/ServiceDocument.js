import mongoose from "mongoose";

const ServiceDocumentSchema = new mongoose.Schema({
    category_slug: {
        type: String,
        required: true,
        index: true
    },
    slug: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    isMandatory: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export default mongoose.model(
    "ServiceDocument",
    ServiceDocumentSchema
);
