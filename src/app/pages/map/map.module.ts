import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { MapPageRoutingModule } from './map-routing.module'

import { MapPage } from './map.page'
import { AngularYandexMapsModule } from 'angular8-yandex-maps'
import { SharedModule } from 'src/app/components/shared.module'
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MapPageRoutingModule,
    AngularYandexMapsModule,
    SharedModule
  ],
  declarations: [MapPage]
})
export class MapPageModule {}
