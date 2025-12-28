import { Component, OnInit } from '@angular/core'
import { Observable } from 'rxjs';
import { ArticlesInterface } from '../../interfaces/articles.interface';
import { ArticleService } from '../../services/article.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NavController } from '@ionic/angular';

@Component({
    selector: 'app-articles',
    templateUrl: './articles.component.html',
    styleUrls: ['./articles.component.scss'],
    standalone: false
})
@UntilDestroy()
export class ArticlesComponent implements OnInit {
  public articles$: Observable<ArticlesInterface[]>;

  constructor(private articleService: ArticleService,
              private navCtrl: NavController) {
  }

  ngOnInit() {
    this.articles$ = this.articleService.getAllArticles().pipe(untilDestroyed(this));
  }

  public navigate(id: string): void {
    this.navCtrl.navigateRoot(`/admin/tabs/articles/article/${id}`);
  }

  public delete(id: string, event?: any): void {
    this.articleService.deleteArticle(id);
  }


}
