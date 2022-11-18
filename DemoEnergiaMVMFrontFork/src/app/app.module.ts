import { Web3ConnectService } from 'src/app/services/web3-connect.service';
import { PagesModule } from './pages/pages.module';
import { SharedModule } from './shared/shared.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { AngularMaterialModule } from './anular-material.module';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxSpinnerModule } from 'ngx-spinner';
import { FlexModule } from '@angular/flex-layout';

import { ToastrModule } from 'ngx-toastr';
import { MatDialogModule } from '@angular/material/dialog';
import { WinRefService } from './services/win-ref.service';
import { HttpClientModule } from '@angular/common/http';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { NgChartsModule } from 'ng2-charts';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    AngularMaterialModule,
    AuthorizationModule,
    NgxSpinnerModule,
    BrowserAnimationsModule,
    SharedModule,
    PagesModule,
    FlexModule,
    ToastrModule.forRoot(),
    MatDialogModule,
    HttpClientModule,
    SweetAlert2Module.forRoot(),
    NgChartsModule 
  ],
  providers: [WinRefService, Web3ConnectService],
  bootstrap: [AppComponent]
})
export class AppModule { }
