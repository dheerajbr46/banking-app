export type TransactionDirection = 'credit' | 'debit';

export interface Transaction {
    id: string;
    accountId: string;
    description: string;
    category: string;
    amount: number;
    currency: string;
    direction: TransactionDirection;
    date: string;
    status: 'posted' | 'pending';
    merchantLogo?: string;
}
