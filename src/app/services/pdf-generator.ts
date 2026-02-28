import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PDF_DEBUG = false;

@Injectable({
  providedIn: 'root',
})
export class PdfGenerator {
  private debugLog(...args: unknown[]): void {
    if (PDF_DEBUG) {
      console.log(...args);
    }
  }

  /**
   * Konvertiert SVG-Images zu Data-URLs für bessere PDF-Kompatibilität
   * @param imgElement - Image-Element mit SVG-Quelle
   * @returns PNG Data-URL
   */
  private async convertSvgToDataUrl(imgElement: HTMLImageElement): Promise<string> {
    try {
      const svgUrl = imgElement.src;
      this.debugLog('Converting SVG:', svgUrl);

      // CORS-Proxy verwenden für Scryfall SVGs
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(svgUrl)}`;
      this.debugLog('Using proxy:', proxyUrl);

      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const svgText = await response.text();
      this.debugLog('SVG fetched, length:', svgText.length);

      // Canvas zum Rendern erstellen (größere Auflösung für bessere Qualität)
      const canvas = document.createElement('canvas');
      const size = 256; // Höhere Auflösung
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d', { alpha: true });

      if (!ctx) {
        throw new Error('Canvas context nicht verfügbar');
      }

      // Weißer Hintergrund
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, size, size);

      // SVG als base64 Data-URL für Image
      const base64 = btoa(unescape(encodeURIComponent(svgText)));
      const dataUrl = `data:image/svg+xml;base64,${base64}`;

      // Image laden und in Canvas zeichnen
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('SVG load timeout'));
        }, 5000);

        img.onload = () => {
          clearTimeout(timeout);
          try {
            // SVG in Canvas zeichnen (zentriert)
            const scale = Math.min(size / img.width, size / img.height);
            const x = (size - img.width * scale) / 2;
            const y = (size - img.height * scale) / 2;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            this.debugLog('SVG drawn to canvas successfully');
            resolve();
          } catch (drawError) {
            reject(drawError);
          }
        };

        img.onerror = (error) => {
          clearTimeout(timeout);
          reject(new Error('Image load failed: ' + error));
        };

        img.src = dataUrl;
      });

      // Canvas zu PNG Data-URL konvertieren
      const pngDataUrl = canvas.toDataURL('image/png', 1.0);
      this.debugLog('PNG Data-URL created, length:', pngDataUrl.length);
      return pngDataUrl;

    } catch (error) {
      console.error('Fehler beim Konvertieren des SVG:', error);
      // Fallback: Versuche das Original zu verwenden
      return imgElement.src;
    }
  }

  /**
   * Generiert PDF aus HTML-Element (Grid mit Karten)
   * @param element - HTML-Element zum Konvertieren
   * @param filename - Dateiname für das PDF
   */
  async generatePdf(element: HTMLElement, filename: string = 'mtg-divider-cards.pdf'): Promise<void> {
    try {
      // Remove-Buttons vor dem Rendern ausblenden
      const removeButtons = element.querySelectorAll('.remove-button');
      removeButtons.forEach(btn => {
        (btn as HTMLElement).style.display = 'none';
      });

      // Schnittlinien temporär ausblenden (::before/::after via CSS-Klasse)
      const cardWrappers = element.querySelectorAll('.card-wrapper');
      const dividerCards = element.querySelectorAll('.divider-card');
      cardWrappers.forEach(wrapper => wrapper.classList.add('hide-cutlines'));
      dividerCards.forEach(card => card.classList.add('hide-cutlines'));

      // Berechne PDF-Dimensionen basierend auf tatsächlichen Kartengröße (nicht Browser-Pixel!)
      const cards = element.querySelectorAll('.divider-card');
      const cardCount = cards.length;
      const cardWidth = 63; // mm (CSS-definiert)
      const cardHeight = 99; // mm (CSS-definiert)
      const gapSize = 0; // mm (CSS: cards-grid gap ist 0)

      // Anzahl Spalten und Zeilen
      const columns = Math.min(cardCount, 3); // Maximal 3 Spalten
      const rows = Math.ceil(cardCount / 3);

      this.debugLog(`Grid: ${rows} rows × ${columns} columns (${cardCount} cards total)`);

      // Berechne gewünschte PDF-Dimensionen
      const targetWidth = (columns * cardWidth) + ((columns - 1) * gapSize);
      const targetHeight = (rows * cardHeight) + ((rows - 1) * gapSize);

      this.debugLog(`Target PDF size: ${targetWidth}mm × ${targetHeight}mm`);

      // Grid für Export auf tatsächliche Spaltenzahl fixieren, damit nichts abgeschnitten wird
      const gridElement = element.querySelector('.cards-grid') as HTMLElement | null;
      if (!gridElement) {
        throw new Error('Cards-Grid nicht gefunden');
      }

      // Element temporär auf feste Größe setzen für korrektes html2canvas-Rendering
      const originalWidth = element.style.width;
      const originalHeight = element.style.height;
      const originalMaxWidth = element.style.maxWidth;
      const originalBoxSizing = element.style.boxSizing;
      const originalGridTemplateColumns = gridElement.style.gridTemplateColumns;
      const originalGridJustifyContent = gridElement.style.justifyContent;
      const originalGridWidth = gridElement.style.width;
      const originalGridMaxWidth = gridElement.style.maxWidth;
      const originalGridGap = gridElement.style.gap;

      // Box-sizing auf content-box setzen um genaue Größe zu garantieren
      element.style.boxSizing = 'content-box';
      element.style.width = `${targetWidth}mm`;
      element.style.height = `${targetHeight}mm`;
      element.style.maxWidth = `${targetWidth}mm`;

      gridElement.style.gridTemplateColumns = `repeat(${columns}, ${cardWidth}mm)`;
      gridElement.style.justifyContent = 'start';
      gridElement.style.width = `${targetWidth}mm`;
      gridElement.style.maxWidth = `${targetWidth}mm`;
      gridElement.style.gap = `${gapSize}mm`;

      // SVG-Images zu Data-URLs konvertieren für bessere PDF-Kompatibilität
      const svgImages = element.querySelectorAll('img[src*=".svg"]') as NodeListOf<HTMLImageElement>;
      const originalSrcs: string[] = [];

      this.debugLog(`Found ${svgImages.length} SVG images to convert`);

      for (const img of Array.from(svgImages)) {
        originalSrcs.push(img.src);
        const dataUrl = await this.convertSvgToDataUrl(img);
        img.src = dataUrl;
      }

      // Kurze Verzögerung damit Browser Images laden kann
      await new Promise(resolve => setTimeout(resolve, 500));

      this.debugLog('Starting html2canvas rendering...');

      // Canvas aus HTML erstellen
      const canvas = await html2canvas(gridElement, {
        scale: 4, // Sehr hohe Auflösung für scharfe Schrift und Symbole
        backgroundColor: '#ffffff',
        logging: PDF_DEBUG, // Nur bei Bedarf Logging von html2canvas
        imageTimeout: 15000, // Längeres Timeout für Images
        useCORS: false, // Deaktiviert, da wir Data-URLs verwenden
      });

      // SVG-Images wiederherstellen
      svgImages.forEach((img, index) => {
        img.src = originalSrcs[index];
      });

      // Element-Styles wiederherstellen
      element.style.width = originalWidth;
      element.style.height = originalHeight;
      element.style.maxWidth = originalMaxWidth;
      element.style.boxSizing = originalBoxSizing;
      gridElement.style.gridTemplateColumns = originalGridTemplateColumns;
      gridElement.style.justifyContent = originalGridJustifyContent;
      gridElement.style.width = originalGridWidth;
      gridElement.style.maxWidth = originalGridMaxWidth;
      gridElement.style.gap = originalGridGap;

      // Remove-Buttons und Schnittlinien wieder einblenden
      removeButtons.forEach(btn => {
        (btn as HTMLElement).style.display = '';
      });
      cardWrappers.forEach(wrapper => wrapper.classList.remove('hide-cutlines'));
      dividerCards.forEach(card => card.classList.remove('hide-cutlines'));

      // PDF-Dimensionen verwenden (bereits berechnet)
      let imgWidth = targetWidth;
      let imgHeight = targetHeight;

      this.debugLog('Using PDF dimensions:', imgWidth.toFixed(2), 'x', imgHeight.toFixed(2), 'mm');

      // Falls breiter als A4, proportional runterskalieren (sollte nicht passieren bei 3 Spalten)
      const maxWidth = 210; // A4 Breite in mm
      if (imgWidth > maxWidth) {
        const scaleFactor = maxWidth / imgWidth;
        imgWidth = maxWidth;
        imgHeight = imgHeight * scaleFactor;
        this.debugLog('Scaled down to fit A4:', imgWidth.toFixed(2), 'x', imgHeight.toFixed(2), 'mm');
      }

      const pageHeight = 297; // A4 Höhe in mm

      // PDF erstellen (A4 Format)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      let heightLeft = imgHeight;
      let position = 0;

      // Canvas zu Base64
      const imgData = canvas.toDataURL('image/png');

      // Erste Seite
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Weitere Seiten falls nötig
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // PDF herunterladen
      pdf.save(filename);
    } catch (error) {
      console.error('Fehler beim Generieren des PDFs:', error);
      throw new Error('PDF-Generierung fehlgeschlagen');
    }
  }

  /**
   * Alternative: Nutzt Browser-Druckfunktion
   */
  printCards(): void {
    window.print();
  }
}
