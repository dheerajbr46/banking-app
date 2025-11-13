import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { combineLatest, map, merge, of, shareReplay, startWith, switchMap, finalize } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { AuthService } from '../../core/auth/auth.service';
import { BankDataService } from '../../core/services/bank-data.service';
import { UserProfile } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly authService = inject(AuthService);
  private readonly bankData = inject(BankDataService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private readonly refreshTrigger$ = merge(of(void 0), this.bankData.refresh$);

  private readonly profileStream$ = this.refreshTrigger$.pipe(
    switchMap(() =>
      combineLatest([
        this.authService.currentUser$.pipe(startWith(null)),
        this.bankData.getUserProfile().pipe(startWith<UserProfile | null>(null)),
      ])
    ),
    map(([sessionProfile, fallback]) => sessionProfile ?? fallback ?? null),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private readonly profileSignal = toSignal<UserProfile | null>(this.profileStream$, { initialValue: null });

  readonly profile = computed(() => this.profileSignal());

  readonly profileForm = this.fb.nonNullable.group({
    id: ['', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email]],
  });

  readonly isSaving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly saveSuccess = signal<string | null>(null);

  constructor() {
    this.profileStream$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((profile) => {
        if (!profile) {
          return;
        }
        this.profileForm.reset(profile);
      });
  }

  submitProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const payload = this.profileForm.getRawValue();
    this.isSaving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(null);

    this.bankData
      .updateUserProfile(payload)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (profile) => {
          this.authService.updateSessionProfile(profile);
          this.saveSuccess.set('Profile updated.');
        },
        error: (error: unknown) => {
          const message = error instanceof Error ? error.message : 'Unable to update profile.';
          this.saveError.set(message);
        },
      });
  }

}
