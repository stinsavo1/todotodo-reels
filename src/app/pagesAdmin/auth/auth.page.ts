import { Component, OnInit } from '@angular/core'
import { AuthService } from 'src/app/services/auth.service'

@Component({
    selector: 'app-auth',
    templateUrl: './auth.page.html',
    styleUrls: ['./auth.page.scss'],
    standalone: false
})
export class AuthPage implements OnInit {
  public login: string = ''
  public pass: string = ''

  constructor (public authService: AuthService) {}

  ngOnInit () {
    this.authService.setupRedirectSuccessAuth('/admin/tabs')
  }
}
