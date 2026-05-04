import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map, filter, take } from 'rxjs/operators';
import { combineLatest, Observable, of } from 'rxjs';
import { FirebaseSyncService } from '../services/firebase-sync.service';

function waitForResolvedAuth(
  firebaseSync: FirebaseSyncService,
  resolver: (isAuthenticated: boolean) => boolean | UrlTree
): Observable<boolean | UrlTree> {
  if (firebaseSync.isAuthInitialized()) {
    return of(resolver(firebaseSync.isAuthenticated()));
  }

  return combineLatest([
    firebaseSync.authInitialized$,
    firebaseSync.authUser$
  ]).pipe(
    filter(([initialized]) => initialized),
    take(1),
    map(([, user]) => resolver(!!user))
  );
}

export const authGuard: CanActivateFn = () => {
  const firebaseSync = inject(FirebaseSyncService);
  const router = inject(Router);

  return waitForResolvedAuth(firebaseSync, (isAuthenticated) =>
    isAuthenticated ? true : router.createUrlTree(['/auth'])
  );
};

export const guestOnlyGuard: CanActivateFn = () => {
  const firebaseSync = inject(FirebaseSyncService);
  const router = inject(Router);

  return waitForResolvedAuth(firebaseSync, (isAuthenticated) =>
    isAuthenticated ? router.createUrlTree(['/home']) : true
  );
};
