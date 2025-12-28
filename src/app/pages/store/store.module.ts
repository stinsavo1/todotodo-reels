import { NgModule } from '@angular/core';
import { MyProductsComponent } from "./my-products/my-products.component";
import { CommonModule } from "@angular/common";
import { StoreRoutingModule } from "./store-routing.module";
import { SharedModule } from "../../components/shared.module";
import { IonicModule } from "@ionic/angular";
import { NewProductComponent } from "./new-product/new-product.component";
import { FormsModule } from "@angular/forms";
import { EditProductComponent } from "./edit-product/edit-product.component";

@NgModule({
  imports: [
    CommonModule,
    StoreRoutingModule,
    SharedModule,
    FormsModule,
    IonicModule
  ],
  declarations: [MyProductsComponent, NewProductComponent, EditProductComponent],
})
export class StoreModule {}
