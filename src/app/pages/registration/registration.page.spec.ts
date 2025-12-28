import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistrationPage } from './registration.page';

describe('PagesRegistrationPage', () => {
  let component: RegistrationPage;
  let fixture: ComponentFixture<PagesRegistrationPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(RegistrationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
