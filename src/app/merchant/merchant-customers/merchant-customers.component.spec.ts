import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchantCustomersComponent } from './merchant-customers.component';

describe('MerchantCustomersComponent', () => {
  let component: MerchantCustomersComponent;
  let fixture: ComponentFixture<MerchantCustomersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MerchantCustomersComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MerchantCustomersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
