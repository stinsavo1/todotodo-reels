import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';



@Component({
  selector: 'app-reels-tabs',
  templateUrl: './reels-tabs.component.html',
  styleUrls: ['./reels-tabs.component.scss'],
  standalone:false,
})
export class ReelsTabsComponent  implements OnInit {
 @Output() createReels = new EventEmitter();
 navigation = {
   'profile':'/tabs/menu/my-profile',
   'home':'/tabs/menu',
   'docs':'/tabs/menu',
   'cart':'/tabs/menu'
 }

  constructor(private router:Router) { }

  ngOnInit() {
  }

  public openCreateModal(): void {
    this.createReels.emit();
  }

  goTo(tab: string) {
    this.router.navigate([this.navigation[tab]]).then();
  }
}
