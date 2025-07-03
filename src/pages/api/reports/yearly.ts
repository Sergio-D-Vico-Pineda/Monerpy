import { isAuthenticated, getCurrentUserId } from '../../../middleware/auth';
import { reportService } from '../../../lib/services/report';

export async function get({ request }: { request: Request }) {
    if (!isAuthenticated(request)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const userId = await getCurrentUserId(request);
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const url = new URL(request.url);
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());

    try {
        const data = await reportService.getYearlyComparison(userId, year);
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch yearly report' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
