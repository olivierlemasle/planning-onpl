import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef} from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpEventType, HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, FormControl, ValidationErrors} from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { MatStepper, ErrorStateMatcher, MatSnackBar, MatIconRegistry } from '@angular/material';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { Subject } from 'rxjs/Subject';

import { CalendarMonth } from './calendar-month';
import { UserInfo } from './user-info';
import { FileInput } from './file-input/file-input';
import { BooleanResult } from './boolean-result';
import { CalendarDay } from './calendar-day';
import { Event } from './event';
import { monthInputValidator } from './month-input-validator';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  constructor(private http: HttpClient, private formBuilder: FormBuilder, private cd: ChangeDetectorRef,
    public snackBar: MatSnackBar, iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
      iconRegistry.addSvgIcon('github', sanitizer.bypassSecurityTrustResourceUrl('/assets/img/github.svg'));
    }

  calendarMonth: CalendarMonth = new CalendarMonth();
  userInfo: UserInfo = new UserInfo();
  isBusy = false;
  mode = 'determinate';
  progress = 0;
  successObserver = new Subject<boolean>();
  importFormGroup: FormGroup;
  @ViewChild(MatStepper) stepper: MatStepper;

  ngOnInit() {
    this.importFormGroup = this.formBuilder.group({
      pdfFile: ['', [Validators.required], [monthInputValidator(this.successObserver)]]
    });
    this.http.get('/api/user').subscribe((data: UserInfo) => {
      this.userInfo = data;
    });

    const sessionCalendarMonth = sessionStorage.getItem('calendarMonth');
    if (sessionCalendarMonth) {
      const obj = JSON.parse(sessionCalendarMonth) as CalendarMonth;
      if (obj) {
        this.calendarMonth = obj;
      }
    }
  }

  ngAfterViewInit() {
    const sessionStep = sessionStorage.getItem('step');
    if (sessionStep === '1' || sessionStep === '2') {
      this.importFormGroup.controls['pdfFile'].disable();
      this.stepper.selected.completed = true;
      this.stepper.selectedIndex = 1;
      this.cd.detectChanges();
    }
    if (sessionStep === '2') {
      this.stepper.selected.completed = true;
      this.stepper.selectedIndex = 2;
      this.cd.detectChanges();
    }
  }

  stepChanged(evt: StepperSelectionEvent) {
    sessionStorage.setItem('step', evt.selectedIndex.toString());
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
    this.http.request(req).subscribe(
      event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const percentDone = Math.round(100 * event.loaded / event.total);
          this.progress = percentDone;
          if (event.loaded === event.total) {
            this.mode = 'query';
          }
        } else if (event instanceof HttpResponse) {
          this.isBusy = false;
          this.successObserver.next(true);
          if (event.status === 200) {
            const resp = event.body as CalendarMonth;
            if (resp && resp.month) {
              this.calendarMonth = resp;
              this.calendarMonth.days.forEach((day: CalendarDay) => {
                day.events.forEach((e: Event) => {
                  e.enabled = true;
                });
              });
              this.snackBar.open('Le planning a été correctement importé.', null, {
                duration: 5000,
              });
            }
          }
        }
      },
      (error: HttpErrorResponse) => {
        this.isBusy = false;
        this.successObserver.next(false);
        let message: string;
        if (error.status === 400) {
          message = 'Le fichier importé n\' semble ne pas être un planning valide.';
        } else {
          message = 'Une erreur est survenue.';
        }
        this.snackBar.open(message, null, {
          duration: 5000,
        });
      }
    );
  }
}
