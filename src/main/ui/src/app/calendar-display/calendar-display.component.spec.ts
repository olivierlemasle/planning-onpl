import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MomentModule } from 'angular2-moment/moment.module';

import { CalendarDisplayComponent } from './calendar-display.component';

describe('CalendarDisplayComponent', () => {
  let component: CalendarDisplayComponent;
  let fixture: ComponentFixture<CalendarDisplayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CalendarDisplayComponent ],
      imports: [ MomentModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendarDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
