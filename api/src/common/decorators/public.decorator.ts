import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() — JWT auth tələbini ləğv edən marker.
 * Default global guard: bütün route-lar JWT tələb edir, @Public() ilə açılır.
 */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
