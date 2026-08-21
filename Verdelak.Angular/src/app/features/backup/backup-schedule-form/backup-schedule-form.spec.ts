import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackupScheduleForm } from './backup-schedule-form';

describe('BackupScheduleForm', () => {
  let component: BackupScheduleForm;
  let fixture: ComponentFixture<BackupScheduleForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackupScheduleForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackupScheduleForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
