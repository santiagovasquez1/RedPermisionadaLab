import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Output,EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { resolve } from 'url';

@Injectable({
  providedIn: 'root'
})
export class EthereumService {

  @Output() TriggerDataChartLine: EventEmitter<any> = new EventEmitter();

  constructor(private http:HttpClient) {
   }

  precioEther(): Observable<any>{

    let headers = new HttpHeaders();
    headers = headers.set('X-CMC_PRO_API_KEY','429aedd0-2724-4a7c-b7cd-8cf5c80b5377');
    //headers=headers.set('content-type','application/json')
    headers = headers.set('Access-Control-Allow-Origin','*');
    console.log(headers)
    //return this.http.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=5000&convert=USD',{headers: headers});
    return this.http.get('/v1/cryptocurrency/listings/latest/v1/cryptocurrency/listings/latest?start=1&limit=5000&convert=USD',{headers: headers});
  }

  loadInfo(valor?: string){
    return valor;
  }


  

  



 
}
