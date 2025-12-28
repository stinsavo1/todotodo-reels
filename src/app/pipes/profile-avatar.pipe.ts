import { Pipe, PipeTransform } from '@angular/core'
import { AuthService } from '../services/auth.service'
import { map, Observable } from 'rxjs'

@Pipe({
    name: 'profileAvatar',
    standalone: false
})
export class ProfileAvatarPipe implements PipeTransform {
  constructor (private authService: AuthService) {}

  transform (uid: string, args?: any): Observable<string> {
    return this.authService
      .get(uid)
      .pipe(
        map(
          item => item['photo'] && item['photo'].length > 0 && item['photo'][0]
        )
      )
  }
}
