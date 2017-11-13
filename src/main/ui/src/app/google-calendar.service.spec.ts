import { TestBed, inject } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { GoogleCalendarService } from './google-calendar.service';

describe('GoogleCalendarService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [ GoogleCalendarService ]
    });
  });

  it('should be created', inject([GoogleCalendarService], (service: GoogleCalendarService) => {
    expect(service).toBeTruthy();
  }));
});
