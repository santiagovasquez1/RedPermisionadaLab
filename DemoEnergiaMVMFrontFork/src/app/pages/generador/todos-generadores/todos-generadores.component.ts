import { Component, OnInit, ViewChild } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { delay, elementAt, forkJoin, Observable, Subscription, timer } from 'rxjs';
import { SolicitudContrato } from 'src/app/models/solicitudContrato';
import { FactoryService } from 'src/app/services/factory.service';

import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { Chart, ChartConfiguration, ChartEvent, ChartType,ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import {default as Annotation} from '../../../../../node_modules/chartjs-plugin-annotation';
import DatalabelsPlugin from '../../../../../node_modules/chartjs-plugin-datalabels';
import { EthereumService } from 'src/app/services/dashboard/ethereum.service';

import { MatTable, MatTableDataSource } from '@angular/material/table';

import { MatSort } from '@angular/material/sort';
import { InfoEnergia } from '../../../models/InfoEnergia'
import { InfoPlantaEnergia } from 'src/app/models/InfoPlantaEnergia';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { GeneradorContractService } from 'src/app/services/generador-contract.service';
import { TableService } from 'src/app/services/shared/table-service.service';
import { MatPaginator } from '@angular/material/paginator';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { InfoContrato } from 'src/app/models/infoContrato';
import { ColsTablaGeoreferencia } from 'src/app/models/ColsTablaGeoreferencia';
import { BREAKPOINT } from '@angular/flex-layout';

export interface PeriodicElement {
  nombre: string;

}

const ELEMENT_DATA: PeriodicElement[] = [
  {nombre: 'EPM'},
  {nombre: 'ELECTROHUILA'},
  {nombre: 'EMCALI'},
  {nombre: 'CELSIA'},
  {nombre: 'AES'}
];



@Component({
  selector: 'app-todos-generadores',
  templateUrl: './todos-generadores.component.html'
})

export class TodosGeneradoresComponent implements OnInit {

  generadores: string[] = [];
  dirContratos: string[] = [];
  dirGeneradores: string[] = [];
  registros: SolicitudContrato[] = [];
  message: string;
  timer$: Observable<any>;
  timerSubscription: Subscription;
  account: string;
  infoGenerador: SolicitudContrato = {} as SolicitudContrato;
  todoGeneradores: SolicitudContrato[] = [];
  todoClientes: any[] = [];
  tipoMapa = 'Plantas de energía';
  agentes = [];
  plantasAux = [];
  flag = true;
  flagClientesLoad = true;
  flagGeneradoresLoad = true;
  loadPlantas = false;
  plantasFiltro= [];
  infoCliente: InfoContrato;
  cantidadesDisponibles: number[] = [];
  totalEnergiasClientes = [];
  cantEnergiaClientesTorta = [];

  
  plantasDeEnergia: InfoPlantaEnergia[] = [];
  dirContract: string;
  energiasDisponibles: string[] = [];
  
  titlte = "titulo desde generadores";
  departamento = "Antioquia";
  panelOpenState = false;

  displayedColumns: string[] = ['nombre','ciudad','tecnologia','cantidadEnergia','capacidadNominal','tasaEmision']
  dataSource: MatTableDataSource<ColsTablaGeoreferencia>
  @ViewChild('table', { static: true }) table: MatTable<PeriodicElement>;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  sort: MatSort;

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  
  
  // displayedColumns: string[] = ['nombre'];
  // // dataSource = ELEMENT_DATA;
  // dataSource:any;
  

  // Pie
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      datalabels: {
        formatter: (value, ctx) => {
          if (ctx.chart.data.labels) {
            return ctx.chart.data.labels[ctx.dataIndex];
          }
        },
      },
    }
  };

  getData(): Array<number>{
    var data = []
    var cantidadSolar = 0;
    var cantidadEolica = 0;
    for (let i = 0; i < this.plantasFiltro.length; i++) {

      switch(this.plantasFiltro[i].tecnologia){
        case 'Solar':
          cantidadSolar = cantidadSolar + this.plantasFiltro[i].cantidadEnergia;
          break;
        case 'Eólica':
          cantidadEolica = cantidadEolica + this.plantasFiltro[i].cantidadEnergia;
      }
      
    }
    data.push(cantidadSolar)
    data.push(cantidadEolica)
    return data;
  }

  setCantidadEnergia(){
    
    this.pieChartData = {
      datasets: [{
        data: this.getData(),
        backgroundColor: ['#4C9C2E', '#C2D500'],
      hoverBackgroundColor: ['#4C9C2E','#C2D500'],
      hoverBorderColor: ['#4C9C2E','#C2D500']
      }]
    }


  }

  setCantEnergiaClientes(vec: number[]){
    console.log("vector en setenergia: ",vec)
    this.pieChartData2 = {
      datasets: [{
        data: vec,
        backgroundColor: ['#4C9C2E', '#C2D500'],
      hoverBackgroundColor: ['#4C9C2E','#C2D500'],
      hoverBorderColor: ['#4C9C2E','#C2D500']
      }]
    }
  }


  public pieChartData: ChartData<'pie', number[], string | string[]> = {
    //labels: [ 'Solar', 'Eólica' ],
    datasets: [ {
      //data: [ 300, 500 ],
      data: this.getData(),
      backgroundColor: ['#4C9C2E', '#C2D500'],
      hoverBackgroundColor: ['#4C9C2E','#C2D500'],
      hoverBorderColor: ['#4C9C2E','#C2D500']
      
    } ]
  };

  public pieChartData2: ChartData<'pie', number[], string | string[]> = {
    //labels: [ 'Solar', 'Eólica' ],
    datasets: [ {
      data: [ 300, 500 ],
      backgroundColor: ['#4C9C2E', '#C2D500'],
      hoverBackgroundColor: ['#4C9C2E','#C2D500'],
      hoverBorderColor: ['#4C9C2E','#C2D500']
      
    } ]
  };



  public pieChartType: ChartType = 'pie';
  public pieChartPlugins = [ DatalabelsPlugin ];
  // events
  public chartClicked({ event, active }: { event: ChartEvent, active: {}[] }): void {
    console.log(event, active);
  }

  public chartHovered({ event, active }: { event: ChartEvent, active: {}[] }): void {
    console.log(event, active);
  }

  changeLabels(): void {
    const words = [ 'hen', 'variable', 'embryo', 'instal', 'pleasant', 'physical', 'bomber', 'army', 'add', 'film',
      'conductor', 'comfortable', 'flourish', 'establish', 'circumstance', 'chimney', 'crack', 'hall', 'energy',
      'treat', 'window', 'shareholder', 'division', 'disk', 'temptation', 'chord', 'left', 'hospital', 'beef',
      'patrol', 'satisfied', 'academy', 'acceptance', 'ivory', 'aquarium', 'building', 'store', 'replace', 'language',
      'redeem', 'honest', 'intention', 'silk', 'opera', 'sleep', 'innocent', 'ignore', 'suite', 'applaud', 'funny' ];
    const randomWord = () => words[Math.trunc(Math.random() * words.length)];
    this.pieChartData.labels = new Array(3).map(_ => randomWord());

    this.chart?.update();
  }

  addSlice(): void {
    if (this.pieChartData.labels) {
      this.pieChartData.labels.push([ 'Line 1', 'Line 2', 'Line 3' ]);
    }

    this.pieChartData.datasets[0].data.push(400);

    this.chart?.update();
  }

  removeSlice(): void {
    if (this.pieChartData.labels) {
      this.pieChartData.labels.pop();
    }

    this.pieChartData.datasets[0].data.pop();

    this.chart?.update();
  }

  changeLegendPosition(): void {
    if (this.pieChartOptions?.plugins?.legend) {
      this.pieChartOptions.plugins.legend.position = this.pieChartOptions.plugins.legend.position === 'left' ? 'top' : 'left';
    }

    this.chart?.render();
  }

  toggleLegend(): void {
    if (this.pieChartOptions?.plugins?.legend) {
      this.pieChartOptions.plugins.legend.display = !this.pieChartOptions.plugins.legend.display;
    }

    this.chart?.render();
  }

  constructor(
    private toastr: ToastrService,
    private bancoEnergia: BancoEnergiaService,
    private generadorService: GeneradorContractService,
    private regulardorMercado: ReguladorMercadoService,
    private ethereumService: EthereumService,
    private tableService: TableService,
    private clienteService: ClienteContractService,
    ) { 

      this.dataSource = new MatTableDataSource(); 
      this.timer$ = timer(0, 1000);
    
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  async ngOnInit(): Promise<void> {
    try {
      // this.dataSource = new MatTableDataSource(ELEMENT_DATA); 
      //this.isFromInit = true;
      //this.spinner.show();
      this.tableService.setPaginatorTable(this.paginator);
      
      await this.regulardorMercado.loadBlockChainContractData();
      //this.spinner.hide();

      this.timerSubscription = this.timer$.subscribe(() => {
        this.regulardorMercado.getContratosRegistrados().subscribe({
          next: (data) => {

            if(this.flag){
              this.registros = data;
              console.log("contratos registrados: ",this.registros)
              this.dataGenerador();
              
            }
            this.flag = false;
            
          }, error: (err) => {
            console.log(err);
            this.toastr.error(err.message, 'Error');
          }
        });
      });      

      // this.timerSubscription = this.timer$.subscribe(() => {
      //   this.regulardorMercado.getContratosRegistrados().subscribe({
      //     next: (data) => {

      //       console.log("data desde todos generadores: ",data)
      //     }, error: (err) => {
      //       console.log(err);
      //       this.toastr.error(err.message, 'Error');
      //     }
      //   });
      // });      

    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }

  ngAfterViewInit(): void{
    this.ethereumService.TriggerDataChartLine.emit({
      data: {
        datasets: [
          {
            data: [200],
            label: 'Precio ETH (usd)',
            backgroundColor: 'rgba(12,199,132,0.2)',
            borderColor: 'rgba(12,199,132,1)',
            pointBackgroundColor: 'rgba(12,199,132,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(12,199,132,0.8)',
            fill: 'origin',
          },
        ],
        labels: [ 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio','Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'  ]
      }
    })
  }


  async dataGenerador() {
    this.registros.forEach(element => {

      switch (element.tipoContrato){

        case 0:
          if(this.flagGeneradoresLoad){
            this.todoClientes.push(element);
            // this.flagClientesLoad = false;
          }
          break;

        case 2:
          if(this.flagGeneradoresLoad){
            this.todoGeneradores.push(element);
            // this.flagGeneradoresLoad = false;
            console.log("this.todoGeneradores: ",this.todoGeneradores)
          }
          break;
      }
    });

    switch (this.tipoMapa){
      case 'Plantas de energía':

        if(this.flagGeneradoresLoad){
          let promises: Promise<void>[] = [];
          console.log("entrando")
          for (let index = 0; index < this.todoGeneradores.length; index++) {
            promises.push(this.loadContract(this.todoGeneradores[index].infoContrato.dirContrato));
            await Promise.all(promises);
          }
          this.flagGeneradoresLoad = false;
        }
        break;

      case 'Clientes':

        if(this.flagClientesLoad){
          let promisesClientes: Promise<void>[] = [];
          for (let index = 0; index < this.todoClientes.length; index++) {
            promisesClientes.push(this.loadContractClientes(this.todoClientes[index].infoContrato.dirContrato));
            await Promise.all(promisesClientes);
          }
          this.flagClientesLoad = false; 
        }
        break;
    }

    this.loadPlantas = true;
  }

  async loadContractClientes(contract): Promise<void> {
    try {
      this.dirContract = contract;
      let promises: Promise<void>[] = [];

      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.clienteService.loadBlockChainContractData(this.dirContract));
      await Promise.all(promises).then(() => {
        this.getContractClientes();

      });

      
    } catch (error) {
      console.log(error);
      this.toastr.error('Error al cargar las plantas de energía', 'Error');
    }
    
  }

  changeMapa(mapa){

    this.dataSource.data = []
    this.plantasFiltro = []
    this.table.renderRows();
    this.setCantidadEnergia();
    this.tipoMapa = mapa;

    switch(this.tipoMapa){

      case 'Plantas de energía':
        this.displayedColumns = ['nombre','ciudad','tecnologia','cantidadEnergia','capacidadNominal','tasaEmision']
        break;
      case 'Clientes':
        this.displayedColumns = ['nombre','ciudad','cantidadSolar','cantidadEolica']
        break;
    }
    this.dataGenerador();
    this.addItem(this.departamento);
  }



  getContractClientes() {
    let observables: Observable<any>[] = [];
    observables.push(this.clienteService.getInfoContrato());
    observables.push(this.bancoEnergia.getTiposEnergiasDisponibles())

    // this.spinner.show();
    forkJoin(observables).subscribe({
      next: (data) => {
        this.infoCliente = data[0];
        const tiposEnergias = data[1] as InfoEnergia[];
        this.energiasDisponibles = tiposEnergias.map(x => x.nombre);
        console.log("energias disponibles: ",this.energiasDisponibles)
        this.getCantidadesEnergiasDisponibles();
      }, error: (error) => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
        // this.spinner.hide();
      }
    });
  }

  private getCantidadesEnergiasDisponibles() {
    let observables: Observable<InfoEnergia>[] = [];
    this.energiasDisponibles.forEach(energia => {
      observables.push(this.clienteService.getEnergiaCliente(energia));
    });
    forkJoin(observables).subscribe({
      next: (data) => {
        this.cantidadesDisponibles = data.map(x => x.cantidadEnergia);
        this.cantidadesDisponibles = this.cantidadesDisponibles.map(x => Number(x))
        this.totalEnergiasClientes.push(this.cantidadesDisponibles);

        if(this.totalEnergiasClientes.length == this.todoClientes.length){
          for (let i = 0; i < this.todoClientes.length; i++) {
            this.todoClientes[i].infoContrato.cantidadSolar = this.totalEnergiasClientes[i][0]
            this.todoClientes[i].infoContrato.cantidadEolica = this.totalEnergiasClientes[i][1]
          }
          this.addItem(this.departamento);
        }

        // this.spinner.hide();
      },
      error: (error) => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
        // this.spinner.hide();
      }
    })
  }

  async loadContract(contract): Promise<void> {
    try {
      this.dirContract = contract;
      let promises: Promise<void>[] = [];
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.generadorService.loadBlockChainContractData(this.dirContract));
      await Promise.all(promises).then(() => {
        this.loadInfoGeneral()
      });
      
    } catch (error) {
      console.log(error);
      this.toastr.error('Error al cargar las plantas de energía', 'Error');
    }
  }

  async loadInfoGeneral():Promise<void> {
    //this.spinner.show();
    let observables: Observable<any>[] = [];
    observables.push(this.bancoEnergia.getTiposEnergiasDisponibles());
    observables.push(this.generadorService.getPlantasEnergia());

    forkJoin(observables).subscribe({
      next: async (data: any[]) => {
        const tiposEnergias = data[0];
        this.energiasDisponibles = tiposEnergias.map(tipo => tipo.nombre);
        this.plantasDeEnergia = data[1];
        this.plantasAux.push(data[1]);
        this.addItem(this.departamento);
        this.setCantidadEnergia();
        //this.spinner.hide();
      },
      error: (err) => {
        console.log(err);
        this.toastr.error(err.message, 'Error');
        //this.spinner.hide();
      },
    });
  }
  
  addItem(newItem: string) {
    this.departamento = newItem;
    this.plantasFiltro= [];
    
    if(this.loadPlantas){
  
      switch(this.tipoMapa){
        case 'Plantas de energía':
          for (let i = 0; i < this.plantasAux.length; i++) {
        
            if(this.plantasAux[i].find(element => element.departamento == this.departamento) != undefined){
              
              let sizePlantasVector = this.plantasAux[i].filter(element => element.departamento == this.departamento).length;
    
              if(sizePlantasVector > 1){
    
                for (let j = 0; j < sizePlantasVector; j++) {
                  this.plantasFiltro.push(this.plantasAux[i].filter(element => element.departamento == this.departamento)[j])
                  
                }
              }
              else{
                this.plantasFiltro.push(this.plantasAux[i].filter(element => element.departamento == this.departamento)[0])
              }
              
              this.plantasFiltro.map((element) => {
                if(element.tecnologia == 'solar'){
                  element.tecnologia = 'Solar'
                }
                else if(element.tecnologia == 'eolica'){
                  element.tecnologia = 'Eólica'
                }
              })
            }
          }
          this.dataSource.data = this.plantasFiltro;
          

          if(this.dataSource.data.length == 0 || this.dataSource.data.length == undefined){
            this.toastr.info('No hay Plantas registradas en este departamento.','Datos no encontrados.');
          }
          break;

        case 'Clientes':
          this.plantasFiltro = this.todoClientes.map(x => x.infoContrato);
          this.dataSource.data = this.plantasFiltro.filter(element => element.departamento == this.departamento);
          
          var vecTotalEnergiaClientes: number[] = [0,0];
          
          for (let i = 0; i < this.dataSource.data.length; i++) {

          //  this.vecTotalEnergiaClientes[0] = this.vecTotalEnergiaClientes[0] + this.dataSource.data[i].cantidadSolar;
          //  this.vecTotalEnergiaClientes[1] = this.vecTotalEnergiaClientes[1] + this.dataSource.data[i].cantidadEolica;
            vecTotalEnergiaClientes[0] = vecTotalEnergiaClientes[0] + this.dataSource.data[i].cantidadSolar;
            vecTotalEnergiaClientes[1] = vecTotalEnergiaClientes[1] + this.dataSource.data[i].cantidadEolica;
          }
          this.setCantEnergiaClientes(vecTotalEnergiaClientes)

          if(this.dataSource.data.length == 0 || this.dataSource.data.length == undefined){
            this.toastr.info('No hay Clientes registrados en este departamento.','Datos no encontrados.');
          }
          break;
      }

      this.table.renderRows();
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.setCantidadEnergia();
    }
  }

  public lineChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [ 650, 590, 1200, 1140, 1210, 1155, 1400,2065, 1900, 1800, 1750, 1896  ],
        label: 'Energía generada MW',
        backgroundColor: 'rgba(12,199,132,0.2)',
        borderColor: 'rgba(12,199,132,1)',
        pointBackgroundColor: 'rgba(12,199,132,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(12,199,132,0.8)',
        fill: 'origin',
      },
    ],
    labels: [ 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio','Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'  ]
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    elements: {
      line: {
        tension: 0.1
      }
    },
    scales: {
      // We use this empty structure as a placeholder for dynamic theming.
      x: {},
      'y-axis-0':
        {
          position: 'left',
        }/*,
      'y-axis-1': {
        position: 'right',
        grid: {
          //color: 'rgba(255,0,0,0.3)',
        },
        ticks: {
          color: 'red'
        }
      }*/
    },

    plugins: {
      legend: { display: true },
    }
  };

  public lineChartType: ChartType = 'line';
}
