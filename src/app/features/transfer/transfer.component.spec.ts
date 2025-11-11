import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { TransferComponent } from './transfer.component';
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
    ]),
};

describe('TransferComponent', () => {
  let component: TransferComponent;
  let fixture: ComponentFixture<TransferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [TransferComponent],
      providers: [{ provide: BankDataService, useValue: bankDataStub }],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();

    fixture = TestBed.createComponent(TransferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
