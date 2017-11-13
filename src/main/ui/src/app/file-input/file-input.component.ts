import { Component, Input, HostBinding, Renderer2, ElementRef, HostListener, OnDestroy, DoCheck, Optional, Self } from '@angular/core';
import { MatFormFieldControl } from '@angular/material';
import { FormBuilder, NgControl, FormControl, ControlValueAccessor, NgForm, FormGroupDirective } from '@angular/forms';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {ErrorStateMatcher} from '@angular/material/core';
import { FocusMonitor } from '@angular/cdk/a11y';

import { Subject } from 'rxjs/Subject';

import { FileInput } from './file-input';

@Component({
  selector: 'app-file-input',
  templateUrl: './file-input.component.html',
  styleUrls: ['./file-input.component.css'],
  providers: [{provide: MatFormFieldControl, useExisting: FileInputComponent}]
})
export class FileInputComponent implements MatFormFieldControl<FileInput>, ControlValueAccessor, OnDestroy, DoCheck {

  static nextId = 0;

  constructor(@Optional() @Self() public ngControl: NgControl, private fm: FocusMonitor, private elRef: ElementRef,
    private renderer: Renderer2,
    @Optional() protected _parentForm: NgForm,
    @Optional() protected _parentFormGroup: FormGroupDirective,
    private _defaultErrorStateMatcher: ErrorStateMatcher) {
      if (ngControl) {
       ngControl.valueAccessor = this;
      }
      fm.monitor(elRef.nativeElement, renderer, true).subscribe(origin => {
        this.focused = !!origin;
        this.stateChanges.next();
      });
  }

  stateChanges = new Subject<void>();
  focused = false;

  @Input() get value(): FileInput | null {
    return this.empty ? null : new FileInput(this.elRef.nativeElement.value || []);
  }

  set value(fileInput: FileInput | null) {
    this.writeValue(fileInput.file);
    this.stateChanges.next();
  }

  @HostBinding() id = `app-file-input-${FileInputComponent.nextId++}`;

  @Input()
  get placeholder() {
    return this._placeholder;
  }
  set placeholder(plh) {
    this._placeholder = plh;
    this.stateChanges.next();
  }
  private _placeholder: string;

  @Input() valuePlaceholder: string;

  get empty() {
    return !this.elRef.nativeElement.value || this.elRef.nativeElement.value.length === 0;
  }

  @HostBinding('class.floating')
  get shouldPlaceholderFloat() {
    return this.focused || !this.empty || this.valuePlaceholder !== undefined;
  }

  @Input()
  get required() {
    return this._required;
  }
  set required(req) {
    this._required = coerceBooleanProperty(req);
    this.stateChanges.next();
  }
  private _required = false;

  @Input()
  get disabled() {
    return this._disabled;
  }
  set disabled(dis) {
    this._disabled = coerceBooleanProperty(dis);
    this.stateChanges.next();
  }
  private _disabled = false;

  @Input() errorStateMatcher: ErrorStateMatcher;

  errorState = false;
  /*@Input() get errorState() {
    return this.ngControl.errors !== null && this.ngControl.touched;
  }*/

  controlType = 'file-input';

  @HostBinding('attr.aria-describedby') describedBy = '';

  setDescribedByIds(ids: string[]) {
    this.describedBy = ids.join(' ');
  }

  private _onChange = (_: any) => { };
  private _onTouched = () => { };

  writeValue(obj: any): void {
    this.renderer.setProperty(this.elRef.nativeElement, 'value', obj);
  }

  registerOnChange(fn: (_: any) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  @HostListener('change', ['$event']) change(event) {
    const fileList = event.target.files;
    if (fileList.length > 0) {
      this.value = new FileInput(fileList[0]);
    } else {
      this.value = new FileInput(null);
    }
    this._onChange(this.value);
  }

  @HostListener('focusout') blur() {
    this.focused = false;
    this._onTouched();
  }

  onContainerClick(event: MouseEvent) {
    if ((event.target as Element).tagName.toLowerCase() !== 'input' && !this.disabled) {
      this.elRef.nativeElement.querySelector('input').focus();
      this.focused = true;
      this.open();
    }
  }

  open() {
    if (!this.disabled) {
      this.elRef.nativeElement.querySelector('input').click();
    }
  }

  get fileName() {
    return this.value ? this.value.file.name : this.valuePlaceholder;
  }

  ngOnDestroy() {
    this.stateChanges.complete();
    this.fm.stopMonitoring(this.elRef.nativeElement);
  }

  ngDoCheck() {
    if (this.ngControl) {
      this._updateErrorState();
    }
  }

  protected _updateErrorState() {
    const oldState = this.errorState;
    const parent = this._parentFormGroup || this._parentForm;
    const matcher = this.errorStateMatcher || this._defaultErrorStateMatcher;
    const control = this.ngControl ? this.ngControl.control as FormControl : null;
    const newState = matcher.isErrorState(control, parent);

    if (newState !== oldState) {
      this.errorState = newState;
      this.stateChanges.next();
    }
  }
}
