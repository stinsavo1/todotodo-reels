import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FullImagePage } from './full-image.page';

const routes: Routes = [
  {
    path: '',
    component: FullImagePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FullImagePageRoutingModule {}
