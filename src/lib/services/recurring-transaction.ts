import { prisma } from "@prisma/index.js";
import type { RecurringTransactionCreate, RecurrenceRule } from "../../types/recurring-transaction";

function calculateNextOccurrence(startDate: Date, rule: RecurrenceRule): Date {
    const next = new Date(startDate);
    const now = new Date();

    while (next <= now) {
        switch (rule.frequency) {
            case 'daily':
                next.setDate(next.getDate() + (rule.interval || 1));
                break;
            case 'weekly':
                next.setDate(next.getDate() + ((rule.interval || 1) * 7));
                if (rule.dayOfWeek !== undefined) {
                    while (next.getDay() !== rule.dayOfWeek) {
                        next.setDate(next.getDate() + 1);
                    }
                }
                break;
            case 'monthly':
                next.setMonth(next.getMonth() + (rule.interval || 1));
                if (rule.dayOfMonth) {
                    next.setDate(Math.min(rule.dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
                }
                break;
            case 'yearly':
                next.setFullYear(next.getFullYear() + (rule.interval || 1));
                if (rule.monthOfYear) {
                    next.setMonth(rule.monthOfYear - 1);
                }
                if (rule.dayOfMonth) {
                    next.setDate(Math.min(rule.dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
                }
                break;
        }
    }
    return next;
}

export const recurringTransactionService = {
    async getAll(userId: number) {
        return prisma.recurringTransaction.findMany({
            where: { userId },
            include: {
                group: true,
            },
            orderBy: {
                nextOccurrence: 'asc',
            },
        });
    },

    async getById(id: number, userId: number) {
        return prisma.recurringTransaction.findFirst({
            where: { id, userId },
            include: {
                group: true,
            },
        });
    },

    async create(userId: number, data: RecurringTransactionCreate) {
        const nextOccurrence = calculateNextOccurrence(
            new Date(data.startDate),
            data.recurrenceRule
        );

        return prisma.recurringTransaction.create({
            data: {
                userId,
                amount: data.amount,
                type: data.type,
                groupId: data.groupId,
                description: data.description,
                startDate: data.startDate,
                endDate: data.endDate,
                recurrenceRule: JSON.stringify(data.recurrenceRule),
                nextOccurrence,
                active: true,
            },
            include: {
                group: true,
            },
        });
    },

    async update(id: number, userId: number, data: Partial<RecurringTransactionCreate>) {
        const current = await this.getById(id, userId);
        if (!current) throw new Error("Recurring transaction not found");

        const recurrenceRule = data.recurrenceRule || JSON.parse(current.recurrenceRule);
        const startDate = data.startDate || current.startDate;
        const nextOccurrence = calculateNextOccurrence(new Date(startDate), recurrenceRule);

        return prisma.recurringTransaction.update({
            where: { id },
            data: {
                amount: data.amount,
                type: data.type,
                groupId: data.groupId,
                description: data.description,
                startDate: data.startDate,
                endDate: data.endDate,
                recurrenceRule: data.recurrenceRule ? JSON.stringify(data.recurrenceRule) : undefined,
                nextOccurrence,
            },
            include: {
                group: true,
            },
        });
    },

    async delete(id: number, userId: number) {
        const recurring = await this.getById(id, userId);
        if (!recurring) throw new Error("Recurring transaction not found");

        return prisma.recurringTransaction.delete({
            where: { id },
        });
    },

    async toggleActive(id: number, userId: number) {
        const recurring = await this.getById(id, userId);
        if (!recurring) throw new Error("Recurring transaction not found");

        return prisma.recurringTransaction.update({
            where: { id },
            data: {
                active: !recurring.active,
            },
        });
    },

    async processRecurringTransactions(userId: number) {
        const now = new Date();
        const recurring = await prisma.recurringTransaction.findMany({
            where: {
                userId,
                active: true,
                nextOccurrence: {
                    lte: now,
                },
                OR: [
                    { endDate: null },
                    { endDate: { gt: now } }
                ]
            },
        });

        for (const rt of recurring) {
            // Create the transaction
            await prisma.transaction.create({
                data: {
                    userId: rt.userId,
                    amount: rt.amount,
                    type: rt.type,
                    groupId: rt.groupId,
                    description: rt.description,
                    transactionDate: rt.nextOccurrence,
                },
            });

            // Update next occurrence
            const recurrenceRule = JSON.parse(rt.recurrenceRule) as RecurrenceRule;
            const nextOccurrence = calculateNextOccurrence(rt.nextOccurrence, recurrenceRule);

            // If this would go beyond the end date, deactivate the recurring transaction
            if (rt.endDate && nextOccurrence > rt.endDate) {
                await prisma.recurringTransaction.update({
                    where: { id: rt.id },
                    data: { active: false },
                });
            } else {
                await prisma.recurringTransaction.update({
                    where: { id: rt.id },
                    data: { nextOccurrence },
                });
            }
        }

        return recurring.length;
    },
};
