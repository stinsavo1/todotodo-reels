import { Component } from "@angular/core";
import { StoreService } from "../../../services/my-service/store.service";
import { ViewWillEnter } from "@ionic/angular";
import { Observable } from "rxjs";
import { AuthService } from "../../../services/auth.service";
import { CoreService } from "../../../services/core.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

@Component({
    selector: 'app-my-products',
    templateUrl: 'my-products.component.html',
    styleUrls: ['my-products.component.scss'],
    standalone: false
})
@UntilDestroy()
export class MyProductsComponent implements ViewWillEnter {
  public products: any[] = [];
  public loading = false;

  constructor(private storeService: StoreService,
              private core: CoreService,
              private authService: AuthService) {
  }

  ionViewWillEnter() {
   this.loadProducts();
  }

  public loadProducts(): void {
    this.loading = true;
    this.storeService.getStoreProductByAuthor(this.authService.uid).pipe(untilDestroyed(this)).subscribe((res) => {
     this.products = res;
    }).add(() => this.loading = false);
  }

  public delete(productId: string): void {
    this.core.presentAlert(
      'Внимание',
      'Вы подтверждаете удаление товара?',
      ['Да', 'Нет']
    ) .then((result) => {
      if (result === 'Да') {
        this.storeService.deleteProduct(productId).subscribe();
        this.loadProducts();
      }
    });
  }
}
