# Verdelak Applications Master To-Do

Last refreshed: 2026-06-29

## Top Priorities

### 1. Barcode / Scanning

Completed this pass:

- Candidate comparison polished with ranked provider results, staged-value comparison, quality/field flags, publisher/external ID visibility, and direct field-merge actions.
- Item-type commit panels improved for Book/CD/DVD with grouped Will write / Audit trace / Not mapped sections, destination fields, backend fields written, trace behavior, commit warnings, per-row commit summaries, and compact type-specific commit readiness checklists.
- Duplicate checks before commit improved with normalized Book title/author warnings, CD barcode blockers plus title/artist and similar-title warnings, DVD barcode blockers plus title/format and similar-title warnings, explicit Book ISBN/barcode storage limitation messaging, severity-coded Blocker / Duplicate review / Info message badges, duplicate-detail import preview panels, and selected-row duplicate warning display in the commit preview.
- Lookup coverage expanded with selected-item Auto lookup, provider capability labels, Discogs normalization, Crossref as a no-key ISBN fallback provider, and Wikidata as a no-key ISBN/UPC/EAN fallback provider.
- Provider priority and fallback behavior polished with stable normalized priority slots, Admin Settings order preview, Up/Down provider controls, clearer provider-order reporting, and fallback retries that include missing, failed, and low-confidence rows.
- Import history/reporting polished with date presets, clear filters, per-batch history CSV export, grouped history summary cards, summary CSV export, and richer audit CSV columns.

Remaining only if desired:

- Revisit barcode import mappings after real imports expose new fields worth preserving directly on destination tables.

### 2. Software

Completed this pass:

- Browser/details/editing flow polished with richer selected-item details, duplicate-from-selected, direct delete, selected-item quick filters, same-title review links, detail readiness checks, and management actions from the details panel.
- Software platforms/locations now use Admin Settings throughout; Software create/update requires Admin-managed platform/location IDs and no longer creates free-text lookup values.
- Platform, location, media, owned/wanted/unknown/all filters polished with active status cards, report bucket shortcuts, and removable filter chips.
- Wanted software connected to the want-list report view with filtered summaries, CSV export, report preview rows, and quick mark-owned actions.

### 3. Gardening

Functionally closed out.

Completed:

- Garden notes/diary polished with grouped month/area entry browsing, quick prompt buttons, filters, summaries, and CSV exports.
- Seed-start planning reports by month, tray, area, and warnings, with detail and summary CSV exports.
- Garden plot/bed planning polished with bed-cell filters, row summaries, focused legend browsing, planning warnings, and clearer grid summary chips.
- Bulk seed import/export polished with header-aware preview, validation warnings, preview CSV, template/export CSV, and per-row import result reporting.
- Yearly tray/bed copy-forward polished with preview, overwrite controls, result summaries, and report CSV export.
- Harvest tracking polished with add/edit/delete, crop/area/date filters, recent harvest display, summaries, report/export CSV, and year comparison integration.

Remaining only if desired:

- Deeper garden analytics after real-season use.
- More specialized printable layouts.

### 4. Master Schedule

Completed this pass:

- `/tasks` verified as the shared action surface for Goals and generated occurrences, using the reusable schedule action component with optional notes.
- Move/reschedule/skip/complete/reopen behavior is consistently available where each item supports it.
- Master Schedule source/category/status filters polished with dropdowns, quick chips, removable active filters, text search, and an Open status bucket.
- Master Schedule overdue/today/week report polish added with range metrics, source/category breakdowns, attention list, and CSV export for the current filtered view.
- Source pages for Chores, Fish, Gardening, and Backups now use optional schedule action notes consistently and refresh their local schedule/activity views after actions.
- Backups still reflect completed/reopened occurrences into backup logs, while Fish task actions continue to appear in tank history.
- Unified generate missing occurrences workflow now has a preview endpoint and UI preview before saving.
- Generation reporting now shows missing and created counts by source and by individual task, with missing-only focus and CSV exports for preview/results.
- Generation date bounds fixed so tasks do not create occurrences beyond the requested `to` date.
- Stale nested API `build-check*` folders cleaned up to prevent Windows max-path build failures.

Remaining:

- Continue deeper source-specific reports only where a section needs more than occurrence status/history.
- Consider adding a `No location`-style null filter pattern later if source reports need null bucket drilldowns.

### 5. Finance

Completed this pass:

- Recurring bill analytics polished with month progress, yearly payment-rate, largest risk, largest variance, and selected-month burn-down cards.
- More dashboard chart polish added to make recurring bill payment status scannable before the detailed tables.
- True `.xlsx` workbook export exists for balances, bills, analytics, snapshots, donations, account history, net worth history, and receipt-needed reporting.
- Printable/report layout polished with reusable report header, range/generated metadata, finance metric cards, improved table styling, and cleaner page-print CSS.

## Inventory / Collections

### 6. Alcohol

Functionally closed out.

Completed:

- Import/staging and cleanup preview.
- Admin Settings for locations/categories.
- Browser/editing flow.
- Summary reporting by status/category/location.
- Wanted list export.
- Cleanup review export.
- Current-page CSV export.
- Import template download.

Remaining only if desired:

- Deeper data cleanup after reviewing spreadsheet quality.
- More specialized reports if the inventory grows.

### 7. Shows

Functionally closed out.

Completed:

- Ownership maps by season.
- Boxset support for complete series and included seasons.
- Want-list and report views.
- Reports for missing seasons, wanted seasons, watch/rewatch candidates, unwatched seasons, and all seasons.
- Batch scheduling watched/rewatch/watch candidates into future Goals years.
- Scheduled vs unscheduled Goals creation polish for single-show and report batch flows.
- Reports show which seasons are already scheduled into Goals and which years they appear in.
- CSV export for report rows, selected Goals batch rows, selected-show ownership maps, and boxsets.

Remaining only if desired:

- Bulk import tools from old spreadsheets or external lists.
- Deeper reporting if the collection grows.

### 8. Comics

Functionally closed out.

Completed:

- Browser and want-list exist.
- Collapsible title browser exists.
- Add/edit/delete issue flow exists for Admin/Contributor.
- Add wanted titles and wanted issues.
- CSV/TXT bulk import/paste with validation preview exists.
- Loaded issue export and full title summary export exist.
- API-backed series report now powers whole-collection summary counts.
- Security behavior matches Music-style rules: everyone authenticated can view; Admin/Contributor can manage.

Remaining only if desired:

- Deeper import/reconciliation tools if a future spreadsheet needs cleanup.
- More specialized reports if the collection grows.

### 9. Minis

- Browser, grouped view, editing, owned/wanted quantities, and want-list exist.
- Browser report polish added with current-filter summary cards, system coverage report, rarity report, ownership-gap review list, system/rarity quick filters, and current-page/summary CSV exports.
- CSV/TXT paste and file import staging added with validation preview, preview export, and commit into normalized company/system/series rows.
- Future polish: deeper reconciliation reports after real data review, future Games Workshop expansion.

### 10. Books / Music / Spookytown / RPG / Magic / Chessex / Dice Games / Dragon Dice / Toys / Phone List

- Mostly functional foundations exist.
- Music Metal Archives gap finder added with band search, full-length/EP discography comparison, owned/wanted/missing status display, and add-selected-missing releases to Music want list.
- Metal Archives is treated as discography enrichment, not barcode lookup; watch real-world request behavior and consider local caching/manual import fallback if the site blocks automated requests.
- CD site performance hot path optimized with paged/searchable `api/artists/catalog`; MVC CD home no longer loads the full artist/album graph before filtering.
- Dice Games / Dragon Dice foundation added with separate backend tables, API endpoints, shared Angular browser, have/want quantities, reports, filters, edit forms, and CSV/TXT import staging.
- Dice Games / Dragon Dice cleanup pass added with imported/live-row quality checks, richer import warnings, potential duplicate clusters, and current-row/cleanup CSV exports.
- Toys browser report polish added with current-filter summary cards, line/company breakdown, attention rows, and page/report CSV exports.
- Phone List report polish added with current-filter summary cards, type/city breakdowns, missing-detail attention rows, and page/report CSV exports.
- Chessex browser report polish added with current-filter summary cards, category/set-type breakdowns, attention rows, and page/report CSV exports.
- Magic: The Gathering collection foundation added with a card identity / printing / owned-copy model, authenticated API, Angular browser, filters, summaries, reports, CRUD, and CSV exports.
- Magic: The Gathering paste import staging added with template CSV export, CSV/tab preview parsing, row warnings/errors, selectable valid rows, and commit into the secured collection API.
- Magic: The Gathering cleanup/reconciliation polish added with color identity reporting, data-quality buckets, possible duplicate printing clusters, quick cleanup focus, and cleanup CSV export.
- Magic: The Gathering full-filter report endpoint added so summary cards, set/color/rarity reports, cleanup buckets, and duplicate clusters cover the whole filtered collection instead of only the current page.
- Magic: The Gathering want-list route and menu polish added with `/mtg/want-list`, route-driven wanted status, header navigation between All Magic and Want list, and dedicated menu children.
- Magic: The Gathering selected-card detail polish added with card image preview, status/printing/identity/location/external chips, Scryfall link, and quick quantity/status controls in the edit panel.
- Magic: The Gathering export polish added with full filtered collection CSV and full filtered cleanup CSV that load all pages behind the current filters while retaining current-page exports.
- Magic: The Gathering selected-card research polish added with exact-printing Scryfall links, same-card/same-set filter shortcuts, visible oracle text/notes, artist/finish metadata, and oracle text in collection CSV exports.
- Magic: The Gathering location report polish added with filtered binder/box/location breakdowns, report CSV location rows, location drilldowns, and a `No location` filter path for cleanup.
- Magic: The Gathering collection-specific filters added with API and Angular support for condition, language, and split finish lookups so filtered reports and exports can target trade/storage details.
- Magic: The Gathering active filter chip polish added with visible filter summaries and one-click removal for search, set, color, rarity, type, location, condition, language, finish, and status filters.
- Magic: The Gathering row table polish added with storage/trade metadata columns for location, finishes, condition, and language plus API-backed location and condition sorting.
- Magic: The Gathering duplicate-from-selected polish added so a selected card row can be copied into a new editable row for another storage, condition, language, finish, or quantity variant.
- Magic: The Gathering trade cleanup polish added missing-condition and missing-language review buckets with matching focus behavior and cleanup CSV issue output.
- Magic: The Gathering attention review polish added inline issue badges and reused cleanup issue detection so wanted rows and current-page cleanup problems are easier to scan before selecting.
- Magic: The Gathering cleanup drilldowns now support no-condition and no-language filters, with cleanup buckets reloading owned rows across the collection instead of only selecting current-page matches.
- Magic: The Gathering table pagination now includes a rows-per-page selector for 25, 50, 100, and 200 row cleanup/review passes.
- Magic: The Gathering selected-card toolbar now has same-location, same-condition, same-language, and same-finish quick filters for faster storage and trade review.
- Magic: The Gathering condition and language filters now expose No condition and No language options directly, matching cleanup drilldown behavior.
- Magic: The Gathering cleanup cards now apply a first-class cleanup filter through the API, list, report, chips, and filtered exports so row-level issues drill down across all matching rows.
- Magic: The Gathering filters now include a cleanup issue dropdown with live bucket counts, making cleanup filters reachable without first using the review cards.
- Magic: The Gathering main table now shows row-level cleanup review badges directly, with Ready markers for rows without current cleanup issues.
- Magic: The Gathering Review column is now sortable, with ascending review sort putting cleanup issue rows first for faster table triage.
- Magic: The Gathering review badges in the main table are now clickable cleanup filters, applying the matching issue bucket without selecting the row.
- Magic: The Gathering table review rendering now precomputes row cleanup issues once per page item, reducing repeated template helper calls as review page sizes grow.
- Magic: The Gathering review table rows and issue badge buttons now use stable trackBy keys to reduce DOM churn during review sorting and filtering.
- Magic: The Gathering summary cards now include current-page review issue and affected-row counts, using the precomputed review row data.
- Magic: The Gathering Review issues summary card is now actionable, sorting the table by review issues first from the card itself.
- Magic: The Gathering Review issues summary now uses filtered report cleanup bucket totals when available, while still showing current-page affected rows in the detail.
- Magic: The Gathering report now includes filtered cleanup affected-row counts so the Review issues summary can distinguish issue totals from distinct rows needing cleanup.
- Magic: The Gathering cleanup filtering now supports an any-issue mode, exposed in the cleanup dropdown and used by the Review issues summary card before review sorting.
- Magic: The Gathering cleanup dropdown now shows the live affected-row count for the Any cleanup issue option.
- Magic: The Gathering API now reuses one translatable cleanup-issue expression for review sorting and any-issue filtering to keep cleanup rules from drifting.
- Magic: The Gathering cleanup filters now include No cleanup issues, with live ready-row counts and clickable Ready badges in the review table.
- Magic: The Gathering report CSV now includes summary rows for filtered rows, cleanup issue instances, distinct cleanup rows, ready rows, and duplicate clusters before grouped report sections.
- Magic: The Gathering Cleanup Review panel now includes filtered Any cleanup issue and Ready rows action tiles, reusing the cleanup filter paths from summary cards and review badges.
- Magic: The Gathering duplicate cluster report rows now carry structured card, printing, status, and storage metadata so duplicate review clicks can filter to the exact matching rows across the full collection.
- Magic: The Gathering duplicate review rows now show and export status, condition, language, and location details so duplicate cleanup can distinguish true duplicates from intentional variants.
- Magic: The Gathering import preview now shows staged status, condition, language, and location before commit so trade/storage metadata mistakes are visible during paste review.
- Magic: The Gathering import preview now supports bulk Select valid and Clear selection actions, with valid-row counts shown in the staging summary.
- Magic: The Gathering import preview now warns when owned staged rows are missing location, condition, or language, matching the cleanup buckets before rows are committed.
- Magic: The Gathering import preview now warns when quantity, foil quantity, or estimated value cannot be parsed numerically before falling back to import defaults.
- Magic: The Gathering import preview now warns when quantity, foil quantity, or estimated value are negative before clamping those numeric values to zero.
- Magic: The Gathering import preview now warns when staged status text is not recognized before defaulting those rows to Have.
- Magic: The Gathering import preview now validates that pasted headers include a card name column before staging rows, preventing silent zero-row previews from unmapped files.
- Magic: The Gathering import preview now surfaces missing set code and collector number headers in the staging message before rows fall back to UNK printing values.
- Magic: The Gathering import preview now errors when no mapped card data can be staged, while preserving rows that contain useful mapped metadata for row-level validation.
- Magic: The Gathering import preview rows and staged issue lists now use stable trackBy keys to reduce DOM churn during bulk selection and paste review.
- Magic: The Gathering selected-card quick filters now support No location, No condition, and No language drilldowns when the selected row is missing storage/trade metadata.
- Magic: The Gathering selected-card detail now shows clickable cleanup issue chips that reuse the table review badge drilldowns for the selected row.
- Magic: The Gathering selected-card detail now shows a clickable Ready chip for selected rows without cleanup issues, matching the table review no-issue drilldown.
- Magic: The Gathering selected-card cleanup review now reuses a form-to-item helper so selected detail issue detection stays aligned with table cleanup rules.
- Magic: The Gathering manual card edit numeric fields now clamp quantity, foil quantity, and estimated value to non-negative values as they are entered, matching API save behavior.
- Magic: The Gathering manual card edit now uppercases colors, color identity, and set code as they are entered so detail chips, review state, and Scryfall links match saved normalization.
- Magic: The Gathering import preview now uppercases staged colors, color identity, and set code so pasted rows preview with the same normalization as manual edits and saved cards.
- Magic: The Gathering language codes now uppercase during manual edits, saves, and import preview so filters and duplicate cleanup do not split EN/en variants.
- Magic: The Gathering rarity now lowercases during manual edits, saves, and import preview, with case-insensitive API filtering for older mixed-case rows.
- Magic: The Gathering API now uppercases set and language codes on save and matches those filters case-insensitively so non-browser callers do not fragment collection metadata.
- Magic: The Gathering finishes now lowercase through import/save and filter case-insensitively so foil/nonfoil/etched metadata stays grouped.
- Magic: The Gathering selected-card toolbar now includes a Same rarity quick filter for faster rarity review from any selected row.
- Magic: The Gathering selected-card toolbar now includes Have rows / Want rows quick filters that mirror the selected row status without changing it.
- Magic: The Gathering search now includes printing artist metadata, with a selected-card Same artist quick filter for visual/style review.
- Magic: The Gathering selected-card toolbar now includes a Same type quick filter that applies the selected row type line to the Type filter.
- Magic: The Gathering selected-card toolbar now includes Same identity / Colorless quick filtering, with API support for exact multi-color identity filters while preserving single-color contains behavior.
- Magic: The Gathering color and identity normalization now preserves WUBRG order in import preview, browser saves, and API saves instead of alphabetizing color symbols.
- Magic: The Gathering import preview now warns when pasted colors or color identity include symbols outside WUBRG so suspicious card color metadata is visible before commit.
- Magic: The Gathering cleanup badges now flag invalid color and color identity symbols on saved/manual rows and route those badges into the missing-identity review bucket.
- RPG browser report polish added with current-filter summary cards, system/type breakdowns, attention rows, and page/report CSV exports.
- Spookytown browser report polish added with current-filter summary cards, type/year breakdowns, attention rows, and page/report CSV exports.
- Books browser report polish added with current-filter summary cards, format/author/series breakdowns, attention rows, and view/report CSV exports.
- Music browser report polish added with current-filter summary cards, format/artist breakdowns, attention rows, and view/report CSV exports.
- Dice Games / Dragon Dice remaining: review cleanup exports against real workbook rows and add richer reconciliation tools only where the data shows persistent issues.
- Future work should otherwise be polish/report/import focused unless a bug appears.

## Household / Personal Systems

### 11. Goals & Plans

Major foundation exists.

Completed:

- Archived-year comparison reports verified with API-backed archived plan comparison, metric/section deltas, completion trend coloring, and CSV export.
- Import column mapping options improved with checklist/timeline presets, broader header aliases, mapping quality cards, duplicate/unmapped header review, mapped-row preview, auto-map blanks, clear mapping, mapping CSV export, and done/yes/no completion parsing.
- Validation warnings before committing staged rows improved with mapped CSV value warnings, richer schedule/date/rollover checks, commit blocking for errors, warning confirmation, inline row warning badges, validation readiness cards, severity row highlighting, and validation CSV export.
- Future-year bulk add workflow for books/shows/minis/etc. polished with draft future-year plan creation, existing future-plan selection, content presets, section staging, pasted queue-item staging, duplicate-title review, existing-section status, preview cards/table, preview CSV export, and reuse of the existing validation/commit path.

Remaining:

- Better mass edit actions for giant queue sections improved with filtered/visible queue selection, queue-row checkboxes, mass progress/window/date/schedule/rollover edits, mark-done, queue-defaults, clear-dates actions, and confirmation before bulk updates.

### 12. Chores

Categories, templates, bulk add/import, and schedule generation exist.

Remaining:

- Report polish added with active/generated summary cards, category/frequency/status breakdowns, attention list, next-30-day schedule export, and report CSV export.
- More source-specific reflection from Master Schedule added with reflected-row/action/activity-note/generated-gap cards, recent reflected Chore actions, upcoming source rows, and combined Master Schedule reflection CSV export.
- Better long-term recurring rule management added with managed/needs-generation/ending-soon/paused cards, per-rule health rows, 90-day previews, generated coverage details, and recurring rule CSV export.
- Chore schedule/reflection reporting now supports selectable 30/60/90 day Master Schedule windows with matching report copy, rule generated-coverage labels, and date-range CSV filenames.

### 13. Fish

Largely closed out.

Remaining only if desired:

- Extra reports.
- More species/product/profile polish.
- Shopping-list edge cases.
- Additional dashboard/chart refinements.

### 14. Shopping / Grocery

Strong foundation exists.

Remaining:

- Pantry/inventory integration added with pantry coverage cards, out/expiring attention rows, shopping-row pantry match badges, on-hand details, and Stock Pantry actions that update pantry from shopping items.
- Recipe meal-plan grouping polish added with automatic group presets, meal-plan summary cards, grouped shopping previews, and grouped last-push results.
- Store-specific aisle/sort behavior refinements added with route coverage cards, store route summaries, missing route attention rows, saved-default route application, route badges, and store-route CSV export.
- Shopping store-route exports now show the current route scope on the page, include scope/export timestamp metadata in the CSV, and use filter-aware filenames for category/store/source/status slices.
- CSV/XLSX shopping history export polished with range presets, summary cards, selected-range labels, and range-aware export filenames.

### 15. Recipes

Browser, organization, and shopping readiness work exists.

Remaining:

- More source/cookbook polish added with visible-source coverage cards, source coverage rows, missing-source review, source quick filters, and current-filter source CSV export.
- Recipe source/cookbook coverage exports now show the current filter scope on the Sources panel, include scope/export timestamp metadata in the CSV, and use scope-aware filenames.
- More filters added with source status, readiness, max total minutes, and clear-filter support backed by API query parameters.
- Recipe-to-shopping refinements added with pantry-aware preview badges, pantry match summary cards, skipped-pantry result details, scaled skipped quantities, and clearer last-push audit output.
- Meal-plan grouping added with automatic group presets, meal-plan summary cards, grouped shopping previews, and grouped last-push results.

## Content / Sites / Creative Sections

### 16. Dino

- Needs full content/admin design.
- Dino admin readiness/design pass added with content readiness cards, missing taxonomy/text/image review rows, readiness filters, richer list columns, CSV export, and API summary fields for taxonomy/content coverage.
- Dino readiness exports now show the active search/status/readiness scope in the admin header, include scope/export timestamp metadata in the CSV, and use scope-aware export filenames.
- Public Dino content API added for the external site with published-only search/list, slug-or-id detail lookup, primary image summaries, classification/clade payloads, ordered text sections/illustrations, and taxonomy counts.
- External Dino site preview/export added to admin with public feed metrics, taxonomy bucket counts, selected detail payload preview, and JSON export for the public API shape.
- External Dino site browse/detail pages added with public API search, taxonomy filters, responsive entry cards, classification/discovery sidebar, text sections, and illustration gallery.
- Scientific classification: Kingdom, Phylum, Class, Clades, Family, Subfamily, Genus, Species.
- Discovery date/by, descriptions, illustrations, text sections.
- External Dino site will display/search content; this app administers it.

### 17. Guitar

Scale/fretboard explorer exists.

Remaining:

- More tuning presets, custom tuning explanation, and note/degree toggle polish added with expanded guitar/bass/baritone/extended tunings, grouped quick presets, tuning descriptions, custom note-count guidance, clean fret-label copy, and fixed separator display.
- Arpeggio practice added with generated triad/seventh patterns for harmonized chords, interval roles, notes, and practice hints in the chord suggestions panel.
- Printable practice sheets added with current scale/tuning summary, primary position fretboard, progressions, chord tones, arpeggio targets, practice routines, and print-to-PDF friendly styling.
- CAGED practice added with key-aware C/A/G/E/D shape cards, chord-tone anchors, position focus notes, practice prompts, and print-sheet inclusion.
- Future: audio playback.

### 18. External Sites

- External site URLs centralized in Admin Settings for Bartender, Dino, CD, Personal, and Film Review, with local/production URL sets, External menu resolution, active/ready/missing URL summaries, duplicate-key/missing-field review, direct open links, and CSV export.
- External Sites admin row editing now uses stable row identity while still displaying sorted rows, so unsaved key edits/removals continue targeting the intended site.

## Admin / Infrastructure

### 19. Admin Settings

Continue centralizing configurable lists:

- Software platforms/locations.
- Alcohol locations/categories.
- Shopping categories.
- Recipe categories/cuisines/tags.
- Finance categories/settings.
- External site URLs.

Also:

- Keep cleaning duplicated New button/form UX as pages mature.
- External Sites key/edit/remove handling cleaned up to avoid key-based row targeting while keys are being edited.

### 20. Identity / Authorization

Password-protected app exists.

Continue enforcing:

- Viewer: view-only.
- User: view plus reviews where applicable.
- Contributor: everything except admin.
- Admin: full access.
- Identity admin role matrix and safety checks added with per-role coverage cards, access descriptions, identity review warnings, and last-Admin delete/demotion protection enforced in both UI and API.
- Identity audit CSV export added with generated-at metadata, role counts, permission matrix rows, current warnings, and sorted account rows for portable admin review.

### 21. Azure Hosting Plan

- Environment-based API URLs and Azure-safe config baseline added with Angular production environment replacement, API CORS allowed-origins configuration, local-only development connection/JWT settings, production JWT issuer/audience validation flags, and startup failure when `Jwt:Key` is missing.
- SQL Server hosting/migration workflow documented with Azure SQL checklist, App Service connection string guidance, idempotent EF migration SQL script generation, and optional EF migration bundle script.
- GitHub Actions CI/publish pipeline scaffold added for API, Angular, and public site artifact builds, with manual Azure App Service deploy jobs for API/site behind repository variables and publish-profile secrets.
- Hosting shape decision documented: use a separate static Angular app, ASP.NET API App Service, and public MVC App Service; keep the single-host option deferred unless cost/domain simplicity outweighs independent deploys.
- Database backup/restore plan documented with Azure SQL point-in-time restore, pre-migration exports, restore drills, incident restore flow, and local `.bacpac` verification guidance.
- Logging/diagnostics baseline added with production exception handling, HTTP request logging, correlation IDs, anonymous `/api/health` SQL connectivity check, logging config defaults, Azure App Service diagnostics guidance, and future Application Insights notes.
- Production CORS review completed with startup validation for non-development origins, placeholder/local/wildcard rejection, allowed-origin startup logging, and deployment guidance for Angular/public-site origins.
- File/image storage needs reviewed and documented: current Home Inventory binary images remain SQL-backed for initial Azure deployment, external cover/artwork fields stay URL-based, and Azure Blob Storage is planned as the longer-term media store with metadata, migration, validation, and backup implications captured.

## Performance / Bundle Size Refactors

- Initial bundle warning resolved in the current refactor pass.
  - Converted remaining eager route imports for Home, Tasks, Backups, and Home Inventory to lazy `loadComponent`.
  - Current production build initial bundle: 408.56 kB, below the 550 kB warning budget.
- Gardening first split completed.
  - Extracted deferred Gardening schedule panel so schedule actions, task list, and schedule preview load when that section enters view.
  - Extracted deferred Gardening year comparison panel for season comparison summaries/tables.
  - Extracted deferred Gardening seed inventory/import panel.
  - Extracted deferred Gardening tray grid/legend and garden bed/plot grid/legend panels.
  - Gardening lazy chunk reduced from 217.49 kB to 145.13 kB.
- Goals first split completed.
  - Extracted deferred Goals bulk add staging/import panel.
  - Goals lazy chunk reduced from 176.64 kB to 159.76 kB.
- Goals schedule preview split completed.
  - Extracted deferred Goals master schedule preview panel so schedule-table rendering loads when the panel enters the viewport.
- Goals archive comparison split completed.
  - Extracted deferred Goals archived-year comparison panel so archive report controls and comparison tables load when that section enters the viewport.
- Continue enforcing route-level lazy loading for major sections: Gardening, Finance, Fish, Goals, Barcode, Shopping, Recipes, Software, Minis, Shows, Comics, Alcohol, Guitar, and other large feature areas.
- Split oversized feature pages into child routes/components when they become hard to maintain or slow to load.
  - Gardening candidates: trays, beds, seeds, harvests, reports.
  - Finance candidates: dashboard, accounts, bills, donations, reports/exports.
  - Goals candidates: outline, staging/import, reports, schedule integration.
- Keep shared/root imports lean: app shell, navigation, auth, home widgets, and shared controls should not import heavy feature-only code.
- Lazy-load charting/report-heavy UI where practical, especially Finance, Fish, Gardening, and Goals reports.
  - Fish water reading trend panel extracted into a deferred child component so chart rendering loads when the panel enters the viewport.
  - Fish report-table panel split evaluated and deferred for now; the first attempted `vm` pass-through component made Angular compilation unreliable in this workspace, so revisit with a narrower typed panel contract instead of a whole-section move.
  - Barcode duplicate scan panel extracted into a deferred child component so duplicate review rendering loads when the panel enters the viewport.
  - Barcode import validation preview panel extracted into a deferred child component so commit preview tables load when the panel enters the viewport.
  - Finance reports/export action panel extracted into a deferred child component so print/export controls load when the panel enters the viewport.
- Angular bundle analysis workflow added with `npm run bundle:report`, a repo script that builds production output and writes an initial/lazy JS/CSS report to `artifacts/bundle/angular-bundle-report.md`.
- Bundle report guardrails polished with configurable initial budget and lazy-review thresholds, summary status labels, largest-initial tracking, and a dedicated lazy split candidate table.
- Bundle report source labeling added with Angular `stats.json` generation, stats metadata discovery, source-path columns for largest assets and lazy split candidates, and a note that shared chunks may remain unlabeled.
- Watch lazy chunk sizes as well as initial bundle size; a large lazy page is acceptable, but it should eventually be split if it becomes unpleasant to use or maintain.



























