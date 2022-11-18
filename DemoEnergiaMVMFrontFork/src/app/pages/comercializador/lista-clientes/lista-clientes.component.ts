import { FormGroup, FormBuilder } from '@angular/forms';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ComercializadorContractService } from './../../../services/comercializador-contract.service';
import { InfoContrato } from './../../../models/infoContrato';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { forkJoin, Observable, Subscription, timer } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { FieldValueChange, RowFilterForm } from 'src/app/models/FilterFormParameter';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-lista-clientes',
  templateUrl: './lista-clientes.component.html',
  styles: [
  ]
})
export class ListaClientesComponent implements OnInit, OnDestroy {

  displayedColumns: string[] = ['empresa', 'contacto', 'ubicacion', 'correo', 'tokens'];

  tokensDelegados: number[] = [];
  timer$: Observable<any>;
  timerSubscription: Subscription;
  contadorAnterior = 0;
  contadorActual = 0;
  isFromInit: boolean = false;
  filterFormProperties: RowFilterForm[] = [];
  filters = {
    empresa: '',
    contacto: '',
    correo: '',
    ubicacion: ''
  }

  reloadData: boolean = false;
  dataSource: MatTableDataSource<InfoContrato>;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild('table', { static: true }) table: MatTable<any>;
  sort: MatSort;

  constructor(private toastr: ToastrService,
    private comercializador: ComercializadorContractService,
    private reguladorMercado: ReguladorMercadoService,
    private spinner: NgxSpinnerService) {
    this.timer$ = timer(0, 1000);
    this.filterFormProperties = [{
      fields: [{
        label: 'Empresa',
        formControlName: 'empresa',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Contacto',
        formControlName: 'contacto',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Correo',
        formControlName: 'correo',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Ubicación',
        formControlName: 'ubicacion',
        controlType: 'text',
        pipe: ''
      }]
    }];
    this.dataSource = new MatTableDataSource();
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  async ngOnInit() {
    try {
      this.isFromInit = true;

      const dirContrato = localStorage.getItem('dirContract');
      await this.reguladorMercado.loadBlockChainContractData();
      await this.comercializador.loadBlockChainContractData(dirContrato);
      this.timer$.subscribe({
        next: () => {
          this.getClientes();
        }
      })
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }

  private getClientes() {
    this.comercializador.getClientesComercializador().subscribe({
      next: (data) => {
        const filterData = this.filterData(data);

        this.contadorActual = filterData.length;
        if (this.contadorActual !== this.contadorAnterior || this.reloadData) {
          this.dataSource.data = filterData;
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;

          let delegacionesObs: Observable<number>[] = [];
          this.dataSource.data.forEach(cliente => {
            delegacionesObs.push(this.reguladorMercado.getTokensDelegados(this.comercializador.dirContrato, cliente.owner));
          });

          forkJoin(delegacionesObs).subscribe({
            next: (data) => {
              this.tokensDelegados = data;
            }, error: (err) => {
              console.log(err);
              this.toastr.error(err.message, 'Error');
            }
          });
          if (this.contadorActual > this.contadorAnterior && !this.isFromInit) {
            this.toastr.success('Nuevo cliente suscrito', 'Registro');
          }
          this.reloadData = false;
          this.contadorAnterior = this.contadorActual;
        }
      }
    });
  }

  onfieldValueChange(event: FieldValueChange) {
    this.filters[event.controlName] = event.data;
    this.reloadData = true;
    this.getClientes();
  }

  private filterData(data: InfoContrato[]): InfoContrato[] {
    let filterArray = data;
    filterArray = this.filters.empresa !== '' ? filterArray.filter(item => item.empresa.toLocaleLowerCase().includes(this.filters.empresa.toLowerCase())) : filterArray;
    filterArray = this.filters.correo !== '' ? filterArray.filter(item => item.correo.toLocaleLowerCase().includes(this.filters.correo.toLowerCase())) : filterArray;
    filterArray = this.filters.contacto !== '' ? filterArray.filter(item => item.contacto.toLocaleLowerCase().includes(this.filters.contacto.toLowerCase())) : filterArray;
    filterArray = this.filters.ubicacion !== '' ? filterArray.filter(item => item.departamento.toLocaleLowerCase().includes(this.filters.ubicacion.toLowerCase())) : filterArray;

    return filterArray;
  }
}
