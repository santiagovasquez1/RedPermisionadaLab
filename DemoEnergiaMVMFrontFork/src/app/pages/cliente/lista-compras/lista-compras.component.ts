import { ComercializadorContractService } from 'src/app/services/comercializador-contract.service';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { TableService } from 'src/app/services/shared/table-service.service';
import { InfoCompraEnergia } from './../../../models/InfoCompraEnergia';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { Component, NgZone, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { FieldValueChange, RowFilterForm } from 'src/app/models/FilterFormParameter';
import { InfoCertificadoCompraComponent } from 'src/app/shared/info-certificado-compra/info-certificado-compra.component';
import { InfoMappingCertificado } from 'src/app/models/InfoCertificados';
import moment from 'moment';
import { ComprarEnergiaComponent } from '../comprar-energia/comprar-energia.component';
import { forkJoin, Observable } from 'rxjs';
import { InfoContrato } from 'src/app/models/infoContrato';
import { InfoEnergia } from 'src/app/models/InfoEnergia';
import { ContratarComercializadorComponent } from '../contratar-comercializador/contratar-comercializador.component';
import { AcuerdoEnergia, EstadoAcuerdo } from 'src/app/models/AcuerdoEnergia';
import { AcuerdoEnergiaComponent } from '../acuerdo-energia/acuerdo-energia.component';

@Component({
  selector: 'app-lista-compras',
  templateUrl: './lista-compras.component.html',
  styles: [
  ]
})
export class ListaComprasComponent implements OnInit, OnDestroy {

  displayedColumns: string[] = ['id', 'comercializador', 'cantidad', 'tecnologia', 'fechaCompra', 'valorCompra', 'generador', 'planta'];
  energiasDisponibles: string[];
  dataSource: MatTableDataSource<InfoCompraEnergia>;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild('table', { static: true }) table: MatTable<any>;
  sort: MatSort;

  filterFormProperties: RowFilterForm[] = [];
  compraEnergiaEvent: any;

  filters = {
    tecnologia: '',
    fechaCompra: '',
    generador: '',
    planta: ''
  }

  tokensDelegados: number = 0;
  infoCliente: InfoContrato;
  nombreComercializador;

  

  constructor(private bancoEnergia: BancoEnergiaService,
    private cliente: ClienteContractService,
    private reguladorMercado: ReguladorMercadoService,
    private comercializador: ComercializadorContractService,
    public dialog: MatDialog,
    private spinner: NgxSpinnerService,
    private ngZone: NgZone,
    private toastr: ToastrService,
    private tableService: TableService,

  ) {
    this.dataSource = new MatTableDataSource();
  }

  ngOnDestroy(): void {
    this.compraEnergiaEvent.removeAllListeners();
  }

  async ngOnInit(): Promise<void> {
    const dirContract = localStorage.getItem('dirContract');
    try {
      let promises: Promise<void>[] = [];
      this.tableService.setPaginatorTable(this.paginator);

      promises.push(this.reguladorMercado.loadBlockChainContractData());
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.cliente.loadBlockChainContractData(dirContract));
      await Promise.all(promises);

      this.getInfoContrato();
      //TODO: REVISAR CAMBIO EVENTO DE COMPRA DE ENERGÍA - YA NO EXISTE EN BACKEND
      // this.compraEnergiaEvent = this.cliente.contract.events.compraEnergia({
      //   fromBlock: 'latest'
      // }, (error, data) => {
      //   if (error) {
      //     console.log(error);
      //     this.toastr.error(error.message, 'Error');
      //   }
      // }).on('data', () => {
      //   this.ngZone.run(() => {
      //     this.toastr.success('Compra de energía realizada', 'Energía');
      //     this.getComprasCliente();
      //     this.getInfoContrato();
      //   });
      // });
      this.getComprasCliente();
    } catch (error) {
      this.toastr.error(error.message, 'Error');
      console.log(error);
    }
  }

  private getComprasCliente() {
    this.cliente.getInfoContrato().subscribe({
      next: (data) => {
        if (data.comercializador !== '0x0000000000000000000000000000000000000000') {
          this.cliente.getComprasRealizadas().subscribe({
            next: (data) => {
              const filterData = this.filterData(data);
              this.dataSource.data = filterData;
              this.dataSource.paginator = this.paginator;
              this.dataSource.sort = this.sort;
              this.table.renderRows();
            },
            error: (err) => {
              console.log(err);
              this.toastr.error(err.message, 'Error');
            }
          });
        }
      },
      error: (error) => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
      }
    })

  }

  private setFilterForm() {
    this.filterFormProperties = [{
      fields: [{
        label: 'Tecnologia',
        formControlName: 'tecnologia',
        controlType: 'select',
        pipe: '',
        optionValues: this.energiasDisponibles
      }, {
        label: 'Fecha de compra',
        formControlName: 'fechaCompra',
        controlType: 'date',
        pipe: ''
      }, {
        label: 'Generador',
        formControlName: 'generador',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Planta',
        formControlName: 'planta',
        controlType: 'text',
        pipe: ''
      }]
    }]
  }

  onfieldValueChange(event: FieldValueChange) {
    if (event.controlName === 'fechaCompra') {
      this.filters.fechaCompra = event.data !== '' ? moment(event.data).format('DD/MM/YYYY') : 'Invalid date';
    } else {
      this.filters[event.controlName] = event.data;
    }
    this.getComprasCliente();
  }


  private filterData(data: InfoCompraEnergia[]): InfoCompraEnergia[] {
    let filterArray = data;
    filterArray = this.filters.fechaCompra !== 'Invalid date' && this.filters.fechaCompra !== '' ? filterArray.filter(item => {
      let temp = moment(item.fechaAprobacion, 'DD/MM/YYYY');
      let isSame = temp.isSame(moment(this.filters.fechaCompra, 'DD/MM/YYYY'), 'day');
      if (isSame) {
        return true;
      } else {
        return false;
      }
    }) : filterArray;

    filterArray = this.filters.generador !== '' ? filterArray.filter(item => item.empresaGerador.toLocaleLowerCase().includes(this.filters.generador.toLowerCase())) : filterArray;
    filterArray = this.filters.planta !== '' ? filterArray.filter(item => item.nombrePlanta.toLocaleLowerCase().includes(this.filters.planta)) : filterArray;
    filterArray = this.filters.tecnologia !== '' ? filterArray.filter(item => item.tipoEnergia == this.filters.tecnologia) : filterArray;

    return filterArray;
  }

  verCertificado(compra: InfoCompraEnergia) {
    let requestCompra: InfoMappingCertificado = {
      dirContratoCliente: compra.dirContratoCliente,
      dirContratoGenerador: compra.dirContratoGerador,
      dirContratoComercializador: compra.dirComercializador,
      cantidadEnergia: compra.cantidadEnergia,
      tipoEnergia: compra.tipoEnergia,
      fechaCompra: compra.fechaAprobacionNumber,
    }

    this.dialog.open(InfoCertificadoCompraComponent, {
      width: '540px',
      data: requestCompra
    });
  }

  onSolicitarCompra() {
    let dialogRef = this.dialog.open(ComprarEnergiaComponent, {
      width: '500px',
      data: {
        dirContrato: localStorage.getItem('dirContract'),
        tokensDelegados: this.tokensDelegados
      }
    });

    dialogRef.afterClosed().subscribe({
      next: () => {
        this.getInfoContrato();
      }
    })
  }

  onContratoEnergia(){

    let dialogRef = this.dialog.open(AcuerdoEnergiaComponent, {
      width: '500px',
      data: {
        dirContrato: localStorage.getItem('dirContract'),
        tokensDelegados: this.tokensDelegados
      }
    });

    dialogRef.afterClosed().subscribe({
      next: () => {
        this.getInfoContrato();
      }
    })


    // let acuerdoEnergia: AcuerdoEnergia = {
    //   dirCliente: "0x19340ba17d7E375c37C36Bf349835FE930E329F8",
    //   dirGenerador: '0x26cd32E0Ef557d88e89CB841C1b58d6623Cd42BD',
    //   dirComercializador: '0x5abF7441F6C394588738eC07f190706c38b338B2',
    //   tipoEnergia: 'solar',
    //   cantidadEnergiaTotal: 0,
    //   cantidadEnergiaInyectada: 0,
    //   fechaSolicitud: Math.trunc(Date.now() / 1000),
    //   fechaInicio: Math.trunc(Date.now() / 1000),
    //   fechaFin: Math.trunc(Date.now() / 1000),
    //   estadoAcuerdo: EstadoAcuerdo.activo,
    //   indexCliente: 0,
    //   indexGlobal: 0,
    // }
    // console.log("ACUERDO DE ENERGÍA: ",acuerdoEnergia)
    
    // let tipoEnergia = 'solar';
    // let cantidad = 40
    // this.cliente.postComprarEnergia(tipoEnergia, cantidad).subscribe({
    //   next: (data) => {
    //     this.infoCliente = data;
    //     this.toastr.success("realizado","exito");
    //     this.spinner.hide();
    //   }, error: (error) => {
    //     console.log(error);
    //     this.toastr.error(error.message, 'Error');
    //     this.spinner.hide();
    //   }
    // });
  }

  onContratar() {
    let dialogRef = this.dialog.open(ContratarComercializadorComponent, {
      width: '500px',
      data: {
        dirContrato: localStorage.getItem('dirContract'),
        comercializador: this.infoCliente.comercializador
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.spinner.show();
      this.cliente.getInfoContrato().subscribe({
        next: (data) => {
          this.infoCliente = data;
          this.spinner.hide();
        }, error: (error) => {
          console.log(error);
          this.toastr.error(error.message, 'Error');
          this.spinner.hide();
        }
      })
    });
  }

  private getInfoContrato() {
    let observables: Observable<any>[] = [];
    observables.push(this.cliente.getInfoContrato());
    observables.push(this.bancoEnergia.getTiposEnergiasDisponibles())

    forkJoin(observables).subscribe({
      next: async (data) => {
        this.infoCliente = data[0];
        const tiposEnergias = data[1] as InfoEnergia[];
        this.energiasDisponibles = tiposEnergias.map(x => x.nombre);
        this.setFilterForm();
        if (this.infoCliente.comercializador !== '0x0000000000000000000000000000000000000000') {
          await this.comercializador.loadBlockChainContractData(this.infoCliente.comercializador);
          forkJoin([this.cliente.getTokensDelegados(), this.comercializador.getInfoContrato()]).subscribe({
            next: (data: any[]) => {
              this.tokensDelegados = data[0];
              this.nombreComercializador = (data[1] as InfoContrato).empresa;
            },
            error: (error) => {
              this.toastr.error(error.message, 'Error');
              console.log(error);
            }
          });
        }
      }, error: (error) => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
        this.spinner.hide();
      }
    });
  }
}
