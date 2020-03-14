import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentpropComponent } from './contentprop.component';

describe('ContentpropComponent', () => {
  let component: ContentpropComponent;
  let fixture: ComponentFixture<ContentpropComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContentpropComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContentpropComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
