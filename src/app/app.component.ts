import { Component, OnInit } from '@angular/core'
import { Observable } from 'rxjs'
import { LoadingScreenService } from './services/my-service/loading-screen.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false
})

export class AppComponent implements OnInit {
  public loading$: Observable<boolean>;

  constructor(
    private loadingScreenService: LoadingScreenService,
  ) {
  }

  public ngOnInit(): void {
    this.loading$ = this.loadingScreenService.loading$;
  }
}
