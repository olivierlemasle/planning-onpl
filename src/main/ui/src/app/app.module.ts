import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { MatButtonModule, MatRadioModule, MatSlideToggleModule, MatMenuModule,
  MatProgressBarModule, MatToolbarModule, MatStepperModule, MatIconModule,
  MatFormFieldModule, MatInputModule, MatTooltipModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MomentModule } from 'angular2-moment';

import { AppComponent } from './app.component';
import { GoogleCalendarComponent } from './google-calendar/google-calendar.component';
import { CalendarChooserComponent } from './calendar-chooser/calendar-chooser.component';

import { GoogleCalendarService } from './google-calendar.service';
import { CalendarDisplayComponent } from './calendar-display/calendar-display.component';
import { FileInputComponent } from './file-input/file-input.component';

@NgModule({
  declarations: [
    AppComponent,
    GoogleCalendarComponent,
    CalendarChooserComponent,
    CalendarDisplayComponent,
    FileInputComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule, ReactiveFormsModule,
    RouterModule.forRoot([
      { path: 'last', component: AppComponent}
    ]),
    MatButtonModule, MatRadioModule, MatSlideToggleModule, MatMenuModule,
    MatProgressBarModule, MatToolbarModule, MatStepperModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatTooltipModule,
    BrowserAnimationsModule,
    MomentModule
  ],
  providers: [
    GoogleCalendarService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
