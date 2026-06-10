import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

export interface ApiResponse<T> {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // Əgər data artıq { data, meta } strukturundadırsa, olduğu kimi qaytar
        if (data && typeof data === 'object' && 'data' in data) {
          const { data: payload, meta } = data as { data: T; meta?: Record<string, unknown> };
          return { ok: true, data: payload, ...(meta ? { meta } : {}) };
        }
        return { ok: true, data };
      }),
    );
  }
}
