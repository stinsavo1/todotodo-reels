import { Component, OnInit } from '@angular/core'
import { DocumentData } from '@angular/fire/firestore'
import { ActivatedRoute } from '@angular/router'
import { AuthService } from 'src/app/services/auth.service'
import { OrdersService } from 'src/app/services/orders.service'

@Component({
    selector: 'app-report',
    templateUrl: './report.page.html',
    styleUrls: ['./report.page.scss'],
    standalone: false
})
export class ReportPage {
  photos: string[]
  id: string

  constructor (
    private route: ActivatedRoute,
    public orderService: OrdersService,
    public authService: AuthService
  ) {    
    this.id = this.route.snapshot.paramMap.get('id') || ''
    this.photos = []
  }
}
