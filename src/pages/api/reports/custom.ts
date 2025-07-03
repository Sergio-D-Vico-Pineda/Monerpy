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
    const range1Start = new Date(url.searchParams.get('range1Start') || '');
    const range1End = new Date(url.searchParams.get('range1End') || '');
    const range2Start = new Date(url.searchParams.get('range2Start') || '');
    const range2End = new Date(url.searchParams.get('range2End') || '');

    // Validate dates
    if (
        isNaN(range1Start.getTime()) || 
        isNaN(range1End.getTime()) || 
        isNaN(range2Start.getTime()) || 
        isNaN(range2End.getTime())
    ) {
        return new Response(JSON.stringify({ error: 'Invalid date parameters' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const data = await reportService.getCustomRangeComparison(
            userId,
            range1Start,
            range1End,
            range2Start,
            range2End
        );
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch custom range report' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
