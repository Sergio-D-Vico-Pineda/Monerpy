import { prisma } from "@prisma/index.js";
import type { TransactionGroup } from "@prisma/client";

interface TransactionGroupInput {
    name: string;
    description?: string;
    type: "income" | "expense";
}

export const transactionGroupService = {
    async list(userId: number, options?: { search?: string }) {
        const where = {
            userId,
            softDeleted: false,
            ...(options?.search
                ? {
                      OR: [
                          { name: { contains: options.search } },
                          { description: { contains: options.search } },
                      ],
                  }
                : {}),
        };

        const groups = await prisma.transactionGroup.findMany({
            where,
            orderBy: { name: "asc" },
        });

        return groups;
    },

    async create(userId: number, data: TransactionGroupInput): Promise<TransactionGroup> {
        return prisma.transactionGroup.create({
            data: {
                ...data,
                userId,
            },
        });
    },

    async getById(id: number, userId: number): Promise<TransactionGroup | null> {
        return prisma.transactionGroup.findFirst({
            where: {
                id,
                userId,
                softDeleted: false,
            },
        });
    },

    async update(
        id: number,
        userId: number,
        data: TransactionGroupInput
    ): Promise<TransactionGroup> {
        return prisma.transactionGroup.update({
            where: {
                id,
                userId,
            },
            data,
        });
    },

    async delete(id: number, userId: number): Promise<TransactionGroup> {
        return prisma.transactionGroup.update({
            where: {
                id,
                userId,
            },
            data: {
                softDeleted: true,
            },
        });
    },
};
