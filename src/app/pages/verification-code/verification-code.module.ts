import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { VerificationCodeComponent } from './verification-code.component';
import { VerificationCodeRoutingModule } from './verification-code-routing.module';
import { ImgEmptyModule } from '../../directives/img-empty/img-empty.module';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../../components/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    VerificationCodeRoutingModule,
    ImgEmptyModule,
    IonicModule,
    ReactiveFormsModule,
    SharedModule
  ],
  declarations: [VerificationCodeComponent]
})
export class VerificationCodeModule {
}
