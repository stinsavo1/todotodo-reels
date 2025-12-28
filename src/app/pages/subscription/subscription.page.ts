import { Component } from '@angular/core'
import { DocumentData } from '@angular/fire/firestore'
import { Observable, switchMap, tap } from 'rxjs'
import { AuthService } from 'src/app/services/auth.service'
import { CoreService } from 'src/app/services/core.service'
import { PaymentService } from 'src/app/services/payment.service'
import { UsersModeEnum } from '../../enums/users-mode.enum';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@Component({
    selector: 'app-subscription',
    templateUrl: './subscription.page.html',
    styleUrls: ['./subscription.page.scss'],
    standalone: false
})
@UntilDestroy()
export class SubscriptionPage {
  public selectedTarif = 'm6';
  public tarifs: any[] = [];
  public allTarifs: any[] = [];
  public tarif: any;
  public usersMode = UsersModeEnum;
  public statusPay$: Observable<DocumentData | undefined>
  public user: any;
  public allRoles = false;
  public selectedRole: string;

  constructor (
    public authService: AuthService,
    private paymentService: PaymentService,
    private core: CoreService
  ) {
    this.authService.authState$.pipe(
      tap(auth => {
        if (!auth.user) {
          this.selectedRole = 'Дилер';
          this.allRoles = true;
        }
      }),
      switchMap(item => this.authService.get(item.user?.uid || ''))
    ).subscribe((res) => {
      this.selectedRole = res['role'];
      if (res['mode'] === this.usersMode.FACTORY) {
        this.selectedRole = 'Производство';
      }
      if (res['mode'] === this.usersMode.SERVICES) {
        this.selectedRole = 'Услуга';
      }
      this.user = res;
    });
    this.getTarifs();
    this.statusPay$ = this.paymentService.getStatusPayment()
  }

  selectRole(role: string): void {
    this.selectedRole = role;
    if (this.selectedRole === 'Монтажник' || this.selectedRole === 'Дилер') {
      this.tarifs = this.allTarifs.filter((x: any) => x.id === 'users');
    } else if (this.selectedRole === 'Производство') {
      this.tarifs = this.allTarifs.filter((x: any) => x.id === 'factory');
    } else if (this.selectedRole === 'Услуга') {
      this.tarifs = this.allTarifs.filter((x: any) => x.id === 'services');
    }
    // this.selectedTarif = this.tarif.find((y: any) => y.default).id;
  }

  public doPay(): void {
    this.core.presentLoading('Переход на оплату...');
    this.paymentService.getPayURL(this.selectedTarif, this.user.mode).then(res => {
      this.core.dismissLoading();
      document.location.href = res['data'].url
    })
  }

  private getTarifs(): void {
    this.paymentService.getTarifs().pipe(untilDestroyed(this)).subscribe((res: any) => {
      this.allTarifs = res;
      this.selectRole(this.selectedRole);
    })
  }
}
