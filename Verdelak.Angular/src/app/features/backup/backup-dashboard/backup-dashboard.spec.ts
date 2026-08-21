import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackupDashboard } from './backup-dashboard';

describe('BackupDashboard', () => {
  let component: BackupDashboard;
  let fixture: ComponentFixture<BackupDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackupDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackupDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
