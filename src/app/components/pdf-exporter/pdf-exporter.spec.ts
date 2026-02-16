import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfExporter } from './pdf-exporter';

describe('PdfExporter', () => {
  let component: PdfExporter;
  let fixture: ComponentFixture<PdfExporter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfExporter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfExporter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
