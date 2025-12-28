import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-finish-registration',
    templateUrl: './finish-registration.component.html',
    styleUrls: ['./finish-registration.component.scss'],
    standalone: false
})
export class FinishRegistrationComponent {

  constructor(public authService: AuthService) {
  }
}
