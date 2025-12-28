import { Pipe, PipeTransform } from '@angular/core'
import { Observable, map } from 'rxjs'
import { AuthService } from '../services/auth.service'

@Pipe({
    name: 'fio',
    standalone: false
})

export class FioPipe implements PipeTransform {
  constructor (private authService: AuthService) {}

  transform (uid: string, args?: any): Observable<string> {
    return this.authService
      .get(uid)
      .pipe(
        map(item => item['fio'] || '-'
        )
      )
  }
}
