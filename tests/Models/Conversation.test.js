import SchemaOrModel from '@/core/Models/Conversation.js';

describe('Model/Schema: Conversation.js', () => {
    it('should export a valid Mongoose Schema or Model', () => {
        expect(SchemaOrModel).toBeDefined();
        
        // Check if it's a model
        expect(SchemaOrModel.modelName || SchemaOrModel.schema).toBeDefined();
        
    });
});
