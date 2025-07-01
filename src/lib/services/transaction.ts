import { prisma } from "@prisma/index.js";

export interface TransactionInput {
    date: Date;
    description?: string;
    splits: {
        type: 'income' | 'expense';
        amount: number;
        category_id?: number;
        note?: string;
        tags?: number[];
    }[];
}

export const transactionService = {
    async list(userId: number, page: number = 1, search?: string) {
        const take = 20;
        const skip = (page - 1) * take;

        const where = {
            user_id: userId,
            deleted_at: null,
            ...(search ? {
                description: {
                    contains: search,
                    mode: 'insensitive' as const,
                }
            } : {}),
        };

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    splits: {
                        include: {
                            category: true,
                            tags: true,
                        }
                    }
                },
                orderBy: {
                    date: 'desc'
                },
                take,
                skip,
            }),
            prisma.transaction.count({ where })
        ]);

        return {
            transactions,
            total,
            pages: Math.ceil(total / take)
        };
    },

    async create(userId: number, data: TransactionInput) {
        const { splits, ...transactionData } = data;

        // Validate splits balance
        const totalIncome = splits
            .filter(s => s.type === 'income')
            .reduce((sum, s) => sum + s.amount, 0);
        
        const totalExpense = splits
            .filter(s => s.type === 'expense')
            .reduce((sum, s) => sum + s.amount, 0);

        if (totalIncome !== totalExpense) {
            throw new Error('Transaction splits must balance to zero');
        }

        return prisma.transaction.create({
            data: {
                ...transactionData,
                user_id: userId,
                splits: {
                    create: splits.map(({ tags, ...split }) => ({
                        ...split,
                        ...(tags ? {
                            tags: {
                                connect: tags.map(id => ({ id }))
                            }
                        } : {})
                    }))
                }
            },
            include: {
                splits: {
                    include: {
                        category: true,
                        tags: true
                    }
                }
            }
        });
    },

    async update(userId: number, id: number, data: Partial<TransactionInput>) {
        const transaction = await prisma.transaction.findFirst({
            where: {
                id,
                user_id: userId,
                deleted_at: null
            }
        });

        if (!transaction) {
            throw new Error('Transaction not found');
        }

        const { splits, ...transactionData } = data;

        if (splits) {
            // Validate splits balance
            const totalIncome = splits
                .filter(s => s.type === 'income')
                .reduce((sum, s) => sum + s.amount, 0);
            
            const totalExpense = splits
                .filter(s => s.type === 'expense')
                .reduce((sum, s) => sum + s.amount, 0);

            if (totalIncome !== totalExpense) {
                throw new Error('Transaction splits must balance to zero');
            }

            // Delete existing splits
            await prisma.split.deleteMany({
                where: { transaction_id: id }
            });
        }

        return prisma.transaction.update({
            where: { id },
            data: {
                ...transactionData,
                ...(splits ? {
                    splits: {
                        create: splits.map(({ tags, ...split }) => ({
                            ...split,
                            ...(tags ? {
                                tags: {
                                    connect: tags.map(id => ({ id }))
                                }
                            } : {})
                        }))
                    }
                } : {})
            },
            include: {
                splits: {
                    include: {
                        category: true,
                        tags: true
                    }
                }
            }
        });
    },

    async delete(userId: number, id: number) {
        const transaction = await prisma.transaction.findFirst({
            where: {
                id,
                user_id: userId,
                deleted_at: null
            }
        });

        if (!transaction) {
            throw new Error('Transaction not found');
        }

        return prisma.transaction.update({
            where: { id },
            data: {
                deleted_at: new Date()
            }
        });
    }
};
