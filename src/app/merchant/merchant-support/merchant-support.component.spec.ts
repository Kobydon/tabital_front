import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchantSupportComponent } from './merchant-support.component';

describe('MerchantSupportComponent', () => {
  let component: MerchantSupportComponent;
  let fixture: ComponentFixture<MerchantSupportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MerchantSupportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MerchantSupportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
