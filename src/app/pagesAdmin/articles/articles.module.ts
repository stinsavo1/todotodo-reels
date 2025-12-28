import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticlesComponent } from './articles.component';
import { ArticlesRoutingModule } from './articles-routing.module';
import { IonicModule } from '@ionic/angular';
import { CreateArticlesComponent } from './create-articles/create-articles.component';
import { JoditAngularModule } from 'jodit-angular';
import { FormsModule } from '@angular/forms';
import { UserPageModule } from '../user/user.module';
import { EditArticlesComponent } from './edit-articles/edit-articles.component';
import { SharedModule } from "../../components/shared.module";

@NgModule({
  imports: [
    CommonModule,
    ArticlesRoutingModule,
    IonicModule,
    SharedModule,
    JoditAngularModule,
    FormsModule,
    UserPageModule,
  ],
  declarations: [ArticlesComponent, CreateArticlesComponent, EditArticlesComponent]
})
export class ArticlesModule {}
