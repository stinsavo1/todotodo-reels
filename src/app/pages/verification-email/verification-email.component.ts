import { Component, OnInit } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { UserService } from "../../services/my-service/user.service";
import { Router } from "@angular/router";
import { CoreService } from "../../services/core.service";

@Component({
    selector: 'app-verification-email',
    templateUrl: './verification-email.component.html',
    styleUrls: ['./verification-email.component.scss'],
    standalone: false
})
@UntilDestroy()
export class VerificationEmailComponent implements OnInit {
  public email: string;
  public id: string;

  constructor(private userService: UserService,
              private core: CoreService,
              private router: Router) {
  }

  ngOnInit() {
    const urlParams = new URLSearchParams(window.location.search);
    this.id = urlParams.get('id');
  }

  public save(): void {
    this.userService.deleteUserLinkByUserId(this.id).then();
    this.userService.updateUserEmail(this.id, this.email).then(() => {
      this.core.presentAlert('Почта добавлена', 'Ваша почта успешно добавлена. Чтобы продолжить, авторизуйтесь по номеру телефона.')
      this.router.navigate(['/tabs/menu/registration/auth']);
    });
  }
}
