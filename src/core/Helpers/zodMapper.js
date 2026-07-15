import { z } from 'zod';

export const zodToOpenApi = (schema) => {
    if (!schema || !schema._def) return {};

    const def = schema._def;
    const typeName = def.typeName;

    switch (typeName) {
        case z.ZodFirstPartyTypeKind.ZodObject:
            const properties = {};
            const required = [];
            const shape = typeof schema.shape === 'function' ? schema.shape() : schema.shape;
            
            for (const [key, propSchema] of Object.entries(shape || {})) {
                properties[key] = zodToOpenApi(propSchema);
                if (!propSchema.isOptional()) {
                    required.push(key);
                }
            }
            return {
                type: 'object',
                properties,
                ...(required.length > 0 && { required })
            };
            
        case z.ZodFirstPartyTypeKind.ZodString:
            return { type: 'string' };
            
        case z.ZodFirstPartyTypeKind.ZodNumber:
            return { type: 'number' };
            
        case z.ZodFirstPartyTypeKind.ZodBoolean:
            return { type: 'boolean' };
            
        case z.ZodFirstPartyTypeKind.ZodArray:
            return { 
                type: 'array',
                items: zodToOpenApi(def.type)
            };
            
        case z.ZodFirstPartyTypeKind.ZodEnum:
            return { 
                type: 'string',
                enum: def.values 
            };
            
        case z.ZodFirstPartyTypeKind.ZodOptional:
        case z.ZodFirstPartyTypeKind.ZodNullable:
            return zodToOpenApi(def.innerType);
            
        default:
            return { type: 'string' }; // fallback
    }
};
