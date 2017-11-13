import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { CalendarChooserComponent } from './calendar-chooser.component';
import { GoogleCalendarService } from '../google-calendar.service';
import { GoogleCalendar } from '../google-calendar';

describe('CalendarChooserComponent', () => {
  let component: CalendarChooserComponent;
  let fixture: ComponentFixture<CalendarChooserComponent>;

  beforeEach(async(() => {
    const googleCalendarService = {
      getCalendars(): Observable<GoogleCalendar[]> {
        const cal1 = new GoogleCalendar();
        cal1.id = '1';
        cal1.summary = 'firstCalendar';
        cal1.backgroundColor = '#eeeeee';

        const cal2 = new GoogleCalendar();
        cal2.id = '2';
        cal2.summary = 'secondCalendar';
        cal2.backgroundColor = '#ffffff';
        return Observable.of([
          cal1, cal2
        ]);
      }
    };

    TestBed.configureTestingModule({
      imports: [ FormsModule, MatRadioModule ],
      declarations: [ CalendarChooserComponent ],
      providers: [ {provide:  GoogleCalendarService, useValue: googleCalendarService} ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendarChooserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should have multiple options', () => {
    const radioButtons = fixture.debugElement.queryAll(By.css('input[type=radio]'));
    expect(radioButtons.length).toBe(2);
  });

  it('should allow the selection of a calendar', () => {
    fixture.debugElement.queryAll(By.css('input[type=radio]'))[1].nativeElement.click();
    expect(component.selectedCalendar.summary).toBe('secondCalendar');
  });
});
