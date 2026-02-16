import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DividerCard } from './divider-card';

describe('DividerCard', () => {
  let component: DividerCard;
  let fixture: ComponentFixture<DividerCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DividerCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DividerCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
