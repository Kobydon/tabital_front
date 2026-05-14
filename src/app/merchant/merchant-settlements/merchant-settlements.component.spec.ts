import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchantSettlementsComponent } from './merchant-settlements.component';

describe('MerchantSettlementsComponent', () => {
  let component: MerchantSettlementsComponent;
  let fixture: ComponentFixture<MerchantSettlementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MerchantSettlementsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MerchantSettlementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
