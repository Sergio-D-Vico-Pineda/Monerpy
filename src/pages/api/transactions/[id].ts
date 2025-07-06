import type { APIRoute } from 'astro';
import { getCurrentUserId } from '../../../lib/auth';
import { transactionService } from '../../../lib/services/transaction';

export const PUT: APIRoute = async ({ request, params }) => {
    try {
        const userId = getCurrentUserId(request);
        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const id = parseInt(params.id!);
        if (isNaN(id)) {
            return new Response(JSON.stringify({ error: 'Invalid transaction ID' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = await request.json();
        const transaction = await transactionService.update(userId, id, data);

        return new Response(JSON.stringify(transaction), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        console.error('Error updating transaction:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
            status: error.message === 'Transaction not found' ? 404 : 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const DELETE: APIRoute = async ({ request, params }) => {
    try {
        const userId = getCurrentUserId(request);
        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const id = parseInt(params.id!);
        if (isNaN(id)) {
            return new Response(JSON.stringify({ error: 'Invalid transaction ID' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await transactionService.delete(userId, [id]);

        return new Response(null, { status: 204 });
    } catch (error: any) {
        console.error('Error deleting transaction:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
            status: error.message === 'Transaction not found' ? 404 : 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
