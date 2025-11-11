import { Injectable } from '@angular/core';
import {
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private readonly authService: AuthService) { }

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const token = this.authService.accessToken;

        if (!token || !req.url.startsWith('api/')) {
            return next.handle(req);
        }

        const authorized = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        });

        return next.handle(authorized);
    }
}
