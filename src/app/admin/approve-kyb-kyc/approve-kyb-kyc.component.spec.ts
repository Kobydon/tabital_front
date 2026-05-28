import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveKybKycComponent } from './approve-kyb-kyc.component';

describe('ApproveKybKycComponent', () => {
  let component: ApproveKybKycComponent;
  let fixture: ComponentFixture<ApproveKybKycComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApproveKybKycComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApproveKybKycComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
