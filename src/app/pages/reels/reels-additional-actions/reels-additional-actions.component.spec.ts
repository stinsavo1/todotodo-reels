import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ReelsAdditionalActionsComponent } from './reels-additional-actions.component';

describe('ReelsAdditionalActionsComponent', () => {
  let component: ReelsAdditionalActionsComponent;
  let fixture: ComponentFixture<ReelsAdditionalActionsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReelsAdditionalActionsComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ReelsAdditionalActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
