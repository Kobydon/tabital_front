import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerShopComponent } from './shop.component';

// import { ShopComponent } from './shop.component';

describe('ShopComponent', () => {
  let component: CustomerShopComponent;
  let fixture: ComponentFixture<CustomerShopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerShopComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerShopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
