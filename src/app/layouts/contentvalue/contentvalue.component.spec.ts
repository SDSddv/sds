import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentvalueComponent } from './contentvalue.component';

describe('ContentvalueComponent', () => {
  let component: ContentvalueComponent;
  let fixture: ComponentFixture<ContentvalueComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContentvalueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContentvalueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
