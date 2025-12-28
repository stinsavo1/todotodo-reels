import { UserStore } from '../../stores/user.store';
import { UserInterface } from '../../interfaces/user.interface';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserStoreService {
  constructor(private userStore: UserStore) {}
  public updateUser(user: UserInterface): void {
    this.userStore.update(user);
  }

  public getUser(): Observable<UserInterface> {
    return this.userStore._select((state: UserInterface) => state);
  }

  public getUserValue(): UserInterface {
    return this.userStore.getValue()
  }

  public resetStore(): void {
    this.userStore.reset();
  }
}
