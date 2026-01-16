import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { PlatformService } from '../../../services/my-service/mobile.service';
import { Reel } from '../interfaces/reels.interface';

@Component({
  selector: 'app-reels-tabs',
  templateUrl: './reels-tabs.component.html',
  styleUrls: ['./reels-tabs.component.scss'],
  standalone: false,
})
export class ReelsTabsComponent implements OnInit {
  @ViewChild('fInput') fInput: ElementRef;
  @Input() reel:Reel;
  @Output() createReels = new EventEmitter<string | null>();
  navigation = {
    'profile': '/tabs/menu/my-profile',
    'home': '/tabs/menu',
    'docs': '/tabs/menu',
    'cart': '/tabs/menu'
  };
  public file:string;

  constructor(private router: Router, private platformService:PlatformService) {
  }

  ngOnInit() {
  }

  public openCreateModal(): void {
    this.createReels.emit();
  }

  goTo(tab: string) {
    this.router.navigate([this.navigation[tab]]).then();
  }

  public uploadVideo(event:any): void {
    this.createReels.emit(event)
  }

  public dowloadFile(): void {
    this.fInput.nativeElement.click()
  }
}
