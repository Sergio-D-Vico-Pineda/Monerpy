import type { APIRoute } from 'astro';
import { isAuthenticated, getSession } from '@midd/auth.ts';
import { prisma } from '@prisma/index.js';

function generateOccurrencesInMonth(
    startDate: Date,
    recurrenceRule: any,
    amount: number,
    type: string,
    description: string | null,
    id: number,
    year: number,
    month: number,
    endDate: Date | null = null
): Array<any> {
    const occurrences = [];
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59));
    let currentDate = new Date(startDate);

    while (currentDate <= monthEnd) {
        // Check if we've passed the end date
        if (endDate && currentDate > endDate) {
            break;
        }

        if (currentDate >= monthStart) {
            occurrences.push({
                id: id,
                title: description || `${type} transaction (recurring)`,
                date: currentDate.toISOString().split('T')[0],
                type,
                amount,
                recurring: true
            });
        }

        // Advance to next occurrence based on recurrence rule
        switch (recurrenceRule.frequency) {
            case 'daily':
                currentDate.setDate(currentDate.getDate() + (recurrenceRule.interval || 1));
                break;
            case 'weekly':
                currentDate.setDate(currentDate.getDate() + ((recurrenceRule.interval || 1) * 7));
                break;
            case 'monthly':
                currentDate.setMonth(currentDate.getMonth() + (recurrenceRule.interval || 1));
                if (recurrenceRule.dayOfMonth) {
                    currentDate.setDate(Math.min(recurrenceRule.dayOfMonth, new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()));
                }
                break;
            case 'yearly':
                currentDate.setFullYear(currentDate.getFullYear() + (recurrenceRule.interval || 1));
                if (recurrenceRule.monthOfYear) {
                    currentDate.setMonth(recurrenceRule.monthOfYear - 1);
                }
                if (recurrenceRule.dayOfMonth) {
                    currentDate.setDate(Math.min(recurrenceRule.dayOfMonth, new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()));
                }
                break;
        }
    }
    return occurrences;
}

export const GET: APIRoute = async ({ request }) => {
    try {
        if (!isAuthenticated(request)) {
            return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
        }

        const session = getSession(request);
        if (!session?.userId) {
            return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
        }

        const url = new URL(request.url);
        const month = parseInt(url.searchParams.get('month') || '');
        const year = parseInt(url.searchParams.get('year') || '');

        if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
            return new Response(JSON.stringify({ error: 'Invalid month or year' }), { status: 400 });
        }

        // Get regular transactions
        const transactions = await prisma.transaction.findMany({
            where: {
                userId: session.userId,
                softDeleted: false,
                transactionDate: {
                    gte: new Date(year, month - 1, 1),
                    lte: new Date(Date.UTC(year, month, 0, 23, 59, 59))
                }
            },
            select: {
                id: true,
                amount: true,
                description: true,
                type: true,
                transactionDate: true
            }
        });

        // Get recurring transactions
        const recurringTransactions = await prisma.recurringTransaction.findMany({
            where: {
                userId: session.userId,
                active: true,
                startDate: {
                    lte: new Date(Date.UTC(year, month, 0, 23, 59, 59))
                },
                OR: [
                    { endDate: null },
                    {
                        endDate: {
                            gte: new Date(year, month - 1, 1)
                        }
                    }
                ]
            }
        });

        // Transform regular transactions
        const regularEvents = transactions.map(event => {
            const dateFormatted = event.transactionDate.toISOString().split('T')[0];
            
            return {
                id: event.id,
                title: event.description || `${event.type} transaction`,
                date: dateFormatted,
                type: event.type,
                amount: event.amount.toNumber(),
                recurring: false
            };
        });

        // Generate occurrences for recurring transactions
        const recurringEvents = recurringTransactions.flatMap(rt =>
            generateOccurrencesInMonth(
                rt.startDate,
                JSON.parse(rt.recurrenceRule),
                rt.amount.toNumber(),
                rt.type,
                rt.description,
                rt.id,
                year,
                month,
                rt.endDate
            )
        );

        // Combine both types of events
        const calendarEvents = [...regularEvents, ...recurringEvents];
        
        console.log(`[Calendar API] Returning ${calendarEvents.length} events for ${year}-${month}:`, calendarEvents);

        return new Response(JSON.stringify({ events: calendarEvents }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in calendar API:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
};
