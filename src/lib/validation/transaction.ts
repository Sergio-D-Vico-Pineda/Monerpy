import type { TransactionInput } from '../services/transaction.ts';

interface ValidationError {
    field: string;
    message: string;
}

export function validateTransaction(data: Partial<TransactionInput>): ValidationError[] {
    const errors: ValidationError[] = [];

    // Amount validation
    if (typeof data.amount !== 'number') {
        errors.push({ field: 'amount', message: 'Amount is required and must be a number' });
    } else if (data.amount <= 0) {
        errors.push({ field: 'amount', message: 'Amount must be greater than 0' });
    }

    // Type validation
    if (!data.type) {
        errors.push({ field: 'type', message: 'Type is required' });
    } else if (!['income', 'expense'].includes(data.type)) {
        errors.push({ field: 'type', message: 'Type must be either income or expense' });
    }

    // Transaction date validation
    if (!data.transactionDate) {
        errors.push({ field: 'transactionDate', message: 'Transaction date is required' });
    } else {
        const date = new Date(data.transactionDate);
        if (isNaN(date.getTime())) {
            errors.push({ field: 'transactionDate', message: 'Invalid transaction date' });
        }
    }

    // Description validation (optional but with constraints if provided)
    if (data.description !== undefined && data.description !== null) {
        if (typeof data.description !== 'string') {
            errors.push({ field: 'description', message: 'Description must be a string' });
        } else if (data.description.length > 500) {
            errors.push({ field: 'description', message: 'Description must be less than 500 characters' });
        }
    }

    // Group ID validation (optional but must be a positive number if provided)
    if (data.groupId !== undefined && data.groupId !== null) {
        if (!Number.isInteger(data.groupId) || data.groupId <= 0) {
            errors.push({ field: 'groupId', message: 'Group ID must be a positive integer' });
        }
    }

    return errors;
}
