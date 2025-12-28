import {ChangeDetectorRef, Component, OnInit} from '@angular/core'
import { DocumentData } from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import {first} from "rxjs/operators";
import { OrdersService } from 'src/app/services/orders.service'

@Component({
    selector: 'app-orders-in-progress',
    templateUrl: './orders-in-progress.page.html',
    styleUrls: ['./orders-in-progress.page.scss'],
    standalone: false
})
export class OrdersInProgressPage implements OnInit {
  items!: DocumentData[];

  constructor (public ordersSevice: OrdersService,
               private cdr: ChangeDetectorRef) {

  }

  ngOnInit() {
    this.ordersSevice.orders(true)
      .pipe(first())
      .subscribe(orders => {
        this.items = orders;
        this.cdr.detectChanges()
      })
  }
}
