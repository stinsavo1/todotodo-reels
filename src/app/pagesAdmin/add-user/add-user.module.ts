import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { SharedModule } from "../../components/shared.module";
import { AddUserComponent } from "./add-user.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { AddUserRoutingModule } from "./add-user-routing.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    AddUserRoutingModule
  ],
  declarations: [AddUserComponent]
})
export class AddUserModule {
}
