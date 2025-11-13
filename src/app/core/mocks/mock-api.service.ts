import { Injectable } from '@angular/core';
import {
    InMemoryDbService,
    RequestInfo,
    RequestInfoUtilities,
    ResponseOptions,
    ParsedRequestUrl,
} from 'angular-in-memory-web-api';

import { Account } from '../models/account.model';
import { Transaction } from '../models/transaction.model';
import { DashboardSummary } from '../models/dashboard-summary.model';
import { UserProfile } from '../models/user.model';

type TransferSchedule = 'once' | 'weekly' | 'monthly';

interface TransferRecord {
    id: string;
    createdAt: string;
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    schedule: TransferSchedule;
    memo?: string;
}

interface MockDatabase {
    accounts: Account[];
    transactions: Transaction[];
    dashboardSummary: DashboardSummary;
    users: MockUserRecord[];
    transfers: TransferRecord[];
}

interface MockUserRecord {
    id: string;
    name: string;
    email: string;
    password: string;
}

@Injectable({ providedIn: 'root' })
export class MockApiService implements InMemoryDbService {
    private accounts: Account[] = [];
    private transactions: Transaction[] = [];
    private users: MockUserRecord[] = [];
    private dashboardSummary!: DashboardSummary;
    private transfers: TransferRecord[] = [];

    createDb(): MockDatabase {
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

        const transfers: TransferRecord[] = [];

        this.accounts = accounts;
        this.transactions = transactions;
        this.dashboardSummary = dashboardSummary;
        this.users = users;
        this.transfers = transfers;

        return {
            accounts,
            transactions,
            dashboardSummary,
            users,
            transfers,
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

    post(reqInfo: RequestInfo) {
        if (reqInfo.collectionName === 'transfers') {
            return reqInfo.utils.createResponse$(() => this.createTransfer(reqInfo));
        }

        if (reqInfo.collectionName === 'transactions') {
            return reqInfo.utils.createResponse$(() => this.createTransaction(reqInfo));
        }

        return undefined;
    }

    put(reqInfo: RequestInfo) {
        if (reqInfo.collectionName === 'accounts') {
            return reqInfo.utils.createResponse$(() => this.updateAccount(reqInfo));
        }

        if (reqInfo.collectionName === 'users') {
            return reqInfo.utils.createResponse$(() => this.updateUser(reqInfo));
        }

        return undefined;
    }

    parseRequestUrl(url: string, utils: RequestInfoUtilities): ParsedRequestUrl {
        const parsed = utils.parseRequestUrl(url);
        if (parsed.collectionName === 'transfers') {
            parsed.collectionName = 'transfers';
        }
        return parsed;
    }

    private createTransfer(reqInfo: RequestInfo): ResponseOptions {
        const body = reqInfo.utils.getJsonBody(reqInfo.req) as {
            fromAccountId: string;
            toAccountId: string;
            amount: number;
            memo?: string;
            schedule: TransferSchedule;
        };

        if (!body.fromAccountId || !body.toAccountId || body.amount <= 0) {
            return {
                status: 400,
                body: { message: 'Invalid transfer payload.' },
            } satisfies ResponseOptions;
        }

        const fromAccount = this.accounts.find((account) => account.id === body.fromAccountId);
        const toAccount = this.accounts.find((account) => account.id === body.toAccountId);

        if (!fromAccount || !toAccount) {
            return {
                status: 404,
                body: { message: 'Account not found.' },
            } satisfies ResponseOptions;
        }

        const timestamp = new Date().toISOString();

        fromAccount.balance = Math.max(0, fromAccount.balance - body.amount);
        fromAccount.availableBalance = Math.max(0, fromAccount.availableBalance - body.amount);
        fromAccount.lastUpdated = timestamp;

        toAccount.balance += body.amount;
        toAccount.availableBalance += body.amount;
        toAccount.lastUpdated = timestamp;

        const debitTransaction: Transaction = {
            id: `txn-${crypto.randomUUID?.() ?? Date.now()}`,
            accountId: fromAccount.id,
            description: body.memo?.trim() || `Transfer to ${toAccount.name}`,
            category: 'Transfers',
            amount: body.amount,
            currency: fromAccount.currency,
            direction: 'debit',
            date: timestamp,
            status: 'posted',
        };

        const creditTransaction: Transaction = {
            id: `txn-${crypto.randomUUID?.() ?? Date.now()}-credit`,
            accountId: toAccount.id,
            description: body.memo?.trim() || `Transfer from ${fromAccount.name}`,
            category: 'Transfers',
            amount: body.amount,
            currency: toAccount.currency,
            direction: 'credit',
            date: timestamp,
            status: 'posted',
        };

        this.transactions.unshift(debitTransaction, creditTransaction);

        const transferRecord: TransferRecord = {
            id: `trf-${crypto.randomUUID?.() ?? Date.now()}`,
            createdAt: timestamp,
            fromAccountId: fromAccount.id,
            toAccountId: toAccount.id,
            amount: body.amount,
            schedule: body.schedule,
            memo: body.memo?.trim() || undefined,
        };

        this.transfers.unshift(transferRecord);

        this.dashboardSummary.netWorth = this.accounts.reduce((total, account) => total + account.balance, 0);

        this.syncDb(reqInfo);

        return {
            status: 201,
            body: {
                transferId: transferRecord.id,
                createdAt: timestamp,
                schedule: body.schedule,
                amount: body.amount,
                fromAccount,
                toAccount,
            },
        } satisfies ResponseOptions;
    }

    private createTransaction(reqInfo: RequestInfo): ResponseOptions {
        const body = reqInfo.utils.getJsonBody(reqInfo.req) as Transaction;
        if (!body || !body.accountId || !body.amount) {
            return {
                status: 400,
                body: { message: 'Invalid transaction payload.' },
            } satisfies ResponseOptions;
        }

        const account = this.accounts.find((item) => item.id === body.accountId);
        if (!account) {
            return {
                status: 404,
                body: { message: 'Account not found.' },
            } satisfies ResponseOptions;
        }

        const transaction: Transaction = {
            ...body,
            id: body.id ?? `txn-${crypto.randomUUID?.() ?? Date.now()}`,
            date: body.date ?? new Date().toISOString(),
            status: body.status ?? 'posted',
            currency: account.currency,
        };

        this.transactions.unshift(transaction);

        if (transaction.direction === 'credit') {
            account.balance += transaction.amount;
            account.availableBalance += transaction.amount;
        } else {
            account.balance = Math.max(0, account.balance - transaction.amount);
            account.availableBalance = Math.max(0, account.availableBalance - transaction.amount);
        }
        account.lastUpdated = transaction.date;

        this.dashboardSummary.netWorth = this.accounts.reduce((total, item) => total + item.balance, 0);

        this.syncDb(reqInfo);

        return {
            status: 201,
            body: transaction,
        } satisfies ResponseOptions;
    }

    private updateAccount(reqInfo: RequestInfo): ResponseOptions {
        const body = reqInfo.utils.getJsonBody(reqInfo.req) as Partial<Account> & { id: string };
        if (!body?.id) {
            return { status: 400, body: { message: 'Account id missing.' } } satisfies ResponseOptions;
        }

        const index = this.accounts.findIndex((item) => item.id === body.id);
        if (index === -1) {
            return { status: 404, body: { message: 'Account not found.' } } satisfies ResponseOptions;
        }

        const updated: Account = {
            ...this.accounts[index],
            ...body,
            lastUpdated: body.lastUpdated ?? new Date().toISOString(),
        };
        this.accounts[index] = updated;

        this.syncDb(reqInfo);

        return {
            status: 200,
            body: updated,
        } satisfies ResponseOptions;
    }

    private updateUser(reqInfo: RequestInfo): ResponseOptions {
        const body = reqInfo.utils.getJsonBody(reqInfo.req) as Partial<MockUserRecord> & { id: string };
        if (!body?.id) {
            return { status: 400, body: { message: 'User id missing.' } } satisfies ResponseOptions;
        }

        const index = this.users.findIndex((item) => item.id === body.id);
        if (index === -1) {
            return { status: 404, body: { message: 'User not found.' } } satisfies ResponseOptions;
        }

        const updated: MockUserRecord = {
            ...this.users[index],
            ...body,
        };
        this.users[index] = updated;

        this.syncDb(reqInfo);

        const profile: UserProfile = {
            id: updated.id,
            name: updated.name,
            email: updated.email,
        };

        return {
            status: 200,
            body: profile,
        } satisfies ResponseOptions;
    }

    private syncDb(reqInfo: RequestInfo): void {
        const db = reqInfo.utils.getDb() as MockDatabase;
        db.accounts = this.accounts;
        db.transactions = this.transactions;
        db.dashboardSummary = this.dashboardSummary;
        db.users = this.users;
        db.transfers = this.transfers;
    }
}
