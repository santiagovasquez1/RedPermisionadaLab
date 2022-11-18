export interface FilterFormParameter {
    label: string;
    formControlName: string;
    controlType: 'text' | 'number' | 'select' | 'date';
    optionValues?: any[];
    pipe: '' | 'estadoRegistro' | 'tipoContrato' | 'tipoTransaccion' | 'estadoPlanta' | 'estadoCompra';
}

export interface RowFilterForm {
    fields: FilterFormParameter[];
}

export interface FieldValueChange {
    data: string;
    controlName: string;
}