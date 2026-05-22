import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerSettingsComponent } from './customer-setings.component';

// import { CustomerSetingsComponent } from './customer-setings.component';

describe('CustomerSetingsComponent', () => {
  let component: CustomerSettingsComponent;
  let fixture: ComponentFixture<CustomerSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerSettingsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
