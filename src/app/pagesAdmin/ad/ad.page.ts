import { Component, OnInit } from '@angular/core'
import { AdService } from '../../services/my-service/ad.service';

@Component({
    selector: 'app-ad',
    templateUrl: './ad.page.html',
    standalone: false
})
export class AdPage implements OnInit {
  public items: any[];

  constructor (private adService: AdService) {
  }

  ngOnInit() {
    this.adService.getClicksByDays().then((res) => {
      this.items = res;
    });
  }
}
