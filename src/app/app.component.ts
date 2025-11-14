import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { AuthService } from './core/auth/auth.service';
import { UserProfile } from './core/models/user.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly title = 'banking-app';

  private readonly navLinks = [
    { label: 'Home', path: '/home', exact: true, requiresAuth: false },
    { label: 'Dashboard', path: '/dashboard', exact: false, requiresAuth: true },
    { label: 'Accounts', path: '/accounts', exact: false, requiresAuth: true },
    { label: 'Transactions', path: '/transactions', exact: false, requiresAuth: true },
    { label: 'Transfer', path: '/transfer', exact: false, requiresAuth: true },
    { label: 'Profile', path: '/profile', exact: false, requiresAuth: true },
  ] as const;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  mobileNavOpen = false;
  readonly mobileNavPanelId = 'mobile-primary-nav';
  readonly currentYear = new Date().getFullYear();

  @ViewChild('mobileNavPanel')
  private mobileNavPanel?: ElementRef<HTMLElement>;

  @ViewChild('mobileNavTrigger')
  private mobileNavTrigger?: ElementRef<HTMLButtonElement>;

  private readonly currentUserSignal = toSignal<UserProfile | null>(
    this.authService.currentUser$,
    { initialValue: null }
  );

  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly currentUser = computed(() => this.currentUserSignal());
  readonly primaryNavLinks = computed(() =>
    this.navLinks.filter((link) => !link.requiresAuth || this.isAuthenticated())
  );

  readonly ctaLabel = computed(() => (this.isAuthenticated() ? 'Log out' : 'Login'));

  toggleMobileNav(): void {
    this.mobileNavOpen = !this.mobileNavOpen;
    if (this.mobileNavOpen) {
      queueMicrotask(() => this.focusFirstMobileLink());
    } else {
      this.focusMobileNavTrigger();
    }
  }

  closeMobileNav(focusTrigger = false): void {
    if (!this.mobileNavOpen) {
      return;
    }
    this.mobileNavOpen = false;
    if (focusTrigger) {
      this.focusMobileNavTrigger();
    }
  }

  handleAuthCta(): void {
    if (this.isAuthenticated()) {
      this.authService.logout();
      this.router.navigateByUrl('/home');
    } else {
      this.router.navigate(['/auth', 'login']);
    }
    this.closeMobileNav(true);
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.mobileNavOpen) {
      this.closeMobileNav(true);
    }
  }

  @HostListener('window:resize')
  handleResize(): void {
    if (window.innerWidth >= 768 && this.mobileNavOpen) {
      this.closeMobileNav();
    }
  }

  private focusFirstMobileLink(): void {
    const panel = this.mobileNavPanel?.nativeElement;
    if (!panel) {
      return;
    }
    const focusable = panel.querySelector<HTMLElement>('a, button');
    focusable?.focus();
  }

  private focusMobileNavTrigger(): void {
    this.mobileNavTrigger?.nativeElement.focus();
  }
}
