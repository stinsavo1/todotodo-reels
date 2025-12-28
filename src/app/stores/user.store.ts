import { Store, StoreConfig } from '@datorama/akita';
import { UserInterface } from '../interfaces/user.interface';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'user', resettable: true })
export class UserStore extends Store<UserInterface> {
  constructor() {
    super({});
  }
}
