import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { LoginFormComponent, ResetPasswordFormComponent, CreateAccountFormComponent, ChangePasswordFormComponent } from './shared/components';
import { AuthGuardService } from './shared/services';
import { HomeComponent } from './pages/home/home.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { TasksComponent } from './pages/tasks/tasks.component';
import { 
  DxDataGridModule, 
  DxPieChartModule, 
  DxFormModule, 
  DxSelectBoxModule, 
  DxBulletModule, 
  DxPivotGridModule, 
  DxChartModule, 
  DxTreeListModule, 
  DxSchedulerModule, 
  DxTabPanelModule,
  DxGanttModule
} from 'devextreme-angular';
import { PivotGridComponent } from './pages/pivot-grid/pivot-grid.component';
import { TreeListComponent } from './pages/tree-list/tree-list.component';
import { SchedulerComponent } from './pages/scheduler/scheduler.component';
import { ApplyPipe } from './shared/pipes/apply.pipe';
import { AreaComponent } from './pages/charts/area/area.component';
import { BarComponent } from './pages/charts/bar/bar.component';
import { BulletComponent } from './pages/charts/bullet/bullet.component';
import { DonutComponent } from './pages/charts/donut/donut.component';
import { GanttComponent } from './pages/charts/gantt/gantt.component';

const routes: Routes = [
  {
    path: 'charts/area',
    component: AreaComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'charts/bar',
    component: BarComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'charts/bullet',
    component: BulletComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'charts/donut',
    component: DonutComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'charts/gantt',
    component: GanttComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'pivot',
    component: PivotGridComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'tree',
    component: TreeListComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'scheduler',
    component: SchedulerComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'tasks',
    component: TasksComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'login-form',
    component: LoginFormComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'reset-password',
    component: ResetPasswordFormComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'create-account',
    component: CreateAccountFormComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'change-password/:recoveryCode',
    component: ChangePasswordFormComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true }), 
            CommonModule,
            DxDataGridModule, 
            DxFormModule, 
            DxTabPanelModule, 
            DxTreeListModule,
            DxChartModule, 
            DxSchedulerModule,
            DxSelectBoxModule,
            DxBulletModule,
            DxPieChartModule,
            DxGanttModule,
            DxPivotGridModule],
  providers: [AuthGuardService],
  exports: [RouterModule],
  declarations: [
    ApplyPipe,
    HomeComponent,
    ProfileComponent,
    TasksComponent,
    PivotGridComponent,
    TreeListComponent,
    SchedulerComponent,
    AreaComponent,
    BarComponent,
    BulletComponent,
    DonutComponent,
    GanttComponent
  ]
})
export class AppRoutingModule { }
