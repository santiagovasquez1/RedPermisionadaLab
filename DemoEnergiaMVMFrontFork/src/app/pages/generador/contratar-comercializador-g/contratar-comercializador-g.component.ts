import { Component, Inject, OnInit } from '@angular/core';
import { InfoContrato } from 'src/app/models/infoContrato';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { map } from 'rxjs';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { GeneradorContractService } from 'src/app/services/generador-contract.service';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';

@Component({
  selector: 'app-contratar-comercializador-g',
  templateUrl: './contratar-comercializador-g.component.html'
})
export class ContratarComercializadorGComponent implements OnInit {

  comercializadores: InfoContrato[] = [];
  comercializadorSeleccionado: InfoContrato = null;
  constructor(public dialogRef: MatDialogRef<ContratarComercializadorGComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private reguladorMercado: ReguladorMercadoService,
              private alertDialog: SweetAlertService,
              private spinner: NgxSpinnerService,
              private generadorContractService: GeneradorContractService,
              private toastr: ToastrService) { }

  async ngOnInit(): Promise<void> {
    await this.reguladorMercado.loadBlockChainContractData();
    await this.generadorContractService.loadBlockChainContractData(localStorage.getItem('dirContract'));
    this.reguladorMercado.getContratosRegistrados().pipe(
      map((data) => {
        let info = data.filter((item) => item.tipoContrato == TiposContratos.Comercializador
          && item.infoContrato.tipoContrato == TiposContratos.Comercializador)
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

  onContratar(){
    
  }

}
