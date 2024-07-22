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
  DxGanttModule,
  DxAccordionModule,
  DxCheckBoxModule,
  DxSliderModule,
  DxTagBoxModule,
  DxMenuModule,
  DxTabsModule,
  DxToolbarModule,
  DxListModule,
  DxTreeViewModule,
  DxBoxModule,
  DxScrollViewModule,
  DxTileViewModule,
  DxGalleryModule,
  DxResizableModule,
  DxSplitterModule,
  DxAutocompleteModule,
  DxCalendarModule,
  DxDateBoxModule,
  DxColorBoxModule,
  DxDropDownBoxModule,
  DxNumberBoxModule,
  DxTextBoxModule,
  DxTextAreaModule,
  DxPopoverModule,
  DxLinearGaugeModule,
  DxCircularGaugeModule,
  DxBarGaugeModule,
  DxFileUploaderModule,
  DxFileManagerModule,
  DxButtonModule,
  DxPopupModule
} from 'devextreme-angular';
import { PivotGridComponent } from './pivot-grid/pivot-grid.component';
import { TreeListComponent } from './pages/tree-list/tree-list.component';
import { SchedulerComponent } from './pages/scheduler/scheduler.component';
import { ApplyPipe } from './shared/pipes/apply.pipe';
import { AreaComponent } from './pages/charts/area/area.component';
import { BarComponent } from './pages/charts/bar/bar.component';
import { BulletComponent } from './pages/charts/bullet/bullet.component';
import { DonutComponent } from './pages/charts/donut/donut.component';
import { GanttComponent } from './pages/charts/gantt/gantt.component';
import { AccordionComponent } from './pages/nav/accordion/accordion.component';
import { MenuComponent } from './pages/nav/menu/menu.component';
import { TabPanelComponent } from './pages/nav/tab-panel/tab-panel.component';
import { TabsComponent } from './pages/nav/tabs/tabs.component';
import { ToolbarComponent } from './pages/nav/toolbar/toolbar.component';
import { TreeviewComponent } from './pages/nav/treeview/treeview.component';
import { DxiItemModule } from 'devextreme-angular/ui/nested';
import { TileViewComponent } from './pages/layout/tile-view/tile-view.component';
import { SplitterComponent } from './pages/layout/splitter/splitter.component';
import { GalleryComponent } from './pages/layout/gallery/gallery.component';
import { ScrollViewComponent } from './pages/layout/scroll-view/scroll-view.component';
import { BoxComponent } from './pages/layout/box/box.component';
import { ResizableComponent } from './pages/layout/resizable/resizable.component';
import { AutocompleteComponent } from './pages/editors/autocomplete/autocomplete.component';
import { CalendarComponent } from './pages/editors/calendar/calendar.component';
import { CheckboxComponent } from './pages/editors/checkbox/checkbox.component';
import { ColorboxComponent } from './pages/editors/colorbox/colorbox.component';
import { DateboxComponent } from './pages/editors/datebox/datebox.component';
import { DropdownComponent } from './pages/editors/dropdown/dropdown.component';
import { NumberboxComponent } from './pages/editors/numberbox/numberbox.component';
import { SelectboxComponent } from './pages/editors/selectbox/selectbox.component';
import { TextboxComponent } from './pages/editors/textbox/textbox.component';
import { TagboxComponent } from './pages/editors/tagbox/tagbox.component';
import { TextareaComponent } from './pages/editors/textarea/textarea.component';
import { ButtongroupComponent } from './pages/forms/buttongroup/buttongroup.component';
import { FieldsetComponent } from './pages/forms/fieldset/fieldset.component';
import { RadiogroupComponent } from './pages/forms/radiogroup/radiogroup.component';
import { RangesliderComponent } from './pages/forms/rangeslider/rangeslider.component';
import { GaugeBarComponent } from './pages/gauges/gaugebar/gaugebar.component';
import { PaletteComponent } from './pages/gauges/palette/palette.component';
import { CircleComponent } from './pages/gauges/circle/circle.component';
import { LinearComponent } from './pages/gauges/linear/linear.component';
import { FileuploaderComponent } from './pages/files/fileuploader/fileuploader.component';
import { FilemanagerComponent } from './pages/files/filemanager/filemanager.component';

const routes: Routes = [

  {
    path: 'files/upload',
    component: FileuploaderComponent,
    canActivate: [ AuthGuardService ]
  },
    {
      path: 'files/manager',
      component: FilemanagerComponent,
      canActivate: [ AuthGuardService ]
    },


  {
    path: 'gauges/bar',
    component: GaugeBarComponent,
    canActivate: [ AuthGuardService ]
  },
    {
      path: 'gauges/palette',
      component: PaletteComponent,
      canActivate: [ AuthGuardService ]
    },
      {
        path: 'gauges/circle',
        component: CircleComponent,
        canActivate: [ AuthGuardService ]
      },
        {
          path: 'gauges/linear',
          component: LinearComponent ,
          canActivate: [ AuthGuardService ]
        },
  {
    path: 'editors/auto',
    component: AutocompleteComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'editors/calendar',
    component: CalendarComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'editors/check',
    component: CheckboxComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'editors/color',
    component: ColorboxComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'editors/date',
    component: DateboxComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'editors/drop',
    component: DropdownComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'editors/number',
    component: NumberboxComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'editors/select',
    component: SelectboxComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'editors/textbox',
    component: TextboxComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'editors/tagbox',
    component: TagboxComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'editors/textarea',
    component: TextareaComponent,
    canActivate: [ AuthGuardService ]
  },  
  {
    path: 'layout/box',
    component: BoxComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'layout/gallery',
    component: GalleryComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'layout/resizable',
    component: ResizableComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'layout/scrollview',
    component: ScrollViewComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'layout/spliiter',
    component: SplitterComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'layout/tileview',
    component: TileViewComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'nav/accordion',
    component: AccordionComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'nav/menu',
    component: MenuComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'nav/tabs',
    component: TabsComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'nav/tabPanel',
    component: TabPanelComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'nav/toolbar',
    component: ToolbarComponent,
    canActivate: [ AuthGuardService ]
  },
  {
    path: 'nav/treeview',
    component: TreeviewComponent,
    canActivate: [ AuthGuardService ]
  },
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
            DxAccordionModule,
            DxCheckBoxModule,
            DxTagBoxModule,
            DxSliderModule,
            DxMenuModule,
            DxTabsModule,
            DxToolbarModule,
            DxListModule,
            DxAutocompleteModule,
            DxTreeViewModule,
            DxiItemModule,
            DxBoxModule,
            DxTextBoxModule,
            DxScrollViewModule,
            DxSplitterModule,
            DxResizableModule,
            DxGalleryModule,
            DxTileViewModule,
            DxNumberBoxModule,
            DxCalendarModule,
            DxPopoverModule,
            DxTextAreaModule,
            DxDropDownBoxModule,
            DxColorBoxModule,
            DxLinearGaugeModule,
            DxPopupModule,
            DxCircularGaugeModule,
            DxFileUploaderModule,
            DxFileManagerModule,
            DxButtonModule,
            DxDateBoxModule,
            DxBarGaugeModule,
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
    GanttComponent,
    AccordionComponent,
    MenuComponent,
    TabPanelComponent,
    TabsComponent,
    ToolbarComponent, 
    TreeviewComponent,
    TileViewComponent,
    SplitterComponent,
    GalleryComponent,
    ScrollViewComponent,
    BoxComponent,
    ResizableComponent,
    AutocompleteComponent,
    CalendarComponent,
    CheckboxComponent,
    ColorboxComponent,
    DateboxComponent,
    DropdownComponent,
    NumberboxComponent,
    SelectboxComponent,
    TextboxComponent,
    TagboxComponent,
    TextareaComponent,
    ButtongroupComponent,
    FieldsetComponent,
    RadiogroupComponent,
    RangesliderComponent,
    GaugeBarComponent,
    PaletteComponent,
    CircleComponent,
    LinearComponent,
    FileuploaderComponent,
    FilemanagerComponent
  ]
})
export class AppRoutingModule { }
