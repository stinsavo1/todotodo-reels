import { Component, OnInit } from '@angular/core'
import { ArticleService } from '../../services/article.service';
import { Observable } from 'rxjs';
import { ArticlesInterface } from '../../interfaces/articles.interface';
import { ViewWillEnter } from '@ionic/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
@Component({
    selector: 'app-faq',
    templateUrl: './faq.component.html',
    styleUrls: ['./faq.component.scss'],
    standalone: false
})
@UntilDestroy()
export class FaqComponent implements ViewWillEnter {
  public articles$: Observable<ArticlesInterface[]>;

  constructor(private articleService: ArticleService) {
  }

  ionViewWillEnter(): void {
    this.articles$ = this.articleService.getAllArticles().pipe(untilDestroyed(this));
  }

}
