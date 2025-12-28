import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core'
import { DocumentData } from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import { OrdersService } from 'src/app/services/orders.service'

@Component({
    selector: 'app-order-short-detail',
    templateUrl: './order-short-detail.component.html',
    styleUrls: ['./order-short-detail.component.scss'],
    standalone: false
})
export class OrderShortDetailComponent implements OnChanges {
  @Input() id: string = ''
  item$: Observable<DocumentData>

  constructor (public orderService: OrdersService) {
    this.item$ = new Observable(observer => {})
  }

  ngOnChanges (changes: SimpleChanges) {
    if (this.id) {
      this.item$ = this.orderService.order(this.id)
    }
  }
}
