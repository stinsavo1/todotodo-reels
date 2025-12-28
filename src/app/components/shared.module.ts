import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { IonicModule } from '@ionic/angular'
import { RouterModule } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { FormUpload2Component } from './form-upload2/form-upload2.component'
import { DistanceComponent } from './distance/distance.component'
import { DistancePipe } from '../pipes/distance.pipe'
import { ProfileFIOPipe } from '../pipes/profile-fio.pipe'
import { OrderByPipe } from '../pipes/order-by.pipe'
import { OrderRoleExecutorComponent } from './order-role-executor/order-role-executor.component'
import { OrderRoleClientComponent } from './order-role-client/order-role-client.component'
import { ProfileAvatarPipe } from '../pipes/profile-avatar.pipe'
import { OrderShortDetailComponent } from './order-short-detail/order-short-detail.component'
import { ImgEmptyModule } from "../directives/img-empty/img-empty.module";
import { FioPipe } from '../pipes/fio.pipe';
import { SplashScreenComponent } from './splash-screen/splash-screen.component';
import { PhoneMaskDirective } from '../directives/app-phone-mask.directive';
import { ShortNamePipe } from '../pipes/shortName.pipe';
import { PhoneMaskPipe } from '../pipes/phone-mask.pipe';
import { RegionPipe } from '../pipes/region.pipe';
import { FilterPipe } from '../pipes/filter.pipe';
import { CookieBannerComponent } from './cookie-banner/cookie-banner.component';

@NgModule({
  imports: [CommonModule, IonicModule.forRoot(), RouterModule, FormsModule, ImgEmptyModule],
  declarations: [
    FormUpload2Component,
    DistanceComponent,
    DistancePipe,
    ProfileFIOPipe,
    FioPipe,
    OrderByPipe,
    OrderRoleExecutorComponent,
    OrderRoleClientComponent,
    ProfileAvatarPipe,
    OrderShortDetailComponent,
    PhoneMaskDirective,
    OrderShortDetailComponent,
    SplashScreenComponent,
    PhoneMaskDirective,
    ShortNamePipe,
    PhoneMaskPipe,
    RegionPipe,
    FilterPipe,
    CookieBannerComponent
  ],
  exports: [
    FormUpload2Component,
    DistanceComponent,
    DistancePipe,
    ProfileFIOPipe,
    FioPipe,
    FilterPipe,
    OrderByPipe,
    OrderRoleExecutorComponent,
    OrderRoleClientComponent,
    ProfileAvatarPipe,
    OrderShortDetailComponent,
    ImgEmptyModule,
    PhoneMaskDirective,
    ImgEmptyModule,
    SplashScreenComponent,
    ShortNamePipe,
    PhoneMaskPipe,
    RegionPipe,
    CookieBannerComponent
  ],
  providers: [PhoneMaskPipe, RegionPipe, ShortNamePipe, OrderByPipe, FioPipe, ProfileAvatarPipe, DistancePipe, ProfileFIOPipe, FilterPipe]
})
export class SharedModule {
}
