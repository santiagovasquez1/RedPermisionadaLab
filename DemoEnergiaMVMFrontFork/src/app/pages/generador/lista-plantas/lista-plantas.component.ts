import { TableService } from 'src/app/services/shared/table-service.service';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { PlantaEnergiaService } from './../../../services/planta-energia.service';
import { InfoEnergia } from 'src/app/models/InfoEnergia';
import { BancoEnergiaService } from './../../../services/banco-energia.service';
import { NuevaEnergiaComponent, Estado } from './../nueva-energia/nueva-energia.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { InfoPlantaEnergia, EstadoPlanta } from './../../../models/InfoPlantaEnergia';
import { Component, OnInit, ViewChild } from '@angular/core';
import { GeneradorContractService } from 'src/app/services/generador-contract.service';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { Observable, forkJoin } from 'rxjs';
import { WinRefService } from 'src/app/services/win-ref.service';
import { Web3ConnectService } from 'src/app/services/web3-connect.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FieldValueChange, RowFilterForm } from 'src/app/models/FilterFormParameter';
import moment from 'moment';
import { PlantasEnergiaComponent } from '../plantas-energia/plantas-energia.component';
import { ComprarEnergiaBolsaComponent } from '../comprar-energia-bolsa/comprar-energia-bolsa.component';


@Component({
  selector: 'app-lista-plantas',
  templateUrl: './lista-plantas.component.html',
  styles: [
  ]
})
export class ListaPlantasComponent implements OnInit {

  displayedColumns: string[] = ['nombre', 'ubicacion', 'coordenadas', 'fechaOperacion', 'tasaEmision', 'capacidad', 'tecnologia', 'cantidad', 'estado', 'acciones'];
  ubicaciones: string[] = []
  estadosPlantas: EstadoPlanta[];
  dirContract: string;
  energiasDisponibles: string[] = [];
  dataSource: MatTableDataSource<InfoPlantaEnergia>;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild('table', { static: true }) table: MatTable<any>;
  sort: MatSort;

  filterFormProperties: RowFilterForm[] = [];

  filters = {
    nombrePlanta: '',
    ubicacion: '',
    fechaOperacion: '',
    tipoEnergia: '',
    estadoPlanta: undefined
  }

  constructor(
    private generadorService: GeneradorContractService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    public dialog: MatDialog,
    private bancoEnergia: BancoEnergiaService,
    private tableService: TableService) {
    this.dataSource = new MatTableDataSource();
  }

  private setFilterForm() {
    this.filterFormProperties = [{
      fields: [{
        label: 'Nombre',
        formControlName: 'nombrePlanta',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Ubicación',
        formControlName: 'ubicacion',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Fecha inicio operaciones',
        formControlName: 'fechaOperacion',
        controlType: 'date',
        pipe: ''
      }]
    }, {
      fields: [{
        label: ' Tecnologia de la planta',
        formControlName: 'tipoEnergia',
        controlType: 'select',
        pipe: '',
        optionValues: this.energiasDisponibles
      }, {
        label: 'Estado de la planta',
        formControlName: 'estadoPlanta',
        controlType: 'select',
        pipe: 'estadoPlanta',
        optionValues: this.estadosPlantas
      }]
    }];
  }

  async ngOnInit(): Promise<void> {
    try {
      this.dirContract = localStorage.getItem('dirContract');
      let promises: Promise<void>[] = [];
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.generadorService.loadBlockChainContractData(this.dirContract));
      await Promise.all(promises);
      this.tableService.setPaginatorTable(this.paginator);
      this.loadSelectsOptions();
      this.loadPlantasEnergia();
    } catch (error) {
      console.log(error);
      this.toastr.error('Error al cargar las plantas de energía', 'Error');
    }
  }

  loadPlantasEnergia() {
    this.generadorService.getPlantasEnergia().subscribe({
      next: (data: InfoPlantaEnergia[]) => {
        const filterData = this.filterData(data);
        this.dataSource.data = filterData;
        this.ubicaciones = filterData.map(item => {
          return `${item.ciudad} ${item.departamento}`
        });
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.table.renderRows();

      },
      error: (error) => {
        this.toastr.error(error.message, 'Error');
        console.log(error);
      }
    })

  }

  private loadSelectsOptions() {
    const tempEstadosPlantas = Object.values(EstadoPlanta).filter(item => typeof item == 'number');
    this.estadosPlantas = tempEstadosPlantas as EstadoPlanta[];
    this.spinner.show();
    this.bancoEnergia.getTiposEnergiasDisponibles().subscribe({
      next: (data: InfoEnergia[]) => {
        this.energiasDisponibles = data.map(item => item.nombre);
        this.setFilterForm();
        this.spinner.hide();
      },
      error: (error) => {
        this.toastr.error(error.message, 'Error');
        console.log(error);
        this.spinner.hide();
      }
    })

  }

  onInyectarEnergia(planta: InfoPlantaEnergia) {
    let dialogRef = this.dialog.open(NuevaEnergiaComponent, {
      width: '500px',
      data: {
        dirContract: this.dirContract,
        hashPlanta: planta.dirPlanta,
        tecnologia: planta.tecnologia,
        capacidadNominal: planta.capacidadNominal,
        cantidadActual: planta.cantidadEnergia,
        estado: Estado.inyectarEnergia
      }
    });

    dialogRef.afterClosed().subscribe({
      next: () => {
        this.loadPlantasEnergia();
      }
    });
  }

  onfieldValueChange(event: FieldValueChange) {
    if (event.controlName === 'estadoPlanta') {
      this.filters[event.controlName] = event.data !== '' ? parseInt(event.data) : event.data;
    } else if (event.controlName === 'fechaOperacion') {
      this.filters[event.controlName] = event.data !== '' ? moment(event.data).format('DD/MM/YYYY') : 'Invalid date'
    }
    else {
      this.filters[event.controlName] = event.data;
    }
    this.loadPlantasEnergia();
  }

  private filterData(data: InfoPlantaEnergia[]): InfoPlantaEnergia[] {
    let filterArray = data;
    filterArray = this.filters.nombrePlanta !== '' ? filterArray.filter(item => item.nombre.toLowerCase().includes(this.filters.nombrePlanta.toLowerCase())) : filterArray;
    filterArray = this.filters.ubicacion !== '' ? filterArray.filter(item => item.departamento.toLowerCase().includes(this.filters.nombrePlanta.toLowerCase())) : filterArray;
    filterArray = this.filters.tipoEnergia !== '' ? filterArray.filter(item => item.tecnologia === this.filters.tipoEnergia) : filterArray;
    filterArray = this.filters.estadoPlanta !== '' && this.filters.estadoPlanta !== undefined ? filterArray.filter(item => item.estado == this.filters.estadoPlanta) : filterArray;
    filterArray = this.filters.fechaOperacion !== 'Invalid date' && this.filters.fechaOperacion !== '' ? filterArray.filter(item => {
      let temp = moment(item.fechaInicio, 'DD/MM/YYYY');
      let isSame = temp.isSame(moment(this.filters.fechaOperacion, 'DD/MM/YYYY'), 'day');
      if (isSame) {
        return true;
      } else {
        return false;
      }
    }) : filterArray;
    return filterArray;
  }

  onCrearPlanta() {
    const dialogRef = this.dialog.open(PlantasEnergiaComponent, {
      width: '800px',
      data: {
        dirContract: this.dirContract,
        energiasDisponibles: this.energiasDisponibles
      }
    });

    dialogRef.afterClosed().subscribe({
      next:()=>{
        this.loadPlantasEnergia()
      }
    })
  }

  onComprarEnergia() {
    const dialogRef = this.dialog.open(ComprarEnergiaBolsaComponent, {
      width: '500px',
      data: {
        dirContract: this.dirContract,
        energiasDisponibles: this.energiasDisponibles
      }
    });

    dialogRef.afterClosed().subscribe({
      next:()=>{
        this.loadPlantasEnergia()
      }
    })
  }
}
