import { GeneradorContractService } from 'src/app/services/generador-contract.service';
import { forkJoin, Observable, map, from } from 'rxjs';
import { InfoContrato } from 'src/app/models/infoContrato';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { CertificadorContractService } from './../../services/certificador-contract.service';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { InfoCertificadoAgente } from 'src/app/models/InfoCertificados';
import moment from 'moment';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';

@Component({
  selector: 'app-info-certificado-agente',
  templateUrl: './info-certificado-agente.component.html',
  styles: [
  ]
})
export class InfoCertificadoAgenteComponent implements OnInit {

  infoCertificador: InfoContrato;
  infoCertificadoAgente: InfoCertificadoAgente;
  dirContratoAgente: string;
  fechaActual: string;
  anioActual: string;
  verbo: string;
  cantidadEnergia: number;
  tipoAgente: TiposContratos;

  constructor(public dialogRef: MatDialogRef<InfoCertificadoAgenteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private certificador: CertificadorContractService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private cliente: ClienteContractService,
    private generador: GeneradorContractService) {
    this.dirContratoAgente = data.dirContratoAgente;
    this.fechaActual = moment.utc().locale('es').subtract(5, 'hours').format('MMMM DD');
    this.anioActual = moment.utc().locale('es').subtract(5, 'hours').format('YYYY');

    this.tipoAgente = parseInt(localStorage.getItem('tipoAgente')) as TiposContratos;
    switch (this.tipoAgente) {
      case TiposContratos.Cliente:
        this.verbo = "comprado";
        break;
      case TiposContratos.Comercializador:
        this.verbo = 'colocado';
        break;
      default:
        this.verbo = '';
        break;
    }
  }

  async ngOnInit() {
    try {

      await this.certificador.loadBlockChainContractData('');
      this.spinner.show();
      let observables: Observable<any>[] = [];

      observables.push(this.certificador.getInfoContrato());
      observables.push(this.certificador.getCertificadoAgente(this.dirContratoAgente));

      forkJoin(observables).subscribe({
        next: async (data) => {
          this.infoCertificador = data[0] as InfoContrato;
          this.infoCertificadoAgente = data[1] as InfoCertificadoAgente
          if (this.tipoAgente == TiposContratos.Cliente) {
            await this.cliente.loadBlockChainContractData(this.infoCertificadoAgente.dirContratoAgente);
            debugger;
            this.cliente.getAcumuladoVenta().subscribe({
              next: (data) => {
                this.cantidadEnergia = data;
                this.spinner.hide();
              },
              error: (error) => {
                console.log(error);
                this.spinner.hide();
                this.toastr.error('Error al obtener el certificado del agente', 'Error');
                this.dialogRef.close();
              }
            });
          } else if (TiposContratos.Generador) {
            await this.generador.loadBlockChainContractData(this.infoCertificadoAgente.dirContratoAgente);
            this.generador.getAcumuladoVenta().subscribe({
              next: (data) => {
                this.cantidadEnergia = data;
                this.spinner.hide();
              },
              error: (error) => {
                console.log(error);
                this.spinner.hide();
                this.toastr.error('Error al obtener el certificado del agente', 'Error');
                this.dialogRef.close();
              }
            })
            this.spinner.hide();
          } else {
            this.spinner.hide();
          }
        },
        error: (error) => {
          console.log(error);
          this.spinner.hide();
          this.toastr.error('Error al obtener el certificado del agente', 'Error');
          this.dialogRef.close();
        }
      })

    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
      this.dialogRef.close();
    }
  }


}
