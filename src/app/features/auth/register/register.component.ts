import { ChangeDetectionStrategy, Component, DestroyRef, WritableSignal, computed, inject, signal } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap, timer } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { RegistrationPayload } from '../../../core/models/user.model';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
    private readonly destroyRef = inject(DestroyRef);
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    readonly isSubmitting = signal(false);
    readonly errorMessage = signal<string | null>(null);
    readonly successMessage = signal<string | null>(null);
    readonly passwordVisible = signal(false);
    readonly usernameAvailabilityState: WritableSignal<'idle' | 'checking' | 'available' | 'unavailable' | 'error'> = signal('idle');
    readonly usernameStatusLabel = computed(() => {
        const state = this.usernameAvailabilityState();
        switch (state) {
            case 'checking':
                return 'Checking availability…';
            case 'available':
                return 'User ID is available';
            case 'unavailable':
                return 'User ID is not available';
            case 'error':
                return 'We couldn’t verify availability. Try again soon.';
            default:
                return '';
        }
    });

    private readonly controlOrder = ['name', 'username', 'email', 'password', 'confirmPassword', 'acceptTerms'] as const;
    private readonly defaultControlValues: Record<typeof this.controlOrder[number], string | boolean> = {
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false,
    };

    private readonly passwordsMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
        const password = control.get('password')?.value;
        const confirmPassword = control.get('confirmPassword')?.value;

        if (!password || !confirmPassword) {
            return null;
        }

        return password === confirmPassword ? null : { passwordMismatch: true };
    };

    private readonly passwordStrengthValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
        const value = String(control.value ?? '');
        if (!value) {
            return null;
        }

        const hasUppercase = /[A-Z]/.test(value);
        const hasLowercase = /[a-z]/.test(value);
        const hasSpecial = /[^\w\s]/.test(value);

        return hasUppercase && hasLowercase && hasSpecial ? null : { passwordWeak: true };
    };

    private readonly usernameAvailabilityValidator: AsyncValidatorFn = (control) => {
        const rawValue = (control.value ?? '') as string;
        const candidate = rawValue.trim();

        if (!candidate) {
            this.usernameAvailabilityState.set('idle');
            return of(null);
        }

        this.usernameAvailabilityState.set('checking');

        return timer(300).pipe(
            switchMap(() => this.authService.checkUsernameAvailability(candidate)),
            map((available) => {
                this.usernameAvailabilityState.set(available ? 'available' : 'unavailable');
                return available ? null : { usernameTaken: true };
            }),
            catchError(() => {
                this.usernameAvailabilityState.set('error');
                return of({ usernameCheckFailed: true });
            })
        );
    };

    readonly registerForm = this.fb.nonNullable.group({
        name: this.fb.nonNullable.control('', {
            validators: [Validators.required, Validators.minLength(3)],
            updateOn: 'blur',
        }),
        username: this.fb.nonNullable.control('', {
            validators: [
                Validators.required,
                Validators.minLength(3),
                Validators.maxLength(24),
                Validators.pattern(/^[a-z0-9._-]+$/i),
            ],
            asyncValidators: [this.usernameAvailabilityValidator],
            updateOn: 'blur',
        }),
        email: this.fb.nonNullable.control('', {
            validators: [Validators.required, Validators.email],
            updateOn: 'blur',
        }),
        password: this.fb.nonNullable.control('', {
            validators: [Validators.required, Validators.minLength(8), this.passwordStrengthValidator],
        }),
        confirmPassword: this.fb.nonNullable.control('', {
            validators: [Validators.required],
        }),
        acceptTerms: this.fb.nonNullable.control(false, {
            validators: [Validators.requiredTrue],
        }),
    });

    constructor() {
        this.registerForm.addValidators(this.passwordsMatchValidator);

        this.setupSequentialEnablement();

        this.registerForm
            .get('password')
            ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                const confirmControl = this.registerForm.get('confirmPassword');
                if (confirmControl?.enabled) {
                    confirmControl.updateValueAndValidity({ onlySelf: true });
                }
            });

        this.registerForm
            .get('username')
            ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.usernameAvailabilityState.set('idle');
            });

        this.registerForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.successMessage.set(null);
        });
    }

    submit(): void {
        if (this.registerForm.invalid || this.isSubmitting()) {
            this.registerForm.markAllAsTouched();
            return;
        }

        const { name, username, email, password } = this.registerForm.getRawValue();
        const payload: RegistrationPayload = {
            name: name.trim(),
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password,
        };

        this.isSubmitting.set(true);
        this.errorMessage.set(null);
        this.successMessage.set(null);

        this.authService
            .register(payload)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.isSubmitting.set(false);
                    this.successMessage.set('Account created successfully. You can now sign in.');
                },
                error: (error: Error) => {
                    this.isSubmitting.set(false);
                    this.errorMessage.set(error.message ?? 'Unable to create an account.');
                },
            });
    }

    showPasswordMismatch(): boolean {
        const confirmControl = this.registerForm.get('confirmPassword');
        return (
            !!confirmControl &&
            !confirmControl.disabled &&
            this.registerForm.hasError('passwordMismatch') &&
            (confirmControl.dirty || confirmControl.touched)
        );
    }

    isControlInvalid(controlName: typeof this.controlOrder[number]): boolean {
        const control = this.registerForm.get(controlName);
        return !!(control && !control.disabled && control.invalid && (control.dirty || control.touched));
    }

    togglePasswordVisibility(): void {
        this.passwordVisible.update((visible) => !visible);
    }

    passwordLengthMet(): boolean {
        return this.passwordValue().length >= 8;
    }

    passwordCaseRequirementMet(): boolean {
        const value = this.passwordValue();
        return /[A-Z]/.test(value) && /[a-z]/.test(value);
    }

    passwordSpecialRequirementMet(): boolean {
        return /[^\w\s]/.test(this.passwordValue());
    }

    private passwordValue(): string {
        const value = this.registerForm.get('password')?.value;
        return typeof value === 'string' ? value : '';
    }

    private setupSequentialEnablement(): void {
        this.controlOrder.forEach((controlName, index) => {
            if (index === 0) {
                return;
            }

            const previousControl = this.registerForm.get(this.controlOrder[index - 1]);
            const currentControl = this.registerForm.get(controlName);

            if (!previousControl || !currentControl) {
                return;
            }

            currentControl.disable({ emitEvent: false });

            previousControl.statusChanges
                .pipe(startWith(previousControl.status), takeUntilDestroyed(this.destroyRef))
                .subscribe((status) => {
                    if (status === 'VALID') {
                        currentControl.enable({ emitEvent: false });
                        return;
                    }

                    const defaultValue = this.defaultControlValues[controlName];
                    currentControl.reset(defaultValue as never, { emitEvent: false });
                    currentControl.disable({ emitEvent: false });
                });
        });
    }
}
