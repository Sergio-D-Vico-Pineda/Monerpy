import type { APIRoute } from 'astro';
import { isAuthenticated, getSession } from '@midd/auth.ts';
import { transactionService } from '@lib/services/transaction';
import { prisma } from '@prisma/index.js';

export const GET: APIRoute = async ({ request }) => {
    try {
        if (!isAuthenticated(request)) {
            return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
        }

        const session = await getSession(request);
        if (!session?.userId) {
            return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
        }

        const url = new URL(request.url);
        const month = parseInt(url.searchParams.get('month') || '');
        const year = parseInt(url.searchParams.get('year') || '');

        if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
            return new Response(JSON.stringify({ error: 'Invalid month or year' }), { status: 400 });
        }

        // Get both calendar events and monthly summary in parallel
        const [events, summary] = await Promise.all([
            prisma.transaction.findMany({
                where: {
                    userId: session.userId,
                    softDeleted: false,
                    transactionDate: {
                        gte: new Date(year, month - 1, 1),
                        lte: new Date(year, month, 0, 23, 59, 59)
                    }
                },
                select: {
                    id: true,
                    amount: true,
                    description: true,
                    type: true,
                    transactionDate: true
                }
            }),
            transactionService.calculateMonthSummary(session.userId, month, year)
        ]);

        // Transform the events into the format expected by the calendar
        const calendarEvents = events.map(event => ({
            id: event.id,
            title: event.description || `${event.type} transaction`,
            date: event.transactionDate.toISOString().split('T')[0],
            amount: event.amount.toNumber(),
            type: event.type,
            isRecurring: false // We'll implement recurring transactions later
        }));

        return new Response(JSON.stringify({
            events: calendarEvents,
            summary
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error in calendar endpoint:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
};
