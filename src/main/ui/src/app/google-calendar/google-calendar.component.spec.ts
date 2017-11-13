import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule, MatProgressSpinnerModule, MatRadioModule } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { GoogleCalendarComponent } from './google-calendar.component';
import { GoogleCalendarService } from '../google-calendar.service';
import { BooleanResult } from '../boolean-result';
import { CalendarMonth } from '../calendar-month';
import { GoogleCalendar } from '../google-calendar';

describe('GoogleCalendarComponent', () => {
  let component: GoogleCalendarComponent;
  let fixture: ComponentFixture<GoogleCalendarComponent>;

  beforeEach(async(() => {
    const res = new BooleanResult();
    res.result = true;
    const googleCalendarService = {
      isLinkedToGCalendar(): Observable<BooleanResult> {
        return Observable.of(res);
      },
      revoke(): Observable<BooleanResult> {
        return Observable.of(res);
      },
      pushEventsToCalendar(calendarId: string, calendarMonth: CalendarMonth): Observable<BooleanResult> {
        return Observable.of(res);
      }
    };

    TestBed.configureTestingModule({
      imports: [ FormsModule, MatSlideToggleModule, MatProgressSpinnerModule ],
      declarations: [ GoogleCalendarComponent ],
      providers: [ {provide: GoogleCalendarService, useValue: googleCalendarService} ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GoogleCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
