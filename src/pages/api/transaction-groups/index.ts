import type { APIRoute } from "astro";
import { isAuthenticated, getCurrentUserId } from "../../../middleware/auth";
import { transactionGroupService } from "../../../lib/services/transaction-group";

export const GET: APIRoute = async ({ request }) => {
    if (!isAuthenticated(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    const userId = await getCurrentUserId(request);
    if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    const groups = await transactionGroupService.list(userId);
    return new Response(JSON.stringify(groups));
};

export const POST: APIRoute = async ({ request }) => {
    if (!isAuthenticated(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    const userId = await getCurrentUserId(request);
    if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    try {
        const data = await request.json();
        const group = await transactionGroupService.create(userId, {
            name: data.name,
            type: data.type,
            description: data.description,
        });

        return new Response(JSON.stringify(group), { status: 201 });
    } catch (error) {
        console.error("Error creating transaction group:", error);
        return new Response(
            JSON.stringify({ error: "Failed to create transaction group" }),
            { status: 500 }
        );
    }
};
