import { Component } from "@angular/core";
import { StoreService } from "../../../services/my-service/store.service";
import { AlertController, ViewWillEnter } from "@ionic/angular";
import { ActivatedRoute, Router } from "@angular/router";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { removeEmpty } from "../../../components/utils/functions";
import { UploadFileService } from "../../../services/upload-file.service";

@Component({
    selector: 'app-edit-product',
    templateUrl: 'edit-product.component.html',
    styleUrls: ['edit-product.component.scss'],
    standalone: false
})

export class EditProductComponent implements ViewWillEnter {
  public photo: string;
  public errorMessage: string = 'Пожалуйста, заполните все обязательные поля';
  public showToast: boolean = false;
  public name: string;
  public description: string;
  public hasError: boolean = false;
  public price: number;
  public discount: number;
  public isLoading = false;

  private urlPhoto: string;
  private blob: Blob | null;
  private id: string;
  private oldPhotoUrl: string;

  constructor(private storeService: StoreService,
              private router: Router,
              private uploadService: UploadFileService,
              private alertController: AlertController,
              private route: ActivatedRoute) {
  }

  ionViewWillEnter() {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.storeService.getStoreProductById(this.id).subscribe((res) => {
      this.photo = res?.photo;
      this.name = res?.name;
      this.description = res?.description;
      this.price = res?.price;
      this.discount = res?.discount;
      this.oldPhotoUrl = res?.photo;
    });
  }

  public closeToast(): void {
    this.showToast = false;
  }

  public async picture(source: string) {
    try {
      const image = await Camera.getPhoto({
        quality: 100,
        allowEditing: false,
        source: source as CameraSource,
        resultType: CameraResultType.Uri,
        saveToGallery: false,
      });

      if (image.webPath) {
        const response = await fetch(image.webPath);

        if (!response.ok) {
          console.error('Ошибка при получении изображения:', response.statusText);
          return;
        }

        this.photo = null;
        this.blob = await response.blob();
        this.photo = URL.createObjectURL(this.blob);
      } else {
        console.error('webPath не был получен.');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('User cancelled')) {
        console.log('Пользователь отменил выбор изображения');
        return;
      }

      console.error('Произошла ошибка при получении фото:', error);
    }
  }

  private async presentAlert() {
    const alert = await this.alertController.create({
      header: 'Изменения сохранены',
      message: '',
      backdropDismiss: true, // Позволяет закрывать алерт кликом на фон
      buttons: [
        {
          text: 'ОК',
          handler: () => {
            this.isLoading = false;
            this.router.navigate(['/tabs/map/store/my-products']);
          }
        }
      ]
    });

    // Отслеживаем, как алерт был закрыт
    alert.onDidDismiss().then((result) => {
      if (result.role === 'backdrop') {
        this.isLoading = false;
        this.router.navigate(['/tabs/map/store/my-products']);
      }
    });

    await alert.present();
  }

  public submit(): void {
    if (!this.name || this.price === undefined || this.price === null || !this.description) {
      this.hasError = true;
      this.showToast = true;
      return;
    }
    this.isLoading = true;
    if (this.blob) {
      this.uploadService.saveFileStoreToStorage(this.blob).then((url) => {
        this.blob = null;
        this.urlPhoto = url;

        if (this.oldPhotoUrl) {
          this.uploadService.removeFileToStorage(this.oldPhotoUrl);
        }

        this.sentStoreProduct();
      })
    } else {
      this.sentStoreProduct();
    }
  }

  private sentStoreProduct(): void {
    const modal = {
      photo: this.urlPhoto,
      name: this.name,
      description: this.description,
      price: this.price,
      discount: this.discount
    }
    this.storeService.updateItemStore(this.id, removeEmpty(modal)).then(() => {
      this.presentAlert();
    }).finally(() => {
      this.isLoading = false;
    });
  }

}
