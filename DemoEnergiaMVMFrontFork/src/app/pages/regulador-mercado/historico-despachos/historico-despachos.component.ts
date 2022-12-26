import { Component, NgZone, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { FieldValueChange, RowFilterForm } from 'src/app/models/FilterFormParameter';
import { OrdenDespacho } from 'src/app/models/OrdenDespacho';
import { DespachosEnergiaService } from 'src/app/services/despachos-energia.service';
import { TableService } from 'src/app/services/shared/table-service.service';

@Component({
  selector: 'app-historico-despachos',
  templateUrl: './historico-despachos.component.html',
  styleUrls: [
    './historico-despachos.component.css'
  ]
})
export class HistoricoDespachosComponent implements OnInit, OnDestroy {

  displayedColumns: string[] = ['index', 'generador', 'capacidadNominal', 'energiaDespachada', 'energiaInyectada', 'fechaDespacho'];
  dataSource: MatTableDataSource<OrdenDespacho>;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild('table', { static: true }) table: MatTable<any>;
  sort: MatSort;
  inyeccionDespachoEvent: any;
  ordenDespachoEvent: any;
  filterFormProperties: RowFilterForm[] = [];

  filters = {
    index: '',
    nombreGenerador: '',
    capacidadNominal: '',
    energiaDespachada: '',
    energiaEntregada: '',
    fechaDespacho: '',
  }

  constructor(private toastr: ToastrService,
    private despachosEnergia: DespachosEnergiaService,
    private tableService: TableService,
    private spinner: NgxSpinnerService,
    private ngZone: NgZone) {
    this.dataSource = new MatTableDataSource();
    this.filterFormProperties = [{
      fields: [{
        label: 'Index',
        formControlName: 'index',
        controlType: 'number',
        pipe: ''
      }, {
        label: 'Generador',
        formControlName: 'nombreGenerador',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Capacidad Nominal (Mw)',
        formControlName: 'capacidadNominal',
        controlType: 'number',
        pipe: ''
      }]
    }, {
      fields: [{
        label: 'Energia Despachada (Mw)',
        formControlName: 'energiaDespachada',
        controlType: 'number',
        pipe: ''
      },
      {
        label: 'Energia Inyectada (Mw)',
        formControlName: 'energiaEntregada',
        controlType: 'number',
        pipe: ''
      }, {
        label: 'Fecha de despacho',
        formControlName: 'fechaDespacho',
        controlType: 'date',
        pipe: ''
      }]
    }]
  }


  async ngOnInit(): Promise<void> {
    try {
      this.spinner.show();
      let promises: Promise<void>[] = [];
      promises.push(this.despachosEnergia.loadBlockChainContractData());
      await Promise.all(promises);
      this.tableService.setPaginatorTable(this.paginator);
      this.spinner.hide();
      this.getHistoricoDespachos();

      this.inyeccionDespachoEvent = this.despachosEnergia.contract.events.inyeccionDespacho({
        fromBlock: 'latest'
      }, (err, event) => {
        if (err) {
          console.log(err);
          this.toastr.error(err.message, 'Error');
        }
      }).on('data', (event) => {
        this.ngZone.run(() => {
          this.getHistoricoDespachos()
        })
      });
      this.ordenDespachoEvent = this.despachosEnergia.contract.events.ordenDespacho({
        fromBlock: 'latest'
      }, (err, event) => {
        if (err) {
          console.log(err);
          this.toastr.error(err.message, 'Error');
        }
      }).on('data', (event) => {
        this.ngZone.run(() => {
          this.getHistoricoDespachos()
        })
      });
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
      this.spinner.hide();
    }

  }

  ngOnDestroy(): void {
    this.inyeccionDespachoEvent.removeAllListeners('data');
    this.ordenDespachoEvent.removeAllListeners('data');
  }

  onfieldValueChange(event: FieldValueChange) {
    if (event.controlName === 'fechaDespacho') {
      this.filters.fechaDespacho = event.data !== '' ? moment(event.data).format('DD/MM/YYYY') : 'Invalid date'
    }else{
      this.filters[event.controlName] = event.data
    }

    this.getHistoricoDespachos();
  }

  private getHistoricoDespachos() {
    this.despachosEnergia.getHistoricoDespachosEnergia().subscribe({
      next: (data: OrdenDespacho[]) => {
        let filterData = this.filterData(data);
        this.dataSource.data = filterData;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.table.renderRows();
      },
      error: error => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
      }
    });
  }

  private filterData(data: OrdenDespacho[]): OrdenDespacho[] {
    let filterArray = data;

    filterArray = this.filters.index !== '' && this.filters.index !== null ? filterArray.filter(item => item.index === parseInt(this.filters.index)) : filterArray;
    filterArray = this.filters.nombreGenerador !== '' ? filterArray.filter(item => item.nombreGenerador.toLowerCase().includes(this.filters.nombreGenerador)) : filterArray;
    filterArray = this.filters.capacidadNominal !== '' && this.filters.capacidadNominal !== null ? filterArray.filter(item => item.capacidadNominal === parseInt(this.filters.capacidadNominal)) : filterArray;
    filterArray = this.filters.energiaEntregada !== '' && this.filters.energiaEntregada !== null ? filterArray.filter(item => item.cantidadProducida === parseInt(this.filters.energiaEntregada)) : filterArray;
    filterArray = this.filters.energiaDespachada !== '' && this.filters.energiaDespachada !== null ? filterArray.filter(item => item.cantidadEnergia === parseInt(this.filters.energiaDespachada)) : filterArray;

    filterArray = this.filters.fechaDespacho !== 'Invalid date' && this.filters.fechaDespacho !== '' ? filterArray.filter(item => {
      let temp = moment(item.fechaDespacho, 'DD/MM/YYYY');
      let isSame = temp.isSame(moment(this.filters.fechaDespacho, 'DD/MM/YYYY'), 'day');
      if (isSame) {
        return true;
      } else {
        return false;
      }
    }) : filterArray;

    return filterArray;
  }
}
