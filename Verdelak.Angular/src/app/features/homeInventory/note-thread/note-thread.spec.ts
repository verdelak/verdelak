import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteThread } from './note-thread';

describe('NoteThread', () => {
  let component: NoteThread;
  let fixture: ComponentFixture<NoteThread>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteThread]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoteThread);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
