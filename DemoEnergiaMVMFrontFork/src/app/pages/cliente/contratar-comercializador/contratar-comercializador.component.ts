import { ToastrService } from 'ngx-toastr';
import { InfoContrato } from './../../../models/infoContrato';
import { ClienteContractService } from './../../../services/cliente-contract.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { SweetAlertService } from './../../../services/sweet-alert.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { filter, from, map, take, takeWhile } from 'rxjs';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';

@Component({
  selector: 'app-contratar-comercializador',
  templateUrl: './contratar-comercializador.component.html',
  styles: [
  ]
})
export class ContratarComercializadorComponent implements OnInit {
  comercializadores: InfoContrato[] = [];
  comercializadorSeleccionado: InfoContrato;
  contratarForm: FormGroup;

  constructor(public dialogRef: MatDialogRef<ContratarComercializadorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private reguladorMercado: ReguladorMercadoService,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService,
    private clienteService: ClienteContractService,
    private toastr: ToastrService,
    private fb: FormBuilder) {
    this.contratarForm = this.fb.group({});
  }

  initForm() {
    this.contratarForm = this.fb.group({
      comercializador: ['', [Validators.required]]
    });

    this.contratarForm.get('comercializador').valueChanges.subscribe((data) => {
      this.comercializadorSeleccionado = data !== '' ? data as InfoContrato : null;
    });
  }

  async ngOnInit(): Promise<void> {
    this.initForm();
    await this.reguladorMercado.loadBlockChainContractData();
    await this.clienteService.loadBlockChainContractData(this.data.dirContrato);
    this.spinner.show();
    this.reguladorMercado.getContratosRegistrados().pipe(
      map((data) => {
        console.log("DATA DE CONTRATOS: ",data)
        let info = data.filter((item) => item.tipoContrato == TiposContratos.Comercializador
          && item.infoContrato.tipoContrato == TiposContratos.Comercializador)
          .map((item) => item.infoContrato);
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

  onContratar() {
    this.alertDialog.confirmAlert('Confirmar contrato', '¿Está seguro de que desea contratar el comercializador?').then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();

        this.clienteService.postContratarComercializador(this.comercializadorSeleccionado.dirContrato).subscribe({
          next: () => {
            this.toastr.success('Contrato contratado con éxito', 'Contrato');
            this.spinner.hide();
            this.dialogRef.close();
          }, error: (error) => {
            console.log(error);
            this.toastr.error('Error al contratar el comercializador', error.message);
            this.spinner.hide();
          }
        });
      }
    })
  }

  get validForm(): boolean {
    return this.comercializadorSeleccionado != null && this.comercializadorSeleccionado.dirContrato !== this.data.comercializador;
  }

}
