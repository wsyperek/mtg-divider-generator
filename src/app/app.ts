import { Component, signal, computed } from '@angular/core';
import { MtgSet } from './models/mtg-set.model';
import { SetInputForm } from './components/set-input-form/set-input-form';
import { SetSelectorList } from './components/set-selector-list/set-selector-list';
import { CardsGrid } from './components/cards-grid/cards-grid';
import { PdfExporter } from './components/pdf-exporter/pdf-exporter';
import { FormsModule } from '@angular/forms';

type SortOption = 'added' | 'name' | 'date-desc' | 'date-asc';

@Component({
  selector: 'app-root',
  imports: [SetInputForm, SetSelectorList, CardsGrid, PdfExporter, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = 'MTG Divider Cards Generator';

  // State: Liste der hinzugefügten MTG Sets
  private readonly rawSets = signal<MtgSet[]>([]);

  // Sortier-Option
  protected sortOption = signal<SortOption>('added');

  // Modal-State für Set-Selektor
  protected readonly showSetSelector = signal<boolean>(false);

  // Computed: Sortierte Sets
  protected readonly sets = computed(() => {
    const sets = [...this.rawSets()];
    const option = this.sortOption();

    switch (option) {
      case 'name':
        return sets.sort((a, b) => a.name.localeCompare(b.name));
      case 'date-desc':
        return sets.sort((a, b) => b.released_at.localeCompare(a.released_at));
      case 'date-asc':
        return sets.sort((a, b) => a.released_at.localeCompare(b.released_at));
      case 'added':
      default:
        return sets;
    }
  });

  /**
   * Fügt ein neues Set zur Liste hinzu
   */
  onSetAdded(newSet: MtgSet): void {
    // Prüfen ob Set bereits existiert
    const exists = this.rawSets().some(set => set.code === newSet.code);

    if (exists) {
      alert(`Set "${newSet.code}" wurde bereits hinzugefügt.`);
      return;
    }

    // Set zur Liste hinzufügen
    this.rawSets.update(currentSets => [...currentSets, newSet]);
  }

  /**
   * Entfernt ein Set aus der Liste (basierend auf Code statt Index)
   */
  onSetRemoved(index: number): void {
    const setToRemove = this.sets()[index];
    this.rawSets.update(currentSets =>
      currentSets.filter(set => set.code !== setToRemove.code)
    );
  }

  /**
   * Ändert die Sortier-Option
   */
  onSortChange(option: SortOption): void {
    this.sortOption.set(option);
  }

  /**
   * Öffnet den Set-Selektor Modal
   */
  openSetSelector(): void {
    this.showSetSelector.set(true);
  }

  /**
   * Schließt den Set-Selektor Modal
   */
  closeSetSelector(): void {
    this.showSetSelector.set(false);
  }

  /**
   * Fügt mehrere Sets zur Liste hinzu (von Set-Selektor)
   */
  onBatchSetsAdded(newSets: MtgSet[]): void {
    const existingCodes = new Set(this.rawSets().map(s => s.code));
    const uniqueNewSets = newSets.filter(set => !existingCodes.has(set.code));

    if (uniqueNewSets.length === 0) {
      alert('Alle ausgewählten Sets sind bereits hinzugefügt');
      this.closeSetSelector();
      return;
    }

    // Sets hinzufügen
    this.rawSets.update(current => [...current, ...uniqueNewSets]);

    // Feedback und Modal schließen
    const skipped = newSets.length - uniqueNewSets.length;
    if (skipped > 0) {
      alert(`${uniqueNewSets.length} Sets hinzugefügt. ${skipped} Set(s) waren bereits vorhanden.`);
    } else {
      alert(`${uniqueNewSets.length} Sets erfolgreich hinzugefügt!`);
    }

    this.closeSetSelector();
  }
}
