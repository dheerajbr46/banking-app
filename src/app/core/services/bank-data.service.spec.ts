import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { skip, take } from 'rxjs';

import { BankDataService } from './bank-data.service';
import { Account } from '../models/account.model';
import { DashboardSummary } from '../models/dashboard-summary.model';

describe('BankDataService', () => {
    let service: BankDataService;
    let httpMock: HttpTestingController;

    const mockAccounts: Account[] = [
        {
            id: 'acc-1',
            name: 'Everyday Checking',
            accountNumber: '••• 1234',
            type: 'checking',
            balance: 3200,
            availableBalance: 3100,
            currency: 'USD',
            lastUpdated: new Date().toISOString(),
        },
    ];

    const mockSummary: DashboardSummary = {
        netWorth: 100000,
        monthlySpend: 4000,
        savingsRate: 0.25,
        upcomingBills: [],
        insights: [],
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });

        service = TestBed.inject(BankDataService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should fetch accounts from the API', () => {
        let result: Account[] | undefined;

        service.getAccounts().subscribe((accounts) => {
            result = accounts;
        });

        const req = httpMock.expectOne('api/accounts');
        expect(req.request.method).toBe('GET');
        req.flush(mockAccounts);

        expect(result).toEqual(mockAccounts);
    });

    it('should unwrap dashboard summary payloads', () => {
        let result: DashboardSummary | undefined;

        service.getDashboardSummary().subscribe((summary) => {
            result = summary;
        });

        const req = httpMock.expectOne('api/dashboardSummary');
        expect(req.request.method).toBe('GET');
        req.flush({ data: mockSummary });

        expect(result).toEqual(mockSummary);
    });

    it('should include accountId parameter when fetching transactions', () => {
        service.getTransactions('acc-1').subscribe();

        const req = httpMock.expectOne((request) => request.url === 'api/transactions');
        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('accountId')).toBe('acc-1');
        req.flush([]);
    });

    it('should trigger a refresh after creating a transfer', () => {
        let refreshEmitted = false;
        service.refresh$.pipe(skip(1), take(1)).subscribe(() => {
            refreshEmitted = true;
        });

        let transferId: string | undefined;
        service
            .createTransfer({ fromAccountId: 'acc-1', toAccountId: 'acc-2', amount: 50, schedule: 'once', memo: 'Test' })
            .subscribe((response) => {
                transferId = response.transferId;
            });

        const req = httpMock.expectOne('api/transfers');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ fromAccountId: 'acc-1', toAccountId: 'acc-2', amount: 50, schedule: 'once', memo: 'Test' });
        req.flush({ transferId: 'trf-123' });

        expect(transferId).toBe('trf-123');
        expect(refreshEmitted).toBe(true);
    });

    it('should trigger a refresh after updating an account', () => {
        let refreshEmitted = false;
        service.refresh$.pipe(skip(1), take(1)).subscribe(() => {
            refreshEmitted = true;
        });

        const updatedAccount: Account = {
            ...mockAccounts[0],
            name: 'Updated Checking',
        };

        let response: Account | undefined;
        service.updateAccount({ id: updatedAccount.id, name: updatedAccount.name }).subscribe((account) => {
            response = account;
        });

        const req = httpMock.expectOne(`api/accounts/${updatedAccount.id}`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ id: updatedAccount.id, name: updatedAccount.name });
        req.flush(updatedAccount);

        expect(response).toEqual(updatedAccount);
        expect(refreshEmitted).toBe(true);
    });
});
