import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, Subject } from 'rxjs';

import { TransferComponent } from './transfer.component';
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

  createTransfer = jasmine.createSpy('createTransfer').and.returnValue(
    of({ transferId: 'trf-123', createdAt: new Date().toISOString(), schedule: 'once', amount: 100 })
  );

  emitRefresh(): void {
    this.refreshSubject.next();
  }
}

describe('TransferComponent', () => {
  let component: TransferComponent;
  let fixture: ComponentFixture<TransferComponent>;
  let bankDataStub: BankDataServiceStub;

  beforeEach(async () => {
    bankDataStub = new BankDataServiceStub();

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

  it('should preselect distinct from/to accounts once data loads', () => {
    expect(component.transferForm.value.fromAccountId).toBe('acct-1');
    expect(component.transferForm.value.toAccountId).toBe('acct-2');
  });

  it('should submit a transfer and surface confirmation with account names', () => {
    component.transferForm.patchValue({
      amount: 125,
      memo: 'Monthly savings',
      schedule: 'monthly',
    });

    component.submit();

    expect(bankDataStub.createTransfer).toHaveBeenCalledWith({
      fromAccountId: 'acct-1',
      toAccountId: 'acct-2',
      amount: 125,
      memo: 'Monthly savings',
      schedule: 'monthly',
    });

    expect(component.confirmation()).toContain('Everyday Checking');
    expect(component.confirmation()).toContain('High-Yield Savings');
    expect(component.submitError()).toBeNull();
  });
});
