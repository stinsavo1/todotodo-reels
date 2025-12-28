import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ArticlesComponent } from './articles.component';
import { CreateArticlesComponent } from './create-articles/create-articles.component';
import { EditArticlesComponent } from './edit-articles/edit-articles.component';

const routes: Routes = [
  {
    path: '',
    component: ArticlesComponent
  },
  {
    path: 'create-articles',
    component: CreateArticlesComponent
  },
  {
    path: 'article/:id',
    component: EditArticlesComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ArticlesRoutingModule {}
