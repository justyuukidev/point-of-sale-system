import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Observable, map } from 'rxjs';
import { InventoryEventsService } from './inventory-events.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Inventory Events')
@ApiBearerAuth('firebase-jwt')
@Controller('inventory')
export class InventoryEventsController {
  constructor(private readonly eventsService: InventoryEventsService) {}

  @Sse('events')
  @Roles('TENANT_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_STAFF', 'CASHIER')
  @ApiOperation({
    summary:
      'SSE stream of inventory changes (product/category create/update/delete)',
  })
  events(@CurrentUser('tenantId') tenantId: number): Observable<MessageEvent> {
    return this.eventsService.getEventsForTenant(tenantId).pipe(
      map((event) => ({
        data: event,
        type: event.type,
      })),
    );
  }
}
