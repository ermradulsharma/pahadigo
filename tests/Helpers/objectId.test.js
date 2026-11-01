import mongoose from 'mongoose';
import objectIdHelper from '@/core/Helpers/objectId.js';

const toObjectId = objectIdHelper?.toObjectId || objectIdHelper;

describe('toObjectId Helper Test', () => {
    it('should convert valid string id to mongoose.Types.ObjectId', () => {
        const idStr = '507f1f77bcf86cd799439011';
        const result = toObjectId(idStr);
        expect(result).toBeInstanceOf(mongoose.Types.ObjectId);
        expect(result.toString()).toBe(idStr);
    });

    it('should return already existing ObjectId directly', () => {
        const objId = new mongoose.Types.ObjectId();
        expect(toObjectId(objId)).toBe(objId);
    });

    it('should return null for invalid or empty id', () => {
        expect(toObjectId(null)).toBeNull();
        expect(toObjectId(undefined)).toBeNull();
        expect(toObjectId('')).toBeNull();
        expect(toObjectId('invalid-id')).toBeNull();
        expect(toObjectId('123')).toBeNull();
    });
});
