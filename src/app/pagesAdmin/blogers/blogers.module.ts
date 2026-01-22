import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CursorPointerDirective } from '../../directives/cursor-pointer.directive';
import { UserPageModule } from '../user/user.module';
import { BlogerInfoComponent } from './bloger-info/bloger-info.component';
import { BlogersService } from './blogers.service';
import { BlogersComponent } from './blogers/blogers.component';

const routes: Routes = [
  {
    path: '',
    component: BlogersComponent,
  },
  {
    path: 'bloger/:id',
    loadComponent: () =>
      import('../../pagesAdmin/blogers/bloger-info/bloger-info.component').then((m) => m.BlogerInfoComponent),
  },
];

@NgModule({
  declarations: [BlogersComponent],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
    FormsModule,
    IonicModule,
    MatIconButton,
    CursorPointerDirective,
  ],
  exports: [RouterModule],
  providers:[BlogersService]
})
export class BlogersModule {
}
