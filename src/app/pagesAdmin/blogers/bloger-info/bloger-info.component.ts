import { AsyncPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable
} from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, ModalController } from '@ionic/angular';
import { firstValueFrom, take } from 'rxjs';
import { CursorPointerDirective } from '../../../directives/cursor-pointer.directive';
import { UserWithRegion } from '../../../interfaces/user.interface';
import { Reel } from '../../../pages/reels/interfaces/reels.interface';
import { FormatDatePipe } from '../../../pipes/format-date.pipe';
import { BlogersService } from '../blogers.service';
import { ViewDetailsComponent } from '../view-details/view-details.component';

@Component({
  selector: 'app-bloger-info',
  templateUrl: './bloger-info.component.html',
  styleUrls: ['./bloger-info.component.scss'],
  imports: [
    IonicModule,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatTable,
    MatHeaderCellDef,
    AsyncPipe,
    CursorPointerDirective
  ],
  standalone: true
})
export class BlogerInfoComponent implements OnInit {
  bloger: UserWithRegion | null;
  public reels: (Reel & { createDateReel?: string })[];
  public displayedColumns: string[] = ['posterUrl', 'description', 'createDateReel', 'viewsCount', 'likesCount', 'commentsCount', 'url'];

  constructor(public blogersService: BlogersService,
              private formatDatePipe: FormatDatePipe,
              private modalCtrl: ModalController,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') || '';
    if (id) {
      this.bloger = this.blogersService.usersById[id];

      this.blogersService.getBlogerReels$(id).pipe(take(1)).subscribe({
        next: (data) => {
          this.reels = data;
          this.reels = this.reels.map((reel) => {
            const regex = /\/(.*?)\./;
            const id = reel.filePath.match(regex)[1];
            return {
              ...reel,
              posterUrl: id + '.jpg',
              url: id + '.mp4',
              createDateReel: this.formatDatePipe.transform(reel.createdAt, 'DD.MM.YYYY HH:mm')
            };
          });
          console.log(this.reels);
        }
      });
    }
  }

  async showLikeInfo(element: Reel) {

    const modal = await this.modalCtrl.create({
      component: ViewDetailsComponent,
      componentProps: { list: element.likes, title:'Кто поставил вам лайк:' }
    });
    modal.present();

  }

  async showComments(element:Reel){
    try {
      const data = await firstValueFrom(this.blogersService.getReelsComments$(element.id));
      const list = data?.map((el)=>el.userId);
      const modal = await this.modalCtrl.create({
        component: ViewDetailsComponent,
        componentProps: {
          list: list,
          title: 'Кто оставил комментарий:'
        }
      });

      await modal.present();
    } catch (error) {
      console.error('Error loading comments:', error);
    }

  }
}
