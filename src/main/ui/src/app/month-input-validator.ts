import { AsyncValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/take';

export function monthInputValidator(successObserver: Observable<boolean>): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> =>
    successObserver
      .map((success: boolean) => success ? null : { 'invalidFile': {}})
      .take(1);
}
