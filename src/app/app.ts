import { Component, signal, computed, effect } from '@angular/core';
import { MtgSet } from './models/mtg-set.model';
import { SetInputForm } from './components/set-input-form/set-input-form';
import { SetSelectorList } from './components/set-selector-list/set-selector-list';
import { CardsGrid } from './components/cards-grid/cards-grid';
import { PdfExporter } from './components/pdf-exporter/pdf-exporter';
import { FormsModule } from '@angular/forms';
import { APP_VERSION } from './app-version';

type SortOption = 'added' | 'name' | 'date-desc' | 'date-asc';

const STORAGE_KEYS = {
  sets: 'mtg-divider-generator.sets',
  sortOption: 'mtg-divider-generator.sortOption'
} as const;
const ICON_PROXY_BASE_URL = 'https://corsproxy.io/?';

@Component({
  selector: 'app-root',
  imports: [SetInputForm, SetSelectorList, CardsGrid, PdfExporter, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = 'MTG Divider Cards Generator';
  protected readonly appVersion = APP_VERSION;
  protected readonly imprintName = 'Wolfram Syperek';
  protected readonly imprintEmail = 'wsyperek@gmail.com';

  // State: Liste der hinzugefügten MTG Sets
  private readonly rawSets = signal<MtgSet[]>([]);

  // Sortier-Option
  protected sortOption = signal<SortOption>('added');

  // Modal-State für Set-Selektor
  protected readonly showSetSelector = signal<boolean>(false);
  private readonly undoSetsSnapshot = signal<MtgSet[] | null>(null);
  protected readonly canUndo = computed(() => this.undoSetsSnapshot() !== null);

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
          this.rawSets.set(this.normalizeLoadedSets(parsed as MtgSet[]));
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
    this.storeUndoSnapshot();
    this.rawSets.update(currentSets => [...currentSets, newSet]);
  }

  /**
   * Entfernt ein Set aus der Liste (basierend auf Code statt Index)
   */
  onSetRemoved(index: number): void {
    const setToRemove = this.sets()[index];
    if (!setToRemove) {
      return;
    }

    this.storeUndoSnapshot();
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
      this.closeSetSelector();
      return;
    }

    // Sets hinzufügen
    this.storeUndoSnapshot();
    this.rawSets.update(current => [...current, ...uniqueNewSets]);
    this.closeSetSelector();
  }

  undoLastChange(): void {
    const snapshot = this.undoSetsSnapshot();
    if (!snapshot) {
      return;
    }

    this.rawSets.set(snapshot);
    this.undoSetsSnapshot.set(null);
  }

  resetAllSets(): void {
    if (this.rawSets().length === 0) {
      return;
    }

    this.storeUndoSnapshot();
    this.rawSets.set([]);
  }

  private storeUndoSnapshot(): void {
    this.undoSetsSnapshot.set([...this.rawSets()]);
  }

  private normalizeLoadedSets(sets: MtgSet[]): MtgSet[] {
    return sets.map(set => ({
      ...set,
      icon_svg_uri: this.toProxyUrl(set.icon_svg_uri)
    }));
  }

  private toProxyUrl(url: string): string {
    if (!url) {
      return url;
    }
    if (url.includes('corsproxy.io/?')) {
      return url;
    }
    return `${ICON_PROXY_BASE_URL}${encodeURIComponent(url)}`;
  }
}
