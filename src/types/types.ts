interface Session {
    userId: number;
    email: string;
    created: string;
}

interface User {
    id: number;
    username: string;
    passwordHash: string;
    email: string;
    role: string;
    createdAt: string;
    deletedAt?: string;

    transactionGroups: TransactionGroup[];
    transactions: Transaction[];
    recurringTransactions: RecurringTransaction[];
    auditLogs: AuditLog[];
    imports: Import[];
    deletedRecords: DeletedRecord[];
}

interface TransactionGroup {
    id: number;
    user: User;
    userId: number;
    name: string;
    description?: string;
    type: string; // 'income' or 'expense'
    softDeleted: boolean;
    createdAt: string;

    transactions: Transaction[];
    recurringTransactions: RecurringTransaction[];
}

interface Transaction {
    id: number;
    user: User;
    userId: number;
    amount: number;
    type: string; // 'income' or 'expense'
    group?: TransactionGroup;
    groupId?: number;
    description?: string;
    transactionDate: string;
    createdAt: string;
    softDeleted: boolean;
}

interface RecurringTransaction {
    id: number;
    user: User;
    userId: number;
    amount: number;
    type: string; // 'income' or 'expense'
    group?: TransactionGroup;
    groupId?: number;
    description?: string;
    startDate: string;
    endDate?: string;
    recurrenceRule: string;
    nextOccurrence: string;
    active: boolean;
    createdAt: string;
}

interface AuditLog {
    id: number;
    user: User;
    userId: number;
    action: string;
    tableName: string;
    recordId: number;
    previousState?: Record<string, unknown>;
    newState?: Record<string, unknown>;
    performedAt: string;
}

interface Import {
    id: number;
    user: User;
    userId: number;
    filename?: string;
    mapping?: Record<string, unknown>;
    importedAt: string;
}

interface DeletedRecord {
    id: number;
    user: User;
    userId: number;
    tableName: string;
    recordId: number;
    recordData: Record<string, unknown>;
    deletedAt: string;
}

export type {
    Session,
    User,
    TransactionGroup,
    Transaction,
    RecurringTransaction,
    AuditLog,
    Import,
    DeletedRecord
};