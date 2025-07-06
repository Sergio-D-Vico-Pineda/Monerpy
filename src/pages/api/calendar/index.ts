import { prisma } from "@prisma/index.js";
import type { APIRoute } from "astro";
import { isAuthenticated, getCurrentUserId } from "../../../middleware/auth";

interface CalendarEvent {
    id: number;
    title: string;
    date: string;
    amount: number;
    type: 'income' | 'expense';
    isRecurring: boolean;
}

export const GET: APIRoute = async ({ request }) => {
    if (!isAuthenticated(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    const url = new URL(request.url);
    const month = parseInt(url.searchParams.get("month") || new Date().getMonth().toString());
    const year = parseInt(url.searchParams.get("year") || new Date().getFullYear().toString());

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const userId = getCurrentUserId(request);
    if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    try {
        // Get regular transactions
        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                softDeleted: false,
                transactionDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                id: true,
                amount: true,
                type: true,
                description: true,
                transactionDate: true,
            },
        });

        // Get recurring transactions and calculate occurrences
        const recurringTransactions = await prisma.recurringTransaction.findMany({
            where: {
                userId,
                active: true,
            },
            select: {
                id: true,
                amount: true,
                type: true,
                description: true,
                startDate: true,
                recurrenceRule: true,
                nextOccurrence: true,
            },
        });

        const events: CalendarEvent[] = [
            // Regular transactions
            ...transactions.map(t => ({
                id: t.id,
                title: t.description || `${t.type === 'income' ? 'Income' : 'Expense'}: ${t.amount}`,
                date: t.transactionDate.toISOString().split('T')[0],
                amount: Number(t.amount),
                type: t.type as 'income' | 'expense',
                isRecurring: false
            })),

            // Recurring transactions that occur in this month
            ...recurringTransactions
                .filter(rt => {
                    // const rule = JSON.parse(rt.recurrenceRule);
                    // Aqui tendriamos que calcular las ocurrencias basadas en la regla de recurrencia
                    const occurrenceDate = new Date(rt.nextOccurrence);
                    return occurrenceDate >= startDate && occurrenceDate <= endDate;
                })
                .map(rt => ({
                    id: rt.id,
                    title: rt.description || `Recurring ${rt.type === 'income' ? 'Income' : 'Expense'}: ${rt.amount}`,
                    date: rt.nextOccurrence.toISOString().split('T')[0],
                    amount: Number(rt.amount),
                    type: rt.type as 'income' | 'expense',
                    isRecurring: true
                }))
        ];

        return new Response(JSON.stringify({ events }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error) {
        console.error("Error fetching calendar data:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
        });
    }
};
