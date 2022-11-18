import { ComercializadorContractService } from './../../services/comercializador-contract.service';
import { Component, OnInit } from '@angular/core';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { InfoContrato } from 'src/app/models/infoContrato';

@Component({
  selector: 'app-comercializador',
  templateUrl: './comercializador.component.html',
  styles: [
  ]
})
export class ComercializadorComponent implements OnInit {
  infoCliente: InfoContrato;

  constructor(private comercializadorService: ComercializadorContractService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService) { }

  async ngOnInit(): Promise<void> {
    let dirContract = localStorage.getItem('dirContract');
    try {
      await this.comercializadorService.loadBlockChainContractData(dirContract);
      this.comercializadorService.getInfoContrato().subscribe({
        next: (info) => {
          this.infoCliente = info;
        }, error: (err) => {
          console.log(err);
          this.toastr.error('Error al cargar la información del contrato', 'Error');
        }
      });
    } catch (error) {
      console.log(error);
      this.toastr.error("Error al cargar el contrato comercializador", 'Error');
    }
  }

}
