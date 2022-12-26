import { InfoEnergia } from 'src/app/models/InfoEnergia';
import { EstadoPlanta, InfoPlantaEnergia } from './../models/InfoPlantaEnergia';
import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { AgenteContractService } from './agente-contract.service';
import Generador from '../../../build/contracts/Generador.json';
import { catchError, from, map, Observable, of, throwError } from 'rxjs';
import moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class GeneradorContractService extends AgenteContractService {

  async loadBlockChainContractData(dirContrato: string): Promise<void> {
    this.dirContrato = dirContrato;
    await this.web3Connect.loadWeb3();
    const web3 = this.winRef.window.web3 as Web3;
    this.setContractData(Generador, web3);
    
  }

  postCrearNuevaEnergia(tipoEnergia: string, cantidad: number): Observable<any> {
    return from(this.contract?.methods.GenerarNuevaEnergia(tipoEnergia, cantidad).send({ from: this.account })).pipe(
      catchError((error) => {
        console.log("error en el service")
        return throwError(() => new Error(error.message));
      })
    );
  }

  postGenerarPlantaEnergia(infoPlanta: InfoPlantaEnergia) {
    return from(this.contract?.methods.crearPlantaEnergia(infoPlanta).send({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  postInyectarEnergiaPlanta(dirPlanta: string, tipoEnergia: string, cantidad: number, cantidadBolsa: number): Observable<any> {
    return from(this.contract?.methods.inyectarEnergiaPlanta(dirPlanta, tipoEnergia, cantidad,cantidadBolsa).send({ from: this.account })).pipe(
      // catchError((error) => {
      //   return throwError(() => new Error(error.message));
      // })
    );
  }

  getPlantasEnergia(): Observable<InfoPlantaEnergia[]> {
    return from(this.contract?.methods.getPlantasEnergia().call({ from: this.account })).pipe(
      map((data: any) => {
        const plantasEnergias = data.map((planta: any) => {
          const [dirPlanta, nombre, departamento, ciudad, coordenadas, fechaInicio, tasaEmision, isRec, capacidadNominal, tecnologia, cantidadEnergia, estado] = planta;
          const infoPlanta: InfoPlantaEnergia = {
            dirPlanta: dirPlanta,
            nombre: nombre,
            departamento: departamento,
            ciudad: ciudad,
            coordenadas: coordenadas,
            fechaInicio: moment(parseInt(fechaInicio) * 1000).format('DD/MM/YYYY'),
            tasaEmision: parseInt(tasaEmision),
            isRec: isRec,
            capacidadNominal: parseInt(capacidadNominal),
            tecnologia: tecnologia,
            cantidadEnergia: parseInt(cantidadEnergia),
            estado: parseInt(estado) as EstadoPlanta
          }
          return infoPlanta as InfoPlantaEnergia;
        })
        return plantasEnergias as InfoPlantaEnergia[];;
      }),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  postContratarComercializador(addresComercializador: string): Observable<any> {
    return from(this.contract?.methods.contratarComercializador(addresComercializador).send({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  getCantidadEnergia(tipoEnergia: string): Observable<number> {
    return from(this.contract?.methods.getCantidadEnergiaPlantas(tipoEnergia).call({ from: this.account })).pipe(
      map((data: any) => {
        return parseInt(data);
      }),
      catchError((error) => {
        console.error(error);
        return of(0);
      })
    );
  }

  getCapacidadNominal(): Observable<number> {
    return from(this.contract?.methods.getCapacidadNominalTotal().call({ from: this.account })).pipe(
      map((data: any) => {
        return parseInt(data);
      }),
      catchError((error) => {
        console.error(error);
        return of(0);
      })
    );
  }

  getInfoEnergiaPlanta(dirPlanta: string): Observable<InfoEnergia> {
    return from(this.contract?.methods.getInfoEnergiaPlanta(dirPlanta).call({ from: this.account })).pipe(
      map((data: any) => {
        const [nombre, cantidadEnergia, precio] = data;
        const infoEnergia: InfoEnergia = {
          nombre: nombre,
          cantidadEnergia: parseInt(cantidadEnergia),
          precio: parseInt(precio)
        }
        return infoEnergia as InfoEnergia;
      }),
      catchError((error) => {
        console.error(error);
        return of(null);
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

  setPrecioEnergia(precioEnergia: number): Observable<any> {
    return from(this.contract?.methods.setPrecioEnergia(precioEnergia).send({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  getPrecioEnergia(): Observable<number> {
    return from(this.contract.methods.getPrecioEnergia().call({ from: this.account })).pipe(
      map(data => data as number),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }
  
}
