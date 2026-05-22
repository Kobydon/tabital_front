import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerInstalmentsComponent } from './customer-instalments.component';

describe('CustomerInstalmentsComponent', () => {
  let component: CustomerInstalmentsComponent;
  let fixture: ComponentFixture<CustomerInstalmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerInstalmentsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerInstalmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
