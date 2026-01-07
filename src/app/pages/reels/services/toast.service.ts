import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { from, Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor (private toastCtrl: ToastController){}

 showIonicToast(message: string): Observable<void> {
    return from(this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'top',
      cssClass: 'custom-toast'
    })).pipe(
      switchMap(toast => from(toast.present()))
    );
  }
}
