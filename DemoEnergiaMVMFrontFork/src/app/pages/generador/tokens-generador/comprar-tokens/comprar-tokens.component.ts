import { UntypedFormGroup, UntypedFormBuilder, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { InfoEnergia } from 'src/app/models/InfoEnergia';

@Component({
  selector: 'app-comprar-tokens',
  templateUrl: './comprar-tokens.component.html'
})
export class ComprarTokensComponent implements OnInit {

  tokensDelegados: number;
  comprarEnergiaForm: FormGroup
  tiposEnergia: InfoEnergia[] = [];

  constructor(public dialogRef: MatDialogRef<ComprarTokensComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService,
    private clienteService: ClienteContractService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private bancoEnergia: BancoEnergiaService) {
    this.tokensDelegados = this.data.tokensDelegados;
    this.initForm();
  }

  async ngOnInit(): Promise<void> {
    try {
      let promises: Promise<void>[] = [];
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.clienteService.loadBlockChainContractData(this.data.dirContrato));
      await Promise.all(promises);

      this.bancoEnergia.getTiposEnergiasDisponibles().subscribe({
        next: (data) => {
          console.log(data);
          this.tiposEnergia = data;
        },
        error: (error) => {
          console.log(error);
          this.toastr.error(error.message, 'Error');
        }
      });
      // this.comprarEnergiaForm.get('tipoEnergia').valueChanges.subscribe({
      //   next: () => {
      //     this.onEnergiaChange();
      //   }
      // });
      // this.comprarEnergiaForm.get('cantidadEnergia').valueChanges.subscribe({
      //   next: () => {
      //     this.onEnergiaChange();
      //   }
      // });
    } catch (error) {
      console.log(error);
      this.toastr.error('Error al cargar los datos', error.message);
    }
  }

  private onEnergiaChange() {
    let tipoEnergia = this.comprarEnergiaForm.get('tipoEnergia').value == '' ? null : this.comprarEnergiaForm.get('tipoEnergia').value as InfoEnergia;
    let cantidadEnergia = this.comprarEnergiaForm.get('cantidadEnergia').value == '' ? 0 : this.comprarEnergiaForm.get('cantidadEnergia').value;
    if (cantidadEnergia > 0 && tipoEnergia) {
      // let precioEnergia = tipoEnergia.precio * cantidadEnergia;
      let precioEnergia = 0.001 * 1500 * 4500 * cantidadEnergia;
      this.comprarEnergiaForm.get('valorCompra').setValue(precioEnergia);
    }
  }

  initForm() {
    this.comprarEnergiaForm = this.fb.group({
      cantidadEnergia: ['', Validators.required],
      valorCompra: [{ value: '', disabled: true }, Validators.required]
    });
  }

  onComprarTokens() {
    this.alertDialog.confirmAlert('Confirmar', '¿Está seguro de que desea comprar energía?')
      .then((result) => {
        if (result.isConfirmed) {
          this.spinner.show();
          let infoEnergia = this.comprarEnergiaForm.get('tipoEnergia').value as InfoEnergia;
          let cantidadEnergia = this.comprarEnergiaForm.get('cantidadEnergia').value;
          this.clienteService.postComprarEnergia(infoEnergia.nombre, cantidadEnergia).subscribe({
            next: () => {
              this.spinner.hide();
              this.toastr.success('Emision de compra de energia', 'Éxito');
              this.dialogRef.close();
            }, error: (error) => {
              this.spinner.hide();
              this.toastr.error(error.message, 'Error');
            }
          });
        }
      });
  }

  onCancelar() {
    this.dialogRef.close();
  }

  // get isComprarValid(): boolean {
  //   let cantidadCompra = this.comprarEnergiaForm.get('cantidadEnergia').value;
  //   return this.comprarEnergiaForm.valid;
  // }

}
