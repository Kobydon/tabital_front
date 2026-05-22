import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerPlansComponent } from './customer-plans.component';

describe('CustomerPlansComponent', () => {
  let component: CustomerPlansComponent;
  let fixture: ComponentFixture<CustomerPlansComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerPlansComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerPlansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
