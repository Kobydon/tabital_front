import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductPlansComponent } from './product-plans.component';

describe('ProductPlansComponent', () => {
  let component: ProductPlansComponent;
  let fixture: ComponentFixture<ProductPlansComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductPlansComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductPlansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
