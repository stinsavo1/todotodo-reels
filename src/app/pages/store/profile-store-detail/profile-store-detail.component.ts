import { Component } from '@angular/core'
import { ViewWillEnter } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { StoreService } from "../../../services/my-service/store.service";

@Component({
    selector: 'app-profile-store-detail',
    templateUrl: './profile-store-detail.component.html',
    styleUrls: ['./profile-store-detail.component.scss'],
    standalone: false
})

@UntilDestroy()
export class ProfileStoreDetailComponent implements ViewWillEnter {
  public product: any;
  public id: string;
  public loading = false;
  public hideButton = true;
  private store: string;

  constructor(
              private storeService: StoreService,
              private route: ActivatedRoute) {
  }

  ionViewWillEnter() {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.loading = true;
    this.storeService.getStoreProductById(this.id).pipe(untilDestroyed(this)).subscribe((res) => {
      this.product = res;
    }).add(() => this.loading = false);
    const urlParams = new URLSearchParams(window.location.search);
    const watch = urlParams.get('watch');
    this.store = urlParams.get('store');
    if (watch) {
      this.hideButton = false;
    }
  }
  public getPriceWithDiscount(price: number, discount: number): number {
    const discounted = price * (1 - discount / 100);
    return parseFloat(discounted.toFixed(2));
  }

  private simpleHash(str: string) {
    let hash = 5381; // Начальное значение
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      hash = ((hash << 5) + hash) + charCode; // hash * 33 + charCode
    }
    return hash >>> 0; // Преобразуем к беззнаковому 32-битному числу
  }
}
