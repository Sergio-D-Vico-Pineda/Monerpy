import type { APIRoute } from "astro";
import { isAuthenticated, getCurrentUserId } from "@midd/auth";
import { recurringTransactionService } from "@lib/services/recurring-transaction";

export const GET: APIRoute = async ({ request }) => {
    if (!isAuthenticated(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    const userId = getCurrentUserId(request);
    if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    
    try {
        // Process any pending recurring transactions
        await recurringTransactionService.processRecurringTransactions(userId);
        
        // Get all recurring transactions
        const recurringTransactions = await recurringTransactionService.getAll(userId);
        return new Response(JSON.stringify(recurringTransactions));
    } catch (error) {
        return new Response(
            JSON.stringify({ error: "Failed to fetch recurring transactions" }),
            { status: 500 }
        );
    }
};

export const POST: APIRoute = async ({ request }) => {
    if (!isAuthenticated(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    const userId = getCurrentUserId(request);
    if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const data = await request.json();
        const recurringTransaction = await recurringTransactionService.create(userId, {
            ...data,
            startDate: new Date(data.startDate),
        });
        return new Response(JSON.stringify(recurringTransaction), { status: 201 });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: "Failed to create recurring transaction" }),
            { status: 500 }
        );
    }
};
