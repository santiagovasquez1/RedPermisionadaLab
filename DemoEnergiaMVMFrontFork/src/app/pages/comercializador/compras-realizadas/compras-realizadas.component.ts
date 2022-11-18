import { InfoCertificadoCompraComponent } from './../../../shared/info-certificado-compra/info-certificado-compra.component';
import { MatDialog } from '@angular/material/dialog';
import { InfoCompraEnergia } from './../../../models/InfoCompraEnergia';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ComercializadorContractService } from 'src/app/services/comercializador-contract.service';
import { InfoMappingCertificado } from 'src/app/models/InfoCertificados';
import moment from 'moment';

@Component({
  selector: 'app-compras-realizadas',
  templateUrl: './compras-realizadas.component.html',
  styles: [
  ]
})
export class ComprasRealizadasComponent implements OnInit, OnDestroy {
  title: string = "Compras realizadas";
  comprasRealizadas: InfoCompraEnergia[] = [];
  compraRealizadaEvent: any;
  constructor(private comercializadorService: ComercializadorContractService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private dialog: MatDialog) {
  }

  async ngOnInit(): Promise<void> {
    try {
      const dirContract = localStorage.getItem('dirContract');
      await this.comercializadorService.loadBlockChainContractData(dirContract);
      this.loadComprasRealizadas();
      this.compraRealizadaEvent = this.comercializadorService.contract?.events.EmisionCompraExitosa({
        fromBlock: 'latest'
      }, (err, event) => {
        if (err) {
          console.log(err);
          this.toastr.error(err.message, 'Error');
        }
      }).on('data', (event) => {
        this.loadComprasRealizadas();
        this.toastr.success('Compra realizada', 'Éxito');
      });
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }

  ngOnDestroy(): void {
    this.compraRealizadaEvent.removeAllListeners('data');
  }

  loadComprasRealizadas() {
    this.spinner.show();
    this.comercializadorService.getInfoComprasRealizadas().subscribe({
      next: (comprasRealizadas) => {
        this.comprasRealizadas = comprasRealizadas;
        this.spinner.hide();
      }, error: (err) => {
        this.spinner.hide();
        this.toastr.error(err.message, 'Error');
      }
    });
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
      width: '800px',
      data: requestCompra
    });
  }
}
