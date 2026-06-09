import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchantOverviewComponent } from './merchant-overview.component';

describe('MerchantOverviewComponent', () => {
  let component: MerchantOverviewComponent;
  let fixture: ComponentFixture<MerchantOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MerchantOverviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MerchantOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
