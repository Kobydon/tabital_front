import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchantOrderComponent } from './merchant-order.component';

describe('MerchantOrderComponent', () => {
  let component: MerchantOrderComponent;
  let fixture: ComponentFixture<MerchantOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MerchantOrderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MerchantOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
