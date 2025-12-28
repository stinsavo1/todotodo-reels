// admin.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { switchMap, take } from 'rxjs/operators';

export const AdminGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return user(auth).pipe(
    take(1),
    switchMap(async (firebaseUser) => {
      if (!firebaseUser) {
        return router.createUrlTree(['/admin/auth']);
      }

      const idTokenResult = await firebaseUser.getIdTokenResult();
      const claims = idTokenResult.claims;
      const isAdmin = claims['admin'] === true;

      return isAdmin ? true : router.createUrlTree(['/admin/auth']);
    })
  );
};
