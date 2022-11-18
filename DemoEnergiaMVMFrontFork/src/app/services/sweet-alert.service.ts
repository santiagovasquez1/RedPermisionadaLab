import { Injectable } from '@angular/core';
import Swal, { SweetAlertResult } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class SweetAlertService {

  constructor() { }

  confirmAlert(title: string, message: string): Promise<SweetAlertResult> {
    return Swal.fire({
      title: title,
      text: message,
      icon: 'question',
      confirmButtonText: 'Si',
      cancelButtonText: 'No',
      showConfirmButton: true,
      showCancelButton: true,
      allowOutsideClick: false,
      reverseButtons: true,
      customClass: {
        title: '',
        htmlContainer: 'alert-htmlContainer',
        confirmButton: 'alert-confirm-button',
        cancelButton: 'alert-cancel-button',
        icon: 'alert-icon'
      }
    })
  }
}
