export interface DashboardSummary {
    netWorth: number;
    monthlySpend: number;
    savingsRate: number;
    upcomingBills: Array<{
        id: string;
        name: string;
        dueDate: string;
        amount: number;
    }>;
    insights: Array<{
        id: string;
        title: string;
        description: string;
    }>;
}
