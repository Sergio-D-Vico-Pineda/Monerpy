import { isAuthenticated, getSession } from "../middleware/auth.ts";
import type { Session } from "../types/types";
import { prisma } from "@prisma/index.js";
import { compare } from "bcryptjs";

export interface LoginResult {
    success: boolean;
    error?: string;
    user?: {
        id: number;
        email: string;
    };
}

export async function validateCredentials(email: string, password: string): Promise<LoginResult> {
    try {
        if (!email || !password) {
            return { success: false, error: 'missing_credentials' };
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                passwordHash: true,
                deletedAt: true
            }
        });

        if (!user) {
            return { success: false, error: 'user_not_found' };
        }

        if (user.deletedAt) {
            return { success: false, error: 'account_deleted' };
        }

        const validPassword = await compare(password, user.passwordHash);

        if (!validPassword) {
            return { success: false, error: 'invalid_password' };
        }

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email
            }
        };
    } catch (error) {
        console.error('Authentication error:', error);
        return { success: false, error: 'server_error' };
    }
}

export const getCurrentUserId = async (request: Request): Promise<number | null> => {
    if (!isAuthenticated(request)) return null;

    const session: Session | null = getSession(request);
    if (!session) return null;

    const userId = session.userId;
    if (!userId) return null;
    return userId;
};
