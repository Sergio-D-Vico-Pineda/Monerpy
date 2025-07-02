import { prisma } from "@prisma/index.js";
import { compare, hash } from "bcryptjs";

export interface UserUpdateInput {
    username?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
}

export const userService = {
    async getById(userId: number) {
        return prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });
    },

    async update(userId: number, data: UserUpdateInput) {
        // Check if username is unique
        if (data.username) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    username: data.username,
                    id: { not: userId },
                    deletedAt: null,
                },
            });
            if (existingUser) {
                throw new Error("Username already taken");
            }
        }

        // Check if email is unique
        if (data.email) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    email: data.email,
                    id: { not: userId },
                    deletedAt: null,
                },
            });
            if (existingUser) {
                throw new Error("Email already taken");
            }
        }

        // If changing password, verify current password
        let passwordHash: string | undefined;
        if (data.newPassword) {
            if (!data.currentPassword) {
                throw new Error("Current password is required to set a new password");
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { passwordHash: true },
            });

            if (!user) {
                throw new Error("User not found");
            }

            // Compare current password
            const validPassword = await compare(
                data.currentPassword,
                user.passwordHash
            );
            if (!validPassword) {
                throw new Error("Current password is incorrect");
            }

            // Hash new password
            passwordHash = await hash(data.newPassword, 12);
        }

        // Remove password fields from data before update
        const { currentPassword, newPassword, ...updateData } = data;

        return prisma.user.update({
            where: { id: userId },
            data: {
                ...updateData,
                ...(passwordHash && { passwordHash }),
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });
    },
};
