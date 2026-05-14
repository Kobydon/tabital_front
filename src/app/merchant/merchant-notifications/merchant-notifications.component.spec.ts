import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchantNotificationsComponent } from './merchant-notifications.component';

describe('MerchantNotificationsComponent', () => {
  let component: MerchantNotificationsComponent;
  let fixture: ComponentFixture<MerchantNotificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MerchantNotificationsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MerchantNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
