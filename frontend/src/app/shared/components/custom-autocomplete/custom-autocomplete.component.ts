import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

export interface AutocompleteOption {
  id: string;
  name: string;
  code: string;
  city: string;
  country: string;
}

@Component({
  selector: 'app-custom-autocomplete',
  templateUrl: './custom-autocomplete.component.html',
  styleUrls: ['./custom-autocomplete.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomAutocompleteComponent),
      multi: true
    }
  ]
})
export class CustomAutocompleteComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() options: AutocompleteOption[] = [];
  @Input() placeholder: string = '';
  @Input() icon: string = '';
  @Output() optionSelected = new EventEmitter<AutocompleteOption>();
  @Output() searchChanged = new EventEmitter<string>();

  @ViewChild('inputElement', { static: true }) inputElement!: ElementRef<HTMLInputElement>;
  @ViewChild('dropdownElement', { static: true }) dropdownElement!: ElementRef<HTMLDivElement>;

  searchTerm: string = '';
  displayValue: string = '';
  filteredOptions: AutocompleteOption[] = [];
  isOpen: boolean = false;
  highlightedIndex: number = -1;
  selectedOption: AutocompleteOption | null = null;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // ControlValueAccessor
  private onChange = (value: any) => {};
  private onTouched = () => {};

  constructor() {}

  ngOnInit(): void {
    this.setupSearch();
    this.filteredOptions = this.options;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.filterOptions(term);
      this.searchChanged.emit(term);
    });
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.displayValue = target.value;
    this.searchSubject.next(this.searchTerm);
    this.isOpen = true;
    this.highlightedIndex = -1;
    
    // Clear selection if user types
    if (this.selectedOption && this.displayValue !== this.getDisplayText(this.selectedOption)) {
      this.selectedOption = null;
      this.onChange(null);
    }
  }

  onFocus(): void {
    this.isOpen = true;
    if (this.filteredOptions.length === 0) {
      this.filteredOptions = this.options;
    }
  }

  onBlur(): void {
    // Delay to allow click on option
    setTimeout(() => {
      this.isOpen = false;
      this.onTouched();
    }, 200);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.filteredOptions.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredOptions.length) {
          this.selectOption(this.filteredOptions[this.highlightedIndex]);
        }
        break;
      case 'Escape':
        this.isOpen = false;
        this.inputElement.nativeElement.blur();
        break;
    }
  }

  selectOption(option: AutocompleteOption): void {
    this.selectedOption = option;
    this.displayValue = this.getDisplayText(option);
    this.searchTerm = this.displayValue;
    this.isOpen = false;
    this.highlightedIndex = -1;
    
    this.optionSelected.emit(option);
    this.onChange(option);
    this.onTouched();
  }

  private filterOptions(term: string): void {
    if (!term.trim()) {
      this.filteredOptions = this.options;
      return;
    }

    const searchTerm = term.toLowerCase();
    this.filteredOptions = this.options.filter(option =>
      option.name.toLowerCase().includes(searchTerm) ||
      option.code.toLowerCase().includes(searchTerm) ||
      option.city.toLowerCase().includes(searchTerm) ||
      option.country.toLowerCase().includes(searchTerm)
    );
  }

  private getDisplayText(option: AutocompleteOption): string {
    return `${option.name} (${option.code})`;
  }

  getIconPath(): string {
    switch (this.icon) {
      case 'takeoff':
        return 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8';
      case 'landing':
        return 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8';
      default:
        return 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z';
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: AutocompleteOption | null): void {
    if (value) {
      this.selectedOption = value;
      this.displayValue = this.getDisplayText(value);
      this.searchTerm = this.displayValue;
    } else {
      this.selectedOption = null;
      this.displayValue = '';
      this.searchTerm = '';
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.inputElement) {
      this.inputElement.nativeElement.disabled = isDisabled;
    }
  }
}