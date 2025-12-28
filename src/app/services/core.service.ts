import { Injectable } from '@angular/core'
import {
  AlertController,
  LoadingController,
  ModalController
} from '@ionic/angular'
import { Storage } from '@ionic/storage-angular'
import { FullImagePage } from '../pages/full-image/full-image.page'
import { ToastController } from '@ionic/angular'

@Injectable({
  providedIn: 'root'
})
export class CoreService {
  public setting: { [key: string]: any }
  constructor (
    private alertController: AlertController,
    private storage: Storage,
    public loadingController: LoadingController,
    public modalController: ModalController,
    private toastController: ToastController
  ) {
    this.setting = {}
    this.init()
  }

  async init () {
    await this.storage.create()
    this.setting = (await this.storage.get('setting')) || {}
  }

  async saveStorage (item: { [key: string]: any }) {
    this.setting = { ...this.setting, ...item }
    this.storage.set('setting', this.setting)
  }

  presentAlertIf (
    bool: boolean,
    header: string,
    message: string,
    buttons: string[] = ['ОК']
  ): boolean {
    if (bool) this.presentAlert(header, message, buttons)
    return bool
  }

  presentAlert (
    header: string,
    message: string = '',
    buttons: string[] = ['ОК']
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const alert = await this.alertController.create({
        header,
        message,
        buttons: buttons.map(btn => ({
          text: btn,
          handler: res => resolve(btn)
        }))
      })

      await alert.present()
    })
  }

  async presentLoading (mess?: string) {
    const loading = await this.loadingController.create({
      message: mess
    })
    await loading.present()
  }

  async dismissLoading () {
    return await this.loadingController.dismiss()
  }

  async openFullImage (
    image: string,
    isReadOnly: boolean = true,
    fnRemove: any = null
  ) {
    const modal = await this.modalController.create({
      component: FullImagePage,
      componentProps: {
        image,
        isReadOnly,
        fnRemove
      }
    })
    return await modal.present()
  }

  async presentToast (message: string, link: string) {
    return new Promise(async (resolve, reject) => {
      const toast = await this.toastController.create({
        message,
        duration: 3000,
        position: 'bottom',
        buttons: [
          {
            text: 'Перейти',
            side: 'end',
            handler: () => {
              this.toastController.dismiss()
              resolve('')
            }
          }
        ]
      })

      await toast.present()
    })
  }
}
