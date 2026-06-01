import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantStore {
  tenantId: number;
  userId: number;
}

@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantStore>();

  run(store: TenantStore, fn: () => void): void {
    this.storage.run(store, fn);
  }

  getTenantId(): number | undefined {
    return this.storage.getStore()?.tenantId;
  }

  getUserId(): number | undefined {
    return this.storage.getStore()?.userId;
  }

  getStore(): TenantStore | undefined {
    return this.storage.getStore();
  }
}
