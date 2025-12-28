import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { IonicModule } from '@ionic/angular'
import { AdPage } from './ad.page'
import { AdRoutingModule } from './ad-routing.module';
import { SharedModule } from '../../components/shared.module';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    AdRoutingModule,
    SharedModule
  ],
  declarations: [AdPage]
})
export class AdModule {}
