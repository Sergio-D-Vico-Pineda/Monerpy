import type { APIRoute } from "astro";
import { getCurrentUserId } from "../../../lib/auth";
import { userService } from "../../../lib/services/user";

export const PUT: APIRoute = async ({ request }) => {
    try {
        const userId = await getCurrentUserId(request);
        if (!userId) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const data = await request.json();
        const user = await userService.update(userId, {
            username: data.username,
            email: data.email,
        });

        return new Response(JSON.stringify(user), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("Error updating user profile:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Failed to update profile" }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
};
