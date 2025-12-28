import { Component, OnInit } from '@angular/core'
import { DocumentData } from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import { NotificationService } from 'src/app/services/notification.service'
import { map } from 'rxjs/operators';

@Component({
    selector: 'app-notifications',
    templateUrl: './notifications.page.html',
    styleUrls: ['./notifications.page.scss'],
    standalone: false
})
export class NotificationsPage implements OnInit {
  items$: Observable<any[]>

  constructor (public notificationService: NotificationService) {
    this.items$ = this.notificationService.list();
  }

  ngOnInit () {}
}
