import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { map } from 'rxjs';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';
import { InfoContrato } from 'src/app/models/infoContrato';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { GeneradorContractService } from 'src/app/services/generador-contract.service';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';

@Component({
  selector: 'app-contratar-comercializador',
  templateUrl: './contratar-comercializador.component.html'
})
export class ContratarComercializadorComponent implements OnInit {

  comercializadores: InfoContrato[] = [];
  comercializadorSeleccionado: InfoContrato = null;
  constructor(public dialogRef: MatDialogRef<ContratarComercializadorComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private reguladorMercado: ReguladorMercadoService,
              private alertDialog: SweetAlertService,
              private spinner: NgxSpinnerService,
              private generadorContractService: GeneradorContractService,
              private toastr: ToastrService) { }

  async ngOnInit(): Promise<void> {
    await this.reguladorMercado.loadBlockChainContractData();
    await this.generadorContractService.loadBlockChainContractData();
    this.reguladorMercado.getContratosRegistrados().pipe(
      map((data) => {
        let info = data.filter((item) => item.tipoContrato == TiposContratos.Comercializador
          && item.infoContrato.tipoComercio == 1)
          .map((item) => item.infoContrato);
        console.log("Contratos de tipo comercializador generador: ",info);
        return info;
      })
    ).subscribe({
      next: (data) => {
        this.comercializadores = data;
        this.spinner.hide();
      }, error: (error) => {
        console.log(error);
        this.toastr.error('Error al cargar los comercializadores', error.message); 3
        this.spinner.hide();
      }
    });
  }

  get validForm(): boolean {
    return this.comercializadorSeleccionado != null && this.comercializadorSeleccionado.dirContrato !== this.data.comercializador;
  }

}
