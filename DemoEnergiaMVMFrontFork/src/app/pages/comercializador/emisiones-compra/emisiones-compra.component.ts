import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { TableService } from 'src/app/services/shared/table-service.service';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { EnumTipoEmision } from './../../../models/EnumTipoEmision';
import { ActivatedRoute, Router } from '@angular/router';
import { CompraEnergiaComponent } from './../compra-energia/compra-energia.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { EstadoCompra, InfoEmisionCompra } from './../../../models/InfoEmisionCompra';
import { Component, OnInit, OnDestroy, NgZone, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { filter, Observable, Subscription } from 'rxjs';
import { ComercializadorContractService } from 'src/app/services/comercializador-contract.service';
import { CompraEnergiaRequest } from 'src/app/models/CompraEnergiaRequest';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FieldValueChange, RowFilterForm } from 'src/app/models/FilterFormParameter';
import moment from 'moment';
import { SetAcuerdosComponent } from '../set-acuerdos/set-acuerdos.component';
import { AcuerdoContractService } from 'src/app/services/acuerdo-contract.service';
import { AcuerdoEnergia, EstadoAcuerdo } from 'src/app/models/AcuerdoEnergia';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { SolicitudContrato } from 'src/app/models/solicitudContrato';

@Component({
  selector: 'app-emisiones-compra',
  templateUrl: './emisiones-compra.component.html',
  styles: [
  ]
})
export class EmisionesCompraComponent implements OnInit, OnDestroy {

  estadosCompra: EstadoCompra[];
  energiasDisponibles: string[];
  displayedColumns: string[] = ['empresaCliente', 'empresaGenerador', 'estado', 'fechaInicio', 'fechaFin', 'tipoEnergia', 'energiaTotal', 'energiaEntregada', 'acciones']
  title: string;
  isLoading: boolean = false;
  emisionCompraEvent: any
  clientes: SolicitudContrato[];
  clientesNombre: string[] = [];

  reloadData: boolean = false;
  dataSource: MatTableDataSource<AcuerdoEnergia>;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild('table', { static: true }) table: MatTable<any>;
  sort: MatSort;

  filterFormProperties: RowFilterForm[] = [];

  filters = {
    cliente: '',
    generador:'',
    fechaSolicitud: '',
    fechaFin: '',
    tipoEnergia: '',
    estado: undefined
  }

  dirComercializador: string = "";

  constructor(private comercializadorService: ComercializadorContractService,
    private regulardorMercado: ReguladorMercadoService,
    private acuerdosService: AcuerdoContractService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    private spinner: NgxSpinnerService,
    private ngZone: NgZone,
    private bancoEnergia: BancoEnergiaService,
    private tableService: TableService,
    private alertService: SweetAlertService) {
    this.dataSource = new MatTableDataSource();
    this.dirComercializador = localStorage.getItem('dirContract');
  }

  private setFilterFormData() {
    this.filterFormProperties = [{
      fields: [{
        label: 'Cliente',
        formControlName: 'cliente',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Generador',
        formControlName: 'generador',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Fecha de solicitud',
        formControlName: 'fechaSolicitud',
        controlType: 'date',
        pipe: ''
      }]
    }, {
      fields: [{
        label: 'Fecha fin',
        formControlName: 'fechaFin',
        controlType: 'date',
        pipe: ''
      }, {
        label: 'Tipo de energia',
        formControlName: 'tipoEnergia',
        controlType: 'select',
        optionValues: this.energiasDisponibles,
        pipe: ''
      }, {
        label: 'Estado de compra',
        formControlName: 'estado',
        controlType: 'select',
        optionValues: Object.values(EstadoAcuerdo).filter(item => typeof item == 'number'),
        pipe: 'estadoCompra'
      }]
    }];
  }

  ngOnDestroy(): void {
    this.emisionCompraEvent.removeAllListeners('data');
  }

  async ngOnInit(): Promise<void> {

    let dirContract = localStorage.getItem('dirContract');

    try {
      let promises: Promise<void>[] = []
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.comercializadorService.loadBlockChainContractData(dirContract));
      promises.push(this.acuerdosService.loadBlockChainContractData());
      await Promise.all(promises);
      this.tableService.setPaginatorTable(this.paginator);
      this.spinner.show();
      this.bancoEnergia.getTiposEnergiasDisponibles().subscribe({
        next: (data) => {
          this.energiasDisponibles = data.map(item => item.nombre);
          this.setFilterFormData();
          this.spinner.hide();
        }, error: (error) => {
          this.spinner.hide();
          console.log(error);
          this.toastr.error(error.message, 'Error')
        }
      })

      this.emisionCompraEvent = this.comercializadorService.contract.events.EmisionDeCompra({
        fromBlock: 'latest'
      }, (err, event) => {
        if (err) {
          console.log(err);
          this.toastr.error(err.message, 'Error');
        }
      }).on('data', (event) => {
        this.ngZone.run(() => {
          this.getEmisionesDeCompra();
        });
      });

      this.getEmisionesDeCompra();
    } catch (error) {
      console.log(error);
      this.toastr.error("Error al cargar el contrato comercializador", 'Error');
    }
  }


  private getEmisionesDeCompra() {
    this.acuerdosService.getAcuerdosDeCompraByComercializador(this.dirComercializador).subscribe({
      next: (data: AcuerdoEnergia[]) => {
        const filterData = this.filterData(data);
        this.dataSource.data = filterData;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.table.renderRows();
      },
      error: (error: any) => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
        this.spinner.hide();
      }
    });
  }

  public onRealizarCompra(emisionCompra: AcuerdoEnergia) {
    console.log("EMISION: ", emisionCompra)
    let dialogRef = this.dialog.open(SetAcuerdosComponent, {
      width: '500px',
      data: {
        emision: emisionCompra,

      }
    });

    dialogRef.afterClosed().subscribe({
      next: () => {
        // this.getInfoContrato();
      }
    })

    // let dialog = this.dialog.open(CompraEnergiaComponent, {
    //   width: '610px',
    //   data: {
    //     emision: emisionCompra,
    //     index: index,
    //     dirContract: localStorage.getItem('dirContract')
    //   }
    // });

    // dialog.afterClosed().subscribe(result => {
    //   this.getEmisionesDeCompra();
    // });
  }

  public onRechazarCompra(dirContrato: string, index: number) {

    this.alertService.confirmAlert('Rechazar', '¿Desea rechazar la solicitud de compra?')
      .then(result => {
        if (result.isConfirmed) {
          this.spinner.show();
          this.comercializadorService.rechazarCompra(dirContrato, index).subscribe({
            next: () => {
              this.toastr.info('Solicitud rechazada', 'Info');
              this.spinner.hide();
              this.getEmisionesDeCompra();
            },
            error: (error) => {
              console.log(error);
              this.spinner.hide();
              this.toastr.error(error.message, 'Error');
            }
          })
        }
      })
  }

  onAcuerdoCompra() {
    let dialogRef = this.dialog.open(SetAcuerdosComponent, {
      width: '500px',
      data: {
        dirContrato: localStorage.getItem('dirContract'),

      }
    });

    dialogRef.afterClosed().subscribe({
      next: () => {
        // this.getInfoContrato();
      }
    })
  }

  onfieldValueChange(event: FieldValueChange) {
    if (event.controlName === 'fechaCompra' || event.controlName === 'fechaSolicitud') {
      if (event.controlName == 'fechaCompra') {
        this.filters.fechaFin = event.data !== '' ? moment(event.data).format('DD/MM/YYYY') : 'Invalid date';
      } else {
        this.filters.fechaSolicitud = event.data !== '' ? moment(event.data).format('DD/MM/YYYY') : 'Invalid date';
      }
    } else if (event.controlName === 'estado') {
      this.filters.estado = event.data !== '' ? parseInt(event.data) : '';
    } else {
      this.filters[event.controlName] = event.data
    }
    this.getEmisionesDeCompra();
  }

  private filterData(data: AcuerdoEnergia[]): AcuerdoEnergia[] {
    let filterArray = data;

    filterArray = this.filters.cliente !== '' ? filterArray.filter(item => item.dataCliente.nombreAgente.toLowerCase().includes(this.filters.cliente)) : filterArray;
    filterArray = this.filters.generador !== '' ? filterArray.filter(item => item.dataGenerador.nombreAgente.toLowerCase().includes(this.filters.generador)) : filterArray;
    filterArray = this.filters.tipoEnergia !== '' ? filterArray.filter(item => item.tipoEnergia.toLowerCase().includes(this.filters.tipoEnergia)) : filterArray;
    filterArray = this.filters.fechaSolicitud !== 'Invalid date' && this.filters.fechaSolicitud !== '' ? filterArray.filter(item => {
      let temp = moment(item.fechaInicio, 'DD/MM/YYYY');
      let isSame = temp.isSame(moment(this.filters.fechaSolicitud, 'DD/MM/YYYY'), 'day');
      if (isSame) {
        return true;
      } else {
        return false;
      }
    }) : filterArray;
    filterArray = this.filters.fechaFin !== 'Invalid date' && this.filters.fechaFin !== '' ? filterArray.filter(item => {
      let temp = moment(item.fechaFin, 'DD/MM/YYYY');
      let isSame = temp.isSame(moment(this.filters.fechaFin, 'DD/MM/YYYY'), 'day');
      if (isSame) {
        return true;
      } else {
        return false;
      }
    }) : filterArray;
    filterArray = this.filters.estado !== undefined && this.filters.estado !== '' ? filterArray.filter(item => item.estadoAcuerdo == this.filters.estado) : filterArray;
    return filterArray;
  }
}
