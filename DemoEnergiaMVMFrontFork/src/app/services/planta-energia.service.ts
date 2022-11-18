import { catchError, from, map, Observable, throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { AgenteContractService } from './agente-contract.service';
import PlantaEnergia from '../../../build/contracts/PlantaEnergia.json';
import Web3 from 'web3';
import { InfoEnergia } from '../models/InfoEnergia';

@Injectable({
  providedIn: 'root'
})
export class PlantaEnergiaService extends AgenteContractService {

  async loadBlockChainContractData(dirContrato: string): Promise<void> {
    this.dirContrato = dirContrato;
    await this.web3Connect.loadWeb3();
    const web3 = this.winRef.window.web3 as Web3;
    this.setContractData(PlantaEnergia, web3);
  }

  getTipoEnergia(): Observable<InfoEnergia> {
    return from(this.contract?.methods.getTipoEnergia().call({ from: this.account })).pipe(
      map((data: any) => {
        const [nombre, cantidadEnergia, precio] = data;
        const infoEnergia: InfoEnergia = {
          nombre: nombre,
          cantidadEnergia: parseInt(cantidadEnergia),
          precio: parseInt(precio)
        }
        return infoEnergia;
      }),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      }));
  }

  postAumentarCapacidadNominal (cantidad:number): Observable<any> {
    return from(this.contract?.methods.aumentarCapacidadNominal(cantidad).send({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      }));
  }

  postDisminuirCapacidadNominal (cantidad:number): Observable<any> {
    return from(this.contract?.methods.disminuirCapacidadNominal(cantidad).send({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      }));
  }
}
