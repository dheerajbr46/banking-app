import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { AuthCredentials, RegistrationPayload } from '../models/user.model';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
    let service: AuthService;
    let httpMock: HttpTestingController;
    const originalUseMockAuth = environment.useMockAuth;

    afterAll(() => {
        environment.useMockAuth = originalUseMockAuth;
        TestBed.resetTestingModule();
    });

    describe('when useMockAuth is disabled', () => {
        beforeEach(() => {
            environment.useMockAuth = false;
            localStorage.clear();
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                imports: [HttpClientTestingModule],
                providers: [AuthService],
            });

            service = TestBed.inject(AuthService);
            httpMock = TestBed.inject(HttpTestingController);
        });

        afterEach(() => {
            httpMock.verify();
            localStorage.clear();
        });

        it('logs in and persists the session', (done) => {
            const credentials: AuthCredentials = {
                email: 'avery@example.com',
                password: 'password123',
            };

            service.login(credentials).subscribe({
                next: (profile) => {
                    expect(profile).toEqual({
                        id: '1',
                        name: 'Avery Johnson',
                        email: 'avery@example.com',
                    });
                    expect(localStorage.getItem('banking-app.token')).toBe('mock-jwt');
                    expect(localStorage.getItem('banking-app.user')).toBe(
                        JSON.stringify({ id: '1', name: 'Avery Johnson', email: 'avery@example.com' })
                    );
                    done();
                },
                error: done.fail,
            });

            const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({
                email: 'avery@example.com',
                password: 'password123',
            });

            req.flush({
                token: 'mock-jwt',
                user: {
                    id: 1,
                    username: 'avery',
                    fullName: 'Avery Johnson',
                    email: 'avery@example.com',
                },
            });
        });

        it('propagates backend error messages', (done) => {
            const credentials: AuthCredentials = {
                email: 'avery@example.com',
                password: 'wrong-password',
            };

            service.login(credentials).subscribe({
                next: () => done.fail('Expected login to fail'),
                error: (error) => {
                    expect(error.message).toBe('Invalid credentials');
                    done();
                },
            });

            const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`);
            req.flush(
                { message: 'Invalid credentials' },
                { status: 401, statusText: 'Unauthorized' }
            );
        });

        it('registers and persists the new session', (done) => {
            const payload: RegistrationPayload = {
                name: ' Avery Johnson ',
                username: '  Avery.J  ',
                email: 'AVERY@example.com',
                password: 'password123',
            };

            service.register(payload).subscribe({
                next: (profile) => {
                    expect(profile).toEqual({
                        id: '42',
                        name: 'Avery Johnson',
                        email: 'avery@example.com',
                    });
                    expect(localStorage.getItem('banking-app.token')).toBeNull();
                    expect(localStorage.getItem('banking-app.user')).toBeNull();
                    const currentUserSubject = (service as unknown as { currentUserSubject: { value: unknown } }).currentUserSubject;
                    expect(currentUserSubject.value).toBeNull();
                    done();
                },
                error: done.fail,
            });

            const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/register`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({
                username: 'Avery.J',
                fullName: 'Avery Johnson',
                email: 'avery@example.com',
                password: 'password123',
            });

            req.flush({
                token: 'new-jwt',
                user: {
                    id: 42,
                    name: 'Avery Johnson',
                    fullName: 'Avery Johnson',
                    email: 'avery@example.com',
                },
            });
        });

        it('handles registration conflicts gracefully', (done) => {
            const payload: RegistrationPayload = {
                name: 'Avery Johnson',
                username: 'avery.j',
                email: 'avery@example.com',
                password: 'password123',
            };

            service.register(payload).subscribe({
                next: () => done.fail('Expected registration to fail'),
                error: (error) => {
                    expect(error.message).toBe('Email already registered');
                    done();
                },
            });

            const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/register`);
            req.flush(
                { message: 'Email already registered' },
                { status: 409, statusText: 'Conflict' }
            );
        });

        it('checks username availability', (done) => {
            service.checkUsernameAvailability('new-user').subscribe({
                next: (available) => {
                    expect(available).toBeTrue();
                    done();
                },
                error: done.fail,
            });

            const req = httpMock.expectOne(
                `${environment.apiBaseUrl}/auth/username-availability?username=new-user`
            );
            expect(req.request.method).toBe('GET');
            req.flush({ available: true });
        });
    });

    describe('when useMockAuth is enabled', () => {
        beforeEach(() => {
            environment.useMockAuth = true;
            localStorage.clear();
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                imports: [HttpClientTestingModule],
                providers: [AuthService],
            });

            service = TestBed.inject(AuthService);
            httpMock = TestBed.inject(HttpTestingController);
        });

        afterEach(() => {
            httpMock.verify();
            localStorage.clear();
        });

        it('logs in seeded mock users with persisted session', (done) => {
            const credentials: AuthCredentials = {
                email: 'avery@interactive.bank',
                password: 'banking123',
            };

            service.login(credentials).subscribe({
                next: (profile) => {
                    expect(profile).toEqual({
                        id: 'user-1',
                        name: 'Avery Hughes',
                        email: 'avery@interactive.bank',
                    });
                    expect(localStorage.getItem('banking-app.token')).toBe('mock-token-user-1');
                    expect(localStorage.getItem('banking-app.user')).toBe(
                        JSON.stringify({ id: 'user-1', name: 'Avery Hughes', email: 'avery@interactive.bank' })
                    );
                    done();
                },
                error: done.fail,
            });
        });

        it('rejects invalid mock credentials', (done) => {
            const credentials: AuthCredentials = {
                email: 'avery@interactive.bank',
                password: 'wrong-password',
            };

            service.login(credentials).subscribe({
                next: () => done.fail('Expected login to fail'),
                error: (error) => {
                    expect(error.message).toBe('Invalid email or password.');
                    expect(localStorage.getItem('banking-app.token')).toBeNull();
                    done();
                },
            });
        });

        it('registers new mock users and persists them locally', (done) => {
            const payload: RegistrationPayload = {
                name: 'Jordan Blake',
                username: 'jordan.b',
                email: 'jordan@example.com',
                password: 'secret123',
            };

            service.register(payload).subscribe({
                next: (profile) => {
                    expect(profile.id.startsWith('mock-')).toBeTrue();
                    expect(profile).toEqual({
                        id: profile.id,
                        name: 'Jordan Blake',
                        email: 'jordan@example.com',
                    });

                    const storedUsers = JSON.parse(localStorage.getItem('banking-app.mock-users') ?? '[]');
                    expect(storedUsers.some((user: { email: string }) => user.email === 'jordan@example.com')).toBeTrue();
                    done();
                },
                error: done.fail,
            });
        });

        it('detects username conflicts locally', (done) => {
            service.checkUsernameAvailability('avery').subscribe({
                next: (available) => {
                    expect(available).toBeFalse();
                    done();
                },
                error: done.fail,
            });
        });

        it('treats new usernames as available', (done) => {
            service.checkUsernameAvailability('fresh-user').subscribe({
                next: (available) => {
                    expect(available).toBeTrue();
                    done();
                },
                error: done.fail,
            });
        });
    });
});
