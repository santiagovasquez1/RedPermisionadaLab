import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { tap, from, Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private reguladorMercadoService: ReguladorMercadoService, private router: Router) {

  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    return new Promise(async (resolve, reject) => {
      try {
        await this.reguladorMercadoService.loadBlockChainContractData();
        this.reguladorMercadoService.validarUsuario().subscribe({
          next: (data: any) => {
            if (data[0]) {
              resolve(true);
            } else {
              this.router.navigate(['/login']);
              resolve(false);
            }
          }, error: (err) => {
            console.log(err);
            this.router.navigate(['/login']);
            reject(false);
          }
        })
      } catch (error) {
        console.log(error);
        this.router.navigate(['/login']);
        reject(false);
      }
    });
  }

}
