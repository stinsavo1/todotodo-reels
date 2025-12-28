import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';

export interface VersionDoc {
  version: string;
  forceUpdate?: boolean; // поддерживаем на случай будущего использования
}

@Injectable({
  providedIn: 'root'
})
export class VersionCheckService {

  constructor(
    private alertCtrl: AlertController,
    private firestore: Firestore
  ) {}

  async checkOnLaunch(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const localVersion = await this.getLocalVersion();
      const remote = await this.fetchRemoteVersions();
      const platform = Capacitor.getPlatform();

      const required = remote[platform];
      if (!required) return;

      const cmp = this.compareVersions(localVersion, required.version);
      if (cmp < 0) {
        await this.showUpdateAlert(platform);
      }
    } catch (err) {
      // Безопасно игнорируем ошибки — как вы предпочитаете
    }
  }

  // ────────────── Private ──────────────

  private async getLocalVersion(): Promise<string> {
    const info = await App.getInfo();
    return info.version;
  }

  private async fetchRemoteVersions(): Promise<{
    ios?: VersionDoc;
    android?: VersionDoc;
  }> {
    const iosRef = doc(this.firestore, 'versions', 'ios');
    const androidRef = doc(this.firestore, 'versions', 'android');

    const [iosSnap, androidSnap] = await Promise.all([
      getDoc(iosRef),
      getDoc(androidRef)
    ]);

    return {
      ios: iosSnap.exists() ? iosSnap.data() as VersionDoc : undefined,
      android: androidSnap.exists() ? androidSnap.data() as VersionDoc : undefined
    };
  }

  private compareVersions(v1: string, v2: string): number {
    const parse = (v: string): number[] => {
      return v
        .split('.')
        .map(part => {
          const numPart = part.match(/^\d+/)?.[0] || '0';
          return parseInt(numPart, 10) || 0;
        })
        .concat([0, 0, 0])
        .slice(0, 3);
    };

    const [a, b] = [parse(v1), parse(v2)];
    for (let i = 0; i < 3; i++) {
      if (a[i] !== b[i]) return a[i] - b[i];
    }
    return 0;
  }

  private async showUpdateAlert(platform: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Доступно обновление',
      message: 'Для продолжения работы обновите приложение до последней версии.',
      backdropDismiss: false, // нельзя закрыть вне кнопки
      buttons: [
        {
          text: 'Обновить',
          handler: async () => {
            const url = platform === 'ios'
              ? 'https://apps.apple.com/us/app/todotodo-pro/id6751858639'
              : 'https://www.rustore.ru/catalog/app/ru.todotodo.app';

            // Открываем App Store / RuStore
            window.open(url.trim(), '_system');

            // Закрываем приложение через небольшую задержку (чтобы ссылка успела уйти)
            setTimeout(() => {
              App.exitApp();
            }, 500);
            return true; // ← разрешаем закрыть алерт после обработки
          }
        }
      ]
    });

    await alert.present();
  }
}
