import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { Web3ConnectService } from './web3-connect.service';
import { WinRefService } from './win-ref.service';
import DespachosEnergia from '../../../build/contracts/DespachosEnergia.json';
import { AbiItem } from 'web3-utils';
import moment from 'moment';
import { Observable, from, catchError, throwError, switchMap, forkJoin, of } from 'rxjs';
import { ProviderRpcError } from '../models/JsonrpcError';
import { OrdenDespacho } from '../models/OrdenDespacho';
import { GeneradorContractService } from './generador-contract.service';

@Injectable({
  providedIn: 'root'
})
export class DespachosEnergiaService {
  contract: Contract | undefined;
  account: any;
  adressContract: any;
  web3: Web3;

  constructor(private winRef: WinRefService, private web3ConnectService: Web3ConnectService, private toastr: ToastrService) {

  }

  async loadBlockChainContractData() {
    await this.web3ConnectService.loadWeb3();
    this.web3 = this.winRef.window.web3 as Web3;

    const networkId = await this.web3.eth.net.getId();
    const networkData = DespachosEnergia.networks[networkId];
    if (networkData) {
      const abi = DespachosEnergia.abi;
      this.adressContract = networkData.address;
      this.contract = new this.web3.eth.Contract(abi as unknown as AbiItem, this.adressContract);
      this.account = localStorage.getItem('account');
      localStorage.setItem('addressDespachos', this.adressContract);
    } else {
      window.alert('Esta aplicación no está disponible en este network.');
    }
  }

  setDespachoEnergia(dirGenerador: string, cantidadDespacho: number): Observable<any> {
    return from(this.contract?.methods.setDespachoEnergia(dirGenerador, cantidadDespacho).send({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      }));
  }

  editCantidadDespacho(dirGenerador: string, cantidadEenergia: number, fechaOrden: number, index: number): Observable<any> {
    return from(this.contract?.methods.editCantidadDespacho(dirGenerador, cantidadEenergia, fechaOrden, index).send({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  getDespachosRealizados(): Observable<OrdenDespacho[]> {
    return from(this.contract?.methods.getDespachosRealizados().call({ from: this.account })).pipe(
      switchMap((data: any[]) => {
        let mappingsOrdenesDespacho: Observable<OrdenDespacho>[]
        data.forEach(tempOrdenDespacho => {
          mappingsOrdenesDespacho.push(this.mappingOrdenDespacho(tempOrdenDespacho))
        })
        return forkJoin(mappingsOrdenesDespacho);
      }),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      }));
  }

  getDespachosByGeneradorAndDate(dirGenerador: string, nombreGenerador: string, date: number): Observable<OrdenDespacho> {
    return from(this.contract?.methods.getDespachosByGeneradorAndDate(dirGenerador, date).call({ from: this.account })).pipe(
      switchMap((data: any) => this.mappingOrdenDespacho(data)),
      catchError((error: ProviderRpcError) => {
        if (error.message.includes("No existe orden")) {
          const generadorContract: GeneradorContractService = new GeneradorContractService(this.winRef, this.web3ConnectService, this.toastr);
          return from(generadorContract.loadBlockChainContractData(dirGenerador)).pipe(
            switchMap(() => {
              return generadorContract.getCapacidadNominal().pipe(
                switchMap((capacidadNominal: number) => {
                  let ordenDespacho: OrdenDespacho = {
                    dirGenerador,
                    nombreGenerador,
                    cantidadEnergia: 0,
                    cantidadProducida: 0,
                    fechaDespacho: '',
                    capacidadNominal,
                    index: null
                  };
                  return of(ordenDespacho);
                })
              );
            })
          );
        }
        return throwError(() => new Error(error.message));
      })
    );
  }


  getHistoricoDespachosEnergia(): Observable<any> {
    return from(this.contract?.methods.getHistoricoDespachos().call({ from: this.account })).pipe(
      switchMap((data: any[]) => {
        let mappingsOrdenesDespacho: Observable<OrdenDespacho>[] = []
        data.forEach(tempOrdenDespacho => {
          mappingsOrdenesDespacho.push(this.mappingOrdenDespacho(tempOrdenDespacho))
        })
        return forkJoin(mappingsOrdenesDespacho);
      }),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }


  private mappingOrdenDespacho(data: any): Observable<OrdenDespacho> {
    const [dirGenerador, nombreGenerador, cantidadEnergia, cantidadProducida, fechaDespacho, index] = data;
    const generadorContract: GeneradorContractService = new GeneradorContractService(this.winRef, this.web3ConnectService, this.toastr);
    return from(generadorContract.loadBlockChainContractData(dirGenerador)).pipe(
      switchMap(() => {
        return generadorContract.getCapacidadNominal().pipe(
          switchMap((capacidadNominal: number) => {
            let ordenDespacho: OrdenDespacho = {
              dirGenerador,
              nombreGenerador,
              cantidadEnergia,
              cantidadProducida,
              fechaDespacho: moment(parseInt(fechaDespacho) * 1000).format('DD/MM/YYYY'),
              capacidadNominal,
              index
            };
            return of(ordenDespacho);
          })
        );
      })
    );
  }
}
