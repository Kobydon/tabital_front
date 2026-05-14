import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchantInstalmentsComponent } from './merchant-instalments.component';

describe('MerchantInstalmentsComponent', () => {
  let component: MerchantInstalmentsComponent;
  let fixture: ComponentFixture<MerchantInstalmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MerchantInstalmentsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MerchantInstalmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
