import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchantTransactionsComponent } from './merchant-transactions.component';

describe('MerchantTransactionsComponent', () => {
  let component: MerchantTransactionsComponent;
  let fixture: ComponentFixture<MerchantTransactionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MerchantTransactionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MerchantTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
