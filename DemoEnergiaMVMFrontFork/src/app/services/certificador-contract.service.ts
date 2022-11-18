import { InfoCertificadoVentaEnergia, InfoMappingCertificado } from './../models/InfoCertificados';
import { InfoCertificadoAgente } from '../models/InfoCertificados';
import { Observable, map, from, catchError, throwError } from 'rxjs';
import { AbiItem } from 'web3-utils';
import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { AgenteContractService } from './agente-contract.service';
import Certificador from '../../../build/contracts/Certificador.json';
import moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class CertificadorContractService extends AgenteContractService {

  async loadBlockChainContractData(dirContrato: string): Promise<void> {
    await this.web3Connect.loadWeb3();
    const web3 = this.winRef.window.web3 as Web3;
    const networkId = await web3.eth.net.getId();
    const networkData = Certificador.networks[networkId];
     
    if (networkData) {
      const abi = Certificador.abi;
      this.dirContrato = networkData.address;
      this.contract = new web3.eth.Contract(abi as unknown as AbiItem, this.dirContrato);
      this.account = localStorage.getItem('account');
      localStorage.setItem('dirContratoCertificador', this.dirContrato);
    } else {
      window.alert('Este contrato no está disponible en este network.');
    }
  }

  getCertificadoAgente(dirContratoAgente: string): Observable<InfoCertificadoAgente> {
    return from(this.contract.methods.getCertificadoAgente(dirContratoAgente).call({ from: this.account })).pipe(
      map((data: any) => {
        const [
          dirContratoAgente,
          nombreEmpresa,
          dirContratoCertificador,
          nombreCertificador,
          hashCertificado,
          fechaCertificado,
        ] = data;

        let infoCertificado: InfoCertificadoAgente = {
          dirContratoAgente: dirContratoAgente,
          nombreEmpresa: nombreEmpresa,
          dirContratoCertificador: dirContratoCertificador,
          nombreCertificador: nombreCertificador,
          hashCertificado: hashCertificado,
          fechaCertificado: moment(parseInt(fechaCertificado) * 1000).format('DD/MM/YYYY')
        };

        return infoCertificado as InfoCertificadoAgente;
      }),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      }));
  }
  getCertificadoCompra(requestCertificado: InfoMappingCertificado): Observable<InfoCertificadoVentaEnergia> {
    return from(this.contract.methods.getCertificadoCompra(requestCertificado).call({ from: this.account })).pipe(
      map((data: any) => {
        const [
          ownerCliente,
          dirContratoCliente,
          empresaCliente,
          dirContratoGenerador,
          empresaGenerador,
          dirPlanta,
          nombrePlanta,
          dirComercializador,
          empresaComercializador,
          dirContratoCertificador,
          nombreCertificador,
          tipoEnergia,
          cantidadEnergia,
          hashCertificado,
          fechaCertificado,
        ] = data;

        let infoCertificado: InfoCertificadoVentaEnergia = {
          ownerCliente: ownerCliente,
          dirContratoCliente: dirContratoCliente,
          empresaCliente: empresaCliente,
          dirContratoGenerador: dirContratoGenerador,
          empresaGenerador: empresaGenerador,
          dirPlanta: dirPlanta,
          nombrePlanta: nombrePlanta,
          dirComercializador: dirComercializador,
          empresaComercializador: empresaComercializador,
          dirContratoCertificador: dirContratoCertificador,
          nombreCertificador: nombreCertificador,
          tipoEnergia: tipoEnergia,
          cantidadEnergia: cantidadEnergia,
          hashCertificado: hashCertificado,
          fechaCertificado: moment(parseInt(fechaCertificado) * 1000).format('DD/MM/YYYY')
        };

        return infoCertificado as InfoCertificadoVentaEnergia;
      }),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }
}
