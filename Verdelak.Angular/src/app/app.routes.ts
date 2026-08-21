import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
    },

    {
        path: 'links',
        canActivate: [authGuard],
        loadComponent: () => import('./features/Links/links/links').then(m => m.LinksComponent)
    },
    {
        path: 'blog',
        canActivate: [authGuard],
        loadComponent: () => import('./features/blog/blog-list/blog-list').then(m => m.BlogList)
    },
    {
        path: 'blog/:slug',
        canActivate: [authGuard],
        loadComponent: () => import('./features/blog/blog-detail/blog-detail').then(m => m.BlogDetail)
    },
    {
        path: 'resume',
        canActivate: [authGuard],
        loadComponent: () => import('./features/resume/resume-page/resume-page').then(m => m.ResumePage)
    },
    {
        path: 'site-map',
        canActivate: [authGuard],
        loadComponent: () => import('./features/site-map/site-map/site-map').then(m => m.SiteMap)
    },
    {
        path: 'spookytown',
        canActivate: [authGuard],
        loadComponent: () => import('./features/spookytown/spookytown-browser/spookytown-browser').then(m => m.SpookytownBrowser)
    },
    {
        path: 'books/want-list',
        canActivate: [authGuard],
        loadComponent: () => import('./features/books/book-want-list/book-want-list').then(m => m.BookWantList)
    },
    {
        path: 'books',
        canActivate: [authGuard],
        loadComponent: () => import('./features/books/book-browser/book-browser').then(m => m.BookBrowser)
    },
    {
        path: 'books/:format',
        canActivate: [authGuard],
        loadComponent: () => import('./features/books/book-browser/book-browser').then(m => m.BookBrowser)
    },
    {
      path: 'music/want-list',
      canActivate: [authGuard],
      loadComponent: () => import('./features/music/music-want-list/music-want-list').then(m => m.MusicWantList)
    },
    {
      path: 'music/metal-archives',
      canActivate: [authGuard],
      loadComponent: () => import('./features/music/metal-archives-gap-finder/metal-archives-gap-finder').then(m => m.MetalArchivesGapFinder)
    },
    {
      path: 'music/:format',
      canActivate: [authGuard],
        loadComponent: () => import('./features/music/music-browser/music-browser').then(m => m.MusicBrowser)
    },
    {
        path: 'home-inventory',
        canActivate: [authGuard],
        loadComponent: () => import('./features/homeInventory/home-inventory/home-inventory').then(m => m.HomeInventory),
        children: [
            {
                path: '',
                loadComponent: () => import('./features/homeInventory/item-list/item-list').then(m => m.ItemList)
            },
            {
                path: ':id',
                loadComponent: () => import('./features/homeInventory/item-detail/item-detail').then(m => m.ItemDetail)
            }
        ]
    },
    {
        path: 'boardgames/new',
        canActivate: [authGuard],
        data: { roles: ['Admin'] },
        loadComponent: () =>
        import('./features/boardgames/boardgame-form/boardgame-form').then(m => m.BoardgameFormComponent)
    },
    {
        path: 'boardgames/:id',
        canActivate: [authGuard],
        loadComponent: () =>
        import('./features/boardgames/boardgame-detail/boardgame-detail').then(m => m.BoardgameDetailComponent),
    },
    {
        path: 'boardgames',
        canActivate: [authGuard],
        loadComponent: () =>
        import('./features/boardgames/boardgame-list/boardgame-list').then(m => m.BoardgameListComponent),
    },
    {
        path: 'chessex',
        canActivate: [authGuard],
        loadComponent: () => import('./features/chessex/chessex-browser/chessex-browser').then(m => m.ChessexBrowser)
    },
    {
        path: 'mtg/want-list',
        canActivate: [authGuard],
        data: { status: 'W' },
        loadComponent: () => import('./features/mtg/mtg-browser/mtg-browser').then(m => m.MtgBrowser)
    },
    {
        path: 'mtg',
        canActivate: [authGuard],
        loadComponent: () => import('./features/mtg/mtg-browser/mtg-browser').then(m => m.MtgBrowser)
    },
    {
        path: 'phone-list',
        canActivate: [authGuard],
        loadComponent: () => import('./features/phone-list/phone-list-browser/phone-list-browser').then(m => m.PhoneListBrowser)
    },
    {
        path: 'shopping-list',
        canActivate: [authGuard],
        loadComponent: () => import('./features/shopping-list/shopping-list-page/shopping-list-page').then(m => m.ShoppingListPage)
    },
    {
        path: 'finance-tracker',
        canActivate: [authGuard],
        data: { roles: ['Admin'] },
        loadComponent: () => import('./features/finance-tracker/finance-dashboard-page/finance-dashboard-page').then(m => m.FinanceTrackerPage)
    },
    {
        path: 'full-tilt',
        canActivate: [authGuard],
        loadComponent: () => import('./features/full-tilt/full-tilt-page/full-tilt-page').then(m => m.FullTiltPage)
    },
    {
        path: 'guitar',
        canActivate: [authGuard],
        loadComponent: () => import('./features/guitar/guitar-explorer/guitar-explorer').then(m => m.GuitarExplorer)
    },
    {
        path: 'recipes',
        canActivate: [authGuard],
        loadComponent: () => import('./features/recipes/recipe-browser/recipe-browser').then(m => m.RecipeBrowser)
    },
    {
        path: 'toys',
        canActivate: [authGuard],
        loadComponent: () => import('./features/toys/toy-browser/toy-browser').then(m => m.ToyBrowser)
    },
    {
        path: 'minis/want-list',
        canActivate: [authGuard],
        loadComponent: () => import('./features/minis/miniatures-want-list/miniatures-want-list').then(m => m.MiniaturesWantList)
    },
    {
        path: 'minis',
        canActivate: [authGuard],
        loadComponent: () => import('./features/minis/miniatures-browser/miniatures-browser').then(m => m.MiniaturesBrowser)
    },
    {
        path: 'dice-games',
        canActivate: [authGuard],
        loadComponent: () => import('./features/dice-games/dice-games-browser/dice-games-browser').then(m => m.DiceGamesBrowser)
    },
    {
        path: 'alcohol',
        canActivate: [authGuard],
        loadComponent: () => import('./features/alcohol/alcohol-browser/alcohol-browser').then(m => m.AlcoholBrowser)
    },
    {
        path: 'software/want-list',
        canActivate: [authGuard],
        data: { status: 'W' },
        loadComponent: () => import('./features/software/software-browser/software-browser').then(m => m.SoftwareBrowser)
    },
    {
        path: 'software',
        canActivate: [authGuard],
        loadComponent: () => import('./features/software/software-browser/software-browser').then(m => m.SoftwareBrowser)
    },
    {
        path: 'gardening',
        canActivate: [authGuard],
        data: { roles: ['Admin'] },
        loadComponent: () => import('./features/gardening/gardening-dashboard/gardening-dashboard').then(m => m.GardeningDashboard)
    },
    {
        path: 'magazines',
        canActivate: [authGuard],
        loadComponent: () => import('./features/magazines/magazine-browser/magazine-browser').then(m => m.MagazineBrowser)
    },
    {
        path: 'shows/want-list',
        canActivate: [authGuard],
        loadComponent: () => import('./features/shows/shows-want-list/shows-want-list').then(m => m.ShowsWantList)
    },
    {
        path: 'shows',
        canActivate: [authGuard],
        loadComponent: () => import('./features/shows/shows-browser/shows-browser').then(m => m.ShowsBrowser)
    },
    {
        path: 'comics/want-list',
        canActivate: [authGuard],
        loadComponent: () => import('./features/comics/comic-want-list/comic-want-list').then(m => m.ComicWantList)
    },
    {
        path: 'comics',
        canActivate: [authGuard],
        loadComponent: () => import('./features/comics/comic-browser/comic-browser').then(m => m.ComicBrowser)
    },
    { path: 'chores', canActivate: [authGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./features/chores/chore-manager/chore-manager').then(m => m.ChoreManager) },
    { path: 'fish', canActivate: [authGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./features/fish/fish-tank-list/fish-tank-list').then(m => m.FishTankList) },
    { path: 'tasks', canActivate: [authGuard], loadComponent: () => import('./features/tasks/task-dashboard/task-dashboard').then(m => m.TaskDashboard) },
    { path: 'backups', canActivate: [authGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./features/backup/backup-dashboard/backup-dashboard').then(m => m.BackupDashboard) },
    { path: 'backups/schedule', canActivate: [authGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./features/backup/backup-schedule-form/backup-schedule-form').then(m => m.BackupScheduleForm) },
    { path: 'barcode-staging', canActivate: [authGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./features/barcode-staging/barcode-staging-workbench/barcode-staging-workbench').then(m => m.BarcodeStagingWorkbench) },
    { path: 'admin/imports', canActivate: [authGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./features/external-imports/external-import-workbench/external-import-workbench').then(m => m.ExternalImportWorkbench) },
    { path: 'admin/users', canActivate: [authGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./features/admin-users/admin-users/admin-users').then(m => m.AdminUsers) },
    { path: 'admin/settings', canActivate: [authGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./features/admin-settings/admin-settings/admin-settings').then(m => m.AdminSettings) },
    { path: 'admin/resume', canActivate: [authGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./features/resume/admin-resume/admin-resume').then(m => m.AdminResume) },
    { path: 'admin/blog', canActivate: [authGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./features/blog/admin-blog/admin-blog').then(m => m.AdminBlog) },
    { path: 'admin/dino', canActivate: [authGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./features/dino/admin-dino/admin-dino').then(m => m.AdminDino) },
    { path: 'goals-plans', canActivate: [authGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./features/goals-plans/goals-plans-browser/goals-plans-browser').then(m => m.GoalsPlansBrowser) },

    { path: 'rpg', canActivate: [authGuard], data: { status: 'H', title: 'RPGs' }, loadComponent: () => import( './features/RPGS/rpg-browser/rpg-browser').then(m => m.RpgBrowser) },
    { path: 'rpg/want-list', canActivate: [authGuard], data: { status: 'W', title: 'RPG Want List' }, loadComponent: () => import( './features/RPGS/rpg-browser/rpg-browser').then(m => m.RpgBrowser) },
    { path: 'rpg/new', canActivate: [authGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./features/RPGS/rpg-edit/rpg-edit').then(m => m.RpgEdit) }, 
    { path: 'rpg/:id', canActivate: [authGuard], loadComponent: () => import('./features/RPGS/rpg-detail/rpg-detail').then(m => m.RpgDetail) },
    { path: 'rpg/:id/edit', canActivate: [authGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./features/RPGS/rpg-edit/rpg-edit').then(m => m.RpgEdit) },
    
    { path: '', canActivate: [authGuard], loadComponent: () => import('./features/home/home').then(m => m.Home) },
];

