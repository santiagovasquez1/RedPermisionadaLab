import { Injectable } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';

@Injectable({
  providedIn: 'root'
})
export class TableService {

  constructor() { }

  public setPaginatorTable(paginator: MatPaginator) {
    paginator._intl.itemsPerPageLabel = 'Elementos por página';
    paginator._intl.nextPageLabel = 'Siguiente';
    paginator._intl.previousPageLabel = 'Anterior';
    paginator._intl.firstPageLabel = 'Primera';
    paginator._intl.lastPageLabel = 'Última';
    paginator._intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
      if (length == 0 || pageSize == 0) {
        return `0 de ${length}`;
      }
      length = Math.max(length, 0);
      const startIndex = page * pageSize;
      const endIndex = startIndex < length ?
        Math.min(startIndex + pageSize, length) :
        startIndex + pageSize;
      return `${startIndex + 1} - ${endIndex} de ${length}`;
    }
  }
}
