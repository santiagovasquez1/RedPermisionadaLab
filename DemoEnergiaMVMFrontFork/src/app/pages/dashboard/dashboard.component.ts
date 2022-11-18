import { Contract } from 'web3-eth-contract';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { ComercializadorContractService } from './../../services/comercializador-contract.service';
import { Observable, forkJoin, Subscription, timer } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  numTokensDisponibles: number = 0;
  solicutudesRegistro: any[] = [];
  timer$: Observable<any>;
  timerSubscription: Subscription;
  contadorActual: number = 0;
  contadorAnterior: number = 0;

  constructor(private reguladorService: ReguladorMercadoService,
    private toastr: ToastrService,
    private spinnerService: NgxSpinnerService,
    private comercializador: ComercializadorContractService,
    private cliente: ClienteContractService) {
    this.timer$ = timer(0, 1000);
  }
  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  async ngOnInit() {
    try {
      await this.reguladorService.loadBlockChainContractData();
      let tipoAgente = parseInt(localStorage.getItem('tipoAgente')) as TiposContratos;
      let dirContract = localStorage.getItem('dirContract');
      switch (tipoAgente) {
        case TiposContratos.Comercializador:
          await this.comercializador.loadBlockChainContractData(dirContract);
          this.ContratosClientesMonitor();
          break;
        case TiposContratos.Cliente:
          await this.cliente.loadBlockChainContractData(dirContract);
          break;
        case TiposContratos.Generador:
          break;
      }
    } catch (error) {
      console.log(error);
      this.toastr.error("Error al cargar contratos", 'Error');
    }
  }


  private ContratosClientesMonitor() {
    this.comercializador.contract.events.EmisionDeCompra({
      fromBlock: 'latest'
    }, (err, event) => {
      if(err){
        console.log(err);
        this.toastr.error(err.message, 'Error');
      }else{
        console.log(event);
        this.toastr.success('Emisión de compra realizada', 'Éxito');
      }
    });
  }
}
