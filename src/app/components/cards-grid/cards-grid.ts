import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MtgSet } from '../../models/mtg-set.model';
import { DividerCard } from '../divider-card/divider-card';

@Component({
  selector: 'app-cards-grid',
  imports: [CommonModule, DividerCard],
  templateUrl: './cards-grid.html',
  styleUrl: './cards-grid.css',
})
export class CardsGrid {
  // Input: Array von MTG Sets
  sets = input.required<MtgSet[]>();

  // Output: Event zum Entfernen eines Sets
  setRemoved = output<number>();

  /**
   * Entfernt ein Set aus der Liste
   */
  removeSet(index: number): void {
    this.setRemoved.emit(index);
  }
}
