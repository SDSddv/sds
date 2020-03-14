import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PagesplitComponent } from './pagesplit.component';

describe('PagesplitComponent', () => {
  let component: PagesplitComponent;
  let fixture: ComponentFixture<PagesplitComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PagesplitComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PagesplitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
