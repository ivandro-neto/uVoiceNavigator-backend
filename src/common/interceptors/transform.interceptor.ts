import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface TransformedResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    version: string;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, TransformedResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<TransformedResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data already has a specific pagination structure, wrap appropriately
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          // Already paginated — merge our meta into it
          return {
            ...data,
            meta: {
              ...data.meta,
              timestamp: new Date().toISOString(),
              version: '1.0',
            },
          };
        }

        return {
          data,
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0',
          },
        };
      }),
    );
  }
}
