import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportsAnalyticsComponent } from './reports-analytics.component';

describe('ReportsAnalyticsComponent', () => {
  let component: ReportsAnalyticsComponent;
  let fixture: ComponentFixture<ReportsAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportsAnalyticsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportsAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
