import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { AuthComponent } from './auth.component';
import { AuthService } from '../../core/auth/auth.service';

class AuthServiceStub {
  login = jasmine.createSpy('login').and.returnValue(
    of({ id: 'user-1', name: 'Test User', email: 'test@example.com' })
  );
  currentUser$ = of(null);
}

const activatedRouteStub = {
  queryParamMap: of(convertToParamMap({})),
};

const routerStub = {
  navigateByUrl: jasmine.createSpy('navigateByUrl'),
};

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      declarations: [AuthComponent],
      providers: [
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: Router, useValue: routerStub },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
