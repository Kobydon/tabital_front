import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomersOverviewComponent } from './customers-overview.component';

describe('CustomersOverviewComponent', () => {
  let component: CustomersOverviewComponent;
  let fixture: ComponentFixture<CustomersOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomersOverviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomersOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
