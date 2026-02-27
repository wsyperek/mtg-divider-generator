import { Component, computed, effect, inject, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MtgSet } from '../../models/mtg-set.model';
import { ScryfallApi } from '../../services/scryfall-api';

type SortByOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';

const STORAGE_KEYS = {
  selectedSetType: 'mtg-divider-generator.selector.selectedSetType',
  sortBy: 'mtg-divider-generator.selector.sortBy'
} as const;

@Component({
  selector: 'app-set-selector-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './set-selector-list.html',
  styleUrl: './set-selector-list.css',
})
export class SetSelectorList implements OnInit {
  private readonly scryfallApi = inject(ScryfallApi);

  // State
  private readonly allSets = signal<MtgSet[]>([]);
  private readonly selectedCodes = signal<Set<string>>(new Set());
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedSetType = signal<string>('all');
  protected readonly sortBy = signal<SortByOption>('date-desc');
  protected readonly isLoading = signal<boolean>(false);

  // Verfügbare Set-Typen für Filter
  protected readonly availableSetTypes = signal<Array<{ value: string; label: string }>>([]);

  // Computed: Gefilterte und sortierte Sets
  protected readonly filteredSets = computed(() => {
    let sets = this.allSets();
    const query = this.searchQuery().toLowerCase();
    const setType = this.selectedSetType();

    // Nach Set-Typ filtern
    if (setType !== 'all') {
      sets = sets.filter(set => set.set_type === setType);
    }

    // Nach Suchbegriff filtern (Name, Code, Datum)
    if (query) {
      sets = sets.filter(set =>
        set.name.toLowerCase().includes(query) ||
        set.code.toLowerCase().includes(query) ||
        set.released_at.includes(query)
      );
    }

    // Sortieren
    const sortBy = this.sortBy();
    sets = [...sets].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return b.released_at.localeCompare(a.released_at);
        case 'date-asc':
          return a.released_at.localeCompare(b.released_at);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return sets;
  });

  // Computed: Anzahl ausgewählter Sets
  protected readonly selectedCount = computed(() => this.selectedCodes().size);

  // Computed: Alle Sets auf aktueller Seite ausgewählt?
  protected readonly allFilteredSelected = computed(() => {
    const filtered = this.filteredSets();
    const selected = this.selectedCodes();
    return filtered.length > 0 && filtered.every(set => selected.has(set.code));
  });

  // Output Events
  setsSelected = output<MtgSet[]>();
  closeRequested = output<void>();

  constructor() {
    this.restorePersistedFilters();

    effect(() => {
      localStorage.setItem(STORAGE_KEYS.selectedSetType, this.selectedSetType());
    });

    effect(() => {
      localStorage.setItem(STORAGE_KEYS.sortBy, this.sortBy());
    });
  }

  ngOnInit(): void {
    this.loadAllSets();
  }

  private restorePersistedFilters(): void {
    const savedSetType = localStorage.getItem(STORAGE_KEYS.selectedSetType);
    if (savedSetType) {
      this.selectedSetType.set(savedSetType);
    }

    const savedSortBy = localStorage.getItem(STORAGE_KEYS.sortBy);
    if (
      savedSortBy === 'date-desc' ||
      savedSortBy === 'date-asc' ||
      savedSortBy === 'name-asc' ||
      savedSortBy === 'name-desc'
    ) {
      this.sortBy.set(savedSortBy);
    }
  }

  /**
   * Lädt alle Sets von Scryfall
   */
  private loadAllSets(): void {
    this.isLoading.set(true);
    this.scryfallApi.getAllSets().subscribe({
      next: (sets) => {
        this.allSets.set(sets);
        this.extractSetTypes(sets);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Fehler beim Laden der Sets:', error);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Extrahiert alle verfügbaren Set-Typen aus den geladenen Sets
   */
  private extractSetTypes(sets: MtgSet[]): void {
    const uniqueTypes = [...new Set(sets.map(set => set.set_type))].sort();
    const setTypes = [
      { value: 'all', label: 'Alle Set-Typen' },
      ...uniqueTypes.map(type => ({
        value: type,
        label: this.translateSetType(type)
      }))
    ];

    this.availableSetTypes.set(setTypes);

    const isValidType = setTypes.some(type => type.value === this.selectedSetType());
    if (!isValidType) {
      this.selectedSetType.set('all');
    }
  }

  /**
   * Toggle-Auswahl für ein einzelnes Set
   */
  toggleSelection(code: string): void {
    this.selectedCodes.update(current => {
      const newSet = new Set(current);
      if (newSet.has(code)) {
        newSet.delete(code);
      } else {
        newSet.add(code);
      }
      return newSet;
    });
  }

  /**
   * Alle gefilterten Sets auswählen
   */
  selectAll(): void {
    this.selectedCodes.update(current => {
      const newSet = new Set(current);
      this.filteredSets().forEach(set => newSet.add(set.code));
      return newSet;
    });
  }

  /**
   * Auswahl aller gefilterten Sets aufheben
   */
  deselectAll(): void {
    this.selectedCodes.update(current => {
      const newSet = new Set(current);
      this.filteredSets().forEach(set => newSet.delete(set.code));
      return newSet;
    });
  }

  /**
   * Komplette Auswahl aufheben
   */
  clearSelection(): void {
    this.selectedCodes.set(new Set());
  }

  /**
   * Ausgewählte Sets hinzufügen
   */
  addSelectedSets(): void {
    const selected = this.allSets().filter(set =>
      this.selectedCodes().has(set.code)
    );

    if (selected.length === 0) {
      return;
    }

    this.setsSelected.emit(selected);
    this.clearSelection();
  }

  /**
   * Modal schließen
   */
  close(): void {
    this.closeRequested.emit();
  }

  /**
   * Formatiert das Datum von YYYY-MM-DD zu YYYY-MM
   */
  formatDate(dateString: string): string {
    const [year, month, day] = dateString.split('-');
    return `${year}-${month}-${day}`;
  }

  /**
   * Übersetzt den Set-Typ ins Deutsche
   */
  translateSetType(setType: string): string {
    const translations: { [key: string]: string } = {
      'core': 'Hauptset',
      'expansion': 'Erweiterung',
      'masters': 'Masters',
      'commander': 'Commander',
      'draft_innovation': 'Draft Innovation',
      'funny': 'Fun-Set',
      'starter': 'Starter',
      'promo': 'Promo',
      'token': 'Token',
      'memorabilia': 'Memorabilia',
      'alchemy': 'Alchemy',
      'arsenal': 'Arsenal',
      'box': 'Box',
      'duel_deck': 'Duel Deck',
      'from_the_vault': 'From the Vault',
      'masterpiece': 'Masterpiece',
      'planechase': 'Planechase',
      'premium_deck': 'Premium Deck',
      'spellbook': 'Spellbook',
      'treasure_chest': 'Treasure Chest',
      'vanguard': 'Vanguard',
      'archenemy': 'Archenemy'
    };
    return translations[setType] || setType;
  }

  /**
   * Prüft ob ein Set ausgewählt ist
   */
  isSelected(code: string): boolean {
    return this.selectedCodes().has(code);
  }
}
