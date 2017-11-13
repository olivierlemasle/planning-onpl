import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpEventType } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


import { CalendarMonth } from './calendar-month';
import { UserInfo } from './user-info';
import { FileInput } from './file-input/file-input';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(private http: HttpClient, private formBuilder: FormBuilder) {}

  calendarMonth: CalendarMonth = new CalendarMonth();
  userInfo: UserInfo = new UserInfo();
  isBusy = false;
  progress = 0;
  importFormGroup: FormGroup;
  @ViewChild('stepper') stepper;

  ngOnInit() {
    this.importFormGroup = this.formBuilder.group({
      pdfFile: ['', [Validators.required]]
    });
    // this.stepper.selectedIndex = 2;
    this.http.get('/api/user').subscribe((data: UserInfo) => {
      this.userInfo = data;
    });
  }

  upload(input: FileInput) {
    if (!input) {
      return;
    }

    const pdfFile: File = input.file;
    this.isBusy = true;
    this.progress = 0;

    const req = new HttpRequest('POST', '/api/upload', pdfFile, {
      reportProgress: true
    });
    this.http.request(req).subscribe(event => {
      if (event.type === HttpEventType.UploadProgress && event.total) {
        const percentDone = Math.round(100 * event.loaded / event.total);
        this.progress = percentDone;
        console.log(`Le fichier est téléchargé à ${percentDone}%.`);
      } else if (event instanceof HttpResponse) {
        this.isBusy = false;
        if (event.status === 200) {
          this.calendarMonth = event.body as CalendarMonth;
        }
      }
    });
  }
}
