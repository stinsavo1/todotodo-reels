import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UsersPageRoutingModule } from './users-routing.module';

import { UsersPage } from './users.page';
import { UserPageModule } from '../user/user.module';
import { EditCommentModalComponent } from './edit-comment-modal.component';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        UsersPageRoutingModule,
        UserPageModule,
        MatTableModule,
        MatIconModule,
        MatPaginatorModule,
        MatButtonModule,
        MatSortModule,
        MatProgressSpinnerModule,
      MatFormFieldModule,
      MatInputModule
    ],
  declarations: [UsersPage, EditCommentModalComponent],
})
export class UsersPageModule {
}
