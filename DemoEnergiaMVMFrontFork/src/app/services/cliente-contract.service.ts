import { InfoCompraEnergia } from './../models/InfoCompraEnergia';
import { InfoEmisionCompra } from 'src/app/models/InfoEmisionCompra';
import { InfoEnergia } from './../models/InfoEnergia';
import { AcuerdoEnergia } from './../models/AcuerdoEnergia';
import { Observable, catchError, throwError, map, from, of } from 'rxjs';
import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { AgenteContractService } from './agente-contract.service';
import Cliente from '../../../build/contracts/Cliente.json';
import moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class ClienteContractService extends AgenteContractService {

  async loadBlockChainContractData(dirContrato: string): Promise<void> {
    this.dirContrato = dirContrato;
    await this.web3Connect.loadWeb3();
    const web3 = this.winRef.window.web3 as Web3;
    this.setContractData(Cliente, web3);
  }

  postContratarComercializador(addresComercializador: string): Observable<any> {
    return from(this.contract?.methods.contratarComercializador(addresComercializador).send({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  postComprarEnergia(tipoEnergia: string, cantidad: number, fechaFin: number): Observable<any> {
    return from(this.contract?.methods.comprarEnergia(tipoEnergia, cantidad,fechaFin).send({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  postConsumirEnergia(tipoEnergia: string, cantidad: number): Observable<any> {
    return from(this.contract?.methods.gastoEnergia(tipoEnergia, cantidad).send({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  getEnergiaCliente(tipoEnergia: string): Observable<InfoEnergia> {
    return from(this.contract?.methods.getEnergiaCliente(tipoEnergia).call({ from: this.account })).pipe(
      map((data: any) => {
        const [nombre, cantidadEnergia, precio] = data;
        let tempInfo: InfoEnergia = {
          nombre: nombre,
          cantidadEnergia: cantidadEnergia,
          precio: precio
        }
        return tempInfo;
      }),
      catchError((error) => {
        let tempInfo: InfoEnergia = {
          nombre: '',
          cantidadEnergia: 0,
          precio: 0
        }
        console.error(error);
        return of(tempInfo);
      })
    );
  }

  getComprasRealizadas(): Observable<InfoCompraEnergia[]> {
    return from(this.contract.methods.getComprasRealizadas().call({ from: this.account })).pipe(
      map((data: any[]) => {
        const tempInfoCompra = data.map(item => {
          const [
            ownerCliente,
            dirContratoCliente,
            empresaCliente,
            dirContratoGerador,
            empresaGerador,
            dirPlanta,
            nombrePlanta,
            dirComercializador,
            empresaComercializador,
            tipoEnergia,
            cantidadEnergia,
            fechaAprobacion,
            index
          ] = item;

          let tempInfo: InfoCompraEnergia = {
            ownerCliente,
            dirContratoCliente,
            empresaCliente,
            dirContratoGerador,
            empresaGerador,
            dirPlanta,
            nombrePlanta,
            dirComercializador,
            empresaComercializador,
            tipoEnergia,
            cantidadEnergia: parseInt(cantidadEnergia),
            fechaAprobacion: moment(parseInt(fechaAprobacion) * 1000).format('DD/MM/YYYY HH:mm:ss'),
            fechaAprobacionNumber: parseInt(fechaAprobacion),
            index
          }
          return tempInfo;
        })
        return tempInfoCompra;
      }),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    )
  }

  getTokensDelegados(): Observable<number> {
    console.log("LLAMANDO A getTokensDelegados CLIENTE SERVICE: ")
    return from(this.contract.methods.getTokensDelegados().call({ from: this.account })).pipe(
      map(data => data as number),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  getAcumuladoVenta(): Observable<number> {
    return from(this.contract.methods.getAcumuladoVenta().call({ from: this.account })).pipe(
      map(data => data as number),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  setAcuerdosDeCompra(AcuerdoEnergia: AcuerdoEnergia): Observable<any> {
    console.log("this.account: ",this.account)
    return from(this.contract?.methods.setAcuerdosDeCompra(AcuerdoEnergia).send({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }
}
