import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MtgSet } from '../../models/mtg-set.model';

@Component({
  selector: 'app-divider-card',
  imports: [CommonModule],
  templateUrl: './divider-card.html',
  styleUrls: ['./divider-card.css'],
})
export class DividerCard {
  // Input Property für Set-Daten
  mtgSet = input.required<MtgSet>();

  onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img || !img.src) {
      return;
    }

    const usedProxy = img.dataset['proxyFallback'] === 'true';
    if (usedProxy) {
      return;
    }

    img.dataset['proxyFallback'] = 'true';
    img.src = `https://corsproxy.io/?${encodeURIComponent(img.src)}`;
  }

  /**
   * Formatiert das Datum von YYYY-MM-DD zu YYYY-MM für die Kopfzeile
   */
  formatDate(dateString: string): string {
    const [year, month] = dateString.split('-');
    return `${year}-${month}`;
  }

  /**
   * Formatiert das vollständige Datum von YYYY-MM-DD zu DD.MM.YYYY
   */
  formatFullDate(dateString: string): string {
    const [year, month, day] = dateString.split('-');
    return `${day}.${month}.${year}`;
  }

  /**
   * Übersetzt den Set-Typ ins Deutsche
   */
  translateSetType(setType: string): string {
    const translations: { [key: string]: string } = {
      'archenemy': 'Archenemy',
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
    };
    return translations[setType] || setType;
  }
}
