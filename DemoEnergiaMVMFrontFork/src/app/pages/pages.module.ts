import { ClienteDashboardComponent } from './cliente/cliente-dashboard.component';
import { Web3ConnectService } from 'src/app/services/web3-connect.service';
import { SharedModule } from './../shared/shared.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AgregarGeneradorComponent } from './dashboard/agregar-generador/agregar-generador.component';
import { AppRoutingModule } from '../app-routing.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AngularMaterialModule } from '../anular-material.module';
import { FlexModule } from '@angular/flex-layout';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { VerGeneradoresComponent } from './dashboard/ver-generadores/ver-generadores.component';
import { GenerarEnergiaComponent } from '../shared/generar-energia/generar-energia.component';
import { WinRefService } from '../services/win-ref.service';
import { ReguladorMercadoService } from '../services/regulador-mercado.service';
import { ReguladorMercadoComponent } from './regulador-mercado/regulador-mercado.component';
import { ContratarComercializadorComponent } from './cliente/contratar-comercializador/contratar-comercializador.component';
import { ComprarEnergiaComponent } from './cliente/comprar-energia/comprar-energia.component';
import { ComercializadorComponent } from './comercializador/comercializador.component';
import { RegistrosComponent } from './regulador-mercado/registros/registros.component';
import { SolicitudesComponent } from './regulador-mercado/solicitudes/solicitudes.component';
import { InyectarTokensComponent } from './regulador-mercado/inyectar-tokens/inyectar-tokens.component';
import { ListaClientesComponent } from './comercializador/lista-clientes/lista-clientes.component';
import { BancoEnergiaComponent } from './banco-energia/banco-energia.component';
import { GeneradorComponent } from './generador/generador.component';
import { TodosGeneradoresComponent } from './generador/todos-generadores/todos-generadores.component';
import { EmisionesCompraComponent } from './comercializador/emisiones-compra/emisiones-compra.component';
import { NuevaEnergiaComponent } from './generador/nueva-energia/nueva-energia.component';
import { CompraEnergiaComponent } from './comercializador/compra-energia/compra-energia.component';
import { ContratarComercializadorGComponent } from './generador/contratar-comercializador-g/contratar-comercializador-g.component';
import { NgChartsModule } from 'ng2-charts';
import { MapaColombiaComponent } from './generador/todos-generadores/mapa-colombia/mapa-colombia.component';
import { DevolverTokensComponent } from './devolver-tokens/devolver-tokens.component';
import { PlantasEnergiaComponent } from './generador/plantas-energia/plantas-energia.component';
import { ListaPlantasComponent } from './generador/lista-plantas/lista-plantas.component';

import { MatIconModule } from '@angular/material/icon';
import { RegistrosDetalleComponent } from './regulador-mercado/registros/registros-detalle/registros-detalle.component';
import {MatTableModule} from '@angular/material/table';

import { ComprasRealizadasComponent } from './comercializador/compras-realizadas/compras-realizadas.component';
import { TransaccionesComponent } from './dashboard/transacciones/transacciones.component';
import { BancoEnergiaInformacionComponent } from './banco-energia/banco-energia-informacion/banco-energia-informacion.component';
import { ConsumirEnergiaComponent } from './cliente/consumir-energia/consumir-energia.component';
import { ListaComprasComponent } from './cliente/lista-compras/lista-compras.component';
import { TokensClienteComponent } from './cliente/tokens-cliente/tokens-cliente.component';
import { TokensGeneradorComponent } from './generador/tokens-generador/tokens-generador.component';
import { ComprarEnergiaBolsaComponent } from './generador/comprar-energia-bolsa/comprar-energia-bolsa.component';
import { OrdenesDespachoComponent } from './regulador-mercado/ordenes-despacho/ordenes-despacho.component';
import { ComprarTokensComponent } from './generador/tokens-generador/comprar-tokens/comprar-tokens.component';


@NgModule({
    declarations: [
        DashboardComponent,
        AgregarGeneradorComponent,
        VerGeneradoresComponent,
        ReguladorMercadoComponent,
        ClienteDashboardComponent,
        ContratarComercializadorComponent,
        ComprarEnergiaComponent,
        ComercializadorComponent,
        RegistrosComponent,
        SolicitudesComponent,
        InyectarTokensComponent,
        ListaClientesComponent,
        DevolverTokensComponent,
        BancoEnergiaComponent,
        GeneradorComponent,
        TodosGeneradoresComponent,
        EmisionesCompraComponent,
        NuevaEnergiaComponent,
        CompraEnergiaComponent,
        ContratarComercializadorGComponent,
        MapaColombiaComponent,
        PlantasEnergiaComponent,
        ListaPlantasComponent,
        RegistrosDetalleComponent,
        ComprasRealizadasComponent,
        TransaccionesComponent,
        BancoEnergiaInformacionComponent,
        ConsumirEnergiaComponent,
        ListaComprasComponent,
        TokensClienteComponent,
        TokensGeneradorComponent,
        ComprarEnergiaBolsaComponent,
        OrdenesDespachoComponent,
        ComprarTokensComponent,
    ],
    imports: [
        CommonModule,
        SharedModule,
        AppRoutingModule,
        ReactiveFormsModule,
        FormsModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        AngularMaterialModule,
        FlexModule,
        ToastrModule.forRoot(),
        BrowserAnimationsModule,
        NgChartsModule,
        MatIconModule,
        MatTableModule

        
    ],
    providers: [WinRefService, Web3ConnectService],
    exports: [
        DashboardComponent,
        AgregarGeneradorComponent,
        VerGeneradoresComponent,
        ReguladorMercadoComponent,
        ClienteDashboardComponent,
        ContratarComercializadorComponent,
        ComprarEnergiaComponent,
        ComercializadorComponent,
        RegistrosComponent,
        SolicitudesComponent,
        InyectarTokensComponent,
        ListaClientesComponent,
        DevolverTokensComponent,
        BancoEnergiaComponent,
        GeneradorComponent,
        TodosGeneradoresComponent,
        EmisionesCompraComponent,
        NuevaEnergiaComponent,
        CompraEnergiaComponent,
        ContratarComercializadorGComponent,
        MapaColombiaComponent,
        PlantasEnergiaComponent,
        ListaPlantasComponent,
        RegistrosDetalleComponent,
        ComprasRealizadasComponent,
        TransaccionesComponent,
    ]
   
})
export class PagesModule { }
