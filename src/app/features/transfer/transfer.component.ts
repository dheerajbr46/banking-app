import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { combineLatest, map, startWith } from 'rxjs';

import { BankDataService } from '../../core/services/bank-data.service';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrl: './transfer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransferComponent {
  private readonly fb = inject(FormBuilder);
  private readonly bankData = inject(BankDataService);

  readonly accounts$ = this.bankData.getAccounts();

  readonly transferForm = this.fb.nonNullable.group({
    fromAccountId: ['', Validators.required],
    toAccountId: ['', Validators.required],
    amount: [250, [Validators.required, Validators.min(1)]],
    memo: ['Monthly savings automation'],
    schedule: ['once' as 'once' | 'weekly' | 'monthly', Validators.required],
  });

  readonly confirmation = signal<string | null>(null);

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

  submit(): void {
    if (!this.transferForm.valid) {
      this.transferForm.markAllAsTouched();
      return;
    }

    const { fromAccountId, toAccountId, amount, schedule } = this.transferForm.getRawValue();
    this.confirmation.set(
      `Scheduled ${schedule} transfer of $${amount.toFixed(2)} from ${fromAccountId} to ${toAccountId}.`
    );
    this.transferForm.reset({
      fromAccountId,
      toAccountId,
      amount,
      memo: '',
      schedule,
    });
  }

}
