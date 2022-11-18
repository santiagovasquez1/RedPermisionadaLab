import { InfoContrato } from './../models/infoContrato';
import { ToastrService } from 'ngx-toastr';
import { Injectable } from '@angular/core';
import { Web3ConnectService } from './web3-connect.service';
import { WinRefService } from './win-ref.service';
import { Contract } from 'web3-eth-contract';
import { catchError, from, Observable, throwError } from 'rxjs';
import { AbiItem } from 'web3-utils';
import Web3 from 'web3';

@Injectable({
  providedIn: 'root'
})
export abstract class FactoryService {

  contract: Contract | undefined;
  account: any;

  constructor(public winRef: WinRefService, public web3Connect: Web3ConnectService, public toastr: ToastrService) { }

  abstract loadBlockChainContractData(): Promise<void>;

  setContractData(factoryJson: any, networkData: any, web3: Web3) {
    if (networkData) {
      const abi = factoryJson.abi;
      const address = networkData.address;
      this.account = localStorage.getItem('account');
      this.contract = new web3.eth.Contract(abi as unknown as AbiItem, address);
    } else {
      this.toastr.error('Esta aplicación no está disponible en este network.');
    }
  }

  setFactoryContrato(infoContrato: InfoContrato): Observable<any> {
    return from(this.contract?.methods.FactoryContrato(infoContrato).send({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  getContratos(): Observable<any> {
    return from(this.contract?.methods.getContratosOwners().call()).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  getIsDireccionRegistrada(): Observable<any> {
    return from(this.contract?.methods.direccionRegistrada().call({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

}
