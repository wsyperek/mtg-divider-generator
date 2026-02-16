import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfGenerator } from '../../services/pdf-generator';

@Component({
  selector: 'app-pdf-exporter',
  imports: [CommonModule],
  templateUrl: './pdf-exporter.html',
  styleUrls: ['./pdf-exporter.css'],
})
export class PdfExporter {
  private readonly pdfGenerator = inject(PdfGenerator);

  // Input: ID des Elements, das exportiert werden soll
  targetElementId = input.required<string>();

  // Input: Anzahl der Sets (zum Deaktivieren der Buttons wenn leer)
  setsCount = input.required<number>();

  isGenerating = false;

  /**
   * Generiert PDF aus dem Grid-Element
   */
  async downloadPdf(): Promise<void> {
    const element = document.getElementById(this.targetElementId());
    if (!element) {
      console.error('Element nicht gefunden:', this.targetElementId());
      return;
    }

    this.isGenerating = true;

    try {
      await this.pdfGenerator.generatePdf(element);
    } catch (error) {
      console.error('PDF-Generierung fehlgeschlagen:', error);
      alert('Fehler beim Generieren des PDFs. Bitte versuche es erneut.');
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Öffnet Browser-Druckdialog
   */
  print(): void {
    this.pdfGenerator.printCards();
  }
}
