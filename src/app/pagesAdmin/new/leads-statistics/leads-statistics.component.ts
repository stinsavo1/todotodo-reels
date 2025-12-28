import { Component } from "@angular/core";
import { LeadStatisticsService } from "../../../services/lead-statistics.service";
import { ModalController, ViewWillEnter } from "@ionic/angular";
import { DocumentSnapshot } from "@angular/fire/firestore";
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe, NgIf } from "@angular/common";
import { UserInterface } from "../../../interfaces/user.interface";
import { EditCommentModalComponent } from "../../users/edit-comment-modal.component";

@Component({
  selector: 'app-lead-statistics',
  templateUrl: './leads-statistics.component.html',
  styleUrls: ['./leads-statistics.component.scss'],
  imports: [
    MatIconModule,
    MatTableModule,
    MatButtonModule,
    DatePipe,
    NgIf
  ],
  standalone: true
})
export class LeadsStatisticsComponent implements ViewWillEnter {
  public displayedColumns  = ['date', 'customerFeedbackDate', 'source', 'contact', 'name', 'price', 'managerRead', 'managerDone', 'buy', 'commentAdmin'];
  public items: any[] = [];
  public isLoading = false;

  constructor(private leadStatistics: LeadStatisticsService,
              private modalCtrl: ModalController) {
  }

  ionViewWillEnter() {
    this.getLeads();
  }

  public deleteComment(item: any): void {
    delete item.commentAdmin;
    this.leadStatistics.deleteCommentsAdmin(item.id).then();
    this.getLeads();
  }

  public async openModal(item: any, title: string) {
    const modal = await this.modalCtrl.create({
      component: EditCommentModalComponent,
      componentProps: { comment: item.commentAdmin, title: title, }, // Передача текущего комментария
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.leadStatistics.updateCommentsAdmin(item.id, result.data);
        item.commentAdmin = result.data;
        this.getLeads();
      }
    });

    await modal.present();
  }

  private getLeads(): void {
    this.leadStatistics.getPage().then((res) => {
      this.items = res;
    });
  }
}
