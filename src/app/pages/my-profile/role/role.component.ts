import { Component, OnInit } from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import {UserNewRoleEnum, UsersModeEnum} from "../../../enums/users-mode.enum";
import {SegmentChangeEventDetail} from "@ionic/angular";
import {untilDestroyed} from "@ngneat/until-destroy";
import {UserStoreService} from "../../../services/store-service/user-store.service";

@Component({
    selector: 'app-role',
    templateUrl: './role.component.html',
    styleUrls: ['./role.component.scss'],
    standalone: false
})

export class RoleComponent implements OnInit {
  public fio: string = '';
  public selectedRole: string | null = null;
  public selectedMode: string | null = null;
  public userNewRoleEnum = UserNewRoleEnum;
  public usersMode = UsersModeEnum;
  public hasError: boolean = false;
  public items: any;
  private uid: string;
  public item$: Observable<any>;

  constructor(private authService: AuthService,
              private userStoreService: UserStoreService,
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
        this.selectedRole = x['role'];
        if (!x['mode']) {
          x['mode'] = this.usersMode.USERS;
        }
        this.selectedMode = x['mode'];
        this.items = x;
        return x;
      })
    );
  }

  selectRole(role: string): void {
    this.selectedRole = role;
  }

  public onSegmentChanged(event: CustomEvent<SegmentChangeEventDetail>): void {
    this.selectedMode = event.detail.value as string;
    if (this.items.mode === this.selectedMode) {
      this.selectedRole = this.items.role;
    } else {
      this.selectedRole = null;
    }
  }

  public save(): void {
    this.hasError = false;
    if (!this.selectedRole) {
      this.hasError = true;
      return;
    }
    this.items['mode'] = this.selectedMode;
    this.items['role'] = this.selectedRole;
    this.authService.save(this.uid, this.items.email, this.items).then(() => {
      this.authService.get(this.authService.uid).pipe(untilDestroyed(this))
        .subscribe((res: any) => {
          this.userStoreService.updateUser({ id: this.authService.uid, ...res });
        })
    }).finally(() => {
      this.router.navigate(['/tabs/menu/my-profile']);
    });
  }
}
