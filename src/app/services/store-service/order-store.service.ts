import { UserInterface } from '../../interfaces/user.interface';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderStore } from '../../stores/order.store';
import { OrderInterface } from '../../interfaces/order.interface';

@Injectable({ providedIn: 'root' })
export class OrderStoreService {
  constructor(private orderStore: OrderStore) {}
  public updateOrder(user: OrderInterface): void {
    this.orderStore.update(user);
  }

  public getOrderValue(): OrderInterface {
    return this.orderStore.getValue()
  }

  public resetStore(): void {
    this.orderStore.reset();
  }
}
