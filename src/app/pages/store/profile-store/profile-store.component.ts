import { Component } from '@angular/core'
import { ViewWillEnter } from '@ionic/angular';
import { AuthService } from '../../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { OrdersService } from "../../../services/orders.service";
import { OrderStatusEnum } from "../../../enums/order-status.enum";
import { MessagesService } from "../../../services/messages.service";

@Component({
    selector: 'app-profile-store',
    templateUrl: './profile-store.component.html',
    styleUrls: ['./profile-store.component.scss'],
    standalone: false
})

@UntilDestroy()
export class ProfileStoreComponent implements ViewWillEnter {
  public user;
  public products: any[] = [];
  public hideButton = true;
  public id: string;
  public loading = false;
  public watch: string;

  constructor(private authService: AuthService,
              private orderService: OrdersService,
              private router: Router,
              private route: ActivatedRoute) {
  }

  ionViewWillEnter() {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.authService.user(this.id).pipe(untilDestroyed(this)).subscribe((res) => {
      this.user = res;
    });
    const urlParams = new URLSearchParams(window.location.search);
    this.watch = urlParams.get('watch');
    if (this.watch) {
      this.hideButton = false;
    }

    this.loading = true;
    this.orderService.getProductsStore(this.id).pipe(untilDestroyed(this)).subscribe((res) => {
      this.products = res;
    }).add(() => this.loading = false);
  }

  public routeDetails(id): void {
    if (this.watch) {
      this.router.navigate([`/product-details/${id}`],{queryParams: {watch: true, store: this.id}} )
    } else {
      this.router.navigate([`/product-details/${id}`], {queryParams: {store: this.id}});
    }
  }

  public shareContent() {
    navigator.share({
      url: window.location.href
    }).then();
  }

  // public openChat(): void {
  //   const existingIDs = [this.authService.uid, this.id];
  //   const uniqueID = this.generateUniqueID(existingIDs);
  //   const id: string = `${this.authService.uid}_${this.id}_${uniqueID}`;
  //   const currentDate = new Date();
  //   const formattedDate = currentDate.toISOString().split('T')[0];
  //   const model = {
  //     id: uniqueID,
  //     orderDate: formattedDate,
  //   }
  //   this.dialogService.getDialogId(id)
  //     .pipe(
  //       switchMap((dialog) =>
  //         this.messagesService.addPrivateDialog(this.id, model, this.orderStatusEnum.PRIVATE_STORE).pipe(untilDestroyed(this))))
  //     .subscribe(() => {
  //       this.router.navigate(['/chat/' + id + '/' + this.id + `/true`])
  //     });
  // }

  private simpleHash(str: string) {
    let hash = 5381; // Начальное значение
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      hash = ((hash << 5) + hash) + charCode; // hash * 33 + charCode
    }
    return hash >>> 0; // Преобразуем к беззнаковому 32-битному числу
  }

  private generateUniqueID(ids: string[]) {
    // Конкатенируем и сортируем ID
    const concatenated = ids.sort().join('');
    // Генерируем хэш
    const hash = this.simpleHash(concatenated);
    return hash.toString(16); // Преобразуем в шестнадцатеричную строку
  }

  public getPriceWithDiscount(price: number, discount: number): number {
    const discounted = price * (1 - discount / 100);
    return parseFloat(discounted.toFixed(2));
  }

}
