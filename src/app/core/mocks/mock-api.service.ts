import { Injectable } from '@angular/core';
import {
    InMemoryDbService,
    RequestInfo,
    ResponseOptions,
} from 'angular-in-memory-web-api';

import { Account } from '../models/account.model';
import { Transaction } from '../models/transaction.model';
import { DashboardSummary } from '../models/dashboard-summary.model';

interface MockUserRecord {
    id: string;
    name: string;
    email: string;
    password: string;
}

@Injectable({ providedIn: 'root' })
export class MockApiService implements InMemoryDbService {
    createDb() {
        const accounts: Account[] = [
            {
                id: 'acc-1001',
                name: 'Primary Checking',
                type: 'checking',
                balance: 8650.42,
                availableBalance: 8450.42,
                currency: 'USD',
                icon: '💳',
                accountNumber: '•••• 1123',
                lastUpdated: new Date().toISOString(),
            },
            {
                id: 'acc-1002',
                name: 'High-Yield Savings',
                type: 'savings',
                balance: 18250.0,
                availableBalance: 18250.0,
                currency: 'USD',
                icon: '💰',
                accountNumber: '•••• 7644',
                lastUpdated: new Date().toISOString(),
            },
            {
                id: 'acc-1003',
                name: 'Long-term Investments',
                type: 'investment',
                balance: 91000.12,
                availableBalance: 91000.12,
                currency: 'USD',
                icon: '📈',
                accountNumber: '•••• 8890',
                lastUpdated: new Date().toISOString(),
            },
        ];

        const transactions: Transaction[] = [
            {
                id: 'txn-5001',
                accountId: 'acc-1001',
                description: 'Apple Subscription',
                category: 'Digital services',
                amount: 42.9,
                currency: 'USD',
                direction: 'debit',
                date: new Date().toISOString(),
                status: 'posted',
                merchantLogo: 'https://logo.clearbit.com/apple.com',
            },
            {
                id: 'txn-5002',
                accountId: 'acc-1001',
                description: 'Employer Deposit',
                category: 'Income',
                amount: 3250,
                currency: 'USD',
                direction: 'credit',
                date: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
                status: 'posted',
            },
            {
                id: 'txn-5003',
                accountId: 'acc-1002',
                description: 'Automatic Transfer',
                category: 'Savings',
                amount: 500,
                currency: 'USD',
                direction: 'credit',
                date: new Date(Date.now() - 3600 * 1000 * 30).toISOString(),
                status: 'posted',
            },
            {
                id: 'txn-5004',
                accountId: 'acc-1001',
                description: 'Coffee Collective',
                category: 'Dining',
                amount: 8.54,
                currency: 'USD',
                direction: 'debit',
                date: new Date(Date.now() - 3600 * 1000 * 36).toISOString(),
                status: 'posted',
            },
            {
                id: 'txn-5005',
                accountId: 'acc-1003',
                description: 'Index Fund Purchase',
                category: 'Investing',
                amount: 1200,
                currency: 'USD',
                direction: 'debit',
                date: new Date(Date.now() - 3600 * 1000 * 50).toISOString(),
                status: 'pending',
            },
        ];

        const dashboardSummary: DashboardSummary = {
            netWorth: 128540,
            monthlySpend: 4210,
            savingsRate: 0.32,
            upcomingBills: [
                {
                    id: 'bill-1',
                    name: 'Studio Rent',
                    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
                    amount: 2150,
                },
                {
                    id: 'bill-2',
                    name: 'Tesla Finance',
                    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 8).toISOString(),
                    amount: 685.5,
                },
            ],
            insights: [
                {
                    id: 'insight-1',
                    title: 'Savings boost',
                    description: 'You saved 5% more than last month. Keep the automatic transfers going!',
                },
                {
                    id: 'insight-2',
                    title: 'Subscription watch',
                    description: '3 recurring subscriptions renewed in the last 7 days.',
                },
            ],
        };

        const users: MockUserRecord[] = [
            {
                id: 'user-1',
                name: 'Avery Hughes',
                email: 'avery@interactive.bank',
                password: 'banking123',
            },
        ];

        return {
            accounts,
            transactions,
            dashboardSummary,
            users,
        };
    }

    // Provide a friendlier response for the singleton dashboard summary resource.
    get(reqInfo: RequestInfo) {
        if (reqInfo.collectionName === 'dashboardSummary') {
            return reqInfo.utils.createResponse$(() => ({
                status: 200,
                headers: reqInfo.headers,
                url: reqInfo.url,
                body: reqInfo.collection as DashboardSummary,
            } satisfies ResponseOptions));
        }

        return undefined; // fallback to default behaviour
    }
}
