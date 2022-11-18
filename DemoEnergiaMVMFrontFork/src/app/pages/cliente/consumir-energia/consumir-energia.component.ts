import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';

@Component({
  selector: 'app-consumir-energia',
  templateUrl: './consumir-energia.component.html',
  styles: [
  ]
})
export class ConsumirEnergiaComponent implements OnInit {

  energiasDisponibles: string[];
  cantidadesDisponibles: number[];
  energiaSeleccionada: string;
  cantidadSeleccionada: number;
  consumoForm: FormGroup;

  constructor(public dialogRef: MatDialogRef<ConsumirEnergiaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService,
    private clienteService: ClienteContractService,
    private toastr: ToastrService,
    private fb: UntypedFormBuilder) {
    this.energiasDisponibles = this.data.energiasDisponibles;
    this.cantidadesDisponibles = this.data.cantidadesDisponibles;
    this.consumoForm = this.fb.group({});
  }

  async ngOnInit(): Promise<void> {
    this.initForm();
    await this.clienteService.loadBlockChainContractData(this.data.dirContrato);
  }

  initForm() {
    this.consumoForm = this.fb.group({
      energia: ['', Validators.required],
      cantidadDisponible: [{ value: '', disabled: true }],
      cantidad: ['', Validators.required]
    })

    this.consumoForm.get('energia').valueChanges.subscribe(data => {
      this.energiaSeleccionada = data;
      if (this.energiaSeleccionada !== '') {
        const index = this.energiasDisponibles.findIndex(item => item === this.energiaSeleccionada);
        this.consumoForm.patchValue({
          cantidadDisponible : this.cantidadesDisponibles[index]
        });
      } else {
        this.consumoForm.patchValue({
          cantidadDisponible : ''
        });
      }
    });
    this.consumoForm.get('cantidad').valueChanges.subscribe(data => {
      this.cantidadSeleccionada = data !== '' ? parseInt(data) : 0;
    });
  }

  onConsumirEnergia() {
    this.alertDialog.confirmAlert('Confirmar', '¿Está seguro de que desea consumir energía?')
      .then((result) => {
        if (result.isConfirmed) {
          this.spinner.show();
          this.clienteService.postConsumirEnergia(this.energiaSeleccionada, this.cantidadSeleccionada).subscribe({
            next: () => {
              this.spinner.hide();
              this.toastr.success(`Consumo de ${this.cantidadSeleccionada}MWh de ${this.energiaSeleccionada}`, 'Éxito');
              this.dialogRef.close();
            },
            error: (error) => {
              this.spinner.hide();
              this.toastr.error(error.message, 'Error');
              this.dialogRef.close();
            }
          })
        }
      });
  }

  get isValid(): boolean {
    const index = this.energiasDisponibles.findIndex(item => item === this.energiaSeleccionada);
    if (this.cantidadSeleccionada <= this.cantidadesDisponibles[index] && this.cantidadSeleccionada > 0 && this.consumoForm.valid) {
      return true;
    } else {
      return false;
    }
  }
}
