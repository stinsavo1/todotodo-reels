import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyProductsComponent } from "./my-products/my-products.component";
import { NewProductComponent } from "./new-product/new-product.component";
import { EditProductComponent } from "./edit-product/edit-product.component";

const routes: Routes = [
  {
    path: 'my-products',
    component: MyProductsComponent
  },
  {
    path: 'new-product',
    component: NewProductComponent
  },
  {
    path: 'edit-product/:id',
    component: EditProductComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StoreRoutingModule {}
