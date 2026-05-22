import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchantDocumentComponent } from './merchant-document.component';

describe('MerchantDocumentComponent', () => {
  let component: MerchantDocumentComponent;
  let fixture: ComponentFixture<MerchantDocumentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MerchantDocumentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MerchantDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
