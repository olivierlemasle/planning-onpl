import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { GoogleCalendarService } from '../google-calendar.service';
import { GoogleCalendar } from '../google-calendar';


@Component({
  selector: 'app-calendar-chooser',
  templateUrl: './calendar-chooser.component.html',
  styleUrls: ['./calendar-chooser.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CalendarChooserComponent implements OnInit {
  calendars: GoogleCalendar[];
  selectedCalendar: GoogleCalendar;

  constructor(private googleCalendarService: GoogleCalendarService) { }

  ngOnInit() {
    this.googleCalendarService.getCalendars().subscribe(data => {
      this.calendars = data;
    });
  }

}
