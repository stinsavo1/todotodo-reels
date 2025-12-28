import { Component } from '@angular/core'
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-menu',
    templateUrl: './menu.page.html',
    styleUrls: ['./menu.page.scss'],
    standalone: false
})
export class MenuPage {
  constructor(public authService: AuthService) {
  }
}
