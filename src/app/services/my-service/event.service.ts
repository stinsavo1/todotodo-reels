import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private serviceRegistrationSubject: Subject<void> = new Subject<void>(); // Для регистрации услуг

  notifyServiceRegistered(): void {
    this.serviceRegistrationSubject.next();
  }

  onServiceRegistered(): Observable<void> {
    return this.serviceRegistrationSubject.asObservable();
  }
}
