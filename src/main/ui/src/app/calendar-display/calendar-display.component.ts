import { Component, OnInit, ViewEncapsulation, Input, OnChanges } from '@angular/core';

import { CalendarDay } from '../calendar-day';
import { Event } from '../event';
import { CalendarMonth } from '../calendar-month';

@Component({
  selector: 'app-calendar-display',
  templateUrl: './calendar-display.component.html',
  styleUrls: ['./calendar-display.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CalendarDisplayComponent implements OnChanges {
  @Input() calendarMonth: CalendarMonth;

  constructor() { }

  ngOnChanges() {
    this.save();
  }

  save() {
    sessionStorage.setItem('calendarMonth', JSON.stringify(this.calendarMonth));
  }

  private events(): Event[] {
    if (!this.calendarMonth || !this.calendarMonth.days) {
      return [];
    }
    return this.calendarMonth
      .days
      .map((day: CalendarDay) => day.events)
      .reduce((previous: Event[], current: Event[]) => previous.concat(current));
  }

  sameStatusForAll(): boolean {
    return !this.events().map((e: Event) => e.enabled)
      .some((value: boolean, index: number, array: boolean[]) => value !== array[0]);
  }

  allChecked(): boolean {
    return !this.events().map((e: Event) => e.enabled)
    .some((value: boolean, index: number, array: boolean[]) => !value);
  }

  globalChange(checked: boolean) {
    this.events().forEach((e: Event) => e.enabled = checked);
    this.save();
  }

}
