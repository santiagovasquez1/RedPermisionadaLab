import { FormGroup } from '@angular/forms';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FormfieldValidatorService {

  constructor() { }

  fieldValidator(form: FormGroup, field: string) {
    if (!form.get(field).pristine || form.get(field).touched) {
      if (form.get(field).invalid) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }

  }
}
