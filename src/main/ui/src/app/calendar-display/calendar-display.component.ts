import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';

import { CalendarDay } from '../calendar-day';

@Component({
  selector: 'app-calendar-display',
  templateUrl: './calendar-display.component.html',
  styleUrls: ['./calendar-display.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CalendarDisplayComponent implements OnInit {
  @Input() days: CalendarDay[];

  constructor() { }

  ngOnInit() {
  }

}
