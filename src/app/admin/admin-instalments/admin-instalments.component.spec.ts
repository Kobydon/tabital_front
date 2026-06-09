import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminInstalmentsComponent } from './admin-instalments.component';

describe('AdminInstalmentsComponent', () => {
  let component: AdminInstalmentsComponent;
  let fixture: ComponentFixture<AdminInstalmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminInstalmentsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminInstalmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
