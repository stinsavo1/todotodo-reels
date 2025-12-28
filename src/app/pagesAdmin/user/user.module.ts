import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { UserPageRoutingModule } from './user-routing.module'
import { UserPage } from './user.page'
import { FormatDatePipe } from '../../pipes/format-date.pipe';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { SharedModule } from "../../components/shared.module";
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UserPageRoutingModule,
    SharedModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule
  ],
  exports: [
    FormatDatePipe
  ],
  providers: [provideNativeDateAdapter()],
  declarations: [UserPage, FormatDatePipe]
})
export class UserPageModule {}
