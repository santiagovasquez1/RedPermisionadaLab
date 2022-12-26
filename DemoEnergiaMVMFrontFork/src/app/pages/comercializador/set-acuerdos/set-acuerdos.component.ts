import { UntypedFormGroup, UntypedFormBuilder, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { InfoEnergia } from 'src/app/models/InfoEnergia';
import { ComercializadorContractService } from 'src/app/services/comercializador-contract.service';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { InfoContrato } from 'src/app/models/infoContrato';
import { SolicitudContrato } from 'src/app/models/solicitudContrato';

@Component({
  selector: 'app-set-acuerdos',
  templateUrl: './set-acuerdos.component.html'
})
export class SetAcuerdosComponent implements OnInit {

  tokensDelegados: number;
  comprarEnergiaForm: FormGroup
  tiposEnergia: InfoEnergia[] = [];
  tiposEnergiaAux: string[] = ['solar','eolica'];
  generadores: SolicitudContrato[];
  dirGenerador: any;
  infoCliente: InfoContrato;

  constructor(public dialogRef: MatDialogRef<SetAcuerdosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService,
    private clienteService: ClienteContractService,
    private comercializadorService: ComercializadorContractService,
    private regulardorMercado: ReguladorMercadoService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private bancoEnergia: BancoEnergiaService) {
    this.tokensDelegados = this.data.tokensDelegados;
    this.initForm();
  }

  async ngOnInit(): Promise<void> {
    try {
      console.log("DATA EN ONINIT: ",this.data.emision)

      this.getInfoGeneradores();

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
      this.comprarEnergiaForm.get('generador').valueChanges.subscribe({
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
    let generador = this.comprarEnergiaForm.get('generador').value == '' ? null : this.comprarEnergiaForm.get('generador').value;
    console.log("SELECCIONÓ EL GENERADOR: ",generador)
    this.dirGenerador = generador;

    let cantidadEnergia = this.comprarEnergiaForm.get('cantidadEnergia').value == '' ? 0 : this.comprarEnergiaForm.get('cantidadEnergia').value;
    let fechaFin = this.comprarEnergiaForm.get('fechaFin').value == '' ? 0 : this.comprarEnergiaForm.get('fechaFin').value;

    console.log(fechaFin)
    if (cantidadEnergia > 0 && generador) {
      let precioEnergia = generador.precio * cantidadEnergia;
      this.comprarEnergiaForm.get('valorCompra').setValue(precioEnergia);
    }
  }

  initForm() {
    this.comprarEnergiaForm = this.fb.group({
      generador: ['', Validators.required],
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

          let _dirCliente: string = '0x19340ba17d7E375c37C36Bf349835FE930E329F8';
          let _indexGlobal: number = 0;

          console.log("THIS GENERADOR ENVIADO: ",this.dirGenerador.infoContrato.dirContrato)
          console.log("this.data.emision.dirCliente: ",this.data.emision.dirCliente)
          console.log("this.data.emision.indexGlobal: ",this.data.emision.indexGlobal)
      
          this.comercializadorService.realizarAcuerdo(this.dirGenerador.infoContrato.dirContrato, this.data.emision.dirCliente,this.data.emision.indexGlobal).subscribe({
            next: (data) => {
              console.log("DATA: ",data)
              this.toastr.success("El cuerdo se ha concretado con el generador.","Transacción exitosa!");
              this.spinner.hide();
              this.dialogRef.close();
            }, error: (error) => {
              console.log(error);
              this.toastr.error(error.message, 'Error');
              this.spinner.hide();
            }
          });
        }
      });
  }

  onCancelar() {
    this.dialogRef.close();
  }

  private getInfoGeneradores() {
    this.regulardorMercado.getSolicitudesRegistro().subscribe({
      next: (data) => {
        let filterData = data as SolicitudContrato[];
        this.generadores = filterData.filter(item => item.tipoContrato == 2);
        console.log("FILTRO GENERADOR: ",this.generadores)
      }, error: (err) => {
        console.log(err);
        this.toastr.error(err.message, 'Error');
      }
    });
  }

  get isComprarValid(): boolean {
    let cantidadCompra = this.comprarEnergiaForm.get('cantidadEnergia').value;
    let valorCompra = this.comprarEnergiaForm.get('valorCompra').value;
    let infoEnergia = this.comprarEnergiaForm.get('generador').value as InfoEnergia;
    return this.comprarEnergiaForm.valid && valorCompra <= this.data.tokensDelegados && cantidadCompra <= infoEnergia.cantidadEnergia;
  }

}







