import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';

/**
 * «Varsa oxu, yoxsa buraxıb keç» JWT qapısı.
 *
 * NİYƏ lazımdır: `GET /listings/:id` `@Public()`-dir, yəni qlobal `JwtAuthGuard`
 * token-i ÜMUMİYYƏTLƏ oxumur — `req.user` həmişə boş qalır. Nəticədə servis
 * baxanın kim olduğunu bilmir və elan sahibi öz qeyri-aktiv (arxiv/satıldı) elanını
 * da 404 kimi görür. Bu guard eyni marşrutu ictimai saxlayır, sadəcə token varsa
 * onu doğrulayıb `req.user`-a qoyur.
 *
 * NİYƏ qlobal `JwtAuthGuard` dəyişdirilmədi: ora toxunmaq bütün `@Public`
 * endpoint-lərin davranışını eyni anda dəyişərdi. Bu guard yalnız təyin olunduğu
 * marşrutda işləyir və qlobal davranışa toxunmur.
 *
 * Yanlış/vaxtı keçmiş token 401 YOX, «anonim» deməkdir — public marşrutun köhnə
 * müştəriyə görə birdən qırılmaması üçün.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = JwtPayload>(_err: unknown, user: TUser | false): TUser | undefined {
    return user === false ? undefined : user;
  }
}
