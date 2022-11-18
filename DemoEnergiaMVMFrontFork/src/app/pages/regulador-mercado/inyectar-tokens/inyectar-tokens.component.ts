import { ToastrService } from 'ngx-toastr';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';

@Component({
  selector: 'app-inyectar-tokens',
  templateUrl: './inyectar-tokens.component.html',
  styles: [
  ]
})
export class InyectarTokensComponent implements OnInit {
  cantidadTokens: number = 0;

  constructor(public dialogRef: MatDialogRef<InyectarTokensComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService,
    private reguladorMercado: ReguladorMercadoService,
    private toastr: ToastrService) { }

  async ngOnInit() {
    await this.reguladorMercado.loadBlockChainContractData();
  }

  get isValid(): boolean {
    return this.cantidadTokens > 0;
  }

  onInyectarTokens() {
    this.alertDialog.confirmAlert('Inyectar Tokens', '¿Está seguro de inyectar tokens?').then(res => {
      if (res.isConfirmed) {
        this.spinner.show();
        this.reguladorMercado.postGenerarTokens(this.cantidadTokens).subscribe(
          {
            next: () => {
              this.spinner.hide();
              this.dialogRef.close();
              this.toastr.success('Tokens inyectados correctamente');
            },
            error: (err) => {
              this.spinner.hide();
              console.log(err);
              this.toastr.error(err.message, 'Error');
              this.dialogRef.close();
            }
          }
        );
      }
    })
  }
}
