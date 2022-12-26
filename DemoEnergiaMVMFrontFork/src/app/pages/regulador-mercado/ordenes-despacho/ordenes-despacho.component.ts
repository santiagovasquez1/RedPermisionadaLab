import { DespachosEnergiaService } from './../../../services/despachos-energia.service';
import { EstadoSolicitud } from './../../../models/solicitudContrato';
import { SweetAlertService } from './../../../services/sweet-alert.service';
import { Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, switchMap, of, forkJoin } from 'rxjs';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { TableService } from 'src/app/services/shared/table-service.service';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';
import { FieldValueChange, RowFilterForm } from 'src/app/models/FilterFormParameter';
import { OrdenDespacho } from 'src/app/models/OrdenDespacho';

@Component({
  selector: 'app-ordenes-despacho',
  templateUrl: './ordenes-despacho.component.html',
  styleUrls: ['./ordenes-despacho.component.css']
})
export class OrdenesDespachoComponent implements OnInit, OnDestroy {

  estadosSolicitud: EstadoSolicitud[];
  tiposDeAgentes: TiposContratos[];

  displayedColumns: string[] = ['generador', 'capacidadNominal', 'cantidadProducida', 'despacho', 'acciones'];
  contadorAnterior = 0;
  contadorActual = 0;
  isFromInit: boolean = false;
  diligenciandoSolicitud: boolean = false;
  reloadData: boolean = false;

  dataSource: MatTableDataSource<OrdenDespacho>;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild('table', { static: true }) table: MatTable<any>;
  sort: MatSort;
  contratoDiligenciadoEvent: any;
  inyeccionDespachoEvent: any;
  filterFormProperties: RowFilterForm[] = [];

  //Filtros:
  filters = {
    nombreGenerador: '',
    capacidadNominal: '',
    energiaDespachada: ''
  }


  constructor(private toastr: ToastrService,
    private regulardorMercado: ReguladorMercadoService,
    private despachosEnergia: DespachosEnergiaService,
    private tableService: TableService,
    private spinner: NgxSpinnerService,
    private sweetAlert: SweetAlertService,
    private ngZone: NgZone) {
    this.dataSource = new MatTableDataSource();

    this.filterFormProperties = [{
      fields: [{
        label: 'Generador',
        formControlName: 'nombreGenerador',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Capacidad Nominal (Mw)',
        formControlName: 'capacidadNominal',
        controlType: 'number',
        pipe: ''
      }, {
        label: 'Energia Despachada (Mw)',
        formControlName: 'energiaDespachada',
        controlType: 'number',
        pipe: ''
      }]
    }]
  }

  ngOnDestroy(): void {
    this.contratoDiligenciadoEvent.removeAllListeners('data');
    this.inyeccionDespachoEvent.removeAllListeners('data');
  }

  async ngOnInit(): Promise<void> {
    try {
      this.spinner.show();
      let promises: Promise<void>[] = [];
      promises.push(this.regulardorMercado.loadBlockChainContractData());
      promises.push(this.despachosEnergia.loadBlockChainContractData());
      await Promise.all(promises);
      this.tableService.setPaginatorTable(this.paginator);
      this.spinner.hide();
      this.getGeneradores();

      this.contratoDiligenciadoEvent = this.regulardorMercado.contract.events.ContratoDiligenciado({
        fromBlock: 'latest'
      }, (err, event) => {
        if (err) {
          console.log(err);
          this.toastr.error(err.message, 'Error');
        }
      }).on('data', (event) => {
        this.ngZone.run(() => {
          this.getGeneradores()
        })
      });

      this.inyeccionDespachoEvent = this.despachosEnergia.contract.events.inyeccionDespacho({
        fromBlock: 'latest'
      }, (err, event) => {
        if (err) {
          console.log(err);
          this.toastr.error(err.message, 'Error');
        }
      }).on('data', (event) => {
        this.ngZone.run(() => {
          this.getGeneradores()
        })
      });


    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }

  private getGeneradores() {
    this.regulardorMercado.getSolicitudesRegistro().pipe(
      switchMap(solicitudes => {
        return of(solicitudes.filter(item => item.tipoContrato == TiposContratos.Generador).map(solicitud => {
          let infoGeneradorDespacho = {
            dirGenerador: solicitud.infoContrato.dirContrato,
            nombreGenerador: solicitud.infoContrato.empresa
          };
          return infoGeneradorDespacho
        }));
      })
    ).subscribe({
      next: data => {
        let timeNow = Math.floor(Date.now() / 1000);
        let getDespachosObservables: Observable<OrdenDespacho>[] = [];

        data.forEach(element => {
          getDespachosObservables.push(this.despachosEnergia.getDespachosByGeneradorAndDate(element.dirGenerador, element.nombreGenerador, timeNow));
        });

        forkJoin(getDespachosObservables).subscribe({
          next: (ordenesDespacho) => {
            let filterData = this.filterData(ordenesDespacho);
            this.dataSource.data = filterData;
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.table.renderRows();
          },
          error: (error) => {
            console.log(error);
            this.toastr.error(error.message, 'Error');
          }
        })
      }, error: (err) => {
        console.log(err);
        this.toastr.error(err.message, 'Error');
      }
    })
  }

  onDespacharEnergia(ordenDespacho: OrdenDespacho) {
    this.sweetAlert.confirmAlert('Despacho de energia', `¿Deseas despachar ${ordenDespacho.cantidadEnergia}Mw al generador ${ordenDespacho.nombreGenerador}`).then(result => {
      if (result.isConfirmed) {
        this.spinner.show();
        if (ordenDespacho.index == null) {
          this.despachosEnergia.setDespachoEnergia(ordenDespacho.dirGenerador, ordenDespacho.cantidadEnergia).subscribe({
            next: (() => {
              this.getGeneradores();
              this.spinner.hide();
              this.toastr.success('Despacho realizado con exito', 'Despacho');
            }),
            error: error => {
              console.log(error);
              this.toastr.error(error.message, 'Error');
            }
          });
        } else {
          let timeNow = Math.floor(Date.now() / 1000);
          this.despachosEnergia.editCantidadDespacho(ordenDespacho.dirGenerador, ordenDespacho.cantidadEnergia,
            timeNow, ordenDespacho.index).subscribe({
              next: () => {
                this.getGeneradores();
                this.spinner.hide();
                this.toastr.success('Modificación de despacho realizado con exito', 'Despacho');
              },
              error: error => {
                console.log(error);
                this.toastr.error(error.message, 'Error');
              }
            });
        }
      }
    });
  }


  onfieldValueChange(event: FieldValueChange) {
    this.filters[event.controlName] = event.data
    this.getGeneradores();
  }

  private filterData(data: OrdenDespacho[]): OrdenDespacho[] {
    let filterArray = data
    filterArray = this.filters.nombreGenerador !== '' ? filterArray.filter(item => item.nombreGenerador.toLowerCase().includes(this.filters.nombreGenerador)) : filterArray;
    filterArray = this.filters.capacidadNominal !== '' ? filterArray.filter(item => item.capacidadNominal === parseInt(this.filters.capacidadNominal)) : filterArray;
    filterArray = this.filters.capacidadNominal !== '' ? filterArray.filter(item => item.cantidadProducida === parseInt(this.filters.energiaDespachada)) : filterArray;

    return filterArray;
  }

}
