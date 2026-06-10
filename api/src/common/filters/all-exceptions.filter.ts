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

      return {
        status,
        payload: { statusCode: status, error: error ?? 'Error', message, path, timestamp },
      };
    }

    // Prisma error
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.fromPrisma(exception, path, timestamp);
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
