import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetInputForm } from './set-input-form';

describe('SetInputForm', () => {
  let component: SetInputForm;
  let fixture: ComponentFixture<SetInputForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetInputForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetInputForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
