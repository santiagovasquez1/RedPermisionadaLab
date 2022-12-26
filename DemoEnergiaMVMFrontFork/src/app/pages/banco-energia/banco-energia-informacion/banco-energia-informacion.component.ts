import { Observable, Subscription, timer } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InfoEnergia } from 'src/app/models/InfoEnergia';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { FijarPreciosComponent } from '../../generador/fijar-precios/fijar-precios.component';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-banco-energia-informacion',
  templateUrl: './banco-energia-informacion.component.html'
})
export class BancoEnergiaInformacionComponent implements OnInit, OnDestroy {

  energiasDisponibles: InfoEnergia[] = [];
  energiaChangeEvent: any;
  panelOpenState = false;
  tipoAgente:string;
  dirContract:string;
  precioEnergia: number;

  constructor(private bancoEnergia: BancoEnergiaService,
    private toastr: ToastrService,
    private ngZone: NgZone,
    public dialog: MatDialog,
    private spinner: NgxSpinnerService,) {

  }

  async ngOnInit(): Promise<void> {
    try {
      this.dirContract = localStorage.getItem('dirContract');
      this.tipoAgente = localStorage.getItem('tipoAgente');
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

    this.loadPrecioVenta();
  }

  ngOnDestroy(): void {

      this.energiaChangeEvent.removeAllListeners('data');
  }

  changeBanco(mapa){

  }

  loadPrecioVenta(){
    this.bancoEnergia.getPrecioVentaEnergia().subscribe({
      next: (data) => {
        this.spinner.hide();
        this.precioEnergia = data;
      }, error: (error) => {
        this.spinner.hide();
        this.toastr.error(error.message, 'Error');
      }
    });
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

  onFijarPrecios(){
    const dialogRef = this.dialog.open(FijarPreciosComponent, {
      width: '500px',
      data: {
        dirContract: this.dirContract,
        energiasDisponibles: this.energiasDisponibles,
        setPrecio: 'bolsa'
      }
    });

    dialogRef.afterClosed().subscribe({
      next:()=>{
        this.loadPrecioVenta()
      }
    })
  }

}
