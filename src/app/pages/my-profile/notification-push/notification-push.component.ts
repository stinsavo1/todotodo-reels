import { Component, OnInit } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import {ProfileService} from "../../../services/my-service/profile.service";
import {map} from "rxjs/operators";
import {NavController} from "@ionic/angular";

@Component({
    selector: 'app-notification-push',
    templateUrl: './notification-push.component.html',
    styleUrls: ['./notification-push.component.scss'],
    standalone: false
})

export class NotificationPushComponent implements OnInit {
  public item$: Observable<any>;
  public callNotificationMessage: boolean;
  public callNotificationNewLead: boolean;
  public callNotificationNewOrder: boolean;

  constructor(private authService: AuthService,
              private profileService: ProfileService,
              private navCtrl: NavController) {
  }

  public ngOnInit() {
    this.item$ = this.authService.authState$.pipe(
      switchMap(item => this.authService.get(item.user?.uid || '')),
      map((x: any) => {
        this.callNotificationNewOrder = x?.notifications?.callNotificationNewOrder;
        this.callNotificationNewLead = x?.notifications?.callNotificationNewLead;
        this.callNotificationMessage = x?.notifications?.callNotificationMessage;
        return x;
      })
    );
  }

  public save(): void {
    const notifications = {
      callNotificationNewOrder: this.callNotificationNewOrder,
      callNotificationNewLead: this.callNotificationNewLead,
      callNotificationMessage: this.callNotificationMessage,
    }
    this.profileService.saveNotificationSettings(notifications).then(() => {
      this.navCtrl.navigateRoot('/tabs/menu/my-profile');
    })
  }
}
