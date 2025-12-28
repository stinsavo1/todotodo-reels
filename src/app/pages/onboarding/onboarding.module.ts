import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { OnboardingComponent } from './onboarding.component';
import { OnboardingRoutingModule } from './onboarding-routing.module';
import { SharedModule } from '../../components/shared.module';
import { IonicModule } from '@ionic/angular';

@NgModule({
  imports: [
    CommonModule,
    OnboardingRoutingModule,
    SharedModule,
    IonicModule,
  ],
  declarations: [OnboardingComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class OnboardingModule {}
