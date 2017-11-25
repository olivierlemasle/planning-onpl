import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';

import { BooleanResult } from './boolean-result';
import { SynchResult } from './synch-result';
import { CalendarMonth } from './calendar-month';
import { GoogleCalendar } from './google-calendar';


@Injectable()
export class GoogleCalendarService {

  constructor(private http: HttpClient) { }

  isLinkedToGCalendar(): Observable<BooleanResult> {
    return this.http.get<BooleanResult>('/api/protected/gCalendar');
  }

  revoke(): Observable<BooleanResult> {
    return this.http.get<BooleanResult>('/api/protected/revoke');
  }

  getCalendars(): Observable<GoogleCalendar[]> {
    return this.http.get<GoogleCalendar[]>('/api/protected/calendars');
  }

  pushEventsToCalendar(calendarId: string, calendarMonth: CalendarMonth): Observable<SynchResult> {
    return this.http.post<SynchResult>('/api/protected/push/' + calendarId, calendarMonth);
  }
}
