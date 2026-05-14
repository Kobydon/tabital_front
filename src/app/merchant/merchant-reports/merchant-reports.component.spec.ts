import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchantReportsComponent } from './merchant-reports.component';

describe('MerchantReportsComponent', () => {
  let component: MerchantReportsComponent;
  let fixture: ComponentFixture<MerchantReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MerchantReportsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MerchantReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
