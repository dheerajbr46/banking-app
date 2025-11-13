import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';

import { TransactionsComponent } from './transactions.component';
import { BankDataService } from '../../core/services/bank-data.service';

class BankDataServiceStub {
  private readonly refreshSubject = new Subject<void>();
  readonly refresh$ = this.refreshSubject.asObservable();

  getAccounts = jasmine.createSpy('getAccounts').and.returnValue(
    of([
      {
        id: 'acct-1',
        name: 'Everyday Checking',
        accountNumber: '••• 1234',
        type: 'checking',
        balance: 3200,
        currency: 'USD',
        availableBalance: 3000,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'acct-2',
        name: 'High-Yield Savings',
        accountNumber: '••• 5678',
        type: 'savings',
        balance: 7800,
        currency: 'USD',
        availableBalance: 7800,
        lastUpdated: new Date().toISOString(),
      },
    ])
  );

  getTransactions = jasmine.createSpy('getTransactions').and.callFake((accountId?: string) =>
    of([
      {
        id: 'txn-1',
        accountId: accountId ?? 'acct-1',
        amount: 125.45,
        category: 'Dining',
        description: 'Mock Bistro',
        date: new Date().toISOString(),
        currency: 'USD',
        direction: 'debit' as const,
        status: 'posted' as const,
      },
    ])
  );

  createTransaction = jasmine.createSpy('createTransaction').and.callFake((payload: unknown) => {
    const body = payload as {
      accountId: string;
      amount: number;
      category: string;
      description: string;
      direction: 'credit' | 'debit';
    };

    return of({
      id: 'txn-2',
      accountId: body.accountId,
      amount: body.amount,
      category: body.category,
      description: body.description,
      currency: 'USD',
      direction: body.direction,
      date: new Date().toISOString(),
      status: 'posted' as const,
    });
  });

  emitRefresh(): void {
    this.refreshSubject.next();
  }
}

describe('TransactionsComponent', () => {
  let component: TransactionsComponent;
  let fixture: ComponentFixture<TransactionsComponent>;
  let bankDataStub: BankDataServiceStub;

  beforeEach(async () => {
    bankDataStub = new BankDataServiceStub();

    await TestBed.configureTestingModule({
      declarations: [TransactionsComponent],
      providers: [{ provide: BankDataService, useValue: bankDataStub }],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();

    fixture = TestBed.createComponent(TransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default the filter to all accounts while syncing the form to the first account', () => {
    expect(component.selectedAccountId()).toBeNull();
    expect(component.newTransactionForm.getRawValue().accountId).toBe('acct-1');
  });

  it('should update the account filter when changeAccountFilter is invoked', () => {
    component.changeAccountFilter('acct-2');
    expect(component.selectedAccountId()).toBe('acct-2');

    component.changeAccountFilter(null);
    expect(component.selectedAccountId()).toBeNull();
  });

  it('should submit a new transaction and record success feedback', () => {
    component.newTransactionForm.patchValue({
      description: 'Coffee run',
      category: 'Dining',
      amount: 18,
      direction: 'debit',
    });

    component.submitNewTransaction();

    expect(bankDataStub.createTransaction).toHaveBeenCalledWith({
      accountId: 'acct-1',
      description: 'Coffee run',
      category: 'Dining',
      amount: 18,
      direction: 'debit',
    });

    expect(component.createSuccess()).toContain('Coffee run');
    expect(component.createError()).toBeNull();
  });
});
