import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { map } from 'rxjs';

import { BankDataService } from '../../core/services/bank-data.service';

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsComponent {
  private readonly bankData = inject(BankDataService);

  readonly accounts$ = this.bankData.getAccounts();

  readonly totals$ = this.accounts$.pipe(
    map((accounts) => ({
      count: accounts.length,
      totalBalance: accounts.reduce((total, account) => total + account.balance, 0),
    }))
  );

}
