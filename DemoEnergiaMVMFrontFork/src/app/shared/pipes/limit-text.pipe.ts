import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'limitText'
})
export class LimitTextPipe implements PipeTransform {

  transform(value: string, limit: number): string {
    let longText: string = (value.length > limit) ? value.slice(0, limit) + '...' : value;

    return longText;
  }

}
