import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { FactoryService } from './factory.service';
import ComercializadorFactory from '../../../build/contracts/MvmComercializadorFactory.json';

@Injectable({
  providedIn: 'root'
})
export class ComercializadorFactoryService extends FactoryService {

  async loadBlockChainContractData(): Promise<void> {
    await this.web3Connect.loadWeb3();
    const web3 = this.winRef.window.web3 as Web3;
    const networkId = await web3.eth.net.getId();
    const networkData = ComercializadorFactory.networks[networkId];
    this.setContractData(ComercializadorFactory, networkData, web3);
  }
}
