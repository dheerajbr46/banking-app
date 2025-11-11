import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, tap, throwError } from 'rxjs';

import { AuthCredentials, UserProfile } from '../models/user.model';
import { unwrapPayload } from '../utils/http.utils';

interface MockUserRecord extends UserProfile {
    password: string;
}

const STORAGE_TOKEN_KEY = 'banking-app.token';
const STORAGE_USER_KEY = 'banking-app.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly baseUrl = 'api';
    private readonly currentUserSubject = new BehaviorSubject<UserProfile | null>(this.restoreUser());

    readonly currentUser$ = this.currentUserSubject.asObservable();
    readonly isAuthenticated$ = this.currentUser$.pipe(map((user) => !!user));

    constructor(private readonly http: HttpClient) { }

    login(credentials: AuthCredentials): Observable<UserProfile> {
        return this.http
            .get<MockUserRecord[] | { data: MockUserRecord[] }>(`${this.baseUrl}/users`)
            .pipe(
                map((response) => unwrapPayload(response)),
                map((users) => users.find((user) => user.email.toLowerCase() === credentials.email.toLowerCase())),
                map((user) => {
                    if (!user || user.password !== credentials.password) {
                        throw new Error('Invalid email or password');
                    }
                    return user;
                }),
                tap((user) => this.persistSession(user)),
                map((user) => {
                    const { password, ...profile } = user;
                    void password;
                    return profile;
                }),
                catchError((error) =>
                    throwError(() =>
                        error instanceof Error ? error : new Error('Unable to complete login request.')
                    )
                )
            );
    }

    logout(): void {
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_USER_KEY);
        this.currentUserSubject.next(null);
    }

    get accessToken(): string | null {
        return localStorage.getItem(STORAGE_TOKEN_KEY);
    }

    private persistSession(user: MockUserRecord): void {
        const token = crypto.randomUUID?.() ?? 'mock-token';
        localStorage.setItem(STORAGE_TOKEN_KEY, token);
        localStorage.setItem(
            STORAGE_USER_KEY,
            JSON.stringify({ id: user.id, name: user.name, email: user.email })
        );
        const { password, ...profile } = user;
        void password;
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
}
