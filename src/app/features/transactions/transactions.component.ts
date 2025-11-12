import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

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

  readonly accounts$ = this.bankData.getAccounts();
  private readonly transactions$ = this.bankData.getTransactions();

  readonly selectedAccountId = signal<string | null>(null);

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

  readonly accountChipSkeletons = Array.from({ length: 3 });
  readonly transactionSkeletons = Array.from({ length: 6 });
  readonly totalSkeletons = Array.from({ length: 3 });

  changeAccountFilter(accountId: string | null): void {
    this.selectedAccountId.set(accountId);
  }

  private sortTransactions(transactions: Transaction[]): Transaction[] {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

}
