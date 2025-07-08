import type { APIRoute } from "astro";
import { isAuthenticated, getCurrentUserId } from "@midd/auth";
import { transactionGroupService } from "@lib/services/transaction-group";

export const GET: APIRoute = async ({ params, request }) => {
    if (!isAuthenticated(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    const userId = getCurrentUserId(request);
    if (!userId || !params.id) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    const group = await transactionGroupService.getById(parseInt(params.id), userId);
    if (!group) {
        return new Response(JSON.stringify({ error: "Group not found" }), {
            status: 404,
        });
    }

    return new Response(JSON.stringify(group));
};

export const PUT: APIRoute = async ({ params, request }) => {
    if (!isAuthenticated(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    const userId = getCurrentUserId(request);
    if (!userId || !params.id) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    try {
        const data = await request.json();
        const group = await transactionGroupService.update(
            parseInt(params.id),
            userId,
            {
                name: data.name,
                type: data.type,
                description: data.description,
            }
        );

        return new Response(JSON.stringify(group));
    } catch (error) {
        console.error("Error updating transaction group:", error);
        return new Response(
            JSON.stringify({ error: "Failed to update transaction group" }),
            { status: 500 }
        );
    }
};

export const DEL: APIRoute = async ({ params, request }) => {
    if (!isAuthenticated(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    const userId = getCurrentUserId(request);
    if (!userId || !params.id) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    try {
        await transactionGroupService.delete(parseInt(params.id), userId);
        return new Response(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting transaction group:", error);
        return new Response(
            JSON.stringify({ error: "Failed to delete transaction group" }),
            { status: 500 }
        );
    }
};
