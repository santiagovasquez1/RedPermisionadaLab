import { Observable, Subscription, timer } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InfoEnergia } from 'src/app/models/InfoEnergia';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';

@Component({
  selector: 'app-banco-energia-informacion',
  templateUrl: './banco-energia-informacion.component.html'
})
export class BancoEnergiaInformacionComponent implements OnInit, OnDestroy {

  energiasDisponibles: InfoEnergia[] = [];
  energiaChangeEvent: any;
  panelOpenState = false;

  constructor(private bancoEnergia: BancoEnergiaService,
    private toastr: ToastrService,
    private ngZone: NgZone) {

  }

  async ngOnInit(): Promise<void> {
    try {
      let promises: Promise<void>[] = [];
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      await Promise.all(promises);
      
      this.energiaChangeEvent = this.bancoEnergia.contract.events.cambioDeEnergia({
        fromBlock: 'latest'
      }, (error, event) => {
        if (error) {
          console.log(error);
          this.toastr.error(error.message, 'Error')
        }
      }).on('data', (event) => {
        this.ngZone.run(() => {
          this.setCantidadEnergiaInfo();
        })
      });
      this.setCantidadEnergiaInfo();
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }

  ngOnDestroy(): void {

      this.energiaChangeEvent.removeAllListeners('data');
  }

  changeBanco(mapa){

  }

  private setCantidadEnergiaInfo() {
    this.bancoEnergia.getTiposEnergiasDisponibles().subscribe({
      next: (data) => {
        this.energiasDisponibles = data;
      },
      error: (error) => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
      }
    });
  }

  onFijarPrecios() {
    
  }

}
