import { NgModule, isDevMode, LOCALE_ID } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { RouteReuseStrategy } from '@angular/router'
import { IonicModule, IonicRouteStrategy } from '@ionic/angular'
import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { ServiceWorkerModule } from '@angular/service-worker'
import { SwUpdate } from '@angular/service-worker'
import { environment } from '../environments/environment'
import { getAuth, initializeAuth, provideAuth } from '@angular/fire/auth'
import { AuthService } from './services/auth.service'
import { IonicStorageModule } from '@ionic/storage-angular'
import { Drivers } from '@ionic/storage'
import { AngularYandexMapsModule } from 'angular8-yandex-maps'
import { getMessaging, provideMessaging } from '@angular/fire/messaging'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { SharedModule } from './components/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { provideFirebaseApp, initializeApp, getApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Capacitor } from "@capacitor/core";
import { indexedDBLocalPersistence } from "firebase/auth";
import { getFunctions, provideFunctions } from "@angular/fire/functions";
import { getStorage } from "firebase/storage";
import { provideStorage } from "@angular/fire/storage";

registerLocaleData(localeRu);

@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent], imports: [BrowserModule,
    BrowserAnimationsModule,
    IonicModule.forRoot({
      backButtonText: '',
      mode: 'ios'
    }),
    AppRoutingModule,
    IonicStorageModule.forRoot({
      name: 'todotodo',
      driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage]
    }),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    AngularYandexMapsModule.forRoot({
      apikey: environment.apikeyYandexMap,
      lang: 'ru_RU'
    }),
    SharedModule], providers: [
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => {
      if (Capacitor.isNativePlatform()) {
        return initializeAuth(getApp(), {
          persistence: indexedDBLocalPersistence
        })
      } else {
        return getAuth()
      }
    }),
    provideFirestore(() => getFirestore()),
    provideFunctions(() => getFunctions()),
    provideMessaging(() => getMessaging()),
    provideStorage(() => getStorage()),
    {provide: RouteReuseStrategy, useClass: IonicRouteStrategy},
    SwUpdate,
    AuthService,
    {provide: LOCALE_ID, useValue: 'ru-RU'},
    provideAnimationsAsync(),
    provideHttpClient(withInterceptorsFromDi())
  ]
})
export class AppModule {
}
