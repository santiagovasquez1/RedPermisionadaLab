import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subscription, timer } from 'rxjs';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';
import { SolicitudContrato } from 'src/app/models/solicitudContrato';
import { ClienteFactoryService } from 'src/app/services/cliente-factory.service';
import { ComercializadorFactoryService } from 'src/app/services/comercializador-factory.service';
import { GeneradorFactoryService } from 'src/app/services/generador-factory.service';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';

@Component({
  selector: 'app-solicitudes',
  templateUrl: './solicitudes.component.html',
  styles: [
  ]
})
export class SolicitudesComponent implements OnInit, OnDestroy {
  solicitudesRegistro: SolicitudContrato[] = [];
  timer$: Observable<any>;
  timerSubscription: Subscription;
  contadorAnterior = 0;
  contadorActual = 0;
  diligenciandoSolicitud: boolean = false;
  isFromInit: boolean = false;

  constructor(private toastr: ToastrService,
    private regulardorMercado: ReguladorMercadoService,
    private spinner: NgxSpinnerService,
    private sweetAlert: SweetAlertService,
    private clienteFactory: ClienteFactoryService,
    private comercializadorFactory: ComercializadorFactoryService,
    private generadorFactory: GeneradorFactoryService) {
    this.timer$ = timer(0, 1000);
  }
  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  async ngOnInit() {
    this.isFromInit = true;
    this.spinner.show();
    await this.regulardorMercado.loadBlockChainContractData();
    this.spinner.hide();
    this.timerSubscription = this.timer$.subscribe(() => {
      this.regulardorMercado.getSolicitudesRegistro().subscribe({
        next: (data) => {
          this.contadorActual = data.length;
          if (this.contadorActual !== this.contadorAnterior && !this.diligenciandoSolicitud) {
            this.solicitudesRegistro = data;
            if (this.contadorActual > this.contadorAnterior && !this.isFromInit) {
              this.toastr.success('Nueva solicitud de registro', 'Registro');
            }
            this.contadorAnterior = this.contadorActual;
          }
        }, error: (err) => {
          console.log(err);
          this.toastr.error(err.message, 'Error');
        }
      });
    })
  }

  onDiligenciarSolicitud(index: number, solicitud: SolicitudContrato) {
    this.diligenciandoSolicitud = true;
    this.sweetAlert.confirmAlert('Diligenciar solicitud', '¿Está seguro de diligenciar la solicitud?')
      .then(async (result) => {
        if (result.isConfirmed) {
          this.spinner.show();
          switch (parseInt(solicitud.tipoContrato.toString())) {
            case TiposContratos.Cliente:
              await this.clienteFactory.loadBlockChainContractData();
              this.clienteFactory.setFactoryContrato(solicitud.infoContrato).subscribe({
                next: () => {
                  this.spinner.hide();
                  this.toastr.success('Solicitud diligenciada', 'Registro');
                }, error: (err) => {
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
                }, error: (err) => {
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
                }, error: (err) => {
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
        }

        this.diligenciandoSolicitud = false;
      })
      .catch((err) => {
        this.toastr.error(err.message, 'Error');
        this.diligenciandoSolicitud = false;
      })
  }

}
