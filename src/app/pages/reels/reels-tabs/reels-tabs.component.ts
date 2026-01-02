import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';



@Component({
  selector: 'app-reels-tabs',
  templateUrl: './reels-tabs.component.html',
  styleUrls: ['./reels-tabs.component.scss'],
  standalone:false,
})
export class ReelsTabsComponent  implements OnInit {
 @Output() createReels = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  public openCreateModal(): void {
    this.createReels.emit();
  }

  goTo(tab: string) {
    console.log('Navigate to:', tab);
  }
}
