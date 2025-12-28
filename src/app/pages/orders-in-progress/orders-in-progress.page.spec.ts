import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrdersInProgressPage } from './orders-in-progress.page';

describe('OrdersInProgressPage', () => {
  let component: OrdersInProgressPage;
  let fixture: ComponentFixture<OrdersInProgressPage>;

  beforeEach((async () => {
    fixture = TestBed.createComponent(OrdersInProgressPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
