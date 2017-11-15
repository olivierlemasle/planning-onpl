import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpEventType } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, FormControl} from '@angular/forms';
import { Router } from '@angular/router';
import { MatStepper, ErrorStateMatcher } from '@angular/material';
import { StepperSelectionEvent } from '@angular/cdk/stepper';

import { CalendarMonth } from './calendar-month';
import { UserInfo } from './user-info';
import { FileInput } from './file-input/file-input';
import { BooleanResult } from './boolean-result';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(private http: HttpClient, private formBuilder: FormBuilder, private router: Router) {}

  calendarMonth: CalendarMonth = new CalendarMonth();
  userInfo: UserInfo = new UserInfo();
  isBusy = false;
  mode = 'determinate';
  progress = 0;
  importFormGroup: FormGroup;
  @ViewChild(MatStepper) stepper: MatStepper;

  ngOnInit() {
    this.importFormGroup = this.formBuilder.group({
      pdfFile: ['', [Validators.required]]
    });
    this.http.get('/api/session').subscribe((data: CalendarMonth) => {
      if (data.month) {
        this.calendarMonth = data;
        this.importFormGroup.controls['pdfFile'].disable();
        this.stepper.selected.completed = true;
        this.stepper.selectedIndex = 1;
        if (this.router.url === '/last') {
          this.stepper.selected.completed = true;
          this.stepper.selectedIndex = 2;
        }
      }
    });
    this.http.get('/api/user').subscribe((data: UserInfo) => {
      this.userInfo = data;
    });
  }

  stepChanged(evt: StepperSelectionEvent) {
    console.log(evt);
  }

  upload(input: FileInput) {
    if (!input) {
      return;
    }

    const pdfFile: File = input.file;
    this.isBusy = true;
    this.progress = 0;
    this.mode = 'determinate';

    const req = new HttpRequest('POST', '/api/upload', pdfFile, {
      reportProgress: true
    });
    this.http.request(req).subscribe(event => {
      if (event.type === HttpEventType.UploadProgress && event.total) {
        const percentDone = Math.round(100 * event.loaded / event.total);
        this.progress = percentDone;
        console.log(`Le fichier est téléchargé à ${percentDone}%.`);
        if (event.loaded === event.total) {
          this.mode = 'query';
        }
      } else if (event instanceof HttpResponse) {
        this.isBusy = false;
        if (event.status === 200) {
          const resp = event.body as CalendarMonth;
          if (resp && resp.month) {
            this.calendarMonth = resp;
          }
        }
      }
    });
  }
}
