import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { GoogleCalendarService } from '../google-calendar.service';
import { GoogleCalendar } from '../google-calendar';
import { CalendarMonth } from '../calendar-month';

@Component({
  selector: 'app-google-calendar',
  templateUrl: './google-calendar.component.html',
  styleUrls: ['./google-calendar.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class GoogleCalendarComponent implements OnInit {
  @Input() calendarMonth: CalendarMonth;
  isLinkedToGCalendar = false;
  isSynching = false;

  constructor(private googleCalendarService: GoogleCalendarService) { }

  ngOnInit() {
    this.googleCalendarService.isLinkedToGCalendar().subscribe(data => {
      this.isLinkedToGCalendar = data.result;
    });
  }

  push(googleCalendar: GoogleCalendar) {
    this.isSynching = true;
    this.googleCalendarService
      .pushEventsToCalendar(googleCalendar.id, this.calendarMonth)
      .subscribe(data => {
        this.isSynching = false;
      });
  }

  change() {
    if (this.isLinkedToGCalendar) {
      window.location.href = '/api/protected/auth';
    } else {
      this.googleCalendarService.revoke().subscribe(data => {});
    }
  }

}
