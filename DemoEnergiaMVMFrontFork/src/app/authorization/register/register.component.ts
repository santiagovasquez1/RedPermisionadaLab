import { FormfieldValidatorService } from '../../services/shared/formfield-validator.service';
import { MunicipioInfo } from './../../models/municipioInfo';
import { MunicipiosService } from './../../services/municipios.service';
import { EstadoSolicitud, SolicitudContrato } from './../../models/solicitudContrato';
import { ToastrService } from 'ngx-toastr';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  agentesMercado: any = [{
    tipo: 'Agente Cliente',
    id: 0
  }, {
    tipo: 'Agente Comercializador',
    id: 1
  }, {
    tipo: 'Agente Generador',
    id: 2
  }]

  tiposCoComercializador: any[] = [
    {
      id: 0,
      tipo: 'Cliente'
    },
    {
      id: 1,
      tipo: 'Generador'
    }
   ] //TODO:Comercializador solo para cliente, no necesita tipo

  agenteMercado: number = 0;
  departamentos: string[] = [];
  municipiosDepartamento: string[] = [];
  municipiosInfo: MunicipioInfo[] = [];
  registroForm: UntypedFormGroup;
  constructor(private fb: UntypedFormBuilder,
    private reguladorMercado: ReguladorMercadoService,
    private toastr: ToastrService,
    private router: Router,
    private spinnerService: NgxSpinnerService,
    private municipioService: MunicipiosService,
    public formfieldValidator:FormfieldValidatorService) {
    this.registroForm = this.fb.group({});
  }

  async ngOnInit(): Promise<void> {
    this.initRegistroForm();
    await this.reguladorMercado.loadBlockChainContractData();
    this.municipioService.getMunicipios().subscribe({
      next: (res) => {
        this.municipiosInfo = res;
        this.departamentos = res.map(item => item.departamento).filter((value, index, self) => self.indexOf(value) === index);
      }, error: (err) => {
        console.log(err);
        this.toastr.error('Error al cargar los municipios', 'Error');
      }
    });
  }

  initRegistroForm() {
    this.registroForm = this.fb.group(
      {
        tipoAgente: ['', Validators.required],
        nit: ['', Validators.required],
        empresa: ['', Validators.required],
        contacto: ['', Validators.required],
        telefono: ['', Validators.required],
        correo: ['', [Validators.required, Validators.email]],
        departamento: ['', Validators.required],
        ciudad: [{ value: '', disabled: true }, Validators.required],
        direccion: ['', Validators.required],
      }
    );

    this.registroForm.get('tipoAgente').valueChanges.subscribe({
      next: (tipoAgente) => {
        this.agenteMercado = parseInt(tipoAgente);
        if (this.agenteMercado == 1) {
          this.registroForm.addControl('tipoComercio', this.fb.control('', Validators.required));
        } else {
          this.registroForm.removeControl('tipoComercio');

        }
      }
    })

    this.registroForm.get('departamento').valueChanges.subscribe(
      (departamento) => {
        this.registroForm.get('ciudad').setValue('');
        this.municipiosDepartamento = this.municipiosInfo.filter(item => item.departamento == departamento).map(item => item.municipio);
        this.registroForm.get('ciudad').enable();
      }
    );
  }

  onTipoComercializadorChange() {
    if (this.agenteMercado == 1) {
      this.registroForm.addControl('tipoComercio', this.fb.control('', Validators.required));
    } else {
      this.registroForm.removeControl('tipoComercio');
    }
  }

  onSubmit() {
    this.spinnerService.show();
    let solicitudContrato: SolicitudContrato = {
      tipoContrato: this.agenteMercado as TiposContratos,
      infoContrato: {
        nit: this.registroForm.value.nit,
        empresa: this.registroForm.value.empresa,
        contacto: this.registroForm.value.contacto,
        telefono: this.registroForm.value.telefono,
        correo: this.registroForm.value.correo,
        departamento: this.registroForm.value.departamento,
        ciudad: this.registroForm.value.ciudad,
        direccion: this.registroForm.value.direccion,
        owner: localStorage.getItem('account'),
        comercializador: '0x0000000000000000000000000000000000000000',
        dirContrato: '0x0000000000000000000000000000000000000000',
        tipoContrato: parseInt(this.registroForm.value.tipoAgente) as TiposContratos
      },
      estadoSolicitud: EstadoSolicitud.pendiente,
      fechaAprobacion: '',
      fechaSolicitud: ''
    }

    this.reguladorMercado.postRegistrarSolicitud(solicitudContrato.infoContrato, solicitudContrato.tipoContrato).subscribe({
      next: (res) => {
        this.spinnerService.hide();
        this.toastr.success('Solicitud enviada correctamente');
        this.router.navigate(['/login']);
      }, error: (err) => {
        this.spinnerService.hide();
        console.log(err);
        this.toastr.error('Error al enviar la solicitud');
        this.router.navigate(['/register']);
      }
    })
  }
}
