import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { environment } from "../../../environments/environment";

@Component({
    selector: 'app-tabs',
    templateUrl: 'tabs.page.html',
    styleUrls: ['tabs.page.scss'],
    standalone: false
})
@UntilDestroy()
export class TabsPage implements OnInit {
  isAdmin: boolean;
  constructor(private authService: AuthService,
              private router: Router) {
  }

  ngOnInit() {
    this.isAdmin = true;
  }

  public signOut(): void {
    this.router.navigate(['/tabs/menu']);
    this.authService.signOut();
  }
}
