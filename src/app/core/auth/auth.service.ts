import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';

import { AuthCredentials, RegistrationPayload, UserProfile } from '../models/user.model';
import { environment } from '../../../environments/environment';

interface LoginResponse {
    token: string;
    user: BackendUser;
}

interface BackendUser {
    id?: number | string;
    name?: string;
    fullName?: string;
    username?: string;
    email: string;
    role?: string;
}

interface MockUser extends BackendUser {
    password: string;
}

const STORAGE_TOKEN_KEY = 'banking-app.token';
const STORAGE_USER_KEY = 'banking-app.user';
const STORAGE_MOCK_USERS_KEY = 'banking-app.mock-users';
const DEFAULT_MOCK_USERS: MockUser[] = [
    {
        id: 'user-1',
        username: 'avery',
        fullName: 'Avery Hughes',
        email: 'avery@interactive.bank',
        password: 'banking123',
        role: 'customer',
    },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly apiBaseUrl = environment.apiBaseUrl;
    private readonly authEndpoint = `${this.apiBaseUrl}/auth`;
    private readonly useMockAuth = environment.useMockAuth ?? false;
    private mockUsers: MockUser[] = this.useMockAuth ? this.restoreMockUsers() : [];
    private readonly currentUserSubject = new BehaviorSubject<UserProfile | null>(this.restoreUser());

    readonly currentUser$ = this.currentUserSubject.asObservable();
    readonly isAuthenticated$ = this.currentUser$.pipe(map((user) => !!user));

    constructor(private readonly http: HttpClient) { }

    login(credentials: AuthCredentials): Observable<UserProfile> {
        const email = credentials.email.trim().toLowerCase();
        const payload = {
            email,
            password: credentials.password,
        };

        if (this.useMockAuth) {
            const user = this.mockUsers.find((item) => item.email.toLowerCase() === email);

            if (!user || user.password !== credentials.password) {
                return throwError(() => new Error('Invalid email or password.'));
            }

            const token = `mock-token-${user.id ?? 'session'}`;
            this.persistSession(token, user);
            return of(this.mapProfile(user));
        }

        return this.http
            .post<LoginResponse>(`${this.authEndpoint}/login`, payload)
            .pipe(
                tap((response) => this.persistSession(response.token, response.user)),
                map((response) => this.mapProfile(response.user)),
                catchError((error) => throwError(() => this.normalizeError(error)))
            );
    }

    register(payload: RegistrationPayload): Observable<UserProfile> {
        const username = payload.username.trim();
        const email = payload.email.trim().toLowerCase();
        const requestBody = {
            username,
            fullName: payload.name.trim(),
            email,
            password: payload.password,
        };

        if (this.useMockAuth) {
            const normalizedUsername = username.toLowerCase();

            if (this.mockUsers.some((item) => item.email.toLowerCase() === email)) {
                return throwError(() => new Error('Email already registered.'));
            }

            if (this.mockUsers.some((item) => (item.username ?? '').toLowerCase() === normalizedUsername)) {
                return throwError(() => new Error('Username already taken.'));
            }

            const mockUser: MockUser = {
                id: `mock-${Date.now()}`,
                email,
                username,
                fullName: requestBody.fullName,
                password: payload.password,
                role: 'customer',
            };

            this.mockUsers = [...this.mockUsers, mockUser];
            this.persistMockUsers();

            return of(this.mapProfile(mockUser));
        }

        return this.http
            .post<LoginResponse>(`${this.authEndpoint}/register`, requestBody)
            .pipe(
                map((response) => this.mapProfile(response.user)),
                catchError((error) => throwError(() => this.normalizeError(error)))
            );
    }

    checkUsernameAvailability(username: string): Observable<boolean> {
        const candidate = username.trim();
        if (!candidate) {
            return throwError(() => new Error('Username is required'));
        }

        if (this.useMockAuth) {
            const normalized = candidate.toLowerCase();
            const taken = this.mockUsers.some((user) => (user.username ?? '').toLowerCase() === normalized);
            return of(!taken);
        }

        return this.http
            .get<{ available: boolean }>(`${this.authEndpoint}/username-availability`, {
                params: { username: candidate },
            })
            .pipe(
                map((response) => response.available),
                catchError((error) => {
                    const normalized = this.normalizeError(error);
                    const message = normalized.message === 'Unable to sign in.'
                        ? 'Unable to verify username.'
                        : normalized.message;
                    return throwError(() => new Error(message));
                })
            );
    }

    logout(): void {
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_USER_KEY);
        this.currentUserSubject.next(null);
    }

    updateSessionProfile(profile: UserProfile): void {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(profile));
        this.currentUserSubject.next(profile);
    }

    get accessToken(): string | null {
        return localStorage.getItem(STORAGE_TOKEN_KEY);
    }

    get backendApiBase(): string {
        return this.apiBaseUrl;
    }

    private persistSession(token: string, user: BackendUser): void {
        const profile = this.mapProfile(user);
        localStorage.setItem(STORAGE_TOKEN_KEY, token);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(profile));
        this.currentUserSubject.next(profile);
    }

    private restoreUser(): UserProfile | null {
        const stored = localStorage.getItem(STORAGE_USER_KEY);
        if (!stored) {
            return null;
        }
        try {
            return JSON.parse(stored) as UserProfile;
        } catch (error) {
            console.warn('Failed to restore user session:', error);
            return null;
        }
    }

    private mapProfile(user: BackendUser): UserProfile {
        const id = user.id ?? user.username ?? user.email;
        const name = user.name ?? user.fullName ?? user.username ?? user.email.split('@')[0];
        return {
            id: String(id),
            name,
            email: user.email,
        };
    }

    private normalizeError(error: unknown): Error {
        if (error instanceof HttpErrorResponse) {
            const message = (error.error && typeof error.error === 'object' && 'message' in error.error)
                ? String(error.error.message)
                : error.message;
            return new Error(message || 'Unable to sign in.');
        }
        if (error instanceof Error) {
            return error;
        }
        return new Error('Unable to sign in.');
    }

    private restoreMockUsers(): MockUser[] {
        const stored = localStorage.getItem(STORAGE_MOCK_USERS_KEY);
        if (!stored) {
            return [...DEFAULT_MOCK_USERS];
        }

        try {
            const parsed = JSON.parse(stored) as MockUser[];
            if (!Array.isArray(parsed) || !parsed.length) {
                return [...DEFAULT_MOCK_USERS];
            }
            return parsed;
        } catch (error) {
            console.warn('Failed to parse stored mock users. Falling back to defaults.', error);
            return [...DEFAULT_MOCK_USERS];
        }
    }

    private persistMockUsers(): void {
        if (!this.useMockAuth) {
            return;
        }
        localStorage.setItem(STORAGE_MOCK_USERS_KEY, JSON.stringify(this.mockUsers));
    }
}
