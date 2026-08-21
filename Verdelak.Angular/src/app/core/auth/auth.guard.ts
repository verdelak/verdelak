import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  const roles = route.data['roles'] as string[] | undefined;

  if (roles?.length && !roles.some(role => auth.hasRole(role))) {
    return router.createUrlTree(['/']);
  }

  return true;
};
