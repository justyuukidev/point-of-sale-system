import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

export interface InventoryChangeEvent {
  type:
    | 'product_created'
    | 'product_updated'
    | 'product_deleted'
    | 'category_created'
    | 'category_updated'
    | 'category_deleted';
  tenantId: number;
  entityId: number;
  uuid: string;
  timestamp: string;
}

@Injectable()
export class InventoryEventsService {
  private readonly events$ = new Subject<InventoryChangeEvent>();

  emit(event: InventoryChangeEvent): void {
    this.events$.next(event);
  }

  /**
   * Get an observable of inventory change events for a specific tenant.
   */
  getEventsForTenant(tenantId: number): Observable<InventoryChangeEvent> {
    return new Observable((subscriber) => {
      const subscription = this.events$.subscribe((event) => {
        if (event.tenantId === tenantId) {
          subscriber.next(event);
        }
      });
      return () => subscription.unsubscribe();
    });
  }
}
