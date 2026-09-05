import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
  details?: unknown;
}

/**
 * Express body-parser (`raw-body`/`body-parser`) xətalarının ağ siyahısı.
 * Açar — həmin kitabxanaların `err.type` dəyəri; dəyər — bizim sabit cavabımız.
 * Siyahıda olmayan hər şey (o cümlədən üçüncü tərəf kitabxanaların `type` sahəsi
 * olan xətaları) əvvəlki kimi 500-ə düşür.
 */
const BODY_PARSER_ERRORS: Record<string, { status: number; error: string; message: string }> = {
  'entity.too.large': {
    status: HttpStatus.PAYLOAD_TOO_LARGE,
    error: 'Payload Too Large',
    message: 'Sorğu gövdəsi 8 MB-dan böyük ola bilməz',
  },
  'parameters.too.many': {
    status: HttpStatus.PAYLOAD_TOO_LARGE,
    error: 'Payload Too Large',
    message: 'Sorğuda həddindən çox parametr var',
  },
  'entity.parse.failed': {
    status: HttpStatus.BAD_REQUEST,
    error: 'BadRequest',
    message: 'Sorğu gövdəsi düzgün formatda deyil',
  },
  'request.size.invalid': {
    status: HttpStatus.BAD_REQUEST,
    error: 'BadRequest',
    message: 'Sorğu gövdəsinin ölçüsü Content-Length ilə uyğun gəlmir',
  },
  'request.aborted': {
    status: HttpStatus.BAD_REQUEST,
    error: 'BadRequest',
    message: 'Sorğu yarımçıq kəsildi',
  },
  'charset.unsupported': {
    status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    error: 'UnsupportedMediaType',
    message: 'Kodlaşdırma dəstəklənmir',
  },
  'encoding.unsupported': {
    status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    error: 'UnsupportedMediaType',
    message: 'Content-Encoding dəstəklənmir',
  },
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, payload } = this.toResponse(exception, request.url);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(payload);
  }

  private toResponse(exception: unknown, path: string): { status: number; payload: ErrorResponse } {
    const timestamp = new Date().toISOString();

    // NestJS HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message = typeof res === 'string' ? res : (res as { message?: string | string[] }).message ?? exception.message;
      const error = typeof res === 'object' && 'error' in res ? (res as { error?: string }).error ?? exception.name : exception.name;

      // Struktur cavab (məs. /health/ready-in dependency detalları) itməsin.
      let details: unknown;
      if (typeof res === 'object' && res !== null) {
        const RESERVED = new Set(['statusCode', 'error', 'message']);
        const rest = Object.fromEntries(
          Object.entries(res as Record<string, unknown>).filter(([k]) => !RESERVED.has(k)),
        );
        if (Object.keys(rest).length > 0) details = rest;
      }

      return {
        status,
        payload: { statusCode: status, error: error ?? 'Error', message, path, timestamp, details },
      };
    }

    // Prisma error
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.fromPrisma(exception, path, timestamp);
    }
    // DB əlçatmazdır (bağlantı qurula bilmir) — bu, "daxili xəta" deyil, müvəqqəti
    // əlçatmazlıqdır. 503 klienti düzgün fallback göstərməyə yönləndirir.
    if (
      exception instanceof Prisma.PrismaClientInitializationError ||
      exception instanceof Prisma.PrismaClientRustPanicError
    ) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        payload: {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          error: 'ServiceUnavailable',
          message: 'Xidmət müvəqqəti əlçatmazdır, bir azdan yenidən cəhd edin',
          path,
          timestamp,
        },
      };
    }
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        payload: {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'ValidationError',
          message: 'Verilənlərin formatı yanlışdır',
          path,
          timestamp,
        },
      };
    }

    // Postgres 22021 — parametrdə NUL bayt (`?region=baki%00`). Bu, korlanmış
    // server vəziyyəti deyil, DEFORMASİYA EDİLMİŞ İSTİFADƏÇİ GİRİŞİdir; 500 saxta
    // 5xx siqnalı yaradırdı. Şablon QƏSDƏN dardır (yalnız bu bir pg kodu) —
    // PrismaClientUnknownRequestError-un qalan halları 500 olaraq qalır.
    if (
      exception instanceof Prisma.PrismaClientUnknownRequestError &&
      /code: "22021"/.test(exception.message)
    ) {
      return {
        status: HttpStatus.BAD_REQUEST,
        payload: {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'BadRequest',
          message: 'Parametrdə icazəsiz simvol var',
          path,
          timestamp,
        },
      };
    }

    // Express body-parser xətaları (main.ts:56 `limit: '8mb'`). Bunlar HttpException
    // DEYİL, ona görə əvvəllər "naməlum xəta" budağına düşüb 500 qaytarırdı — halbuki
    // eyni 8 MB həddi multer yolunda düzgün 413 verir.
    //
    // Qayda QƏSDƏN DARDIR: yalnız body-parser-in öz `type` dəyərləri ağ siyahıdadır.
    // Rədd edilən alternativ — "istənilən `status`/`statusCode` sahəsi olan obyekti
    // 4xx say" — üçüncü tərəf kitabxanaların daxili xətalarını da 4xx kimi göstərər
    // və mesajlarını sızdırardı. Mesaj HEÇ VAXT exception-dan götürülmür (sabit AZ mətn).
    const parserType = (exception as { type?: unknown } | null)?.type;
    if (exception instanceof Error && typeof parserType === 'string') {
      const mapped = BODY_PARSER_ERRORS[parserType];
      if (mapped) {
        return {
          status: mapped.status,
          payload: {
            statusCode: mapped.status,
            error: mapped.error,
            message: mapped.message,
            path,
            timestamp,
          },
        };
      }
    }

    // Naməlum xəta
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      payload: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'InternalServerError',
        message: 'Daxili server xətası',
        path,
        timestamp,
      },
    };
  }

  private fromPrisma(
    exception: Prisma.PrismaClientKnownRequestError,
    path: string,
    timestamp: string,
  ): { status: number; payload: ErrorResponse } {
    switch (exception.code) {
      case 'P2002': {
        const target = (exception.meta as { target?: string[] | string } | undefined)?.target;
        const field = Array.isArray(target) ? target.join(', ') : target ?? 'sahə';
        return {
          status: HttpStatus.CONFLICT,
          payload: {
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            message: `Bu ${field} artıq mövcuddur`,
            path,
            timestamp,
          },
        };
      }
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          payload: {
            statusCode: HttpStatus.NOT_FOUND,
            error: 'NotFound',
            message: 'Tələb olunan resurs tapılmadı',
            path,
            timestamp,
          },
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          payload: {
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'BadRequest',
            message: 'Əlaqəli resurs tapılmadı',
            path,
            timestamp,
          },
        };
      // P2023 = "Inconsistent column data" — praktikada demək olar həmişə yanlış
      // formatlı UUID (`/geo/districts/abc/nearby`) yəni İSTİFADƏÇİ girişidir, ona
      // görə 400. QEYD: P2023 nəzəri olaraq bazadakı korlanmış datada da atılır —
      // orada 500 daha doğru olardı; ikisini exception-dan ayırd etmək mümkün deyil,
      // ona görə daha çox rast gəlinən (və daha az zərərli) hal seçildi.
      // Əsl həll girişi DB-yə çatmadan ParseUUIDPipe ilə kəsməkdir — o, controller
      // faylına aiddir (bu iş bölgüsündən kənar).
      case 'P2023':
        return {
          status: HttpStatus.BAD_REQUEST,
          payload: {
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'BadRequest',
            message: 'Parametr formatı yanlışdır',
            path,
            timestamp,
          },
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          payload: {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'DatabaseError',
            message: 'Verilənlər bazası xətası',
            path,
            timestamp,
          },
        };
    }
  }
}
