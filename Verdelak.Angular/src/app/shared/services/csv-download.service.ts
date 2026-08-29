import { Injectable } from '@angular/core';

export type CsvCell = string | number | boolean | null | undefined;
export type CsvObjectRow = Record<string, CsvCell>;

@Injectable({ providedIn: 'root' })
export class CsvDownloadService {
  download(fileName: string, rows: CsvCell[][]): void {
    const csv = rows
      .map(row => row.map(cell => this.cell(cell)).join(','))
      .join('\r\n');
    this.downloadText(fileName, csv);
  }

  downloadObjects(fileName: string, rows: CsvObjectRow[]): void {
    const csvRows = rows.length ? rows : [{ Message: 'No rows to export' }];
    const headers = Object.keys(csvRows[0]);
    this.download(fileName, [
      headers,
      ...csvRows.map(row => headers.map(header => row[header]))
    ]);
  }

  private downloadText(fileName: string, csv: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  cell(value: CsvCell): string {
    if (value === null || value === undefined) {
      return '';
    }

    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }
}
