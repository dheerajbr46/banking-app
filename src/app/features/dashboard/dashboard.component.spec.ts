import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { BankDataService } from '../../core/services/bank-data.service';

const bankDataStub = {
  getDashboardSummary: () =>
    of({
      greeting: 'Welcome back',
      totalBalance: 48000,
      totalAccounts: 4,
      monthlySpend: 2200,
      savingsRate: 0.32,
    }),
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
        amount: 650.25,
        category: 'Rent',
        counterparty: 'Mock Apartments',
        date: new Date().toISOString(),
        direction: 'debit',
        status: 'posted',
      },
    ]),
};

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      providers: [{ provide: BankDataService, useValue: bankDataStub }],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
