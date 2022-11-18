import { FactoryService } from './factory.service';
import { Injectable } from '@angular/core';
import ClienteFactory from '../../../build/contracts/MvmClienteFactory.json';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

@Injectable({
  providedIn: 'root'
})
export class ClienteFactoryService extends FactoryService {

  async loadBlockChainContractData(): Promise<void> {
    await this.web3Connect.loadWeb3();
    const web3 = this.winRef.window.web3 as Web3;
    const networkId = await web3.eth.net.getId();
    const networkData = ClienteFactory.networks[networkId];
    this.setContractData(ClienteFactory, networkData, web3);
  }
}
