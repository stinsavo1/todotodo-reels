import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { LoadingScreenService } from '../services/my-service/loading-screen.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private loadingShown = false; // Флаг для отслеживания состояния загрузки

  constructor(private loadingScreenService: LoadingScreenService) {}

  canActivate() {
    if (this.loadingShown) {
      // Если экран загрузки уже был показан, сразу разрешаем доступ
      return of(true);
    }

    // Устанавливаем флаг, чтобы не показывать загрузку повторно
    this.loadingShown = true;

    // Показываем экран загрузки на 2 секунды только при первой загрузке
    this.loadingScreenService.show();
    return of(true).pipe(
      delay(2000),
      tap(() => this.loadingScreenService.hide())
    );
  }
}
