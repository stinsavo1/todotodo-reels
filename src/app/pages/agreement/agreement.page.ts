import { Component, OnInit } from '@angular/core'
import { Observable } from 'rxjs'
import { AuthService } from 'src/app/services/auth.service'

@Component({
    selector: 'app-agreement',
    templateUrl: './agreement.page.html',
    styleUrls: ['./agreement.page.scss'],
    standalone: false
})
export class AgreementPage implements OnInit {
  item$: Observable<any>

  constructor (private authService: AuthService) {
    this.item$ = this.authService.agreement()
  }

  ngOnInit () {}
}
