import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchantSettingsComponent } from './merchant-settings.component';

describe('MerchantSettingsComponent', () => {
  let component: MerchantSettingsComponent;
  let fixture: ComponentFixture<MerchantSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MerchantSettingsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MerchantSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
