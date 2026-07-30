import SchemaOrModel from '@/core/Models/ChatMessage.js';

describe('Model/Schema: ChatMessage.js', () => {
    it('should export a valid Mongoose Schema or Model', () => {
        expect(SchemaOrModel).toBeDefined();
        
        // Check if it's a model
        expect(SchemaOrModel.modelName || SchemaOrModel.schema).toBeDefined();
        
    });
});
