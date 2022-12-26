import { InfoEmisionCompra } from './../models/InfoEmisionCompra';
import { InfoContrato } from './../models/infoContrato';
import { CompraEnergiaRequest } from './../models/CompraEnergiaRequest';
import { catchError, map, Observable, throwError, switchMap, forkJoin, from } from 'rxjs';
import { Injectable } from '@angular/core';
import { AgenteContractService } from './agente-contract.service';
import Comercializador from '../../../build/contracts/Comercializador.json';
import Web3 from 'web3';
import moment from 'moment';
import { InfoCompraEnergia } from '../models/InfoCompraEnergia';
import { AcuerdoEnergia } from '../models/AcuerdoEnergia';

@Injectable({
  providedIn: 'root'
})
export class ComercializadorContractService extends AgenteContractService {
  async loadBlockChainContractData(dirContrato: string): Promise<void> {
    this.dirContrato = dirContrato;
    await this.web3Connect.loadWeb3();
    const web3 = this.winRef.window.web3 as Web3;
    this.setContractData(Comercializador, web3);
  }

  getClientesComercializador(): Observable<InfoContrato[]> {
    return from(this.contract.methods.getClientesComercializador().call({ from: this.account })).pipe(
      map((data: any) => {
        let infoContratos = data.map(infoContrato => {
          const [
            dirContrato,
            owner,
            nit,
            empresa,
            contacto,
            telefono,
            correo,
            departamento,
            ciudad,
            direccion,
            comercializador,
            tipoContrato
          ] = infoContrato

          let tempInfo: InfoContrato = {
            dirContrato,
            owner,
            nit,
            empresa,
            contacto,
            telefono,
            correo,
            departamento,
            ciudad,
            direccion,
            comercializador,
            tipoContrato
          }
          return tempInfo;
        });
        return infoContratos as InfoContrato[];
      }),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  getEnergiaDisponible(tipoEnergia: string, cliente: string): Observable<any> {
    return from(this.contract.methods.getEnergiaDisponible(tipoEnergia, cliente).call({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  ComprarEnergia(compraEnergiaRequest: CompraEnergiaRequest): Observable<any> {
    return from(this.contract.methods.ComprarEnergia(compraEnergiaRequest.dirContratoGenerador,
      compraEnergiaRequest.dirPlantaGenerador, compraEnergiaRequest.ownerCliente,
      compraEnergiaRequest.cantidadEnergia, compraEnergiaRequest.tipoEnergia,
      compraEnergiaRequest.index).send({ from: this.account })).pipe(
        catchError((error) => {
          return throwError(() => new Error(error.message));
        })
      );
  }

  getInfoComprasRealizadas(): Observable<InfoCompraEnergia[]> {
    return from(this.contract.methods.contadorCompras().call({ from: this.account })).pipe(
      switchMap((data: string) => {
        let numCompras = parseInt(data);
        let observables: Observable<InfoCompraEnergia>[] = [];
        for (let i = numCompras - 1; i >= 0; i--) {
          let tempObs = from(this.contract.methods.getInfoComprasRealizadas(i).call({ from: this.account })).pipe(
            map((data: any) => {
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
              ] = data;

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
                cantidadEnergia,
                fechaAprobacion: moment(parseInt(fechaAprobacion) * 1000).format('DD/MM/YYYY HH:mm:ss'),
                fechaAprobacionNumber: parseInt(fechaAprobacion),
                index
              }
              return tempInfo;
            })
          );
          observables.push(tempObs);
        }
        return forkJoin(observables);
      })
    )
  }

  getEmisionesDeCompra(): Observable<InfoEmisionCompra[]> {
    return from(this.contract.methods.contadorEmisiones().call({ from: this.account })).pipe(
      switchMap((data: string) => {
        let numEmisiones = parseInt(data);
        let observables: Observable<InfoEmisionCompra>[] = [];
        for (let i = numEmisiones - 1; i >= 0; i--) {
          let tempObs = from(this.contract.methods.getInfoEmisionesDeCompra(i).call({ from: this.account })).pipe(
            map((data: any) => {
              const [
                ownerCliente,
                dirContratoCliente,
                empresaCliente,
                tipoEnergia,
                cantidadDeEnergia,
                estado,
                fechaEmision,
                fechaAprobacion,
                index
              ] = data;

              let tempInfo: InfoEmisionCompra = {
                ownerCliente,
                dirContratoCliente,
                empresaCliente,
                tipoEnergia,
                cantidadDeEnergia,
                estado,
                fechaEmision: moment(parseInt(fechaEmision) * 1000).format('DD/MM/YYYY HH:mm:ss'),
                fechaAprobacion: moment(parseInt(fechaAprobacion) * 1000).format('DD/MM/YYYY HH:mm:ss'),
                index
              }
              return tempInfo;
            })
          );
          observables.push(tempObs);
        }
        return forkJoin(observables);
      })
    );
  }

  rechazarCompra(dirContratoCliente: string, index: number): Observable<any> {
    return from(this.contract.methods.rechazarCompra(dirContratoCliente, index).send({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  getInfoCompraByEmision(index:number):Observable<InfoEmisionCompra[]>{
    return from(this.contract.methods.getInfoCompraByEmision(index).call({ from: this.account })).pipe(
      map((data: any[]) => {
        const tempInfoCompra = data.map(item=>{
          const [
            ownerCliente,
            dirContratoCliente,
            empresaCliente,
            tipoEnergia,
            cantidadDeEnergia,
            estado,
            fechaEmision,
            fechaAprobacion,
            index
          ] = item;
  
          let tempInfo: InfoEmisionCompra = {
            ownerCliente,
            dirContratoCliente,
            empresaCliente,
            tipoEnergia,
            cantidadDeEnergia,
            estado,
            fechaEmision: moment(parseInt(fechaEmision) * 1000).format('DD/MM/YYYY HH:mm:ss'),
            fechaAprobacion: moment(parseInt(fechaAprobacion) * 1000).format('DD/MM/YYYY HH:mm:ss'),
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

  realizarAcuerdo(_dirGenerador: string, _dirCliente: string,_indexGlobal: number): Observable<any> {
    return from(this.contract?.methods.realizarAcuerdo(_dirGenerador, _dirCliente,_indexGlobal).send({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  getHistoricoAcuerdos(): Observable<any> {
    return from(this.contract?.methods.getHistoricoAcuerdos().call({ from: this.account })).pipe(map((data: any) => {

      console.log("fecha inicio desde servicio: ",data)

      return data;
    }),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }
}
