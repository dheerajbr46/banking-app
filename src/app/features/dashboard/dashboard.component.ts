import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { map, merge, of, shareReplay, switchMap } from 'rxjs';

import { BankDataService } from '../../core/services/bank-data.service';
import { Transaction } from '../../core/models/transaction.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly bankData = inject(BankDataService);

  private readonly refreshTrigger$ = merge(of(void 0), this.bankData.refresh$);

  readonly accounts$ = this.refreshTrigger$.pipe(
    switchMap(() => this.bankData.getAccounts()),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly summary$ = this.refreshTrigger$.pipe(
    switchMap(() => this.bankData.getDashboardSummary()),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly recentTransactions$ = this.refreshTrigger$.pipe(
    switchMap(() => this.bankData.getTransactions()),
    map((transactions) => this.toRecentTransactions(transactions)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly topAccounts$ = this.accounts$.pipe(
    map((accounts) => [...accounts].sort((a, b) => b.balance - a.balance).slice(0, 2))
  );

  readonly totalCash$ = this.accounts$.pipe(
    map((accounts) =>
      accounts
        .filter((account) => account.type !== 'investment')
        .reduce((total, account) => total + account.balance, 0)
    )
  );

  readonly metricSkeletons = Array.from({ length: 3 });
  readonly topAccountSkeletons = Array.from({ length: 2 });
  readonly transactionSkeletons = Array.from({ length: 5 });
  readonly billsSkeletons = Array.from({ length: 3 });
  readonly insightSkeletons = Array.from({ length: 3 });

  private toRecentTransactions(transactions: Transaction[]): Transaction[] {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }

}
