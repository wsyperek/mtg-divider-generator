import { Component, inject, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScryfallApi } from '../../services/scryfall-api';
import { MtgSet } from '../../models/mtg-set.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-set-input-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './set-input-form.html',
  styleUrl: './set-input-form.css',
})
export class SetInputForm implements OnInit {
  private readonly scryfallApi = inject(ScryfallApi);

  // Output Event zum Parent-Component
  setAdded = output<MtgSet>();

  // Component State
  setCode = '';
  isLoading = false;
  errorMessage = '';

  // Autocomplete State
  allSets = signal<MtgSet[]>([]);
  filteredSets = signal<MtgSet[]>([]);
  showSuggestions = false;
  selectedIndex = -1;

  // Filter State
  selectedSetType = 'all'; // 'all' oder spezifischer Set-Typ
  availableSetTypes: { value: string; label: string }[] = [];

  ngOnInit(): void {
    // Lade alle Sets beim Start
    this.scryfallApi.getAllSets().subscribe({
      next: (sets) => {
        this.allSets.set(sets);

        // Extrahiere unique Set-Typen für Filter
        const uniqueTypes = [...new Set(sets.map(set => set.set_type))];
        this.availableSetTypes = [
          { value: 'all', label: 'Alle Set-Typen' },
          ...uniqueTypes.map(type => ({
            value: type,
            label: this.translateSetType(type)
          })).sort((a, b) => a.label.localeCompare(b.label))
        ];
      },
      error: (error) => {
        console.error('Fehler beim Laden der Sets:', error);
      }
    });
  }

  /**
   * Übersetzt Set-Typ ins Deutsche
   */
  private translateSetType(setType: string): string {
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
      'alchemy': 'Alchemy'
    };
    return translations[setType] || setType;
  }

  /**
   * Filtert Sets basierend auf Eingabe
   */
  onInput(): void {
    const query = this.setCode.trim().toLowerCase();

    if (query.length === 0) {
      this.filteredSets.set([]);
      this.showSuggestions = false;
      this.selectedIndex = -1;
      return;
    }

    // Filtere nach Code, Name oder Release-Datum
    let filtered = this.allSets().filter(set =>
      set.code.toLowerCase().includes(query) ||
      set.name.toLowerCase().includes(query) ||
      set.released_at.includes(query) // Suche auch nach Datum (yyyy-mm-dd)
    );

    // Zusätzlich nach Set-Typ filtern, falls ausgewählt
    if (this.selectedSetType !== 'all') {
      filtered = filtered.filter(set => set.set_type === this.selectedSetType);
    }

    // Maximal 10 Vorschläge
    filtered = filtered.slice(0, 10);

    this.filteredSets.set(filtered);
    this.showSuggestions = filtered.length > 0;
    this.selectedIndex = -1;
  }

  /**
   * Ändert den Set-Typ-Filter
   */
  onSetTypeChange(): void {
    // Filtere erneut mit neuem Set-Typ
    if (this.setCode.trim()) {
      this.onInput();
    }
  }

  /**
   * Wählt ein Set aus der Autocomplete-Liste aus
   */
  selectSet(set: MtgSet): void {
    this.setAdded.emit(set);
    this.setCode = '';
    this.filteredSets.set([]);
    this.showSuggestions = false;
    this.selectedIndex = -1;
    this.errorMessage = '';
  }

  /**
   * Lädt Set-Daten von Scryfall API und emittiert sie
   */
  addSet(): void {
    if (!this.setCode.trim()) {
      this.errorMessage = 'Bitte gib ein Set-Kürzel ein.';
      return;
    }

    // Wenn ein Vorschlag ausgewählt ist, nutze diesen
    if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredSets().length) {
      this.selectSet(this.filteredSets()[this.selectedIndex]);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.showSuggestions = false;

    this.scryfallApi.getSetByCode(this.setCode.trim()).subscribe({
      next: (mtgSet) => {
        this.setAdded.emit(mtgSet);
        this.setCode = '';
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
      }
    });
  }

  /**
   * Behandelt Tastatureingaben für Navigation
   */
  onKeyDown(event: KeyboardEvent): void {
    if (!this.showSuggestions) {
      if (event.key === 'Enter') {
        this.addSet();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredSets().length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0) {
          this.selectSet(this.filteredSets()[this.selectedIndex]);
        } else {
          this.addSet();
        }
        break;
      case 'Escape':
        this.showSuggestions = false;
        this.selectedIndex = -1;
        break;
    }
  }

  /**
   * Schließt Autocomplete bei Klick außerhalb
   */
  onBlur(): void {
    // Verzögert schließen, damit Click-Event auf Vorschlag noch funktioniert
    setTimeout(() => {
      this.showSuggestions = false;
      this.selectedIndex = -1;
    }, 200);
  }
}
