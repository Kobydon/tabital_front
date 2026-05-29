import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppoveCustomerKycComponent } from './appove-customer-kyc.component';

describe('AppoveCustomerKycComponent', () => {
  let component: AppoveCustomerKycComponent;
  let fixture: ComponentFixture<AppoveCustomerKycComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppoveCustomerKycComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppoveCustomerKycComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
