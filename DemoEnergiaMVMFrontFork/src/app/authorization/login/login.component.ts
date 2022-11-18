import { CertificadorContractService } from './../../services/certificador-contract.service';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Web3ConnectService } from 'src/app/services/web3-connect.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  constructor(private web3Service: Web3ConnectService,
    private regulardorMercado: ReguladorMercadoService,
    private certificador:CertificadorContractService,
    private spinnerService: NgxSpinnerService,
    private toastr: ToastrService,
    private router: Router
  ) { }

  async onLogin() {
    try {
      this.spinnerService.show();
      await this.web3Service.loadWeb3();
      await this.regulardorMercado.loadBlockChainContractData();
      await this.certificador.loadBlockChainContractData('');
      this.regulardorMercado.validarUsuario().subscribe({
        next: (data) => {
           if (data[0]) {
            this.spinnerService.hide();
            localStorage.setItem('dirContract', data[1]);
            localStorage.setItem('tipoAgente', data[2]);
            this.router.navigate(['/dashboard']);
          } else {
            this.spinnerService.hide();
            this.router.navigate(['/register']);
          }
        }, error: (err) => {
          console.log(err);
          this.spinnerService.hide();
          this.toastr.error('Error al validar usuario', 'Error');
        }
      });
    } catch (error) {

      this.spinnerService.hide();
      this.toastr.error(error.message, 'Error');
    }

  }

}

