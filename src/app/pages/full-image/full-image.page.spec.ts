import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FullImagePage } from './full-image.page';

describe('FullImagePage', () => {
  let component: FullImagePage;
  let fixture: ComponentFixture<FullImagePage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(FullImagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
