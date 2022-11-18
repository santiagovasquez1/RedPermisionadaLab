import { UntypedFormGroup, UntypedFormBuilder, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { GeneradorContractService } from 'src/app/services/generador-contract.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';

export enum Estado {
  nuevaEnergia,
  inyectarEnergia
}

@Component({
  selector: 'app-nueva-energia',
  templateUrl: './nueva-energia.component.html'
})
export class NuevaEnergiaComponent implements OnInit {

  tipoEnergia: string = '';
  capacidadNominal: number;
  cantidadActual: number;
  cantidadEnergia: number;
  nuevaEnergiaForm: FormGroup;
  estado: Estado;
  title: string

  constructor(public dialogRef: MatDialogRef<NuevaEnergiaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generadorContract: GeneradorContractService,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private fb: FormBuilder) {

    this.tipoEnergia = this.data.tecnologia;
    this.capacidadNominal = parseInt(this.data.capacidadNominal);
    this.cantidadActual = parseInt(this.data.cantidadActual);

    this.estado = this.data.estado;
    switch (this.estado) {
      case Estado.nuevaEnergia:
        this.title = 'Crear nueva energía';
        break;
      case Estado.inyectarEnergia:
        this.title = 'Inyectar energía';
        break;
    }
    this.initForm();
  }

  async ngOnInit() {

    try {
      await this.generadorContract.loadBlockChainContractData(this.data.dirContract);
    } catch (error) {
      this.toastr.error(error.message, 'Error');
      this.dialogRef.close();
    }
  }

  initForm() {
    this.nuevaEnergiaForm = this.fb.group({
      nombreEnergia: [{ value: this.tipoEnergia, disabled: true }, Validators.required],
      cantidadEnergia: ['', Validators.required]
    });

    this.nuevaEnergiaForm.get('cantidadEnergia').valueChanges.subscribe(data => {
      this.cantidadEnergia = data !== '' ? parseInt(data) : 0;
    })
  }

  onCrearNuevaEnergia() {
    this.alertDialog.confirmAlert('Crear nueva energía', '¿Está seguro de crear la energía?').then(res => {
      if (res.isConfirmed) {
        this.spinner.show();
        let nombreEnergia = this.nuevaEnergiaForm.get('nombreEnergia').value;
        let cantidadEnergia = this.nuevaEnergiaForm.get('cantidadEnergia').value;
        this.generadorContract.postCrearNuevaEnergia(nombreEnergia, cantidadEnergia).subscribe(
          {
            next: () => {
              this.spinner.hide();
              this.dialogRef.close();
              this.toastr.success('¡Energía agregada con éxito!');
            },
            error: (err) => {
              this.spinner.hide();
              console.log(err);
              this.toastr.error(err.message, 'Error');
              this.dialogRef.close();
            }
          }
        );
      }
    })
  }

  onInyectarEnergia() {
    this.alertDialog.confirmAlert('Inyectar energía', '¿Está seguro de inyectar la energía?').then(res => {
      if (res.isConfirmed) {
        this.spinner.show();
        let nombreEnergia = this.nuevaEnergiaForm.get('nombreEnergia').value;
        let cantidadEnergia = this.nuevaEnergiaForm.get('cantidadEnergia').value;
        const dirPlanta = this.data.hashPlanta;
        this.generadorContract.postInyectarEnergiaPlanta(dirPlanta, nombreEnergia, cantidadEnergia).subscribe({
          next: () => {
            this.spinner.hide();
            this.dialogRef.close();
            this.toastr.success('¡Energía agregada con éxito!');
          }, error: (err) => {
            this.spinner.hide();
            console.log(err);
            this.toastr.error(err.message, 'Error');
            this.dialogRef.close();
          }
        });
      }
    });
  }

  get isValid(): boolean {
    if (this.cantidadActual + this.cantidadEnergia <= this.capacidadNominal && this.cantidadEnergia > 0) {
      return true;
    } else {
      return false;
    }
  }

  onCancelar(){
    this.dialogRef.close();
  }
}
