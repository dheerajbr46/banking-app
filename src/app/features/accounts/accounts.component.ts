import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize, map, merge, of, shareReplay, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { BankDataService } from '../../core/services/bank-data.service';

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsComponent {
  private readonly bankData = inject(BankDataService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private readonly refreshTrigger$ = merge(of(void 0), this.bankData.refresh$);

  readonly accounts$ = this.refreshTrigger$.pipe(
    switchMap(() => this.bankData.getAccounts()),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly totals$ = this.accounts$.pipe(
    map((accounts) => ({
      count: accounts.length,
      totalBalance: accounts.reduce((total, account) => total + account.balance, 0),
    }))
  );

  readonly editingAccountId = signal<string | null>(null);
  readonly saveSuccess = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly isSaving = signal(false);

  readonly accountForm = this.fb.nonNullable.group({
    id: ['', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(60)]],
    availableBalance: [0, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    this.bankData.refresh$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.editingAccountId.set(null);
      });
  }

  startEditing(account: { id: string; name: string; availableBalance: number }): void {
    this.accountForm.setValue({
      id: account.id,
      name: account.name,
      availableBalance: account.availableBalance,
    });
    this.saveSuccess.set(null);
    this.saveError.set(null);
    this.editingAccountId.set(account.id);
  }

  cancelEditing(): void {
    this.editingAccountId.set(null);
  }

  submitAccount(): void {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    const { id, name, availableBalance } = this.accountForm.getRawValue();
    this.isSaving.set(true);
    this.saveSuccess.set(null);
    this.saveError.set(null);

    this.bankData
      .updateAccount({ id, name, availableBalance: Number(availableBalance) })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (account) => {
          this.saveSuccess.set(`${account.name} updated.`);
          this.editingAccountId.set(null);
        },
        error: (error: unknown) => {
          const message = error instanceof Error ? error.message : 'Unable to update account.';
          this.saveError.set(message);
        },
      });
  }

}
