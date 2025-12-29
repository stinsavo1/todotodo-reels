import { inject, Injectable, NgZone } from '@angular/core'
import {
  BehaviorSubject,
  catchError,
  defer,
  firstValueFrom,
  from,
  Observable,
  of,
  shareReplay,
  take,
  tap,
  throwError
} from 'rxjs'
import * as types from '@firebase/auth-types'
import { map, mergeMap, share, switchMap } from 'rxjs/operators'
import { Router } from '@angular/router'
import { CoreService } from './core.service'
import {
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  DocumentData,
  Firestore,
  getDocs,
  query,
  setDoc,
  where
} from '@angular/fire/firestore'
import { Location } from '@angular/common'
import { MapService } from './map.service'
import { UserStoreService } from './store-service/user-store.service';
import { UserInterface } from '../interfaces/user.interface';
import { removeEmpty } from '../components/utils/functions';
import { UserNewRoleEnum } from '../enums/users-mode.enum';
import { EventService } from './my-service/event.service';
import { RegionEnum } from "../enums/regions.enum";
import { Functions, httpsCallable } from '@angular/fire/functions';
import {
  Auth,
  User,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithCustomToken,
  getIdTokenResult,
  onAuthStateChanged, authState
} from '@angular/fire/auth';


// TODO переделать костыльное решение
const moderators = [
  'RXAiksxsubN116POWwmN7giBWSn1',
];
const admins = [
  'GiaBb13A05Sg8s5X0kPY3QLtBP53',
]
const regionsModerator = [
  {
    id: 'a5NKPgVVoPbackt0CPMw5CRtLd52',
    region: RegionEnum.Stavropol
  },
  {
    id: 'zapZ2LvwjVO4FmWwi6R8cSwaEIA2',
    region: RegionEnum.Krasnodar
  },
  {
    id: 'v7oRDOklGRU9W2NrHv18dyezTYv2',
    region: RegionEnum.Rostov
  }
]
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public authState$: Observable<{ user: types.User | null }>
  public authStateAdmin$: Observable<any>
  public isAuth: boolean
  public isNeedRefreshAuthState$: BehaviorSubject<boolean>
  private isCheckLinkRegistration: boolean
  private firestore: Firestore = inject(Firestore)
  public isNeedHelpPassword: boolean
  public uid: string
  public isRegionModerator: boolean;
  public regionModerators: { id: string, region: RegionEnum };
  public isAdmin: boolean;
  public isModerators: boolean;
  private userNewRoleEnum = UserNewRoleEnum;
  private readonly _uidSubject = new BehaviorSubject<string | null>(null);
  public readonly uid$: Observable<string | null> = this._uidSubject.asObservable();

  constructor (
    public auth: Auth,
    private router: Router,
    private core: CoreService,
    public ngZone: NgZone,
    private location: Location,
    private mapService: MapService,
    private userService: UserStoreService,
    private functions: Functions,
    private eventService: EventService
  ) {
    this.isAuth = false;
    this.uid = '';
    this.isNeedHelpPassword = false;
    this.isNeedRefreshAuthState$ = new BehaviorSubject(false);
    this.isCheckLinkRegistration = false;

    onAuthStateChanged(this.auth, (user) => {
      this.isAuth = !!user;
      const uid = user?.uid ?? null;
      this._uidSubject.next(uid);
      this.isAdmin = true;
      this.isModerators = moderators.includes(this.uid);
      this.isRegionModerator = regionsModerator.map((x) => x.id).includes(this.uid);
      this.regionModerators = regionsModerator.find((moderator) => moderator.id === this.uid);
    });

    this.authState$ = authState(this.auth).pipe(
      switchMap(user => {
        if (!user) {
          return of({ user: null });
        }
        return from(getIdTokenResult(user)).pipe(
          map(tokenResult => {
            // ... ваши проверки ролей
            this.isAuth = user.emailVerified || false;
            this.uid = user.uid;
            this.isAdmin = true;
            this.isModerators = moderators.includes(this.uid);
            this.isRegionModerator = regionsModerator.map(x => x.id).includes(this.uid);
            this.regionModerators = regionsModerator.find(m => m.id === this.uid);

            if (user && !user.emailVerified && !this.isCheckLinkRegistration) {
              this.isCheckLinkRegistration = true;
              this.checkLinkRegistration(user.email || '');
            }

            return { user };
          })
        );
      }),
      shareReplay(1)
    );

    this.authStateAdmin$ = this.authState$.pipe(
      mergeMap((item: any) => {
        if (item.user) {
          return from(getIdTokenResult(item.user));
        }
        return of(null);
      }),
      map((item: any) => item?.claims['admin'])
    );
  }

  async checkLinkRegistration(email: string) {
    try {
      const isSignInWithEmailLinkResult = isSignInWithEmailLink(this.auth, window.location.href);
      if (isSignInWithEmailLinkResult) {
        this.ngZone.run(async () => {
          this.core.presentLoading('Активация...');
          try {
            await signInWithEmailLink(this.auth, email, window.location.href);
            this.core.dismissLoading();
            this.isNeedRefreshAuthState$.next(true);
          } catch (e) {
            this.core.dismissLoading();
            throw e;
          }
        });
      }
    } catch (e: any) {
      console.log(e.code);
      this.core.dismissLoading();
      this.core.presentAlertIf(
        e.code == 'auth/invalid-action-code',
        'Регистрация',
        'Ссылка для активации не действительна, попробуйте повторить процедуру'
      );
    }
  }

  async authorization(login: string, pass: string, redirect: string) {
    if (
      this.core.presentAlertIf(!login, 'Авторизация', 'E-mail пуст') ||
      this.core.presentAlertIf(!pass, 'Авторизация', 'Пустой пароль')
    )
      return;

    try {
      this.core.presentLoading('Авторизация...');

      const userCredential = await signInWithEmailAndPassword(this.auth, login, pass);
      const uid = userCredential.user?.uid as string;
      this.get(uid).pipe(take(1)).subscribe((res: any) => {
        this.userService.updateUser({ id: uid, ...res });
        this.router.navigate([redirect]);
      });
      this.core.dismissLoading();
    } catch (e: any) {
      // ... error handling remains the same
    }
  }

  signOut () {
    this.router.navigate(['/tabs/menu/registration/auth']);
    signOut(this.auth);
    this.userService.resetStore();
  }

  setupRedirectSuccessAuth (redirectSuccessAuth: string) {
    if (redirectSuccessAuth) {
      this.core.saveStorage({ redirectSuccessAuth })
    }
  }

  async savePartnership(id: string, modal: any) {
    const responsesRef = doc(
      this.firestore,
      `users/${id}/partnership/${id}`
    )
    await setDoc(responsesRef, removeEmpty(modal));
  }

  async savePageAdmin (
    uid: string,
    email: string | null,
    items: { [key: string]: any }
  ) {
    this.core.presentLoading('Сохранение...')
    if (items['address']) {
      if (items['uri']) {
        items['geometry'] = await this.mapService.geoCoderURI(items['uri'])
        delete items['uri']
      } else {
        items['geometry'] = await this.mapService.geoCoder(items['address'])
      }
    }
    if (items['phone']) {
      items['phone'] = items['phone'].replace(/[^0-9+]/g, '');
    }
    const userDoc = doc(this.firestore, 'users/' + uid)
    await setDoc(userDoc, {
      ...items,
      email
    })
    delete items['geometry'];
    this.core.dismissLoading();
  }

  async save (
    uid: string,
    email: string | null,
    items: { [key: string]: any },
    redirect: boolean = true,
    redirectUrl: string = ''
  ) {
    this.core.presentLoading('Сохранение...')
    if (items['address']) {
      if (items['uri']) {
        items['geometry'] = await this.mapService.geoCoderURI(items['uri'])
        delete items['uri']
      } else {
        items['geometry'] = await this.mapService.geoCoder(items['address'])
      }
    }
    if (items['phone']) {
      items['phone'] = items['phone'].replace(/[^0-9+]/g, '');
    }
    const userDoc = doc(this.firestore, 'users/' + uid)
    await setDoc(userDoc, removeEmpty({
      ...items,
      email
    }))
    delete items['geometry'];
    this.core.dismissLoading()
    if (redirect) {
      if (redirectUrl) {
        this.router.navigate([redirectUrl]);
        return;
      }
    } else this.location.back()
  }

  get (uid: string | null) {
    const userDoc = doc(this.firestore, 'users/' + uid)
    return docData(userDoc)
      .pipe(map(item => (item ? item : { role: 'Дилер' })))
      .pipe(share())
  }

  agreement (): Observable<any> {
    const refDoc = doc(this.firestore, 'references/agreement')
    return docData(refDoc)
  }

  users (): Observable<DocumentData[]> {
    const refDoc = collection(this.firestore, 'users')
    return collectionData(refDoc, {
      idField: 'id'
    })
  }

  async getUsersWithDocIds(excludeRoles: boolean = true): Promise<any[]> {
    const usersCollection = collection(this.firestore, "users");
    const snapshot = await getDocs(usersCollection);

    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }))
      .filter(user => {
        // Если нужно исключать роли
        if (excludeRoles) {
          return user.role !== this.userNewRoleEnum.INSTALLER && user.role !== this.userNewRoleEnum.CLIENT;
        }
        // Или возвращать всех
        return true;
      });
  }

  public getUsers(): Observable<any[]> {
    const refDoc = collection(this.firestore, 'users');
    return collectionData(refDoc);
  }

  usersFilterByPhone(phone: string | null): Observable<DocumentData[]> {
    const refDoc = collection(this.firestore, 'users');

    // Создаем запрос с условием на наличие поля "geometry"
    const q = query(refDoc, where('phone', '==', phone));

    // Возвращаем данные, только те, у кого есть поле "geometry"
    return collectionData(q, {
      idField: 'id'
    });
  }

  usersFilterByEmail(email: string | null): Observable<DocumentData[]> {
    const refDoc = collection(this.firestore, 'users');

    // Создаем запрос с условием на наличие поля "geometry"
    const q = query(refDoc, where('email', '==', email));

    // Возвращаем данные, только те, у кого есть поле "geometry"
    return collectionData(q, {
      idField: 'id'
    });
  }


  public usersWithGeometry(): Observable<DocumentData[]> {
    const refDoc = collection(this.firestore, 'users');

    // Создаем запрос с условием на наличие поля "geometry"
    const q = query(refDoc, where('geometry', '!=', null));

    // Возвращаем данные, только те, у кого есть поле "geometry"
    return collectionData(q, {
      idField: 'id'
    });
  }

  user (id: string): Observable<DocumentData | undefined> {
    const refDoc = doc(this.firestore, `users/${id}`)
    return docData(refDoc)
  }

  usersWithPhone(phone: string): Observable<DocumentData[]> {
    const usersCollection = collection(this.firestore, 'users');
    const q = query(usersCollection, where('phone', '==', phone));
    return collectionData(q);
  }

  async delete(id: string) {
    this.core.presentLoading('Удаление...');

    try {
      // 1. Удалить документ из Firestore
      const refDoc = doc(this.firestore, `users/${id}`);
      await deleteDoc(refDoc);

      // 2. Вызвать Cloud Function для удаления пользователя из Auth
      try {
        const deleteAuthUser = httpsCallable(this.functions,'deleteAuthUser');
        await firstValueFrom(from(deleteAuthUser({ userId: id })));
      } catch (fnError) {
        // Игнорируем ошибку вызова Cloud Function
        console.warn('Ошибка при вызове Cloud Function deleteAuthUser:', fnError);
      }

      this.core.dismissLoading();
      this.location.back();
    } catch (error) {
      console.error('Ошибка при удалении пользователя:', error);
      this.core.dismissLoading();
    }
  }

  public getUser(uid: string): Observable<UserInterface> {
    const userDoc = doc(this.firestore, 'users/' + uid);
    return docData(userDoc).pipe(
      map((item: any) => (item ? item : null)),
      share()
    );
  }

  public authWithToken(token: string, redirect: string, isRegistration = false): Observable<void> {
    return from(signInWithCustomToken(this.auth, token)).pipe(
      switchMap(userCredential => {
        const uid = userCredential.user?.uid as string;
        return this.get(uid).pipe(
          take(1),
          tap((res: any) => {
            this.userService.updateUser({ id: uid, ...res });
            if (isRegistration) {
              this.eventService.notifyServiceRegistered();
            }
            this.router.navigate([redirect]);
          })
        );
      }),
      catchError(error => {
        console.error(error.code);

        // Обработка ошибок через сервис core
        this.core.presentAlertIf(
          error.code === 'auth/invalid-custom-token',
          'Авторизация',
          'Недействительный токен. Попробуйте снова.'
        );
        this.core.presentAlertIf(
          error.code === 'auth/network-request-failed',
          'Авторизация',
          'Нет связи. Попробуйте позже.'
        );

        return throwError(error);
      })
    );
  }

  public getUserByIdentifier(email?: string, phone?: string): Observable<DocumentData[]> {
    return defer(async () => {
      const usersRef = collection(this.firestore, 'users');
      let results: DocumentData[] = [];

      // Поиск по email (если передан и не пустой)
      if (email?.trim()) {
        const emailQuery = query(usersRef, where('email', '==', email.trim()));
        const emailSnapshot = await getDocs(emailQuery);
        if (!emailSnapshot.empty) {
          return emailSnapshot.docs.map(doc => doc.data());
        }
      }

      // Поиск по телефону (если email не найден и телефон передан)
      if (phone?.trim()) {
        const phoneQuery = query(usersRef, where('phone', '==', phone.trim()));
        const phoneSnapshot = await getDocs(phoneQuery);
        results = phoneSnapshot.docs.map(doc => doc.data());
      }

      return results;
    });
  }
}
