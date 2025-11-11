import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { Account } from '../models/account.model';
import { Transaction } from '../models/transaction.model';
import { DashboardSummary } from '../models/dashboard-summary.model';
import { UserProfile } from '../models/user.model';
import { unwrapPayload } from '../utils/http.utils';

@Injectable({ providedIn: 'root' })
export class BankDataService {
    private readonly baseUrl = 'api';

    constructor(private readonly http: HttpClient) { }

    getAccounts(): Observable<Account[]> {
        return this.http
            .get<Account[] | { data: Account[] }>(`${this.baseUrl}/accounts`)
            .pipe(map((response) => unwrapPayload(response)));
    }

    getAccountById(accountId: string): Observable<Account | undefined> {
        return this.http
            .get<Account | { data: Account }>(`${this.baseUrl}/accounts/${accountId}`)
            .pipe(map((response) => unwrapPayload(response) ?? undefined));
    }

    getTransactions(accountId?: string): Observable<Transaction[]> {
        let params = new HttpParams();
        if (accountId) {
            params = params.set('accountId', accountId);
        }
        return this.http
            .get<Transaction[] | { data: Transaction[] }>(`${this.baseUrl}/transactions`, { params })
            .pipe(map((response) => unwrapPayload(response)));
    }

    getDashboardSummary(): Observable<DashboardSummary> {
        return this.http
            .get<DashboardSummary | { data: DashboardSummary }>(`${this.baseUrl}/dashboardSummary`)
            .pipe(map((response) => unwrapPayload(response)));
    }

    getUserProfile(): Observable<UserProfile> {
        return this.http
            .get<UserProfile[] | { data: UserProfile[] }>(`${this.baseUrl}/users`)
            .pipe(map((response) => unwrapPayload(response)[0]));
    }
}
