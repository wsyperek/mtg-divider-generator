import { Component, signal, computed, effect } from '@angular/core';
import { MtgSet } from './models/mtg-set.model';
import { SetInputForm } from './components/set-input-form/set-input-form';
import { SetSelectorList } from './components/set-selector-list/set-selector-list';
import { CardsGrid } from './components/cards-grid/cards-grid';
import { PdfExporter } from './components/pdf-exporter/pdf-exporter';
import { FormsModule } from '@angular/forms';

type SortOption = 'added' | 'name' | 'date-desc' | 'date-asc';

const STORAGE_KEYS = {
  sets: 'mtg-divider-generator.sets',
  sortOption: 'mtg-divider-generator.sortOption'
} as const;

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

  constructor() {
    this.restoreState();

    effect(() => {
      localStorage.setItem(STORAGE_KEYS.sets, JSON.stringify(this.rawSets()));
    });

    effect(() => {
      localStorage.setItem(STORAGE_KEYS.sortOption, this.sortOption());
    });
  }

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

  private restoreState(): void {
    const savedSets = localStorage.getItem(STORAGE_KEYS.sets);
    if (savedSets) {
      try {
        const parsed = JSON.parse(savedSets);
        if (Array.isArray(parsed)) {
          this.rawSets.set(parsed as MtgSet[]);
        }
      } catch (error) {
        console.error('Konnte gespeicherte Sets nicht laden:', error);
      }
    }

    const savedSortOption = localStorage.getItem(STORAGE_KEYS.sortOption);
    if (
      savedSortOption === 'added' ||
      savedSortOption === 'name' ||
      savedSortOption === 'date-desc' ||
      savedSortOption === 'date-asc'
    ) {
      this.sortOption.set(savedSortOption);
    }
  }

  /**
   * Fügt ein neues Set zur Liste hinzu
   */
  onSetAdded(newSet: MtgSet): void {
    // Prüfen ob Set bereits existiert
    // Skip digital-only sets (e.g. MTG Arena)
    if (newSet.digital) {
      alert(`Set "${newSet.code}" ist nur digital verfügbar (MTG Arena). Divider nicht erforderlich.`);
      return;
    }

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

    // Filter out existing and digital-only sets
    const digitalSets = newSets.filter(s => !!s.digital);
    const uniqueNewSets = newSets.filter(set => !existingCodes.has(set.code) && !set.digital);

    if (uniqueNewSets.length === 0) {
      let msg = 'Keine neuen Sets hinzugefügt.';
      if (digitalSets.length > 0) msg += ` ${digitalSets.length} digitale Set(s) wurden übersprungen.`;
      alert(msg);
      this.closeSetSelector();
      return;
    }

    // Sets hinzufügen
    this.rawSets.update(current => [...current, ...uniqueNewSets]);

    // Feedback und Modal schließen
    const skippedExisting = newSets.length - (uniqueNewSets.length + digitalSets.length);
    let messageParts: string[] = [];
    messageParts.push(`${uniqueNewSets.length} Sets hinzugefügt.`);
    if (skippedExisting > 0) messageParts.push(`${skippedExisting} Set(s) waren bereits vorhanden.`);
    if (digitalSets.length > 0) messageParts.push(`${digitalSets.length} digitale Set(s) übersprungen (Arena-only).`);

    alert(messageParts.join(' '));
    this.closeSetSelector();
  }
}
