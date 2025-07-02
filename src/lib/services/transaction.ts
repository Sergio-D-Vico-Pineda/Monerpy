import { prisma } from "@prisma/index.js";
import { Decimal } from "@prisma/client/runtime/library";

export interface TransactionInput {
    amount: number;
    type: 'income' | 'expense';
    description?: string;
    transactionDate: Date;
    groupId?: number;
}

export interface TransactionWithGroup {
    id: number;
    amount: Decimal;
    type: string;
    description: string | null;
    transactionDate: Date;
    createdAt: Date;
    group: {
        id: number;
        name: string;
        type: string;
    } | null;
}

export interface TransactionSummary {
    totalIncome: number;
    totalExpense: number;
    balance: number;
}

export interface DateRangeFilter {
    type: 'last7days' | 'last30days' | 'thisMonth' | null;
}

export interface TransactionFilters {
    search?: string;
    dateRange?: DateRangeFilter;
    types?: ('income' | 'expense')[];
}

export const transactionService = {
    getDateRangeFilter(filter: DateRangeFilter): { gte: Date, lte: Date } | null {
        if (!filter.type) return null;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (filter.type) {
            case 'last7days':
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // -6 because we want to include today
                return {
                    gte: sevenDaysAgo,
                    lte: new Date(today.setDate(today.getDate() + 1))
                };
            case 'last30days':
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); // -29 because we want to include today
                return {
                    gte: thirtyDaysAgo,
                    lte: new Date(today.setDate(today.getDate() + 1))
                };
            case 'thisMonth':
                return {
                    gte: new Date(now.getFullYear(), now.getMonth(), 1),
                    lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
                };
            default:
                return null;
        }
    },

    async list(
        userId: number,
        page: number = 1,
        filters: TransactionFilters = {}
    ): Promise<{
        transactions: TransactionWithGroup[],
        total: number,
        pages: number,
        summary: TransactionSummary
    }> {
        const take = 20;
        const skip = (page - 1) * take;

        const dateRange = filters.dateRange ? this.getDateRangeFilter(filters.dateRange) : null;

        const where = {
            userId,
            softDeleted: false,
            ...(typeof filters.search === 'string' && filters.search.trim() !== '' ? {
                description: {
                    contains: filters.search.trim(),
                    mode: 'insensitive' as const,
                }
            } : {}),
            ...(dateRange ? {
                transactionDate: {
                    gte: dateRange.gte,
                    lte: dateRange.lte
                }
            } : {}),
            ...(filters.types && filters.types.length > 0 ? {
                type: {
                    in: filters.types
                }
            } : {})
        };

        const [transactions, total, summary] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    group: {
                        select: {
                            id: true,
                            name: true,
                            type: true
                        }
                    }
                },
                orderBy: {
                    transactionDate: 'desc'
                },
                take,
                skip,
            }),
            prisma.transaction.count({ where }),
            this.calculateSummary(userId)
        ]);

        return {
            transactions,
            total,
            pages: Math.ceil(total / take),
            summary
        };
    },

    async create(userId: number, data: TransactionInput) {
        return prisma.transaction.create({
            data: {
                ...data,
                userId,
                amount: new Decimal(data.amount),
            },
            include: {
                group: {
                    select: {
                        id: true,
                        name: true,
                        type: true
                    }
                }
            }
        });
    },

    async update(userId: number, id: number, data: TransactionInput) {
        const transaction = await prisma.transaction.findFirst({
            where: {
                id,
                userId,
                softDeleted: false
            }
        });

        if (!transaction) {
            throw new Error('Transaction not found');
        }

        return prisma.transaction.update({
            where: { id },
            data: {
                ...data,
                amount: new Decimal(data.amount),
            },
            include: {
                group: {
                    select: {
                        id: true,
                        name: true,
                        type: true
                    }
                }
            }
        });
    },

    async delete(userId: number, ids: number[]) {
        await prisma.transaction.updateMany({
            where: {
                id: { in: ids },
                userId,
                softDeleted: false
            },
            data: {
                softDeleted: true
            }
        });
    },

    async calculateSummary(userId: number): Promise<TransactionSummary> {
        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                softDeleted: false
            },
            select: {
                type: true,
                amount: true
            }
        });

        const summary = transactions.reduce((acc: { totalIncome: number, totalExpense: number }, transaction) => {
            const amount = transaction.amount.toNumber();
            if (transaction.type === 'income') {
                acc.totalIncome += amount;
            } else {
                acc.totalExpense += amount;
            }
            return acc;
        }, { totalIncome: 0, totalExpense: 0 });

        return {
            ...summary,
            balance: summary.totalIncome - summary.totalExpense
        };
    }
};
