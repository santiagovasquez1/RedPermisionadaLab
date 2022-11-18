import { EstadoPlanta, InfoPlantaEnergia } from './../../../models/InfoPlantaEnergia';
import { NgxSpinnerService } from 'ngx-spinner';
import { SweetAlertService } from './../../../services/sweet-alert.service';
import { ToastrService } from 'ngx-toastr';
import { FormGroup, FormBuilder, Validators, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { GeneradorContractService } from 'src/app/services/generador-contract.service';
import moment from 'moment';
import { MunicipiosService } from 'src/app/services/municipios.service';
import { MunicipioInfo } from 'src/app/models/municipioInfo';

@Component({
  selector: 'app-plantas-energia',
  templateUrl: './plantas-energia.component.html',
  styles: [
  ]
})
export class PlantasEnergiaComponent implements OnInit {
  title: string = 'Crear planta de energía';
  plantaEnergiaForm: FormGroup;
  departamentos: string[] = [];
  municipiosDepartamento: string[] = [];
  municipiosInfo: MunicipioInfo[] = [];
  energiasDisponibles: string[] = [];

  constructor(public dialogRef: MatDialogRef<PlantasEnergiaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private generadorContract: GeneradorContractService,
    private toastr: ToastrService,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService,
    private municipioService: MunicipiosService) {
    this.plantaEnergiaForm = this.fb.group({});
    this.energiasDisponibles = this.data.energiasDisponibles;
  }

  async ngOnInit(): Promise<void> {
    try {
      this.initForm();
      await this.generadorContract.loadBlockChainContractData(this.data.dirContract);
      this.municipioService.getMunicipios().subscribe({
        next: (res) => {
          this.municipiosInfo = res;
          this.departamentos = res.map(item => item.departamento).filter((value, index, self) => self.indexOf(value) === index);
        }
      });
    } catch (error) {
      this.toastr.error(error.message, 'Error');
      this.dialogRef.close();
    }
  }

  initForm() {
    this.plantaEnergiaForm = this.fb.group({
      nombre: ['', Validators.required],
      departamento: ['', Validators.required],
      ciudad: [{ value: '', disabled: true }, Validators.required],
      coordenadas: ['', Validators.required],
      tasaEmision: ['', Validators.required],
      isRec: [true, Validators.required],
      tipoEnergia: ['', Validators.required],
      capacidadNominal: ['', Validators.required],
      estado: ['', Validators.required]
    });

    this.plantaEnergiaForm.get('departamento').valueChanges.subscribe((departamento) => {
      this.plantaEnergiaForm.get('ciudad').reset();
      this.municipiosDepartamento = this.municipiosInfo.filter(item => item.departamento === departamento).map(item => item.municipio);
      this.plantaEnergiaForm.get('ciudad').enable();
    });
  }

  onCreatePlantaEnergia() {
    this.alertDialog.confirmAlert('Crear planta de energía', '¿Estás seguro de crear la planta de energía?').then(res => {
      if (res.isConfirmed) {
        this.spinner.show();
         
        const tempInfo: InfoPlantaEnergia = {
          dirPlanta: '0x0000000000000000000000000000000000000000',
          nombre: this.plantaEnergiaForm.get('nombre').value,
          departamento: this.plantaEnergiaForm.get('departamento').value,
          ciudad: this.plantaEnergiaForm.get('ciudad').value,
          coordenadas: this.plantaEnergiaForm.get('coordenadas').value,
          fechaInicio: '0',
          tasaEmision: this.plantaEnergiaForm.get('tasaEmision').value,
          isRec: true,
          capacidadNominal: this.plantaEnergiaForm.get('capacidadNominal').value,
          tecnologia: this.plantaEnergiaForm.get('tipoEnergia').value,
          cantidadEnergia: 0,
          estado: this.plantaEnergiaForm.get('estado').value as EstadoPlanta
        }

        this.generadorContract.postGenerarPlantaEnergia(tempInfo).subscribe({
          next: () => {
            this.spinner.hide();
            this.toastr.success('Planta de energía creada con éxito');
            this.dialogRef.close(true);
          }, error: (err) => {
            console.log(err);
            this.spinner.hide();
            this.toastr.error('Error al crear la planta de energía');
            this.dialogRef.close();
          }
        })
      }
    })
  }

}
