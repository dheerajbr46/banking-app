import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { AuthService } from '../../core/auth/auth.service';
import { BankDataService } from '../../core/services/bank-data.service';
import { UserProfile } from '../../core/models/user.model';

class AuthServiceStub {
  private readonly userSubject = new BehaviorSubject<UserProfile | null>(null);
  readonly currentUser$ = this.userSubject.asObservable();

  updateSessionProfile = jasmine.createSpy('updateSessionProfile');
}

const bankDataStub = {
  refresh$: of(void 0),
  getUserProfile: () =>
    of({
      id: 'user-1',
      name: 'Avery Interactive',
      email: 'avery@example.com',
      avatarUrl: '',
      jobTitle: 'Product Manager',
    }),
  updateUserProfile: jasmine.createSpy('updateUserProfile').and.callFake((profile: UserProfile) => of(profile)),
};

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProfileComponent],
      providers: [
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: BankDataService, useValue: bankDataStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
