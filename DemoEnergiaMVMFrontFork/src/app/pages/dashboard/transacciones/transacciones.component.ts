import { SolicitudContrato } from './../../../models/solicitudContrato';
import { ReguladorMercadoService } from './../../../services/regulador-mercado.service';
import { InfoContrato } from './../../../models/infoContrato';
import { InfoEnergia } from 'src/app/models/InfoEnergia';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable, Subscription, timer, forkJoin } from 'rxjs';
import { TableService } from './../../../services/shared/table-service.service';
import { InfoTx, TipoTx } from './../../../models/InfoTx';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDatepicker } from '@angular/material/datepicker';
import moment from 'moment';

@Component({
  selector: 'app-transacciones',
  templateUrl: './transacciones.component.html',
  styles: [
  ]
})
export class TransaccionesComponent implements OnInit, OnDestroy {

  filterForm: FormGroup;
  tiposTransaccion: TipoTx[] = [];
  tiposEnergia: InfoEnergia[] = [];
  agentesRegistrados: InfoContrato[] = [];
  displayedColumns: string[] = ['Transaccion', 'Fecha', 'TipoEnergia', 'AgenteOrigen', 'AgenteDestino', 'CantidadEnergia']
  dataSource: MatTableDataSource<InfoTx>
  timer$: Observable<any>;
  timerSubscription: Subscription;
  contadorAnterior: number = 0;
  contadorActual: number = 0;

  //Filtros
  private tipoTx: number | string = '';
  private fechaTx: string = 'Invalid date';
  private tipoEnergia: string = '';
  private agenteOrigen: string = '';
  private agenteDestino: string = '';
  private filterFlag: Boolean = false;

  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild('table', { static: true }) table: MatTable<any>;
  sort: MatSort;
  @ViewChild('picker', { static: true }) datePicker: MatDatepicker<any>;

  constructor(private bancoEnergia: BancoEnergiaService,
    private reguladorMercado: ReguladorMercadoService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private tableService: TableService,
    private fb: FormBuilder) {
    this.dataSource = new MatTableDataSource();
    this.timer$ = timer(0, 5000);
    this.tiposTransaccion = this.getTiposTransacciones();
    this.filterForm = fb.group({});
  }

  async ngOnInit(): Promise<void> {
    try {
      this.initFilterForm();
      let promises: Promise<void>[] = [];
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.reguladorMercado.loadBlockChainContractData());
      await Promise.all(promises);

      this.tableService.setPaginatorTable(this.paginator);
      this.timerSubscription = this.timer$.subscribe(() => {
        this.getTransactions();
      });

      this.getInfoFiltros();
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }

  ngOnDestroy(): void {
    this.timerSubscription.unsubscribe();
  }

  initFilterForm() {
    this.filterForm = this.fb.group({
      tipoTx: [''],
      fechaTx: [''],
      tipoEnergia: [''],
      agenteOrigen: [''],
      agenteDestino: ['']
    });


    this.filterForm.get('tipoTx').valueChanges.subscribe({
      next: (data: string) => {
        this.tipoTx = data !== '' ? parseInt(data) : '';
        this.getTransactions();
      }
    });

    this.filterForm.get('fechaTx').valueChanges.subscribe({
      next: (data: string) => {
        this.fechaTx = data !== '' ? moment(data).format('DD/MM/YYYY') : 'Invalid date';
        this.getTransactions();
      }
    });

    this.filterForm.get('tipoEnergia').valueChanges.subscribe({
      next: (data: string) => {
        this.tipoEnergia = data;
        this.getTransactions();
      }
    });

    this.filterForm.get('agenteOrigen').valueChanges.subscribe({
      next: (data: string) => {
        this.agenteOrigen = data;
        this.getTransactions();
      }
    });

    this.filterForm.get('agenteDestino').valueChanges.subscribe({
      next: (data: string) => {
        this.agenteDestino = data;
        this.getTransactions();
      }
    });
  }

  getTransactions() {
    this.bancoEnergia.getInfoTxs().subscribe({
      next: (data) => {
        let filterArray = data;
        filterArray = this.tipoTx !== '' ? filterArray.filter(item => item.tipoTx === this.tipoTx) : filterArray;
        filterArray = this.fechaTx !== 'Invalid date' ? filterArray.filter(item => {
          let temp = moment(item.fechaTx, 'DD/MM/YYYY');
          let isSame = temp.isSame(moment(this.fechaTx, 'DD/MM/YYYY'), 'day');
          if (isSame) {
            return true;
          } else {
            return false;
          }
        }) : filterArray;
        filterArray = this.tipoEnergia !== '' ? filterArray.filter(item => item.tipoEnergia === this.tipoEnergia) : filterArray;
        filterArray = this.agenteOrigen !== '' ? filterArray.filter(item => item.nombreAgenteOrigen === this.agenteOrigen) : filterArray;
        filterArray = this.agenteDestino !== '' ? filterArray.filter(item => item.nombreAgenteDestino === this.agenteDestino) : filterArray;

        this.contadorActual = filterArray.length;
        if (this.contadorActual !== this.contadorAnterior) {
          this.dataSource.data = filterArray.reverse();
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.table.renderRows();
          this.contadorAnterior = this.contadorActual;
        }
      }, error: (error) => {
        this.toastr.error(error.message, 'Error');
      }
    })
  }

  getTiposTransacciones() {
    const tempTipos = Object.values(TipoTx).filter(
      (value) => typeof value === 'number'
    ) as TipoTx[];
    return tempTipos;
  }

  getInfoFiltros() {
    this.spinner.show();
    let observables: Observable<any>[] = []
    observables.push(this.bancoEnergia.getTiposEnergiasDisponibles());
    observables.push(this.reguladorMercado.getContratosRegistrados());

    forkJoin(observables).subscribe({
      next: (data: any[]) => {
        this.tiposEnergia = data[0];
        const tempRegistros = data[1] as SolicitudContrato[];
        this.agentesRegistrados = tempRegistros.map(solicitud => solicitud.infoContrato);
        this.spinner.hide();
      },
      error: (error) => {
        this.toastr.error(error.message, 'Error');
        console.log(error);
        this.spinner.hide();
      }
    });
  }

  onFilterClick() {

    let filterArray = this.dataSource.data;
    filterArray = this.tipoTx !== '' ? filterArray.filter(item => item.tipoTx === this.tipoTx) : filterArray;
    filterArray = this.fechaTx !== 'Invalid date' ? filterArray.filter(item => {
      let temp = moment(item.fechaTx, 'DD/MM/YYYY');
      let isSame = temp.isSame(moment(this.fechaTx, 'DD/MM/YYYY'), 'day');
      if (isSame) {
        return true;
      } else {
        return false;
      }
    }) : filterArray;
    filterArray = this.tipoEnergia !== '' ? filterArray.filter(item => item.tipoEnergia === this.tipoEnergia) : filterArray;
    this.filterFlag = true;
    console.log(filterArray);
    //this.filterForm.reset();
  }

}
