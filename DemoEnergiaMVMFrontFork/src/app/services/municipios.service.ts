import { environment } from './../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { MunicipioInfo } from '../models/municipioInfo';

@Injectable({
  providedIn: 'root'
})
export class MunicipiosService {

  constructor(private http: HttpClient) { }

  getMunicipios(): Observable<MunicipioInfo[]> {
    const url = environment.municipiosUrl;
    return this.http.get<MunicipioInfo[]>(url).pipe(
      map((result: any[]) => {
        return result.map((item: any) => {
          let municipioInfo: MunicipioInfo = {
            departamento: item.departamento,
            municipio: item.municipio
          }
          return municipioInfo;
        });
      })
    );
  }
}
