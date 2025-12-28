import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { OrdersService } from '../../../services/orders.service';

@Component({
    selector: 'app-region',
    templateUrl: './region.component.html',
    styleUrls: ['./region.component.scss'],
    standalone: false
})
@UntilDestroy()
export class RegionComponent implements OnInit {
  public item$: Observable<any>;
  public regions$: Observable<any>;
  public region: string = '';
  public regionTouched: boolean = false;
  public items: any;
  private uid: string;

  constructor(private authService: AuthService,
              private ordersService: OrdersService,
              private detectorRef: ChangeDetectorRef,
              private router: Router) {
  }

  public ngOnInit() {
    this.regions$ = this.ordersService.regions().pipe(untilDestroyed(this));
    this.item$ = this.authService.authState$.pipe(
      tap((x: any) => {
        if (x?.user) {
          this.uid = x.user.uid
          return x;
        }
      }),
      switchMap(item => this.authService.get(item.user?.uid || '')),
      map((x: any) => {
        if (!x.region) {
          this.regionTouched = true;
        }
        this.items = x;
        return x;
      })
    );
  }

  public change(): void {
    this.regionTouched = true;
    this.detectorRef.detectChanges();
  }

  public save(): void {
    this.authService.save(this.uid, this.items.email, this.items).then(() => {
    }).finally(() => {
      this.router.navigate(['/tabs/menu/my-profile']);
    })
  }
}
