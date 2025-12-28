import { Pipe, PipeTransform } from '@angular/core';
import { DocumentData } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Pipe({
  name: 'profileFIO',
  standalone: false
})
export class ProfileFIOPipe implements PipeTransform {
  constructor(private authService: AuthService) {}

  transform(uid: string): Observable<string> {
    return this.authService.get(uid).pipe(
      map(item => {
        if (!item) return '-';

        const finishPeriod = item['finishPeriod'];
        if (!finishPeriod) return '-';

        // Assuming finishPeriod is an ISO string
        const finishDate = new Date(finishPeriod);
        const now = new Date();

        return finishDate > now ? item['fio'] : '-';
      })
    );
  }
}
