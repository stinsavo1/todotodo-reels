import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import {
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  Firestore,
  setDoc,
  updateDoc
} from '@angular/fire/firestore';
import { CoreService } from './core.service';
import { NavController } from '@ionic/angular';
import { from, Observable } from 'rxjs';
import { ArticlesInterface } from '../interfaces/articles.interface';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private firestore: Firestore = inject(Firestore)
  constructor (
    private core: CoreService,
    private navCtrl: NavController
  ) {
  }
  public async createArticle(item: { [key: string]: any }, id: string = uuidv4()) {
    this.core.presentLoading('Сохранение...')
    const articleDoc = doc(this.firestore, 'articles/' + id)
    await setDoc(articleDoc, {
      ...item,
    })

    this.core.dismissLoading();
    this.core.presentAlert('Статья создана.', '').then(() => {
      this.navCtrl.navigateRoot('/admin/tabs/articles');
    });
  }

  public getAllArticles(): Observable<ArticlesInterface[]> {
    const articlesCollection = collection(this.firestore, 'articles');
    return collectionData(articlesCollection, { idField: 'id' }) as Observable<ArticlesInterface[]>;
  }

  public getArticleById(uid: string): Observable<ArticlesInterface> {
    const articleDocRef = doc(this.firestore, 'articles/' + uid);
    return docData(articleDocRef, { idField: 'id' }) as Observable<ArticlesInterface>;
  }

  public updateArticle(id: string, updatedData: { [key: string]: any }): Observable<void> {
    this.core.presentLoading('Обновление...');
    const articleDoc = doc(this.firestore, 'articles/' + id);
    return from(
      updateDoc(articleDoc, updatedData).then(() => {
        this.core.dismissLoading();
        this.core.presentAlert('Статья обновлена.', '').then(() => {
          this.navCtrl.navigateRoot('/admin/tabs/articles');
        });
      })
    );
  }

  public deleteArticle(id: string): Observable<void> {
    this.core.presentLoading('Удаление...');
    const articleDoc = doc(this.firestore, 'articles/' + id);
    return from(
      deleteDoc(articleDoc).then(() => {
        this.core.dismissLoading();
        this.core.presentAlert('Статья удалена.', '');
      })
    );
  }
}
