import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-cookie-banner',
    templateUrl: './cookie-banner.component.html',
    styleUrls: ['./cookie-banner.component.scss'],
    standalone: false
})
export class CookieBannerComponent implements OnInit {
  isVisible = true;

  ngOnInit() {
    const consent = localStorage.getItem('cookieConsent');
    const consentDateStr = localStorage.getItem('cookieConsentDate');

    if (consent === 'accepted' && consentDateStr) {
      const consentDate = new Date(consentDateStr);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      if (consentDate >= sixMonthsAgo) {
        this.isVisible = false;
      } else {
        this.isVisible = true; // Согласие устарело
      }
    } else {
      this.isVisible = true;
    }
  }

  acceptCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    this.isVisible = false;
  }
}
