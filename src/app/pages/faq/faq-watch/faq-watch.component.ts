import { Component } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { ActivatedRoute, Route } from '@angular/router';
import { ArticleService } from '../../../services/article.service';
import { Observable } from 'rxjs';
import { ArticlesInterface } from '../../../interfaces/articles.interface';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
    selector: 'app-faq-watch',
    templateUrl: './faq-watch.component.html',
    styleUrls: ['./faq-watch.component.scss'],
    standalone: false
})
export class FaqWatchComponent implements ViewWillEnter {
  public uid: string;
  public article$: Observable<ArticlesInterface>;
  constructor(private route: ActivatedRoute,
              private sanitizer: DomSanitizer,
              private articleService: ArticleService) {
  }
  ionViewWillEnter(): void {
    const uid = this.route.snapshot.paramMap.get('uid');
    if (uid) {
      this.article$ = this.articleService.getArticleById(uid);
    }
  }

  public getSafeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

}
