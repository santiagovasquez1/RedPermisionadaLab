import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, forkJoin, from, of } from 'rxjs';
import { InfoContrato } from 'src/app/models/infoContrato';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';

@Component({
  selector: 'app-tokens-cliente',
  templateUrl: './tokens-cliente.component.html',
  styles: [
  ]
})
export class TokensClienteComponent implements OnInit, OnDestroy {
  infoCliente: InfoContrato;
  tokensCliente: number = 0;
  tokensDelegados: number = 0;
  tokensMercado: number = 0;
  compraEnergiaEvent: any;

  tokensComprar: number | string = '';
  tokensDelegar: number | string = '';
  tokensCambiar: number | string = '';

  constructor(private clienteService: ClienteContractService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private reguladorMercado: ReguladorMercadoService,
    private bancoEnergia: BancoEnergiaService,
    private ngZone: NgZone,
    private alertDialog: SweetAlertService) { }

  async ngOnInit(): Promise<void> {
    try {
      let dirContract = localStorage.getItem('dirContract');
      this.spinner.show();
      let promises: Promise<void>[] = []
      promises.push(this.reguladorMercado.loadBlockChainContractData());
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.clienteService.loadBlockChainContractData(dirContract));
      await Promise.all(promises);
      this.spinner.hide();
      this.getInfoContrato();
      //TODO: EVENTO ELIMINADO DE BACKEND
      // this.compraEnergiaEvent = this.clienteService.contract.events.compraEnergia({
      //   fromBlock: 'latest'
      // }, (error, event) => {
      //   if (error) {
      //     console.log(error);
      //     this.toastr.error(error.message, 'Error');
      //   }
      // }).on('data', () => {
      //   this.ngZone.run(() => {
      //     this.toastr.success('Compra de energía realizada', 'Energía');
      //     this.getInfoContrato();
      //   });
      // });
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }

  }

  ngOnDestroy(): void {
    this.compraEnergiaEvent.removeAllListeners();
  }

  getInfoContrato() {
    
    this.clienteService.getInfoContrato().subscribe({
      next: (data) => {
        this.infoCliente = data;
        console.log("THIS.NFO.CLIENTE: ",this.infoCliente)
        let observables: Observable<number>[] = [];
        observables.push(this.clienteService.getMisTokens());
        if (this.infoCliente.comercializador !== '0x0000000000000000000000000000000000000000') {
          // TODO: CAMBIAR LA QUEMA DE DATOS
          observables.push(this.reguladorMercado.getTokensDelegados(this.infoCliente.comercializador,this.infoCliente.owner));
        } else {
          observables.push(of(0));
        }
        observables.push(this.reguladorMercado.getTokensDisponibles());

        forkJoin(observables).subscribe({
          next: (data: number[]) => {
            console.log("DATA TOKENS: ",data)
            this.tokensCliente = data[0] - data[1];
            this.tokensDelegados = data[1];
            this.tokensMercado = data[2];
          },
          error: (error) => {
            console.log(error);
            this.toastr.error(error.message, 'Error');
          }
        });
      },
      error: (error) => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
      }
    });
  }

  get isComprarValid(): boolean {
    if (this.tokensComprar > 0 && this.tokensComprar !== '' && this.tokensComprar <= this.tokensMercado) {
      return true
    } else {
      return false;
    }
  }

  get isDelegarValid(): boolean {
    if (this.tokensDelegar > 0 && this.tokensDelegar !== '' && this.tokensDelegar <= this.tokensCliente + this.tokensDelegados && this.infoCliente.comercializador !== '0x0000000000000000000000000000000000000000') {
      return true;
    } else {
      return false;
    }
  }

  get isDevolverValid(): boolean {
    if (this.tokensCambiar > 0 && this.tokensCambiar !== '' && this.tokensCambiar <= this.tokensCliente) {
      return true;
    } else {
      return false;
    }
  }

  onComprar() {
    this.alertDialog.confirmAlert('Confirmar compra', `¿Deseas continuar con la compra de  ${this.tokensComprar} tokens?`).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        const tokensComprar = typeof this.tokensComprar == 'string' ? parseInt(this.tokensComprar) : this.tokensComprar
        this.reguladorMercado.postComprarTokens(tokensComprar).subscribe({
          next: () => {
            this.spinner.hide();
            this.toastr.success('Compra realizada con éxito', 'Éxito');
            this.tokensComprar = '';
            this.getInfoContrato();
          }, error: (error) => {
            this.spinner.hide();
            console.log(error);
            this.toastr.error(error.message, 'Error');
          }
        })
      }
    })
  }

  onDelegar() {
    this.alertDialog.confirmAlert('Confirmar delegación', `¿Desea continuar con la delegacion de ${this.tokensDelegar} tokens?`).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        let tokensDelegados = typeof this.tokensDelegar == 'string' ? parseInt(this.tokensDelegar) : this.tokensDelegar;
        let delegateAddress = this.infoCliente.comercializador;
        this.reguladorMercado.postDelegarTokens(delegateAddress, tokensDelegados).subscribe({
          next: () => {
            this.spinner.hide();
            this.toastr.success('Delegación realizada con éxito', 'Éxito');
            this.tokensDelegar = '';
            this.getInfoContrato()
          }
        })
      }
    }).catch((error) => {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    });
  }

  onCambiar() {
    this.alertDialog.confirmAlert('Confirmar devolución', `¿Desea continuar con el cambio de ${this.tokensCambiar} tokens?`).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        let tokensCambiar = typeof this.tokensCambiar == 'string' ? parseInt(this.tokensCambiar) : this.tokensCambiar;
        this.reguladorMercado.postDevolverTokens(tokensCambiar).subscribe({
          next: () => {
            this.spinner.hide();
            this.toastr.success('Tokens devueltos correctamente', 'Éxito');
            this.tokensCambiar = '';
            this.getInfoContrato();
          },
          error: (error) => {
            console.log(error);
            this.toastr.error(error.message, 'Error');
            this.spinner.hide();
          }
        });
      }
    });
  }
}
