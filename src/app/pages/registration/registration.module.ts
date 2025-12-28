import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { RegistrationPageRoutingModule } from './registration-routing.module'

import { RegistrationPage } from './registration.page'
import { SharedModule } from 'src/app/components/shared.module'
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegistrationPageRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  declarations: [RegistrationPage]
})
export class RegistrationPageModule {
}
