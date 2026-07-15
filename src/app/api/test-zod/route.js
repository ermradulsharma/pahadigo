import { schemas } from '@/core/Helpers/validation.js';
import { zodToOpenApi } from '@/core/Helpers/zodMapper.js';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const schema = zodToOpenApi(schemas.passwordLogin);
        return Response.json({ success: true, schema });
    } catch (e) {
        return Response.json({ success: false, error: e.message });
    }
}
