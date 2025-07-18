import type { APIRoute } from 'astro';
import { getCurrentUserId } from '@lib/auth';
import { transactionService } from '@lib/services/transaction';
import { validateTransaction } from '@lib/validation/transaction';

export const GET: APIRoute = async ({ request, url }) => {
    try {
        const userId = await getCurrentUserId(request);
        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const page = parseInt(url.searchParams.get('page') || '1');
        const search = url.searchParams.get('search');
        const dateRange = url.searchParams.get('dateRange');
        const types = url.searchParams.getAll('type');

        const filters = {
            search: search && search.trim() !== '' ? search.trim() : undefined,
            dateRange: dateRange ? { type: dateRange as 'last7days' | 'last30days' | 'thisMonth' } : undefined,
            types: types.length > 0 ? types as ('income' | 'expense')[] : undefined
        };

        const result = await transactionService.list(userId, page, filters);

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const userId = await getCurrentUserId(request);
        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = await request.json();

        // Validate transaction data
        const validationErrors = validateTransaction(data);
        if (validationErrors.length > 0) {
            return new Response(JSON.stringify({
                error: 'Validation failed',
                validationErrors
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const transaction = await transactionService.create(userId, data);

        return new Response(JSON.stringify(transaction), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        console.error('Error creating transaction:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
