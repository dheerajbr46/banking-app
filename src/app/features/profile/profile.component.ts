import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

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

  private readonly profileSignal = toSignal<UserProfile | null>(
    combineLatest([
      this.authService.currentUser$,
      this.bankData.getUserProfile(),
    ]).pipe(
      map(([sessionProfile, fallback]) => sessionProfile ?? fallback ?? null)
    ),
    { initialValue: null }
  );

  readonly profile = computed(() => this.profileSignal());

}
