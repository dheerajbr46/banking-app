import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { map } from 'rxjs';

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

  readonly summary$ = this.bankData.getDashboardSummary();
  readonly accounts$ = this.bankData.getAccounts();
  readonly recentTransactions$ = this.bankData
    .getTransactions()
    .pipe(map((transactions) => this.toRecentTransactions(transactions)));

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

  private toRecentTransactions(transactions: Transaction[]): Transaction[] {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }

}
