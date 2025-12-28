import { Component } from '@angular/core'
import { UntilDestroy } from '@ngneat/until-destroy';
import { removeEmpty } from '../../../components/utils/functions';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { UserStoreService } from '../../../services/store-service/user-store.service';
import { CoreService } from '../../../services/core.service';
import {Camera, CameraResultType, CameraSource} from "@capacitor/camera";
import {UploadFileService} from "../../../services/upload-file.service";
import { StoreService } from "../../../services/my-service/store.service";

@Component({
    selector: 'app-new-product',
    templateUrl: './new-product.component.html',
    styleUrls: ['./new-product.component.scss'],
    standalone: false
})

@UntilDestroy()
export class NewProductComponent {
  public showToast: boolean = false;
  public hasError: boolean = false;
  public isLoading = false;
  public errorMessage: string = 'Пожалуйста, заполните все обязательные поля'
  public blob: Blob | null;
  public photo: string;
  public name: string;
  public description: string;
  public price: number;
  public discount: number;
  private urlPhoto: string;

  constructor (
    public storeService: StoreService,
    private core: CoreService,
    private alertController: AlertController,
    private userStoreService: UserStoreService,
    private router: Router,
    private uploadService: UploadFileService
  ) {
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
    this.storeService.sentItemStore(removeEmpty(modal)).then(() => {
      this.presentAlert();
    }).finally(() => {
      this.isLoading = false;
    });
  }

  private async presentAlert() {
    const alert = await this.alertController.create({
      header: 'Товар размещен.',
      message: '',
      backdropDismiss: true, // Позволяет закрывать алерт кликом на фон
      buttons: [
        {
          text: 'ОК',
          handler: () => {
            this.isLoading = false;
            this.router.navigate(['/tabs/map']);
          }
        }
      ]
    });

    // Отслеживаем, как алерт был закрыт
    alert.onDidDismiss().then((result) => {
      if (result.role === 'backdrop') {
        this.isLoading = false;
        this.router.navigate(['/tabs/map']);
      }
    });

    await alert.present();
  }
}
