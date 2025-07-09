export interface RecurrenceRule {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number; // e.g., every 2 weeks
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    monthOfYear?: number; // 1-12 for yearly
}

export interface RecurringTransactionCreate {
    amount: number;
    type: 'income' | 'expense';
    groupId?: number;
    description?: string;
    startDate: Date;
    endDate?: Date;
    recurrenceRule: RecurrenceRule;
}

export interface RecurringTransaction extends RecurringTransactionCreate {
    id: number;
    userId: number;
    nextOccurrence: Date;
    active: boolean;
    createdAt: Date;
}
