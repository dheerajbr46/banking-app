import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { combineLatest, finalize, map, merge, of, shareReplay, switchMap } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

import { BankDataService } from '../../core/services/bank-data.service';
import { Transaction } from '../../core/models/transaction.model';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsComponent {
  private readonly bankData = inject(BankDataService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private readonly refreshTrigger$ = merge(of(void 0), this.bankData.refresh$);

  readonly accounts$ = this.refreshTrigger$.pipe(
    switchMap(() => this.bankData.getAccounts()),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private readonly transactions$ = this.refreshTrigger$.pipe(
    switchMap(() => this.bankData.getTransactions()),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly selectedAccountId = signal<string | null>(null);
  readonly isCreating = signal(false);
  readonly createError = signal<string | null>(null);
  readonly createSuccess = signal<string | null>(null);

  readonly newTransactionForm = this.fb.nonNullable.group({
    accountId: ['', Validators.required],
    description: ['', [Validators.required, Validators.maxLength(80)]],
    category: ['Miscellaneous', [Validators.required, Validators.maxLength(40)]],
    amount: [50, [Validators.required, Validators.min(1)]],
    direction: ['debit' as const, Validators.required],
  });

  readonly filteredTransactions$ = combineLatest([
    this.transactions$,
    toObservable(this.selectedAccountId),
  ]).pipe(
    map(([transactions, selected]) =>
      this.sortTransactions(
        selected ? transactions.filter((tx) => tx.accountId === selected) : transactions
      )
    )
  );

  readonly totalForSelection$ = this.filteredTransactions$.pipe(
    map((transactions) =>
      transactions.reduce(
        (totals, tx) => {
          if (tx.direction === 'credit') {
            totals.inflows += tx.amount;
          } else {
            totals.outflows += tx.amount;
          }
          return totals;
        },
        { inflows: 0, outflows: 0 }
      )
    )
  );

  readonly selectedAccountLabel = computed(() => this.selectedAccountId());

  readonly transactionSkeletons = Array.from({ length: 6 });
  readonly totalSkeletons = Array.from({ length: 3 });

  constructor() {
    this.accounts$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((accounts) => {
        if (!accounts.length) {
          return;
        }
        const firstId = accounts[0].id;
        if (!this.newTransactionForm.controls.accountId.value) {
          this.newTransactionForm.controls.accountId.setValue(firstId);
        }
      });
  }

  changeAccountFilter(accountId: string | null): void {
    this.selectedAccountId.set(accountId);
  }

  submitNewTransaction(): void {
    if (this.newTransactionForm.invalid) {
      this.newTransactionForm.markAllAsTouched();
      return;
    }

    const { accountId, amount, direction, description, category } = this.newTransactionForm.getRawValue();
    this.isCreating.set(true);
    this.createError.set(null);
    this.createSuccess.set(null);

    this.bankData
      .createTransaction({
        accountId,
        amount,
        direction,
        description,
        category,
      })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.isCreating.set(false)))
      .subscribe({
        next: (transaction) => {
          this.createSuccess.set(
            `${transaction.description} logged for ${transaction.amount.toLocaleString('en-US', {
              style: 'currency',
              currency: transaction.currency,
            })}.`
          );
          this.newTransactionForm.patchValue({
            description: '',
            category: 'Miscellaneous',
            amount: 50,
          });
        },
        error: (error: unknown) => {
          const message = error instanceof Error ? error.message : 'Unable to create transaction.';
          this.createError.set(message);
        },
      });
  }

  private sortTransactions(transactions: Transaction[]): Transaction[] {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

}
