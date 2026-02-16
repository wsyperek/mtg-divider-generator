import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MtgSet, ScryfallSetResponse } from '../models/mtg-set.model';

@Injectable({
  providedIn: 'root',
})
export class ScryfallApi {
  private readonly http = inject(HttpClient);
  private readonly API_BASE_URL = 'https://api.scryfall.com';

  /**
   * Lädt alle verfügbaren Sets von Scryfall API
   * @returns Observable mit Array von MtgSets
   */
  getAllSets(): Observable<MtgSet[]> {
    const url = `${this.API_BASE_URL}/sets`;

    return this.http.get<{ data: ScryfallSetResponse[] }>(url).pipe(
      map(response => response.data.map(set => this.mapToMtgSet(set))),
      catchError(this.handleError)
    );
  }

  /**
   * Lädt Set-Daten von Scryfall API basierend auf Set-Kürzel
   * @param setCode - Set-Kürzel (z.B. "MH3", "BLB", "OTJ")
   * @returns Observable mit MtgSet-Daten
   */
  getSetByCode(setCode: string): Observable<MtgSet> {
    const url = `${this.API_BASE_URL}/sets/${setCode.toLowerCase()}`;

    return this.http.get<ScryfallSetResponse>(url).pipe(
      map(response => this.mapToMtgSet(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Mappt Scryfall API Response zu unserem MtgSet Model
   */
  private mapToMtgSet(response: ScryfallSetResponse): MtgSet {
    return {
      code: response.code.toUpperCase(),
      name: response.name,
      released_at: response.released_at,
      icon_svg_uri: response.icon_svg_uri,
      set_type: response.set_type,
      card_count: response.card_count,
      block: response.block
    };
  }

  /**
   * Error-Handling für API-Calls
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ein unbekannter Fehler ist aufgetreten.';

    if (error.error instanceof ErrorEvent) {
      // Client-seitiger Fehler
      errorMessage = `Fehler: ${error.error.message}`;
    } else {
      // Server-seitiger Fehler
      if (error.status === 404) {
        errorMessage = 'Set-Kürzel nicht gefunden. Bitte überprüfe die Eingabe.';
      } else if (error.status === 0) {
        errorMessage = 'Keine Verbindung zur Scryfall API möglich.';
      } else {
        errorMessage = `Server-Fehler: ${error.status} - ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
