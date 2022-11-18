import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { InfoCertificadoVentaEnergia, InfoMappingCertificado } from 'src/app/models/InfoCertificados';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CertificadorContractService } from 'src/app/services/certificador-contract.service';

@Component({
  selector: 'app-info-certificado-compra',
  templateUrl: './info-certificado-compra.component.html',
  styles: []
})
export class InfoCertificadoCompraComponent implements OnInit {

  infoCertificadoCompra: InfoCertificadoVentaEnergia;

  constructor(public dialogRef: MatDialogRef<InfoCertificadoCompraComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InfoMappingCertificado,
    private certificador: CertificadorContractService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService) { }

  async ngOnInit() {
    try {
      await this.certificador.loadBlockChainContractData('');
      this.spinner.show();
      this.certificador.getCertificadoCompra(this.data).subscribe({
        next: (data) => {
          this.infoCertificadoCompra = data;
          this.spinner.hide();
        },
        error: (err) => {
          console.log(err);
          this.spinner.hide();
          this.toastr.error('Error al obtener el certificado de compra', 'Error');
          this.dialogRef.close();
        }
      })
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
      this.dialogRef.close();
    }
  }

}
