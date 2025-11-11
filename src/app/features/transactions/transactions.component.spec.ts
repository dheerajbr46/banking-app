import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TransactionsComponent } from './transactions.component';
import { BankDataService } from '../../core/services/bank-data.service';

const bankDataStub = {
  getAccounts: () =>
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
    ]),
  getTransactions: () =>
    of([
      {
        id: 'txn-1',
        accountId: 'acct-1',
        amount: 125.45,
        category: 'Dining',
        counterparty: 'Mock Bistro',
        date: new Date().toISOString(),
        direction: 'debit',
        status: 'posted',
      },
    ]),
};

describe('TransactionsComponent', () => {
  let component: TransactionsComponent;
  let fixture: ComponentFixture<TransactionsComponent>;

  beforeEach(async () => {
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
});
