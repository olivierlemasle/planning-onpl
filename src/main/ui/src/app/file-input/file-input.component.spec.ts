import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FileInputComponent } from './file-input.component';
import { A11yModule } from '@angular/cdk/a11y';
import { ErrorStateMatcher } from '@angular/material';

describe('FileInputComponent', () => {
  let component: FileInputComponent;
  let fixture: ComponentFixture<FileInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ A11yModule ],
      declarations: [ FileInputComponent ],
      providers: [{provide: ErrorStateMatcher, useValue: {isErrorState: () => true}}]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
