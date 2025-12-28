import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { NewOrderPageRoutingModule } from './new-order-routing.module'

import { NewOrderPage } from './new-order.page'
import { SharedModule } from 'src/app/components/shared.module'
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NewOrderPageRoutingModule,
    SharedModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  providers: [provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'ru-RU' },],
  declarations: [NewOrderPage]
})
export class NewOrderPageModule {
}
