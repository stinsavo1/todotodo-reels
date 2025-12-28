import { Injectable } from "@angular/core";
import { forkJoin, from, map, Observable, of, switchMap } from "rxjs";
import {
  arrayUnion,
  collection,
  collectionData, deleteDoc,
  doc,
  docData,
  DocumentData,
  Firestore,
  updateDoc
} from "@angular/fire/firestore";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root',
})
export class LeadService {
  private dealsCollection = collection(this.firestore, 'bitrixDeals');

  constructor(private firestore: Firestore,
              private http: HttpClient) {}

  // Возвращает Observable с массивом сделок, включая id
  getDeals(): Observable<any[]> {
    return collectionData(this.dealsCollection, { idField: 'id' }) as Observable<any[]>;
  }

  getDealById(id: string): Observable<any | undefined> {
    const dealDoc = doc(this.firestore, 'bitrixDeals', id);
    return docData(dealDoc, { idField: 'id' }) as Observable<any | undefined>;
  }

  updateDeals(id: string, updatedData: Partial<DocumentData>, key: string): Observable<void> {
    const refDoc = doc(this.firestore, `bitrixDeals/${id}`);

    return from(updateDoc(refDoc, {
      [key]: arrayUnion(...updatedData[key])
    }));
  }

  getBitrixAudioFiles(phoneLead: string): Observable<string[]> {
    const userId = '17';
    const token = '28fig2rcor0pnm7e';
    const folderId = '97';
    const base = `https://todotodo.bitrix24.ru/rest/${userId}/${token}`;
    const phone = (phoneLead || '').replace(/\D/g, '');

    const fetchPage = (start: number) =>
      this.http.get<any>(`${base}/disk.folder.getchildren.json`, {
        params: {
          id: folderId,
          start: String(start),
          'order[CREATE_TIME]': 'DESC',
        },
      });

    // Первые 2 страницы — 0 и 50
    return forkJoin([
      fetchPage(0),
      fetchPage(50),
    ]).pipe(
      map(([res1, res2]) => {
        const allFiles = [...(res1.result || []), ...(res2.result || [])];

        // Уникальность по базовому имени (без суффикса (N))
        const seen = new Set<string>();
        const urls: string[] = [];

        for (const f of allFiles) {
          const name = f?.NAME?.toString() || '';
          if (!name || !name.toLowerCase().endsWith('.mp3') || !name.includes(phone)) continue;

          // Исключаем (1), (2), (3)...
          if (/\s*\(\d+\)\.mp3$/i.test(name)) continue;

          // Ключ для дедупликации: базовое имя (например, "2025-10-28 14-31-09 79112074049.mp3")
          const baseName = name.replace(/\.mp3$/i, '').replace(/\s*\(\d+\)$/, '') + '.mp3';
          if (seen.has(baseName)) continue;

          seen.add(baseName);
          const url = f.DOWNLOAD_URL;
          if (url) urls.push(url);
        }

        return urls;
      })
    );
  }

  async removeLead(id: string) {
    const refOrderDoc = doc(this.firestore, `bitrixDeals/${id}`)
    await deleteDoc(refOrderDoc);
  }
}
