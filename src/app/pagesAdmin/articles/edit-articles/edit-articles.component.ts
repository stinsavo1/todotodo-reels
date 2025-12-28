import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core'
import { NavController } from '@ionic/angular';
import { JoditAngularComponent } from 'jodit-angular';
import { ArticleService } from '../../../services/article.service';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { ArticlesInterface } from '../../../interfaces/articles.interface';

const editorConfig = {
  language: 'ru',
  height: '500px',
  buttons: [
    'bold', 'italic', 'underline', 'strikethrough', 'eraser', 'ul', 'ol',
    'font', 'fontsize', 'paragraph', 'image', 'file', 'video', 'link',
    'align', 'undo', 'redo', 'preview'
  ],
  uploader: {
    insertImageAsBase64URI: true, // Позволяет вставлять изображения как base64
  },
  filebrowser: {
    buttons: ['upload', 'remove', 'update', 'select']
  },
  fonts: [
    { name: 'Roboto', value: 'Roboto, sans-serif' },
  ]
};
@Component({
    selector: 'app-edit-articles',
    templateUrl: './edit-articles.component.html',
    styleUrls: ['./edit-articles.component.scss'],
    standalone: false
})
export class EditArticlesComponent implements OnInit, AfterViewInit {
  @ViewChild('editor') editor: JoditAngularComponent;
  public article$: Observable<ArticlesInterface>;
  public title: string;
  public uid: string;
  public config = editorConfig;
  constructor(private navCtrl: NavController,
              private route: ActivatedRoute,
              private articleService: ArticleService) {
  }

  ngOnInit() {
    this.uid = this.route.snapshot.paramMap.get('id') as string;
    if (this.uid) {
      this.article$ = this.articleService.getArticleById(this.uid);

    }
  }

  ngAfterViewInit() {
    this.article$.subscribe(article => {
      this.title = article.title;
      if (this.editor && article.content) {
        this.editor.value = article.content;
      }
    });
  }

  public back(): void {
    this.navCtrl.navigateRoot('/admin/tabs/articles');
  }

  public save(): void {
    const content = this.editor.value;
    this.articleService.updateArticle(
      this.uid, {
      title: this.title,
      content: content
    });
  }

  public preview(): void {
    if (this.editor && this.editor.editor) {
      this.editor.editor.execCommand('preview');
    }
  }
}
