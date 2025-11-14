import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivate,
    CanMatch,
    Route,
    Router,
    RouterStateSnapshot,
    UrlSegment,
    UrlTree,
} from '@angular/router';
import { Observable, map } from 'rxjs';

import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanMatch {
    constructor(private readonly authService: AuthService, private readonly router: Router) { }

    canActivate(
        _route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean | UrlTree> {
        return this.authService.isAuthenticated$.pipe(
            map((isAuthed) => (isAuthed ? true : this.redirectToAuth(state.url)))
        );
    }

    canMatch(route: Route, segments: UrlSegment[]): Observable<boolean | UrlTree> {
        const attemptedUrl = `/${segments.map((segment) => segment.path).join('/')}`;
        return this.authService.isAuthenticated$.pipe(
            map((isAuthed) => (isAuthed ? true : this.redirectToAuth(attemptedUrl)))
        );
    }

    private redirectToAuth(returnUrl: string): UrlTree {
        return this.router.createUrlTree(['/auth', 'login'], {
            queryParams: {
                returnUrl,
            },
        });
    }
}
