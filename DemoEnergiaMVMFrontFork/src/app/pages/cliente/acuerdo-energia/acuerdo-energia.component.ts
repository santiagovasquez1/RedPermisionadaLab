import { UntypedFormGroup, UntypedFormBuilder, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { InfoEnergia } from 'src/app/models/InfoEnergia';
import { type } from 'os';


@Component({
  selector: 'app-acuerdo-energia',
  templateUrl: './acuerdo-energia.component.html'
})
export class AcuerdoEnergiaComponent implements OnInit {
  tokensDelegados: number;
  comprarEnergiaForm: FormGroup
  tiposEnergia: InfoEnergia[] = [];

  constructor(public dialogRef: MatDialogRef<AcuerdoEnergiaComponent>,
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
          console.log("TIPOS DE ENERGÍA: ",data);
          this.tiposEnergia = data;
        },
        error: (error) => {
          console.log(error);
          this.toastr.error(error.message, 'Error');
        }
      });
      this.comprarEnergiaForm.get('tipoEnergia').valueChanges.subscribe({
        next: () => {
          this.onEnergiaChange();
        }
      });
      this.comprarEnergiaForm.get('cantidadEnergia').valueChanges.subscribe({
        next: () => {
          this.onEnergiaChange();
        }
      });
      this.comprarEnergiaForm.get('fechaFin').valueChanges.subscribe({
        next: () => {
          this.onEnergiaChange();
        }
      });
    } catch (error) {
      console.log(error);
      this.toastr.error('Error al cargar los datos', error.message);
    }
  }

  private onEnergiaChange() {
    let tipoEnergia = this.comprarEnergiaForm.get('tipoEnergia').value == '' ? null : this.comprarEnergiaForm.get('tipoEnergia').value as InfoEnergia;
    let cantidadEnergia = this.comprarEnergiaForm.get('cantidadEnergia').value == '' ? 0 : this.comprarEnergiaForm.get('cantidadEnergia').value;
    let fechaFin = this.comprarEnergiaForm.get('fechaFin').value == '' ? 0 : this.comprarEnergiaForm.get('fechaFin').value;

    console.log(fechaFin)
    if (cantidadEnergia > 0 && tipoEnergia) {
      let precioEnergia = tipoEnergia.precio * cantidadEnergia;
      this.comprarEnergiaForm.get('valorCompra').setValue(precioEnergia);
    }
  }

  initForm() {
    this.comprarEnergiaForm = this.fb.group({
      tipoEnergia: ['', Validators.required],
      cantidadEnergia: ['', Validators.required],
      fechaFin:['', Validators.required],
      // valorCompra: [{ value: '', disabled: true }, Validators.required],
      // tokensDelegados: [{ value: this.tokensDelegados, disabled: true }, Validators.required],
    });
  }

  onComprarEnergia() {
    this.alertDialog.confirmAlert('Confirmar', '¿Está seguro de que desea comprar energía?')
      .then((result) => {
        if (result.isConfirmed) {
          this.spinner.show();
          let infoEnergia = this.comprarEnergiaForm.get('tipoEnergia').value as InfoEnergia;
          let cantidadEnergia = this.comprarEnergiaForm.get('cantidadEnergia').value;
          let fechaFin = this.comprarEnergiaForm.get('fechaFin').value;
          fechaFin = Math.trunc(Date.parse(fechaFin) / 1000)
          console.log("infoEnergia: ",infoEnergia);
          console.log("cantidadEnergia: ",cantidadEnergia);
          console.log("fechaFin: ",fechaFin);
          this.clienteService.postComprarEnergia(infoEnergia.nombre, cantidadEnergia,fechaFin).subscribe({
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

  get isComprarValid(): boolean {
    let cantidadCompra = this.comprarEnergiaForm.get('cantidadEnergia').value;
    let valorCompra = this.comprarEnergiaForm.get('valorCompra').value;
    let infoEnergia = this.comprarEnergiaForm.get('tipoEnergia').value as InfoEnergia;
    return this.comprarEnergiaForm.valid && valorCompra <= this.data.tokensDelegados && cantidadCompra <= infoEnergia.cantidadEnergia;
  }
}





