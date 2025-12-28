import { Component, ViewChild } from '@angular/core'
import { NavController, ViewWillEnter } from '@ionic/angular';
import { OrderInterface } from '../../interfaces/order.interface';
import { FormUpload2Component } from '../../components/form-upload2/form-upload2.component';
import { ActivatedRoute } from '@angular/router';
import { FeedbackModeMap, OrderFeedbackModeEnum } from '../../enums/order-feedback-mode.enum';
import { OrdersService } from '../../services/orders.service';
import { UserStoreService } from '../../services/store-service/user-store.service';
import moment from 'moment/moment';
import { v4 as uuidv4 } from 'uuid';
import {UntilDestroy, untilDestroyed} from "@ngneat/until-destroy";
import {UserService} from "../../services/my-service/user.service";
import { LeadService } from "../../services/lead.service";
import { AuthService } from "../../services/auth.service";

@Component({
    selector: 'app-feedback-form',
    templateUrl: './feedback-form.component.html',
    styleUrls: ['./feedback-form.component.scss'],
    standalone: false
})

@UntilDestroy()
export class FeedbackFormComponent implements ViewWillEnter {
  @ViewChild('uploadComponent') uploadComponent!: FormUpload2Component;

  public photo: string[] = []
  public files: { url: string; name: string }[] = [];
  public order: OrderInterface;
  public comment: string;
  public userType: 'Client' | 'Executor' | 'Lead';
  public userId: string;
  public type: string;
  public orderId: string;
  public orderFeedbackModeEnum = OrderFeedbackModeEnum;
  public selectedFeedbackType: OrderFeedbackModeEnum = this.orderFeedbackModeEnum.RECOMMENDATION;

  constructor(
              private userStoreService: UserStoreService,
              private orderService: OrdersService,
              public authService: AuthService,
              private userService: UserService,
              private navCtrl: NavController,
              private leadService: LeadService,
              private route: ActivatedRoute) {
  }

  ionViewWillEnter(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    this.orderId = this.route.snapshot.paramMap.get('orderId') || '';
    this.userType = this.route.snapshot.paramMap.get('userType') as 'Client' | 'Executor' | 'Lead';
    this.type = this.route.snapshot.paramMap.get('type');
    if (this.type === 'lead') {
      this.getLead();
    } else {
      this.getOrder();
    }
  }

  public onFocus(event: FocusEvent): void {
    event.preventDefault();
    (event.target as HTMLElement).blur();
  }

  public selectFeedbackType(feedbackType: OrderFeedbackModeEnum): void {
    this.selectedFeedbackType = feedbackType;
  }

  public getNameType(idType: OrderFeedbackModeEnum): string {
    return <string>FeedbackModeMap.get(idType);
  }

  public sentFeedback(): void {
    let checks: 'like'
      | 'dislike';
    if (this.selectedFeedbackType === this.orderFeedbackModeEnum.RECOMMENDATION) {
      checks = 'like';
    } else {
      checks = 'dislike';
    }

    this.userService.getUserById(this.userId).pipe(untilDestroyed(this)).subscribe((res) => {
      const user = this.userStoreService.getUserValue();
      const nameParts = user?.fio.split(' ');
      user.shortName = nameParts[1] !== undefined ? nameParts[0] + ' ' + nameParts[1] : nameParts[0];
      const model = {
        id: uuidv4(),
        orderId: this.orderId,
        dateOrder: this.order.orderDate,
        address: this.order.address,
        authorName: user.shortName,
        comment: this.comment,
        role: res.role,
        type: this.order.type,
        date: moment(new Date(), 'DD.MM.YYYY HH:mm:ss').toISOString(),
        checks: checks
      }
      if (this.type === 'lead') {
        this.orderService.sentFeedbackLead(this.userId, this.orderId, this.userType, model).then(() => {
          this.navCtrl.navigateRoot('/tabs/addresses');
        });
      } else {
        this.orderService.sentFeedback(this.userId, this.orderId, this.userType, model).then(() => {
          this.navCtrl.navigateRoot('/tabs/addresses');
        });
      }
    })
  }

  private getOrder() {
    this.orderService.order(this.orderId).pipe(untilDestroyed(this)).subscribe((res) => {
      this.order = res;
    });
  }

  private getLead() {
    this.leadService.getDealById(this.orderId).pipe(untilDestroyed(this)).subscribe((res) => {
      this.order = res;
      this.order.orderDate = res.date;
    })
  }
}
