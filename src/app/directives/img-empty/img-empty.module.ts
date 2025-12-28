import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ImgEmptyDirective} from "./img-empty.directive";

@NgModule({
  declarations: [ImgEmptyDirective],
  imports: [
    CommonModule
  ],
  exports: [ImgEmptyDirective]
})
export class ImgEmptyModule { }
