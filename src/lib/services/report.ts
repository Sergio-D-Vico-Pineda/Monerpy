import { prisma } from "@prisma/index.js";

export interface TransactionSummary {
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    incomeByGroup: { groupName: string; amount: number }[];
    expensesByGroup: { groupName: string; amount: number }[];
    dailyTotals: { date: string; income: number; expenses: number }[];
}

export interface PeriodComparison {
    currentPeriod: TransactionSummary;
    previousPeriod: TransactionSummary;
}

export const reportService = {
    async getTransactionSummary(
        userId: number,
        startDate: Date,
        endDate: Date
    ): Promise<TransactionSummary> {
        // Get all transactions for the period
        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                transactionDate: {
                    gte: startDate,
                    lte: endDate,
                },
                softDeleted: false,
            },
            include: {
                group: true,
            },
            orderBy: {
                transactionDate: 'asc',
            },
        });

        // Calculate totals
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        // Group by category
        const incomeByGroup = this.groupTransactionsByCategory(
            transactions.filter(t => t.type === 'income')
        );

        const expensesByGroup = this.groupTransactionsByCategory(
            transactions.filter(t => t.type === 'expense')
        );

        // Calculate daily totals
        const dailyTotals = this.calculateDailyTotals(transactions, startDate, endDate);

        return {
            totalIncome,
            totalExpenses,
            netAmount: totalIncome - totalExpenses,
            incomeByGroup,
            expensesByGroup,
            dailyTotals,
        };
    },

    async getMonthlyComparison(userId: number, year: number, month: number): Promise<PeriodComparison> {
        // Calculate current month's date range
        const currentStartDate = new Date(year, month - 1, 1);
        const currentEndDate = new Date(year, month, 0);

        // Calculate previous month's date range
        const previousStartDate = new Date(year, month - 2, 1);
        const previousEndDate = new Date(year, month - 1, 0);

        return {
            currentPeriod: await this.getTransactionSummary(userId, currentStartDate, currentEndDate),
            previousPeriod: await this.getTransactionSummary(userId, previousStartDate, previousEndDate),
        };
    },

    async getYearlyComparison(userId: number, year: number): Promise<PeriodComparison> {
        // Calculate current year's date range
        const currentStartDate = new Date(year, 0, 1);
        const currentEndDate = new Date(year, 11, 31);

        // Calculate previous year's date range
        const previousStartDate = new Date(year - 1, 0, 1);
        const previousEndDate = new Date(year - 1, 11, 31);

        return {
            currentPeriod: await this.getTransactionSummary(userId, currentStartDate, currentEndDate),
            previousPeriod: await this.getTransactionSummary(userId, previousStartDate, previousEndDate),
        };
    },

    async getCustomRangeComparison(
        userId: number, 
        range1Start: Date, 
        range1End: Date, 
        range2Start: Date, 
        range2End: Date
    ): Promise<PeriodComparison> {
        return {
            currentPeriod: await this.getTransactionSummary(userId, range1Start, range1End),
            previousPeriod: await this.getTransactionSummary(userId, range2Start, range2End),
        };
    },

    groupTransactionsByCategory(transactions: any[]) {
        const groups = new Map<string, number>();

        transactions.forEach(transaction => {
            const groupName = transaction.group?.name || 'Uncategorized';
            const currentAmount = groups.get(groupName) || 0;
            groups.set(groupName, currentAmount + Number(transaction.amount));
        });

        return Array.from(groups.entries()).map(([groupName, amount]) => ({
            groupName,
            amount,
        }));
    },

    calculateDailyTotals(transactions: any[], startDate: Date, endDate: Date) {
        const dailyMap = new Map<string, { income: number; expenses: number }>();
        
        // Initialize all dates in the range
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            dailyMap.set(dateKey, { income: 0, expenses: 0 });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Fill in actual transaction data
        transactions.forEach(transaction => {
            const dateKey = new Date(transaction.transactionDate)
                .toISOString()
                .split('T')[0];
            const current = dailyMap.get(dateKey) || { income: 0, expenses: 0 };

            if (transaction.type === 'income') {
                current.income += Number(transaction.amount);
            } else {
                current.expenses += Number(transaction.amount);
            }

            dailyMap.set(dateKey, current);
        });

        return Array.from(dailyMap.entries()).map(([date, totals]) => ({
            date,
            ...totals,
        }));
    },

    async getMonthlyBreakdown(userId: number, year: number): Promise<{ month: number; summary: TransactionSummary }[]> {
        const breakdowns = [];
        for (let month = 1; month <= 12; month++) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            const summary = await this.getTransactionSummary(userId, startDate, endDate);
            breakdowns.push({ month, summary });
        }
        return breakdowns;
    },

    generateCSVReport(summary: TransactionSummary): string {
        let csv = 'Category,Type,Amount\n';
        
        // Add income by group
        summary.incomeByGroup.forEach(({ groupName, amount }) => {
            csv += `${groupName},Income,${amount}\n`;
        });

        // Add expenses by group
        summary.expensesByGroup.forEach(({ groupName, amount }) => {
            csv += `${groupName},Expense,${amount}\n`;
        });

        // Add daily totals
        csv += '\nDate,Income,Expenses,Net\n';
        summary.dailyTotals.forEach(({ date, income, expenses }) => {
            csv += `${date},${income},${expenses},${income - expenses}\n`;
        });

        // Add summary
        csv += '\nSummary,Amount\n';
        csv += `Total Income,${summary.totalIncome}\n`;
        csv += `Total Expenses,${summary.totalExpenses}\n`;
        csv += `Net Amount,${summary.netAmount}\n`;

        return csv;
    }
};
