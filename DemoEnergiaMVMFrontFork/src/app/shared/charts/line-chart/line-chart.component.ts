import { Component, OnInit, ViewChild } from '@angular/core';
import { Chart, ChartConfiguration, ChartDatasetProperties, ChartEvent, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import {default as Annotation} from '../../../../../node_modules/chartjs-plugin-annotation';
import { EthereumService } from 'src/app/services/dashboard/ethereum.service';
import { infoChart } from 'src/app/models/infoChart';


@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css']
})
export class LineChartComponent implements OnInit {

  textoPrueba = 'tittle';
  infoChart:[];
  constructor(private EthereumService: EthereumService ) { 
    Chart.register(Annotation)
  }

  ngOnInit(): void {
    console.log("oninit: ",this.textoPrueba)
    this.EthereumService.TriggerDataChartLine.subscribe(
      data => {
        this.infoChart = data.data
        console.log("data desde line-chart: ",this.infoChart);
      }
    )
    console.log("oninit luego de serviciio: ",this.textoPrueba)
  }

  ngOnChanges(){
    
  }


  public lineChartData: ChartConfiguration['data'] = {
    
    datasets: [
      {
        data: [200],
        label: 'Precio ETH (usd)',
        backgroundColor: 'rgba(12,199,132,0.2)',
        borderColor: 'rgba(12,199,132,1)',
        pointBackgroundColor: 'rgba(12,199,132,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(12,199,132,0.8)',
        fill: 'origin',
      },
    ],
    labels: [ 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio','Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'  ]
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    elements: {
      line: {
        tension: 0.1
      }
    },
    scales: {
      // We use this empty structure as a placeholder for dynamic theming.
      x: {},
      'y-axis-0':
        {
          position: 'left',
        }/*,
      'y-axis-1': {
        position: 'right',
        grid: {
          //color: 'rgba(255,0,0,0.3)',
        },
        ticks: {
          color: 'red'
        }
      }*/
    },

    plugins: {
      legend: { display: true },
      /*
      annotation: {
        
        annotations: [
          {
            type: 'line',
            scaleID: 'x',
            value: 'March',
            //borderColor: 'orange',
            borderWidth: 2,
            label: {
              position: 'center',
              //enabled: true,
              //color: 'orange',
              content: 'LineAnno',
              font: {
                weight: 'bold'
              }
            }
          },
        ],
      }*/
    }
  };

  public lineChartType: ChartType = 'line';

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  private static generateNumber(i: number): number {
    return Math.floor((Math.random() * (i < 2 ? 100 : 1000)) + 1);
  }

  public randomize(): void {
    for (let i = 0; i < this.lineChartData.datasets.length; i++) {
      for (let j = 0; j < this.lineChartData.datasets[i].data.length; j++) {
        this.lineChartData.datasets[i].data[j] = LineChartComponent.generateNumber(i);
      }
    }
    this.chart?.update();
  }

  // events
  public chartClicked({ event, active }: { event?: ChartEvent, active?: {}[] }): void {
    console.log(event, active);
  }

  public chartHovered({ event, active }: { event?: ChartEvent, active?: {}[] }): void {
    console.log(event, active);
  }

  public hideOne(): void {
    const isHidden = this.chart?.isDatasetHidden(1);
    this.chart?.hideDataset(1, !isHidden);
  }

  public pushOne(): void {
    this.lineChartData.datasets.forEach((x, i) => {
      const num = LineChartComponent.generateNumber(i);
      x.data.push(num);
    });
    this.lineChartData?.labels?.push(`Label ${ this.lineChartData.labels.length }`);

    this.chart?.update();
  }

  public changeColor(): void {
    this.lineChartData.datasets[2].borderColor = 'green';
    this.lineChartData.datasets[2].backgroundColor = `rgba(0, 255, 0, 0.3)`;

    this.chart?.update();
  }

  public changeLabel(): void {
    if (this.lineChartData.labels) {
      this.lineChartData.labels[2] = [ '1st Line', '2nd Line' ];
    }

    this.chart?.update();
  }

}
