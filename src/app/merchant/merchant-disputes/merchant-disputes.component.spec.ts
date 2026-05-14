import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchantDisputesComponent } from './merchant-disputes.component';

describe('MerchantDisputesComponent', () => {
  let component: MerchantDisputesComponent;
  let fixture: ComponentFixture<MerchantDisputesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MerchantDisputesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MerchantDisputesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
