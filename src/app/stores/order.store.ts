import { Store, StoreConfig } from '@datorama/akita';
import { Injectable } from '@angular/core';
import { OrderInterface } from '../interfaces/order.interface';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'order', resettable: true })
export class OrderStore extends Store<OrderInterface> {
  constructor() {
    super({});
  }
}
