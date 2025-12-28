import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { UploadFileService } from '../../../services/upload-file.service';
import { map } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CoreService } from '../../../services/core.service';

@Component({
    selector: 'app-photo',
    templateUrl: './photo.component.html',
    styleUrls: ['./photo.component.scss'],
    standalone: false
})

export class PhotoComponent implements OnInit {
  @ViewChild('profileImage', { static: false }) profileImage: ElementRef;
  @ViewChild('dialogTemplate', { static: true }) dialogTemplate!: TemplateRef<any>;
  public item$: Observable<any>;
  public items: any;
  public oldPhotoUrl: string;
  public uid: string;
  public blob: Blob | null;

  constructor(private authService: AuthService,
              private core: CoreService,
              private dialog: MatDialog,
              private router: Router,
              private uploadService: UploadFileService) {
  }

  ngOnInit() {
    this.item$ = this.authService.authState$.pipe(
      tap((x: any) => {
        if (x?.user) {
          this.uid = x.user.uid
          return x;
        }
      }),
      switchMap(item => this.authService.get(item.user?.uid || '')),
      map((x) => {
        this.items = x;
        return x;
      })
    );
  }

  async takePicture() {
    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      source: CameraSource.Camera,
      resultType: CameraResultType.Uri,
      saveToGallery: false,
    });
    if (image.webPath) {
      const response = await fetch(image.webPath);

      if (!response.ok) {
        console.error('Ошибка при получении изображения:', response.statusText);
        return;
      }
      this.blob = await response.blob();
      this.oldPhotoUrl = this.items['photo'];
      if (this.profileImage) {
        this.profileImage.nativeElement.src = URL.createObjectURL(this.blob);
      } else {
        this.items['photo'] = URL.createObjectURL(this.blob);
      }
    } else {
      console.error('webPath не был получен.');
    }
  }

  async pickFromGallery() {
    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      source: CameraSource.Photos, // Выбор из галереи
      resultType: CameraResultType.Uri,
      saveToGallery: false,
    });
    if (image.webPath) {
      const response = await fetch(image.webPath);

      if (!response.ok) {
        console.error('Ошибка при получении изображения:', response.statusText);
        return;
      }
      this.blob = await response.blob();
      this.oldPhotoUrl = this.items['photo'];
      if (this.profileImage) {
        this.profileImage.nativeElement.src = URL.createObjectURL(this.blob);
      } else {
        this.items['photo'] = URL.createObjectURL(this.blob);
      }
    } else {
      console.error('webPath не был получен.');
    }
  }

  public save() {
    if (this.oldPhotoUrl) {
      this.removeImage(this.oldPhotoUrl);
    }
    this.uploadService.saveFileToStorage(this.blob).then((url) => {
      this.blob = null;
      this.items['photo'] = [url];
      this.authService.save(this.uid, this.items.email, this.items).then(() => {
      }).finally(() => {
        this.openDialog();
      })
    })
  }

  public closeDialogAndRedirect() {
    this.dialog.closeAll();
    this.router.navigate(['/tabs/menu/my-profile']);
  }

  private openDialog() {
    this.dialog.open(this.dialogTemplate, {
      width: '400px',
      position: { bottom: '0' },
      panelClass: 'custom-dialog-container',
    });
  }

  private removeImage(imageName: string): void {
    this.uploadService.removeFileToStorage(imageName);
  }
}
