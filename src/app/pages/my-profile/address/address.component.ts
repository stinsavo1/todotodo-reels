import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { Observable, ReplaySubject, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MapService } from '../../../services/map.service';

@Component({
    selector: 'app-address',
    templateUrl: './address.component.html',
    styleUrls: ['./address.component.scss'],
    standalone: false
})
@UntilDestroy()
export class AddressComponent implements OnInit {
  public item$: Observable<any>;
  public searchAddressList$: Observable<{ [key: string]: any }[]>;
  public searchAddress$: ReplaySubject<string>;
  public address: string = '';
  public addressTouched: boolean = false;
  public items: any;
  private uid: string;

  constructor(private authService: AuthService,
              private ngZone: NgZone,
              private mapService: MapService,
              private cdr: ChangeDetectorRef,
              private router: Router) {
  }

  public ngOnInit() {
    this.searchAddress$ = new ReplaySubject(1);
    this.searchAddressList$ = this.mapService.suggest(this.searchAddress$).pipe(untilDestroyed(this));
    this.item$ = this.authService.authState$.pipe(
      tap((x: any) => {
        if (x?.user) {
          this.uid = x.user.uid
          return x;
        }
      }),
      switchMap(item => this.authService.get(item.user?.uid || '')),
      map((x) => {
        this.items = x;
        return x;
      })
    );
  }

  public onChangeAddress (e: CustomEvent): void {
    this.ngZone.run(() => {
      this.searchAddress$.next(e.detail.value)
    })
  }

  public selectAddress(item: { [key: string]: any }, text: string, uri: string): void {
    this.ngZone.run(() => {
      item['address'] = text;
      this.searchAddress$.next('');
      item['uri'] = uri;
    });
  }

  public save(): void {
    this.authService.save(this.uid, this.items.email, this.items).then(() => {
    }).finally(() => {
      this.router.navigate(['/tabs/menu/my-profile']);
    })
  }
}
