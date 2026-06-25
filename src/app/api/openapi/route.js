import { generateOpenApiSpec } from '@/core/Helpers/openApi.js';

export async function GET() {
    return Response.json(generateOpenApiSpec());
}
