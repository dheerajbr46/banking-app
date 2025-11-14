import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/auth/auth.service';

class AuthServiceStub {
    register = jasmine.createSpy('register').and.returnValue(
        of({ id: '1', name: 'Test User', email: 'test@example.com' })
    );
    checkUsernameAvailability = jasmine.createSpy('checkUsernameAvailability').and.returnValue(of(true));
}

describe('RegisterComponent', () => {
    let component: RegisterComponent;
    let fixture: ComponentFixture<RegisterComponent>;
    let authService: AuthServiceStub;
    let router: Router;
    let navigateSpy: jasmine.Spy;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, RouterTestingModule],
            declarations: [RegisterComponent],
            providers: [
                { provide: AuthService, useClass: AuthServiceStub },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(RegisterComponent);
        component = fixture.componentInstance;
        authService = TestBed.inject(AuthService) as unknown as AuthServiceStub;
        router = TestBed.inject(Router);
        navigateSpy = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
        authService.register.calls.reset();
        authService.checkUsernameAvailability.calls.reset();
        fixture.detectChanges();
        component.registerForm.enable({ emitEvent: false });
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('submits registration when form is valid', fakeAsync(() => {
        const nameControl = component.registerForm.get('name');
        nameControl?.setValue(' Avery Johnson ');
        nameControl?.markAsDirty();
        nameControl?.markAsTouched();
        nameControl?.updateValueAndValidity();
        tick();
        fixture.detectChanges();

        const usernameControl = component.registerForm.get('username');
        usernameControl?.setValue('Avery_J');
        usernameControl?.markAsDirty();
        usernameControl?.markAsTouched();
        usernameControl?.updateValueAndValidity();
        tick(301);
        fixture.detectChanges();

        const emailControl = component.registerForm.get('email');
        emailControl?.setValue('avery@example.com');
        emailControl?.markAsDirty();
        emailControl?.markAsTouched();
        emailControl?.updateValueAndValidity();
        tick();
        fixture.detectChanges();

        const passwordControl = component.registerForm.get('password');
        passwordControl?.setValue('StrongPass!');
        passwordControl?.markAsDirty();
        passwordControl?.markAsTouched();
        passwordControl?.updateValueAndValidity();
        tick();
        fixture.detectChanges();

        const confirmControl = component.registerForm.get('confirmPassword');
        confirmControl?.setValue('StrongPass!');
        confirmControl?.markAsDirty();
        confirmControl?.markAsTouched();
        confirmControl?.updateValueAndValidity();
        tick();
        fixture.detectChanges();

        const termsControl = component.registerForm.get('acceptTerms');
        termsControl?.setValue(true);
        termsControl?.markAsDirty();
        termsControl?.markAsTouched();
        termsControl?.updateValueAndValidity();
        tick();
        fixture.detectChanges();

        expect(authService.checkUsernameAvailability).toHaveBeenCalledWith('Avery_J');

        component.submit();

        expect(authService.register).toHaveBeenCalledWith({
            name: 'Avery Johnson',
            username: 'Avery_J',
            email: 'avery@example.com',
            password: 'StrongPass!',
        });
        expect(component.successMessage()).toBe('Account created successfully. You can now sign in.');
        expect(component.errorMessage()).toBeNull();
        expect(component.isSubmitting()).toBeFalse();
        expect(navigateSpy).not.toHaveBeenCalled();
    }));

    it('prevents submission when passwords do not match', fakeAsync(() => {
        const nameControl = component.registerForm.get('name');
        nameControl?.setValue('Avery');
        nameControl?.markAsDirty();
        nameControl?.markAsTouched();
        nameControl?.updateValueAndValidity();
        tick();
        fixture.detectChanges();

        const usernameControl = component.registerForm.get('username');
        usernameControl?.setValue('avery_j');
        usernameControl?.markAsDirty();
        usernameControl?.markAsTouched();
        usernameControl?.updateValueAndValidity();
        tick(301);
        fixture.detectChanges();

        const emailControl = component.registerForm.get('email');
        emailControl?.setValue('avery@example.com');
        emailControl?.markAsDirty();
        emailControl?.markAsTouched();
        emailControl?.updateValueAndValidity();
        tick();
        fixture.detectChanges();

        const passwordControl = component.registerForm.get('password');
        passwordControl?.setValue('StrongPass!');
        passwordControl?.markAsDirty();
        passwordControl?.markAsTouched();
        passwordControl?.updateValueAndValidity();
        tick();
        fixture.detectChanges();

        const confirmControl = component.registerForm.get('confirmPassword');
        confirmControl?.setValue('Mismatch!');
        confirmControl?.markAsDirty();
        confirmControl?.markAsTouched();
        confirmControl?.updateValueAndValidity();
        tick();
        fixture.detectChanges();

        const termsControl = component.registerForm.get('acceptTerms');
        termsControl?.setValue(true);
        termsControl?.markAsDirty();
        termsControl?.markAsTouched();
        termsControl?.updateValueAndValidity();
        tick();
        fixture.detectChanges();

        expect(authService.checkUsernameAvailability).toHaveBeenCalledWith('avery_j');

        component.submit();

        expect(authService.register).not.toHaveBeenCalled();
        expect(component.registerForm.hasError('passwordMismatch')).toBeTrue();
        expect(component.successMessage()).toBeNull();
        expect(navigateSpy).not.toHaveBeenCalled();
    }));

    afterEach(() => {
        navigateSpy.calls.reset();
    });
});
