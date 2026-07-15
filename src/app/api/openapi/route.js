import { generateOpenApiSpec } from '@/core/Helpers/openApi.js';

export const dynamic = 'force-dynamic';

export async function GET() {
    return Response.json(generateOpenApiSpec());
}
