import { EstadoSolicitud } from './../../../models/solicitudContrato';
import { FormGroup, FormBuilder } from '@angular/forms';
import { SweetAlertService } from './../../../services/sweet-alert.service';
import { InfoContrato } from './../../../models/infoContrato';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subscription, timer, filter } from 'rxjs';
import { SolicitudContrato } from 'src/app/models/solicitudContrato';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { TableService } from 'src/app/services/shared/table-service.service';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';
import { ClienteFactoryService } from 'src/app/services/cliente-factory.service';
import { ComercializadorFactoryService } from 'src/app/services/comercializador-factory.service';
import { GeneradorFactoryService } from 'src/app/services/generador-factory.service';
import { FieldValueChange, RowFilterForm } from 'src/app/models/FilterFormParameter';

@Component({
  selector: 'app-ordenes-despacho',
  templateUrl: './ordenes-despacho.component.html',
  styleUrls: ['./ordenes-despacho.component.css']
})
export class OrdenesDespachoComponent implements OnInit {

  estadosSolicitud: EstadoSolicitud[];
  tiposDeAgentes: TiposContratos[];

  displayedColumns: string[] = ['empresa', 'ubicacion', 'correo', 'tipoAgente', 'acciones'];
  timer$: Observable<any>;
  timerSubscription: Subscription;
  contadorAnterior = 0;
  contadorActual = 0;
  isFromInit: boolean = false;
  diligenciandoSolicitud: boolean = false;
  reloadData: boolean = false;

  dataSource: MatTableDataSource<SolicitudContrato>;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild('table', { static: true }) table: MatTable<any>;
  sort: MatSort;

  filterFormProperties: RowFilterForm[] = [];

  //Filtros:
  filters = {
    empresa: '',
    contacto: '',
    ubicacion: '',
    correo: '',
    tipoAgente: undefined,
    estado: undefined
  }


  constructor(private toastr: ToastrService,
    private regulardorMercado: ReguladorMercadoService,
    private tableService: TableService,
    private spinner: NgxSpinnerService,
    private sweetAlert: SweetAlertService,
    private clienteFactory: ClienteFactoryService,
    private comercializadorFactory: ComercializadorFactoryService,
    private generadorFactory: GeneradorFactoryService,
    private fb: FormBuilder) {
    this.timer$ = timer(0, 5000);
    this.dataSource = new MatTableDataSource();
    this.getArraysEnums();

    this.filterFormProperties = [{
      fields: [{
        label: 'Empresa',
        formControlName: 'empresa',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Contacto',
        formControlName: 'contacto',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Correo',
        formControlName: 'correo',
        controlType: 'text',
        pipe: ''
      }]
    }, {
      fields: [{
        label: 'Ubicación',
        formControlName: 'ubicacion',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Tipo de agente',
        formControlName: 'tipoAgente',
        controlType: 'select',
        optionValues: this.tiposDeAgentes,
        pipe: 'tipoContrato'
      }, {
        label: 'Estado',
        formControlName: 'estado',
        controlType: 'select',
        optionValues: this.estadosSolicitud,
        pipe: 'estadoRegistro'
      }]
    }]
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  async ngOnInit(): Promise<void> {
    try {
      this.isFromInit = true;
      this.spinner.show();
      await this.regulardorMercado.loadBlockChainContractData();
      this.tableService.setPaginatorTable(this.paginator);
      this.spinner.hide();
      this.timerSubscription = this.timer$.subscribe(() => {
        this.getInfoAgentes();
      });
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }

  private getInfoAgentes() {
    this.regulardorMercado.getSolicitudesRegistro().subscribe({
      next: (data) => {
        let filterData = this.filterData(data);
        filterData = filterData.filter(item => item.tipoContrato == 2);


        this.contadorActual = filterData.length;
        if ((this.contadorActual !== this.contadorAnterior && !this.diligenciandoSolicitud) || this.reloadData) {
          this.dataSource.data = filterData;
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          if (this.contadorActual > this.contadorAnterior && !this.isFromInit) {
            this.toastr.success('Nueva solicitud registrada', 'Registro');
          }
          this.reloadData = false;
          this.table.renderRows();
          this.contadorAnterior = this.contadorActual;
        }
      }, error: (err) => {
        console.log(err);
        this.toastr.error(err.message, 'Error');
      }
    });
  }

  onApprove(index: number, solicitud: SolicitudContrato) {
    this.diligenciandoSolicitud = true;
    this.sweetAlert.confirmAlert('Diligenciar solicitud', '¿Está seguro de diligenciar la solicitud?')
      .then(async (result) => {
        if (result.isConfirmed) {
          this.spinner.show();
          switch (solicitud.tipoContrato) {
            case TiposContratos.Cliente:
              await this.clienteFactory.loadBlockChainContractData();
              this.clienteFactory.setFactoryContrato(solicitud.infoContrato).subscribe({
                next: () => {
                  this.spinner.hide();
                  this.toastr.success('Solicitud diligenciada', 'Registro');
                  this.reloadData = true;
                  this.diligenciandoSolicitud = false;
                  this.getInfoAgentes();
                }, error: (err) => {
                  this.diligenciandoSolicitud = false;
                  console.log(err);
                  this.spinner.hide();
                  this.toastr.error(err.message, 'Error');
                }
              });
              break;
            case TiposContratos.Comercializador:
              await this.comercializadorFactory.loadBlockChainContractData();
              this.comercializadorFactory.setFactoryContrato(solicitud.infoContrato).subscribe({
                next: () => {
                  this.spinner.hide();
                  this.toastr.success('Solicitud diligenciada', 'Registro');
                  this.reloadData = true;
                  this.diligenciandoSolicitud = false;
                  this.getInfoAgentes();
                }, error: (err) => {
                  this.diligenciandoSolicitud = false;
                  console.log(err);
                  this.spinner.hide();
                  this.toastr.error(err.message, 'Error');
                }
              });
              break;
            case TiposContratos.Generador:
              await this.generadorFactory.loadBlockChainContractData();

              this.generadorFactory.setFactoryContrato(solicitud.infoContrato).subscribe({
                next: () => {
                  this.spinner.hide();
                  this.toastr.success('Solicitud diligenciada', 'Registro');
                  this.reloadData = true;
                  this.diligenciandoSolicitud = false;
                  this.getInfoAgentes();
                }, error: (err) => {
                  this.diligenciandoSolicitud = false;
                  console.log(err);
                  this.spinner.hide();
                  this.toastr.error(err.message, 'Error');
                }
              });
              break;
            default:
              this.spinner.hide();
              this.toastr.error('Tipo de contrato no soportado', 'Error');
          }

        } else {
          this.diligenciandoSolicitud = false;
        }
      })

  }

  onReject(index: number, infoContrato: InfoContrato) {
    this.diligenciandoSolicitud = true;
    this.sweetAlert.confirmAlert('Rechazar solicitud', '¿Está seguro de rechazar la solicitud?')
      .then(result => {
        if (result.isConfirmed) {
          this.spinner.show();
          this.regulardorMercado.diligenciarSolicitud(index, infoContrato, EstadoSolicitud.rechazada).subscribe({
            next: () => {
              this.spinner.hide();
              this.toastr.info('Solicitud rechazada', 'Registro');
              this.reloadData = true;
              this.diligenciandoSolicitud = false;
              this.getInfoAgentes();
            },
            error: (err) => {
              this.diligenciandoSolicitud = false;
              console.log(err);
              this.spinner.hide();
              this.toastr.error(err.message, 'Error');
            }
          })
        } else {
          this.diligenciandoSolicitud = false;
        }
      })
  }

  onfieldValueChange(event: FieldValueChange) {
    if (event.controlName === 'tipoAgente' || event.controlName === 'estado') {
      this.filters[event.controlName] = event.data !== '' ? parseInt(event.data) : event.data;
      console.log(event.controlName)
      console.log(this.filters)
    } else {
      this.filters[event.controlName] = event.data;
    }
    this.reloadData = true;
    this.getInfoAgentes();
  }

  private getArraysEnums() {
    this.tiposDeAgentes = Object.values(TiposContratos).filter(item => typeof item === 'number') as TiposContratos[];
    this.estadosSolicitud = Object.values(EstadoSolicitud).filter(item => typeof item === 'number') as EstadoSolicitud[];
  }

  private filterData(data: SolicitudContrato[]): SolicitudContrato[] {
    let filterArray = data
    filterArray = this.filters.empresa !== '' ? filterArray.filter(item => item.infoContrato.empresa.toLowerCase().includes(this.filters.empresa)) : filterArray;
    filterArray = this.filters.contacto !== '' ? filterArray.filter(item => item.infoContrato.contacto.toLowerCase().includes(this.filters.contacto.toLowerCase())) : filterArray;
    filterArray = this.filters.ubicacion !== '' ? filterArray.filter(item => item.infoContrato.departamento.toLowerCase().includes(this.filters.ubicacion.toLowerCase())) : filterArray;
    filterArray = this.filters.correo !== '' ? filterArray.filter(item => item.infoContrato.correo.toLowerCase().includes(this.filters.correo.toLowerCase())) : filterArray;
    filterArray = this.filters.tipoAgente !== '' && this.filters.tipoAgente !== undefined ? filterArray.filter(item => item.tipoContrato == this.filters.tipoAgente) : filterArray;
    filterArray = this.filters.estado !== '' && this.filters.estado !== undefined ? filterArray.filter(item => item.estadoSolicitud == this.filters.estado) : filterArray;

    return filterArray;
  }

}
