import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { GoogleCalendarService } from '../google-calendar.service';
import { GoogleCalendar } from '../google-calendar';
import { CalendarMonth } from '../calendar-month';
import { CalendarDay } from '../calendar-day';
import { Event } from '../event';

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

  constructor(private googleCalendarService: GoogleCalendarService, public snackBar: MatSnackBar) { }

  ngOnInit() {
    this.googleCalendarService.isLinkedToGCalendar().subscribe(data => {
      this.isLinkedToGCalendar = data.result;
    });
  }

  filter(calendarMonth: CalendarMonth): CalendarMonth {
    const selectedCalendars = new CalendarMonth();
    selectedCalendars.month = calendarMonth.month;
    selectedCalendars.days = calendarMonth
      .days
      .map((day: CalendarDay) => {
        const filteredDay = new CalendarDay();
        filteredDay.date = day.date;
        filteredDay.events = day.events.filter((e: Event) => e.enabled);
        return filteredDay;
      });
      return selectedCalendars;
  }

  push(googleCalendar: GoogleCalendar) {
    this.isSynching = true;
    const selectedCalendars = this.filter(this.calendarMonth);
    this.googleCalendarService
      .pushEventsToCalendar(googleCalendar.id, selectedCalendars)
      .subscribe(
        data => {
          this.isSynching = false;
          let message = '';
          if (data.removed > 1) {
            message = `${data.removed} événements supprimés`;
          } else if (data.removed === 1) {
            message = '1 événement supprimé';
          }
          if (data.added > 0 && data.removed > 0) {
            message += ', ';
          }
          if (data.added > 1) {
            message += `${data.added} événements ajoutés`;
          } else if (data.added === 1) {
            message += '1 événement ajouté';
          }
          this.snackBar.open(message, null, {
            duration: 5000
          });
        },
        err => {
          this.isSynching = false;
          this.snackBar.open('Erreur de synchronisation', null, {
            duration: 5000
          });
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
