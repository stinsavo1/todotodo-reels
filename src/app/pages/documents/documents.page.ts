import { Component } from '@angular/core'

@Component({
    selector: 'app-documents',
    templateUrl: './documents.page.html',
    styleUrls: ['./documents.page.scss'],
    standalone: false
})
export class DocumentsPage {

  public openSupport(): void {
    window.location.href = 'https://wa.me/79889770777?text=%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82!%20%D0%9C%D0%BD%D0%B5%20%D0%BD%D1%83%D0%B6%D0%BD%D0%B0%20%D0%BF%D0%BE%D0%BC%D0%BE%D1%89%D1%8C%20%D0%B2%20%D0%B2%D0%B0%D1%88%D0%B5%D0%BC%20%D1%81%D0%B5%D1%80%D0%B2%D0%B8%D1%81%D0%B5';
  }
}
