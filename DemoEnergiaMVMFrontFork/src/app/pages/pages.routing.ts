import { HistoricoDespachosComponent } from './regulador-mercado/historico-despachos/historico-despachos.component';
import { TokensGeneradorComponent } from './generador/tokens-generador/tokens-generador.component';
import { ListaComprasComponent } from './cliente/lista-compras/lista-compras.component';
import { ListaPlantasComponent } from './generador/lista-plantas/lista-plantas.component';
import { EmisionesCompraComponent } from './comercializador/emisiones-compra/emisiones-compra.component';
import { BancoEnergiaComponent } from './banco-energia/banco-energia.component';
import { SolicitudesComponent } from './regulador-mercado/solicitudes/solicitudes.component';
import { RegistrosComponent } from './regulador-mercado/registros/registros.component';
import { ComercializadorComponent } from './comercializador/comercializador.component';
import { ClienteDashboardComponent } from './cliente/cliente-dashboard.component';
import { ReguladorMercadoComponent } from './regulador-mercado/regulador-mercado.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AgregarGeneradorComponent } from './dashboard/agregar-generador/agregar-generador.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { VerGeneradoresComponent } from './dashboard/ver-generadores/ver-generadores.component';
import { AuthGuard } from '../guards/auth.guard';
import { ListaClientesComponent } from './comercializador/lista-clientes/lista-clientes.component';
import { GeneradorComponent } from './generador/generador.component';
import { TodosGeneradoresComponent } from './generador/todos-generadores/todos-generadores.component';
import { RegistrosDetalleComponent } from './regulador-mercado/registros/registros-detalle/registros-detalle.component';
import { ComprasRealizadasComponent } from './comercializador/compras-realizadas/compras-realizadas.component';
import { TransaccionesComponent } from './dashboard/transacciones/transacciones.component';
import { BancoEnergiaInformacionComponent } from './banco-energia/banco-energia-informacion/banco-energia-informacion.component';
import { TokensClienteComponent } from './cliente/tokens-cliente/tokens-cliente.component';
import { OrdenesDespachoComponent } from './regulador-mercado/ordenes-despacho/ordenes-despacho.component';


const routes: Routes = [
    {
        path: "dashboard",
        component: DashboardComponent,
        children: [
            {
                path: "",
                component: BancoEnergiaComponent
            },
            {
                path: "informacion",
                component: BancoEnergiaInformacionComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "regulador-mercado",
                component: ReguladorMercadoComponent,
                canActivate: [AuthGuard],
            },
            {
                path: "regulador-mercado/solicitudes",
                component: SolicitudesComponent,
                canActivate: [AuthGuard],
            },
            {
                path: "regulador-mercado/registros",
                component: RegistrosComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "regulador-mercado/registros/detalle",
                component: RegistrosDetalleComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "regulador-mercado/ordenes-despacho",
                component: OrdenesDespachoComponent,
                canActivate: [AuthGuard]
            }, {
                path: "regulador-mercado/historico-ordenes-despacho",
                component: HistoricoDespachosComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "cliente",
                component: ClienteDashboardComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "cliente/lista-compras",
                component: ListaComprasComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "cliente/tokens",
                component: TokensClienteComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "comercializador",
                component: ComercializadorComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "comercializador/lista-clientes",
                component: ListaClientesComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "comercializador/emisiones-de-compra/:tipo",
                component: EmisionesCompraComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "comercializador/compras-realizadas",
                component: ComprasRealizadasComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "generador",
                component: GeneradorComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "generador/tokens",
                component: TokensGeneradorComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "generador/lista-plantas-energia",
                component: ListaPlantasComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "agregarGenerador",
                component: AgregarGeneradorComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "verGeneradores",
                component: VerGeneradoresComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "todos-generadores",
                component: TodosGeneradoresComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "transacciones",
                component: TransaccionesComponent,
            }
        ]
    }
]
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PagesRoutingModule { }
