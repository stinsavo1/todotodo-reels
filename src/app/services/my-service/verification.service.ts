import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { catchError, from, Observable, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {

  constructor(
    private functions: Functions, // ✅ Современный сервис
    private authService: AuthService
  ) { }

  public registration(email: string, fullName: string, phone: string, region: number, idReferral?: string, promocode?: string): Observable<any> {
    const callable = httpsCallable(this.functions, 'registration');
    return from(callable({ email, fio: fullName, phone, region, idReferral, promocode }));
  }

  public resendCodeSMS(phone: string): Observable<any> {
    const callable = httpsCallable(this.functions, 'resendCodeSMS');
    return from(callable({ phone }));
  }

  public sendCodeByEmail(phoneNumber: string): Observable<any> {
    const callable = httpsCallable(this.functions, 'sendVerificationCodeByEmail');
    return from(callable({ phoneNumber }));
  }

  public verifyCodeBySms(phoneNumber: string, code: string): Observable<void> {
    const callable = httpsCallable(this.functions, 'verifyCodeBySms');
    return from(callable({ phoneNumber, code })).pipe(
      switchMap((response: any) => {
        const customToken = response.data.token; // ✅ Обратите внимание: данные часто в `response.data`
        return from(this.authService.authWithToken(customToken, '/tabs/map', true));
      }),
      catchError(error => throwError(() => error))
    );
  }

  public verifyCode(phoneNumber: string, code: string): Observable<void> {
    const callable = httpsCallable(this.functions, 'verifyCodeByEmail');
    return from(callable({ phoneNumber, code })).pipe(
      switchMap((response: any) => {
        const customToken = response.data.token; // ✅ Данные в `response.data`
        return this.authService.authWithToken(customToken, '/tabs/map');
      }),
      catchError(error => throwError(() => error)),
    );
  }

  public simpleRegistration(params: any): Observable<any> {
    const callable = httpsCallable(this.functions, 'simpleRegistration');
    return from(callable(params));
  }
}
