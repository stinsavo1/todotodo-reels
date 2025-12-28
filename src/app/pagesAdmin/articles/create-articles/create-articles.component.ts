import { Component, ViewChild } from '@angular/core'
import { NavController } from '@ionic/angular';
import { JoditAngularComponent } from 'jodit-angular';
import { ArticleService } from '../../../services/article.service';

const editorConfig = {
  language: 'ru',
  height: '500px',
  toolbarAdaptive: false,
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
    selector: 'app-create-articles',
    templateUrl: './create-articles.component.html',
    styleUrls: ['./create-articles.component.scss'],
    standalone: false
})
export class CreateArticlesComponent {
  @ViewChild('editor') editor: JoditAngularComponent;
  public title: string;
  public config = editorConfig;
  constructor(private navCtrl: NavController,
              private articleService: ArticleService) {}

  public back(): void {
    this.navCtrl.navigateRoot('/admin/tabs/articles');
  }

  public save(): void {
    const content = this.editor.value;
    this.articleService.createArticle({
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
