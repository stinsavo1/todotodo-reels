import { Component } from '@angular/core'
import { DocumentData } from '@angular/fire/firestore'
import { ActivatedRoute } from '@angular/router'
import { Observable, tap } from 'rxjs'
import { OrdersService } from 'src/app/services/orders.service'

@Component({
    selector: 'app-order',
    templateUrl: './order.page.html',
    standalone: false
})
export class OrderPage {
  id: string
  chatId: string = ''
  item$: Observable<DocumentData>
  users$: Observable<DocumentData[]>

  constructor (
    private route: ActivatedRoute,
    public orderService: OrdersService
  ) {
    this.id = this.route.snapshot.paramMap.get('id') || ''
    this.item$ = this.orderService.order(this.id).pipe(
      tap(item => {
        this.chatId = this.orderService.generateChatId(item)
      })
    )
    this.users$ = this.orderService.users()
  }
}
