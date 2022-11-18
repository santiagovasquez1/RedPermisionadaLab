import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Console } from 'console';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subscription, timer } from 'rxjs';
import { SolicitudContrato } from 'src/app/models/solicitudContrato';
import { FactoryService } from 'src/app/services/factory.service';
import { GeneradorFactoryService } from 'src/app/services/generador-factory.service';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { GenerarEnergiaComponent } from 'src/app/shared/generar-energia/generar-energia.component';

@Component({
  selector: 'app-ver-generadores',
  templateUrl: './ver-generadores.component.html',
  styleUrls: ['./ver-generadores.component.css']
})
export class VerGeneradoresComponent implements OnInit, OnDestroy {

  generadores: string[] = [];
  dirContratos: string[] = [];
  dirGeneradores: string[] = [];
  registros: SolicitudContrato[] = [];
  infoGenerador: {};
  message: string;
  timer$: Observable<any>;
  timerSubscription: Subscription;
  account: string;


  constructor(
    public dialog: MatDialog,
    private toastr: ToastrService,
    private generadorService: GeneradorFactoryService,
    private spinnerService: NgxSpinnerService,
    private regulardorMercado: ReguladorMercadoService ) { 
    this.timer$ = timer(0, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  async ngOnInit(): Promise<void> {
    this.account = localStorage.getItem('account');
    try {
        await this.generadorService.loadBlockChainContractData();
        //this.timerSubscription = this.timer$.subscribe(() => {
          this.regulardorMercado.getContratosRegistrados().subscribe({
          next: data => {
            this.registros = data;
            console.log(data);
            this.dataGenerador();
          },
          error: err => {
            console.log(err);
            this.toastr.error('Error al cargar los generadores', 'Error');
          }
        });
      //});
      }
      catch (error) {
        console.log(error);
        this.toastr.error('Error al cargar el contrato', 'Error');
      }

  }

  dataGenerador(): void {
    //this.registros.filter();
    this.infoGenerador = this.registros.find(element => element.infoContrato.owner == "0x83c10b685ddc3560B3a1e84eBc8D1367C468893B")
    console.log(this.infoGenerador);
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(GenerarEnergiaComponent, {});
    dialogRef.afterClosed().subscribe(res => {
      console.log(res);
    })
  }

}
