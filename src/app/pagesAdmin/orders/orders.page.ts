import { Component } from '@angular/core'
import { DocumentData } from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import { OrdersService } from 'src/app/services/orders.service'

@Component({
    selector: 'app-orders',
    templateUrl: './orders.page.html',
    styleUrls: ['./orders.page.scss'],
    standalone: false
})
export class OrdersPage {
  public orders$: Observable<DocumentData[]>

  constructor (private orderService: OrdersService) {
    this.orders$ = this.orderService.ordersAdmin();
  }
}
