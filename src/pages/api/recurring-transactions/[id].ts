import type { APIRoute } from "astro";
import { isAuthenticated, getCurrentUserId } from "@midd/auth";
import { recurringTransactionService } from "@lib/services/recurring-transaction";

export const GET: APIRoute = async ({ request, params }) => {
    if (!isAuthenticated(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const userId = getCurrentUserId(request);
    if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const id = Number(params.id);
    if (isNaN(id)) {
        return new Response(JSON.stringify({ error: "Invalid ID" }), { status: 400 });
    }

    try {
        const recurringTransaction = await recurringTransactionService.getById(id, userId);
        if (!recurringTransaction) {
            return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
        }
        return new Response(JSON.stringify(recurringTransaction));
    } catch (error) {
        return new Response(
            JSON.stringify({ error: "Failed to fetch recurring transaction" }),
            { status: 500 }
        );
    }
};

export const PUT: APIRoute = async ({ request, params }) => {
    if (!isAuthenticated(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const userId = getCurrentUserId(request);
    if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const id = Number(params.id);
    if (isNaN(id)) {
        return new Response(JSON.stringify({ error: "Invalid ID" }), { status: 400 });
    }

    try {
        const data = await request.json();
        if (data.startDate) {
            data.startDate = new Date(data.startDate);
        }

        const recurringTransaction = await recurringTransactionService.update(id, userId, data);
        return new Response(JSON.stringify(recurringTransaction));
    } catch (error) {
        return new Response(
            JSON.stringify({ error: "Failed to update recurring transaction" }),
            { status: 500 }
        );
    }
};

export const DELETE: APIRoute = async ({ request, params }) => {
    if (!isAuthenticated(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const userId = getCurrentUserId(request);
    if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const id = Number(params.id);
    if (isNaN(id)) {
        return new Response(JSON.stringify({ error: "Invalid ID" }), { status: 400 });
    }

    try {
        await recurringTransactionService.delete(id, userId);
        return new Response(null, { status: 204 });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: "Failed to delete recurring transaction" }),
            { status: 500 }
        );
    }
};

export const PATCH: APIRoute = async ({ request, params }) => {
    if (!isAuthenticated(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const userId = getCurrentUserId(request);
    if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const id = Number(params.id);
    if (isNaN(id)) {
        return new Response(JSON.stringify({ error: "Invalid ID" }), { status: 400 });
    }

    try {
        const recurringTransaction = await recurringTransactionService.toggleActive(id, userId);
        return new Response(JSON.stringify(recurringTransaction));
    } catch (error) {
        return new Response(
            JSON.stringify({ error: "Failed to toggle recurring transaction status" }),
            { status: 500 }
        );
    }
};
