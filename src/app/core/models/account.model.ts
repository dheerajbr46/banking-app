export interface Account {
    id: string;
    name: string;
    type: 'checking' | 'savings' | 'investment' | 'credit';
    balance: number;
    availableBalance: number;
    currency: string;
    icon?: string;
    accountNumber: string;
    lastUpdated: string;
}
