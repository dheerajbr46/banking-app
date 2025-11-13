import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { combineLatest, finalize, map, merge, of, shareReplay, startWith, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { BankDataService } from '../../core/services/bank-data.service';
import { Account } from '../../core/models/account.model';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrl: './transfer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransferComponent {
  private readonly fb = inject(FormBuilder);
  private readonly bankData = inject(BankDataService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly refreshTrigger$ = merge(of(void 0), this.bankData.refresh$);

  readonly accounts$ = this.refreshTrigger$.pipe(
    switchMap(() => this.bankData.getAccounts()),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private readonly accountsSnapshot = signal<Account[]>([]);

  readonly transferForm = this.fb.nonNullable.group({
    fromAccountId: ['', Validators.required],
    toAccountId: ['', Validators.required],
    amount: [250, [Validators.required, Validators.min(1)]],
    memo: ['Monthly savings automation'],
    schedule: ['once' as 'once' | 'weekly' | 'monthly', Validators.required],
  });

  readonly confirmation = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly isSubmitting = signal(false);

  readonly selectedAccounts$ = combineLatest([
    this.accounts$,
    this.transferForm.valueChanges.pipe(startWith(this.transferForm.getRawValue())),
  ]).pipe(
    map(([accounts, formValue]) => ({
      from: accounts.find((account) => account.id === formValue.fromAccountId) ?? null,
      to: accounts.find((account) => account.id === formValue.toAccountId) ?? null,
    }))
  );

  readonly isValidTransfer = computed(() => this.transferForm.valid);

  constructor() {
    this.accounts$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((accounts) => {
        this.accountsSnapshot.set(accounts);

        if (!this.transferForm.controls.fromAccountId.value && accounts.length > 0) {
          this.transferForm.patchValue({ fromAccountId: accounts[0].id });
        }

        if (!this.transferForm.controls.toAccountId.value && accounts.length > 1) {
          this.transferForm.patchValue({ toAccountId: accounts[1].id });
        }
      });
  }

  submit(): void {
    if (!this.transferForm.valid) {
      this.transferForm.markAllAsTouched();
      return;
    }

    const { fromAccountId, toAccountId, amount, memo, schedule } = this.transferForm.getRawValue();
    this.isSubmitting.set(true);
    this.submitError.set(null);
    this.confirmation.set(null);

    const accounts = this.accountsSnapshot();
    const fromAccount = accounts.find((account) => account.id === fromAccountId);
    const toAccount = accounts.find((account) => account.id === toAccountId);

    this.bankData
      .createTransfer({ fromAccountId, toAccountId, amount, memo: memo || undefined, schedule })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.confirmation.set(
            `Scheduled ${schedule} transfer of $${amount.toFixed(2)} from ${fromAccount?.name ?? fromAccountId} to ${toAccount?.name ?? toAccountId}. Reference: ${response.transferId}.`
          );
          this.transferForm.reset({
            fromAccountId,
            toAccountId,
            amount,
            memo: '',
            schedule,
          });
        },
        error: (error: unknown) => {
          const message = error instanceof Error ? error.message : 'Unable to complete transfer.';
          this.submitError.set(message);
        },
      });
  }

}
