import { Component, OnInit } from '@angular/core';
import { FeedbackService } from '../../services/my-service/feedback.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ActivatedRoute } from '@angular/router';
import { UserInterface } from '../../interfaces/user.interface';
import { MatTableDataSource } from '@angular/material/table';
import { FormatDatePipe } from '../../pipes/format-date.pipe';

@Component({
    selector: 'app-feedbacks',
    templateUrl: './feedbacks.page.html',
    styleUrls: ['./feedbacks.page.scss'],
    standalone: false
})
@UntilDestroy()
export class FeedbacksPage implements OnInit {
  private uid: string;
  public loading: boolean = false;
  public displayedColumns: string[] = ['authorName', 'role', 'type', 'address', 'dateOrder', 'date', 'checks',];
  public dataSource: MatTableDataSource<any> = new MatTableDataSource();

  constructor(private feedbackService: FeedbackService,
              private formatDatePipe: FormatDatePipe,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.uid = this.route.snapshot.paramMap.get('uid') || '';
    this.getFeedbacks();
  }

  private getFeedbacks(): void {
    this.loading = true;
    this.feedbackService.getFeedbacks(this.uid).pipe(untilDestroyed(this)).subscribe((res: any) => {
      if (res) {
        res.data = res.data.map((feedback: any) => {
          feedback.date = feedback?.date ? this.formatDatePipe.transform(feedback.date, 'DD.MM.YYYY HH:mm') : '-';
          feedback.dateOrder = feedback?.dateOrder ? this.formatDatePipe.transform(feedback.dateOrder, 'DD.MM.YYYY') : '-';
          return feedback;
        })
        this.dataSource.data = res.data;
      }
      this.loading = false;
    });
  }
}
