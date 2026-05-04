import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { BehaviorSubject, firstValueFrom, isObservable } from 'rxjs';
import { authGuard, guestOnlyGuard } from './auth.guard';
import { FirebaseSyncService } from '../services/firebase-sync.service';

describe('auth guards', () => {
  let authInitializedSubject: BehaviorSubject<boolean>;
  let authUserSubject: BehaviorSubject<any>;
  let firebaseSyncSpy: jasmine.SpyObj<FirebaseSyncService>;
  let routerSpy: jasmine.SpyObj<Router>;

  async function resolveGuardResult(result: ReturnType<typeof authGuard>): Promise<boolean | UrlTree | any> {
    return isObservable(result) ? firstValueFrom(result) : result;
  }

  beforeEach(() => {
    authInitializedSubject = new BehaviorSubject<boolean>(true);
    authUserSubject = new BehaviorSubject<any>(null);

    firebaseSyncSpy = jasmine.createSpyObj<FirebaseSyncService>(
      'FirebaseSyncService',
      ['isAuthInitialized', 'isAuthenticated'],
      {
        authInitialized$: authInitializedSubject.asObservable(),
        authUser$: authUserSubject.asObservable()
      }
    );

    routerSpy = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    routerSpy.createUrlTree.and.callFake((commands: any[]) => ({ commands }) as any);

    firebaseSyncSpy.isAuthInitialized.and.callFake(() => authInitializedSubject.value);
    firebaseSyncSpy.isAuthenticated.and.callFake(() => !!authUserSubject.value);

    TestBed.configureTestingModule({
      providers: [
        { provide: FirebaseSyncService, useValue: firebaseSyncSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  it('should redirect unauthenticated users to /auth', async () => {
    authUserSubject.next(null);

    const result = await TestBed.runInInjectionContext(() => resolveGuardResult(authGuard(null as any, null as any)));

    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/auth']);
    expect((result as any).commands).toEqual(['/auth']);
  });

  it('should allow authenticated users to access protected routes', async () => {
    authUserSubject.next({ uid: 'user-1' });

    const result = await TestBed.runInInjectionContext(() => resolveGuardResult(authGuard(null as any, null as any)));

    expect(result).toBeTrue();
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('should wait for auth initialization before resolving guest-only access', async () => {
    authInitializedSubject.next(false);

    const pendingResult = TestBed.runInInjectionContext(() => resolveGuardResult(guestOnlyGuard(null as any, null as any)));

    authUserSubject.next({ uid: 'user-1' });
    authInitializedSubject.next(true);

    const result = await pendingResult;

    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/home']);
    expect((result as any).commands).toEqual(['/home']);
  });
});
