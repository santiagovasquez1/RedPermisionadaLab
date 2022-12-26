import { UntypedFormGroup, UntypedFormBuilder, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { InfoEnergia } from 'src/app/models/InfoEnergia';
import { GeneradorContractService } from 'src/app/services/generador-contract.service';

@Component({
  selector: 'app-fijar-precios',
  templateUrl: './fijar-precios.component.html'
})
export class FijarPreciosComponent implements OnInit {

  tokensDelegados: number;
  comprarEnergiaForm: FormGroup
  tiposEnergia: InfoEnergia[] = [];

  constructor(public dialogRef: MatDialogRef<FijarPreciosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService,
    private clienteService: ClienteContractService,
    private generadorContract: GeneradorContractService,
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
    } catch (error) {
      console.log(error);
      this.toastr.error('Error al cargar los datos', error.message);
    }
  }

  private onEnergiaChange() {

  }

  initForm() {
    this.comprarEnergiaForm = this.fb.group({
      valorEnergia: ['', Validators.required],
    });
  }

  onFijarPrecio() {
    this.alertDialog.confirmAlert('Confirmar', '¿Está seguro de que desea fijar el precio?')
      .then((result) => {
        if (result.isConfirmed) {
          this.spinner.show();
          let precioEnergia = this.comprarEnergiaForm.get('valorEnergia').value;
          if(this.data.setPrecio == 'bolsa'){
            this.bancoEnergia.setPrecioVentaEnergia(precioEnergia).subscribe({
              next: () => {
                this.spinner.hide();
                this.toastr.success('Fijación de precio', 'Éxito');
                this.dialogRef.close();
                this.bancoEnergia.getPrecioVentaEnergia().subscribe({
                  next: (data) => {
                    this.spinner.hide();
                    this.dialogRef.close();
                  }, error: (error) => {
                    this.spinner.hide();
                    this.toastr.error(error.message, 'Error');
                  }
                });
              },error: (error) => {
                this.spinner.hide();
                this.toastr.error(error.message, 'Error');
              }
            });


          }
          else if(this.data.setPrecio == 'generador'){
            this.generadorContract.setPrecioEnergia(precioEnergia).subscribe({
              next: () => {
                this.spinner.hide();
                this.toastr.success('Fijación de precio', 'Éxito');
                this.dialogRef.close();
              }, error: (error) => {
                this.spinner.hide();
                this.toastr.error(error.message, 'Error');
              }
            });
          }

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
