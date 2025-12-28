import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { VerificationCodeEmailComponent } from './verification-code-email.component';
import { VerificationCodeEmailRoutingModule } from './verification-code-email-routing.module';
import { ImgEmptyModule } from '../../directives/img-empty/img-empty.module';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../../components/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    VerificationCodeEmailRoutingModule,
    ImgEmptyModule,
    IonicModule,
    ReactiveFormsModule,
    SharedModule
  ],
  declarations: [VerificationCodeEmailComponent]
})
export class VerificationCodeEmailModule {
}
