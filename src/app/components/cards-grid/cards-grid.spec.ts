import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardsGrid } from './cards-grid';

describe('CardsGrid', () => {
  let component: CardsGrid;
  let fixture: ComponentFixture<CardsGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardsGrid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardsGrid);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
