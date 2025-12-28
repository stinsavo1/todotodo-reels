import { Component, OnInit } from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { PhoneMaskPipe } from '../../../pipes/phone-mask.pipe';

@Component({
    selector: 'app-phone',
    templateUrl: './phone.component.html',
    styleUrls: ['./phone.component.scss'],
    standalone: false
})

export class PhoneComponent implements OnInit {
  public item$: Observable<any>;
  public phone: string = '';
  public phoneTouched: boolean = false;
  public items: any;
  private uid: string;

  constructor(private authService: AuthService,
              private phoneMaskPipe: PhoneMaskPipe,
              private router: Router) {
  }

  public ngOnInit() {
    this.item$ = this.authService.authState$.pipe(
      tap((x: any) => {
        if (x?.user) {
          this.uid = x.user.uid
          return x;
        }
      }),
      switchMap(item => this.authService.get(item.user?.uid || '')),
      map((x) => {
        x['phone'] = this.phoneMaskPipe.transform(x['phone']);
        this.items = x;
        return x;
      })
    );
  }

  public save(): void {
    this.authService.save(this.uid, this.items.email, this.items).then(() => {
    }).finally(() => {
      this.router.navigate(['/tabs/menu/my-profile']);
    })
  }
}
