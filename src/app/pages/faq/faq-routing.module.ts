import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FaqComponent } from './faq.component';
import { FaqWatchComponent } from './faq-watch/faq-watch.component';

const routes: Routes = [
  {
    path: '',
    component: FaqComponent
  },
  {
    path: 'faq-watch/:uid',
    component: FaqWatchComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FaqRoutingModule {}
