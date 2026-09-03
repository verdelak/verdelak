# Verdelak Applications Master To-Do

Last refreshed: 2026-08-26

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

Completed:

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
- Spreadsheet import normalized into product, category, type, style, region, location, count, rating, and value tables while preserving the original imported AlcoholItems table as staging/reference.
- Alcohol browser now reads/writes normalized inventory rows, with lookup datalists for category, type, style, country, region, and location.
- Lookup cleanup preview and export added for imported country/region placeholders and abbreviations.
- Admin-only lookup cleanup apply flow added for guarded country/region fixes.
- Admin-only lookup management added for merging or clearing category, type, style, location, country, and region lookup values.
- Product duplicate preview/export and Admin-only merge flow added so identical bottle definitions can collapse into one product with multiple inventory count rows.
- Import duplicate warnings now check against the full normalized Alcohol inventory instead of only the current browser page.
- Normalized filters and report breakdowns added for type, style, country, and region.
- Focused Alcohol cleanup reports added for missing price, missing rating, high-value rows, top-rated rows, and wine vintage review.

Remaining only if desired:

- Apply the reviewed lookup cleanup suggestions to the live data.
- Add highly specialized cellar/value reports if the inventory grows.

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
- Better mass edit actions for giant queue sections improved with filtered/visible queue selection, queue-row checkboxes, mass progress/window/date/schedule/rollover edits, mark-done, queue-defaults, clear-dates actions, and confirmation before bulk updates.

### 12. Chores

Categories, templates, bulk add/import, and schedule generation exist.

Completed:

- Report polish added with active/generated summary cards, category/frequency/status breakdowns, attention list, next-30-day schedule export, and report CSV export.
- More source-specific reflection from Master Schedule added with reflected-row/action/activity-note/generated-gap cards, recent reflected Chore actions, upcoming source rows, and combined Master Schedule reflection CSV export.
- Better long-term recurring rule management added with managed/needs-generation/ending-soon/paused cards, per-rule health rows, 90-day previews, generated coverage details, and recurring rule CSV export.
- Chore schedule/reflection reporting now supports selectable 30/60/90 day Master Schedule windows with matching report copy, rule generated-coverage labels, and date-range CSV filenames.

Remaining only if desired:

- Deeper chore analytics after real schedule use.

### 13. Fish

Largely closed out.

Remaining only if desired:

- Extra reports.
- More species/product/profile polish.
- Shopping-list edge cases.
- Additional dashboard/chart refinements.

### 14. Shopping / Grocery

Strong foundation exists.

Completed:

- Pantry/inventory integration added with pantry coverage cards, out/expiring attention rows, shopping-row pantry match badges, on-hand details, and Stock Pantry actions that update pantry from shopping items.
- Recipe meal-plan grouping polish added with automatic group presets, meal-plan summary cards, grouped shopping previews, and grouped last-push results.
- Store-specific aisle/sort behavior refinements added with route coverage cards, store route summaries, missing route attention rows, saved-default route application, route badges, and store-route CSV export.
- Shopping store-route exports now show the current route scope on the page, include scope/export timestamp metadata in the CSV, and use filter-aware filenames for category/store/source/status slices.
- CSV/XLSX shopping history export polished with range presets, summary cards, selected-range labels, and range-aware export filenames.

Remaining only if desired:

- Deeper shopping analytics after real grocery/pantry use.

### 15. Recipes

Browser, organization, and shopping readiness work exists.

Completed:

- More source/cookbook polish added with visible-source coverage cards, source coverage rows, missing-source review, source quick filters, and current-filter source CSV export.
- Recipe source/cookbook coverage exports now show the current filter scope on the Sources panel, include scope/export timestamp metadata in the CSV, and use scope-aware filenames.
- More filters added with source status, readiness, max total minutes, and clear-filter support backed by API query parameters.
- Recipe-to-shopping refinements added with pantry-aware preview badges, pantry match summary cards, skipped-pantry result details, scaled skipped quantities, and clearer last-push audit output.
- Meal-plan grouping added with automatic group presets, meal-plan summary cards, grouped shopping previews, and grouped last-push results.

Remaining only if desired:

- Deeper cookbook/meal-plan analytics after real recipe use.

## Content / Sites / Creative Sections

### 16. Dino

Major content/admin/public foundation exists.

Completed:

- Dino admin readiness/design pass added with content readiness cards, missing taxonomy/text/image review rows, readiness filters, richer list columns, CSV export, and API summary fields for taxonomy/content coverage.
- Dino readiness exports now show the active search/status/readiness scope in the admin header, include scope/export timestamp metadata in the CSV, and use scope-aware export filenames.
- Public Dino content API added for the external site with published-only search/list, slug-or-id detail lookup, primary image summaries, classification/clade payloads, ordered text sections/illustrations, and taxonomy counts.
- External Dino site preview/export added to admin with public feed metrics, taxonomy bucket counts, selected detail payload preview, and JSON export for the public API shape.
- External Dino site browse/detail pages added with public API search, taxonomy filters, responsive entry cards, classification/discovery sidebar, text sections, and illustration gallery.
- Scientific classification: Kingdom, Phylum, Class, Clades, Family, Subfamily, Genus, Species.
- Discovery date/by, descriptions, illustrations, text sections.
- External Dino site will display/search content; this app administers it.

Remaining only if desired:

- Continue adding and polishing real Dino content.
- Deeper public-site presentation after content volume grows.

### 17. Guitar

Scale/fretboard explorer exists.

Completed:

- More tuning presets, custom tuning explanation, and note/degree toggle polish added with expanded guitar/bass/baritone/extended tunings, grouped quick presets, tuning descriptions, custom note-count guidance, clean fret-label copy, and fixed separator display.
- Arpeggio practice added with generated triad/seventh patterns for harmonized chords, interval roles, notes, and practice hints in the chord suggestions panel.
- Printable practice sheets added with current scale/tuning summary, primary position fretboard, progressions, chord tones, arpeggio targets, practice routines, and print-to-PDF friendly styling.
- CAGED practice added with key-aware C/A/G/E/D shape cards, chord-tone anchors, position focus notes, practice prompts, and print-sheet inclusion.

Remaining only if desired:

- Audio playback.

### 18. External Sites

- External site URLs centralized in Admin Settings for Bartender, Dino, CD, Personal, and Film Review, with local/production URL sets, External menu resolution, active/ready/missing URL summaries, duplicate-key/missing-field review, direct open links, and CSV export.
- External Sites admin row editing now uses stable row identity while still displaying sorted rows, so unsaved key edits/removals continue targeting the intended site.

## Admin / Infrastructure

### 19. Admin Settings

Continue centralizing configurable lists:

- Software platforms/locations.
- Alcohol locations/categories plus normalized type/style/country/region/location merge cleanup.
- Shopping categories.
- Recipe categories/cuisines/tags.
- Finance categories/settings.
- External site URLs.

Also:

- Add Admin sections for customizing the main site's visual presentation, including colors, theme tokens, images, logo/artwork choices, and other reusable appearance settings.
- Add equivalent appearance Admin sections for the CD site, movie review site, and blog so each public surface can manage colors, images, and branded presentation without code edits.
- Update the main site's CSS architecture so shared styling is centralized, cleaned up, token-driven, and directly usable by the appearance Admin sections.
- Keep cleaning duplicated New button/form UX as pages mature.
- External Sites key/edit/remove handling cleaned up to avoid key-based row targeting while keys are being edited.
- Shopping, Recipe, Alcohol, and Finance lookup Admin Settings review polish added with will-save/input/duplicate summary cards and duplicate-value warnings before saving.
- Steam and BoardGameGeek importer defaults surfaced in Admin Settings with shared save/reset controls, required-field review warnings, and status cards matching the external imports workbench settings.
- Importer defaults Admin Settings load/save hardened so Steam and BoardGameGeek settings update through one combined operation with a single loading/error state.
- Admin Settings navigation polish added with a compact section index and stable anchors for the major settings areas, including separate Software platform and location jumps.
- Main appearance settings groundwork added with AppSettings-backed API storage plus Admin controls for brand name, tagline, primary/accent colors, logo URL, hero image URL, favicon URL, and a small preview/review panel.
- Main Angular shell now consumes Main Appearance settings, applying primary/accent CSS variables and showing the configured brand/logo in the top menu.
- Main Appearance settings now update the browser title and favicon from the shared Angular appearance service with safe fallbacks.
- Home now consumes the Main Appearance tagline and optional hero image so saved branding artwork surfaces in the dashboard header.
- CD site appearance settings added with AppSettings-backed API storage, Admin controls, and public MVC consumption for brand/title/logo/favicon/colors/tagline/hero image with safe fallbacks.
- Dino site appearance settings added with AppSettings-backed API storage, Admin controls, and public MVC consumption for brand/title/logo/favicon/colors/tagline/hero image with safe fallbacks.
- Admin Appearance panels refactored into a reusable Angular panel component with shared appearance load/save helpers so future public-surface appearance settings do not duplicate the same form and persistence code.
- Blog appearance settings added with AppSettings-backed API storage, Admin controls, and Angular blog list/detail consumption for brand/logo/colors/tagline/hero image with safe fallbacks.
- Film Review appearance settings added with AppSettings-backed API storage and Admin controls; public consumption is ready to attach once the film review site/project exists in this repo.
- Music folder import added to Admin Settings with AppSettings-backed `Z:\Rips` default path, preview/apply support, normalized DB comparison against existing CD artists/albums, database-only owned CD review rows, duplicate rip-folder warnings, status filtering, summary cards, and CSV export for the comparison results.
- Main Angular token styling started with shared `--verd-*` derived CSS tokens plus reusable tokenized action/control/link classes, and the reusable Admin Appearance panel now consumes those classes instead of hard-coded blue focus/button styling.
- Admin Settings common save/add controls, token links, and form focus states now consume shared token classes, extending the main Appearance CSS token architecture beyond the reusable appearance panel.
- Admin Settings selectable table row hover/selected states now use shared tokenized row classes, removing the remaining hard-coded blue utility classes from the Admin Settings template.
- Admin Users now uses the shared token classes for its admin kicker, editable form focus states, primary save action, and selectable account rows.
- Admin Blog now uses shared token classes for its admin kicker, filters, editor controls, checkbox accent, primary actions, and selectable post rows.
- Admin Resume now uses shared token classes for its admin kicker, profile/editor fields, primary actions, section filter chips, checkbox accent, and selectable entry rows.
- Login now uses shared token classes for its brand kicker, credential fields, and primary sign-in action.
- Public Blog list now uses the shared token control class for search focus styling, leaving the Blog feature free of hard-coded blue utility classes.
- Public Resume now uses shared token accent classes for its kicker, timeline borders, and highlight bullets, leaving the Resume feature free of hard-coded blue utility classes.
- Shared Schedule Actions move-save button defaults plus current Task Dashboard and Chores overrides now use the primary action token class instead of hard-coded blue button utilities.
- Task Dashboard header controls now use shared token classes for the schedule kicker, anchor date focus styling, and selected schedule-range buttons.
- Task Dashboard actionable summary and schedule-maintenance generation panel now use shared token surface/text/control/action classes instead of hard-coded blue card, form, and button utilities.
- Task Dashboard lower filters, active chips, report breakdown chips, Fish tones, Actionable report metric, and today calendar marker now use shared token or non-blue semantic classes, leaving the route free of hard-coded blue utilities.
- External Imports workbench now uses shared token classes for provider cards, primary importer actions, importer settings controls, batch selection, staging controls, and filter fields, with Steam/default match badges moved off hard-coded blue utilities.
- Comics browser and want-list views now use shared token classes for kickers, controls, primary/import actions, title-only summary, edit links, selectable rows, and issue forms, with Special badges moved off hard-coded blue utilities.
- Chessex browser now uses shared token classes for the inventory kicker, filters, apply/save actions, report drilldown links, sortable headers, selected table rows, and edit form controls, leaving the feature free of hard-coded blue utilities.
- Toys browser now uses shared token classes for the inventory kicker, filters, apply/save actions, report drilldown links, sortable headers, selected table rows, checkbox accent, and edit form controls, leaving the feature free of hard-coded blue utilities.
- Phone List browser now uses shared token classes for the personal kicker, filters, apply/save actions, report drilldown links, sortable headers, selected contact rows, checkbox accent, and contact form controls, leaving the feature free of hard-coded blue utilities.
- Books browser and want-list views now use shared token classes for kickers, report row buttons, search/form controls, primary save action, selectable book rows, and want-list sort links, leaving the feature free of hard-coded blue utilities.
- Magazines browser now uses shared token classes for the inventory kicker, filters, apply/save actions, sortable headers, selected issue rows, checkbox accent, Special badge color, and edit form controls, leaving the feature free of hard-coded blue utilities.
- Spookytown browser now uses shared token classes for the inventory kicker, filters, apply/save actions, report row buttons, sortable headers, selected item rows, checkbox accent, and edit form controls, leaving the feature free of hard-coded blue utilities.
- Music browser, want-list, and Metal Archives gap finder now use shared token classes for kickers, report row buttons, search/form controls, primary/soft actions, selected album rows, external links, checkbox accent, wanted summary/tone, and want-list sort rows, leaving the feature free of hard-coded blue utilities.
- Software browser now uses shared token classes for the inventory kicker, import panel, filters, primary/soft actions, report bucket buttons, active chips, selected rows, selected-item quick filters, detail facts, checkbox accent, and edit form controls, leaving the feature free of hard-coded blue utilities.
- Dino admin now uses shared token classes for the admin kicker, export/preview/add soft actions, primary search/save actions, and dinosaur selection links, leaving the feature free of hard-coded blue utilities.
- Site Map now uses shared token classes for the misc kicker, filter controls, placeholder checkbox, linked entries, and planned status badges, leaving the feature free of hard-coded blue utilities.
- Guitar explorer now uses shared token classes for the personal kicker, scale/chord/arpeggio accents, CAGED badge/shape markers, fretboard root legend, practice focus labels, and tuning info surface, leaving the feature free of hard-coded blue utilities.
- Chores now uses shared token classes for the Master Schedule link, chore form controls, checkbox accents, weekly/range buttons, occurrence previews, bulk-generate actions, Master Schedule reflection panels, and per-row generate controls, leaving the feature free of hard-coded blue utilities.
- MTG browser now uses shared token classes for the inventory kicker, filters, active chips, import commit/control states, selectable summary cards, report drilldown links, sortable headers, selected card rows, Scryfall printing action, detail chip tones, primary/soft actions, checkbox accent, and edit form controls, leaving the feature free of hard-coded blue utilities.
- Full Tilt now uses shared token classes for the active-player accent, add-knight action, D6 roll buttons, and clean-hit action, leaving the feature free of hard-coded blue utilities.
- Home now uses shared token classes for dashboard card kickers, quick-shopping form controls, latest-blog links, and default task-source badges, leaving the feature free of hard-coded blue utilities.
- Barcode batch history panel now uses shared token classes for report preview actions, import-history filters, date/row controls, preset range buttons, and cleanup age input, leaving that child panel free of hard-coded blue utilities.
- Goals section summaries and schedule preview panels now use shared token classes for section drilldown links, active-count badges, and schedule-mode badges, leaving those child panels free of hard-coded blue utilities.
- Goals focused-work and archive comparison panels now use shared token classes for unscheduled scheduling actions, archive-year selects, and compare actions, leaving those child panels free of hard-coded blue utilities.
- Goals grid and archive rollover panels now use shared token classes for grid edit controls, per-row save actions, archived-year selection rows, rollover form controls, and rollover actions, leaving those child panels free of hard-coded blue utilities.
- Goals reporting panel now uses shared token classes for the year-completion kicker, active schedule badges, and section drilldown links, leaving that child panel free of hard-coded blue utilities.
- Goals staging panel now uses shared token classes for staging parent/default controls, column/batch mapping controls, future-year bulk-add surfaces and actions, pasted-row controls, staged-table edit controls, and add-staged actions, leaving that child panel free of hard-coded blue utilities.
- Goals outline panel now uses shared token classes for selected outline rows, title drilldown links, schedule-feed surfaces and mode buttons, dependency controls/actions, move-parent controls/actions, and outline edit controls/save actions, leaving that child panel free of hard-coded blue utilities.
- Goals browser shell now uses shared token classes for admin/year dashboard kickers, XML import controls/actions, plan selectors, export action, filters, checkbox accents, All/Active work-view toggles, and outline-create controls/actions, leaving the tracked route shell free of hard-coded blue utilities.
- Barcode staging workbench top intake and queue controls now use shared token classes for the collection kicker, batch/scan/paste controls, stage action, queue filters, batch lookup selects, lookup action, and batch note input.
- Barcode staging workbench review editor now uses shared token classes for queue row selection, auto lookup, save review, selected-item controls, item-type-specific suggestion fields, and review notes input.
- Barcode staging workbench candidate comparison now uses shared token classes for selected candidate cards, selected comparison rows, selected-candidate summary, cover links, and use-all-fields actions.
- Barcode staging workbench TypeScript tone helpers now use shared token classes for lookup workflow cards, import history trace summaries, info badges, candidate rank/value tones, commit audit panels, and audit/trace field chips, leaving the workbench free of hard-coded blue utilities.
- Barcode import validation panel now uses shared token classes for preview-selected actions, trace field chips, and trace-behavior panels, leaving the Barcode staging feature free of hard-coded blue utilities.
- Finance reports/export panel now uses the shared soft primary action token for the full workbook export action, leaving that child panel free of hard-coded blue utilities.
- Finance donations panel now uses shared token classes for receipt metrics and donation organization drilldown links, leaving that child panel free of hard-coded blue utilities.
- Finance bill reports panel now uses the shared accent background token for the monthly paid totals progress bar, leaving that child panel free of hard-coded blue utilities.
- Finance dashboard page now uses shared token classes for the personal kicker, financial-year shortcut, bill and snapshot drilldown links, primary save actions, expected-bill action, and annual bill payment-rate fallback tone.
- Goals future-year bulk-add TypeScript card tones now use shared accent tokens and neutral fallbacks, leaving the Angular app scan free of hard-coded blue utility classes in tracked HTML/TS templates.
- Miniatures browser and want-list now use shared token classes for the gaming kicker, apply/import/save/edit actions, import textarea focus state, system report drilldown links, and selected rows, leaving the Minis feature free of hard-coded indigo/sky primary utilities.
- Alcohol, Dice Games, Admin Users, and Admin Blog compact badges/cards now use shared soft-surface and token text classes for wanted/value/status/role presentation, clearing their remaining indigo/sky primary utility hits.
- Books, Music, Comics, Home, Site Map, and Resume repeated format/tag/type pills now use shared soft-surface token classes instead of hard-coded indigo badge utilities.
- Magazines report polish added with filtered totals, series/year breakdowns, missing issue range review, duplicate-number checks, and visible report cards on the Magazine browser.
- Magazine report export added with summary, series/year breakdown, missing-range, and duplicate-number CSV rows for filtered collection review.
- Magazine current-page CSV export added for the visible issue rows, including series, number/date, status, flags, cover, info, and display label.
- Magazine issue-number filtering added across the API list/report endpoints and browser filters so large numbered series can jump straight to a specific issue.
- Magazine report drilldowns added so series, year, duplicate-number, and missing-range rows can narrow the browser filters directly from the report panel.
- Magazine issue-number range filtering added for list/report queries, with missing-range report clicks opening the neighboring issue span for gap review.
- Magazine active filter chips added for search, series, number/range, date, flags, cover, and status filters, with one-click removal for focused collection review.
- Barcode staging, External Imports, and Software remaining primary-ish status/provider/detail tones now use shared soft-surface, token text, token ring, and left-border accent classes instead of hard-coded indigo/sky/left-blue utilities.
- Shopping and Recipes route/edit/open/cuisine/shopping-result tones now use shared soft action and soft-surface token classes, clearing their remaining indigo/sky primary utility hits.
- Shows browser and want-list Goals scheduling panels, watch-candidate chips, scheduled-year badges, and quick scheduling actions now use shared token surface/action classes, clearing Shows indigo/sky primary utility hits.
- Task Dashboard and Chores category/source tone helpers now use shared token or non-sky semantic classes for Goals, learning, and pets, clearing those sections' remaining indigo/sky primary utility hits.
- Fish tank list now uses shared token classes for the section kicker, tank log save action, and fallback history tone, clearing Fish indigo/sky primary utility hits.
- Gardening dashboard, seed inventory, tray/plot grids, and seed-start report panels now use shared token surface/action/text classes for indoor, started, planted, maintenance, update, and fallback cell tones, clearing Gardening indigo/sky primary utility hits.
- Finance savings and asset visualizations now use emerald semantic classes instead of sky utilities, leaving the Angular app scan clean for hard-coded indigo/sky utility classes.
- Barcode fallback actions, External Imports GOG-only chips, Comics/Magazines variant badges, and Recipe book/used controls now use shared token classes or teal semantic tones instead of hard-coded purple/violet utilities.
- Gardening tray copy, tray report, year comparison, note prompt, plot/tray clear-seed, and selected legend/grid states now use shared token classes instead of hard-coded violet/fuchsia utilities, leaving Gardening clean for purple-family utility hits.
- Fish report profile/food gaps, Finance variance and bill-frequency progress tones, Task music/gaming category tones, Home Goals source tone, Shows rewatch chips/cards, and Full Tilt unhorsed action now use shared tokens or non-purple semantic classes, leaving the Angular app scan clean for hard-coded purple-family utilities.
- Gardening Copy Bed Year controls now mirror the tokenized tray-copy workflow, using shared surfaces, controls, checkbox, and action classes instead of hard-coded teal utilities.
- Fish schedule/product/report action buttons, loading/preview counters, product report metrics, and history type chips now use shared token classes instead of hard-coded cyan/teal UI utilities; only the water trend chart stroke/fill cyan remains as chart styling.
- External Imports Steam/GOG-only summary and row tones plus Goals manual/move-parent, queue mass-edit, section queue, and queue default controls now use shared token classes instead of hard-coded cyan/teal UI utilities; Goals keeps cyan only for explicit unscheduled status coloring.
- Comics/Magazines special badges plus Home, Chores, and Task Dashboard Fish/Backups/music/learning/writing/pets/cleaning tone helpers now use shared tokens or non-cyan/teal semantic classes, clearing those compact badge/helper cyan/teal hits.
- Shopping List header kicker, mode/refresh/save/import/export/duplicate/history actions, frequent defaults, pantry counters, default rows, and item-level pantry/default buttons now use shared token classes instead of hard-coded teal utilities, leaving the Shopping List template clean for cyan/teal hits.
- Shows Not-in-Goals report controls now use selectable/soft action tokens, and Recipe pantry-match "On hand" badges now use emerald status classes instead of teal, leaving Shows and Recipes clean for cyan/teal hits.

### 20. Code Quality / Refactoring

- Do a general code cleanup pass across the API, Angular app, and public sites.
- Extract reusable functions/components/services where repeated code has accumulated.
- Standardize naming, form handling, filtering/report helpers, CSS utility patterns, and API mapping patterns where sections have drifted.
- Keep refactors behavior-preserving unless a specific section is already being actively redesigned.
- Alcohol browser CSV export helpers consolidated with a shared inventory row formatter and focused-report export map, reducing repeated report export methods without changing UI behavior.
- Admin Settings AppSettings JSON read/write helpers added so straightforward settings endpoints share one defensive deserialize/normalize and upsert/serialize path instead of repeating persistence code.
- Shared Angular CSV download service added and adopted across feature CSV exports, including Admin Settings, Admin Users, Music, Books, Magazines, Chessex, Toys, Spookytown, Phone List, RPG, Miniatures, Software, Chores, Recipes, Alcohol, Dice Games, Shows, Shopping List, Dino Admin, MTG, Barcode Staging, Fish, Gardening, and Goals & Plans.
- Shared CSV object-row export support added and adopted by Finance, Comics, Comic Want List, and Task Dashboard so report-object and matrix exports share the same escaping and download path.
- Dice Games, Admin Users, Blog, Software, and collection browser duplicated edit-form action strips/filter controls now use shared token controls/actions, with clearer in-panel reset labels for D&D Dice Masters, Dragon Dice, Admin Users, Blog, Books, Chessex, Toys, Magazines, and Spookytown forms.
- Recipes and Shopping List secondary action buttons now use shared token controls/actions, with clearer form-reset labels for recipe source, shopping item, saved default, and pantry forms.
- Shows browser/report secondary action buttons now use shared token controls/actions across filters, show/season/boxset forms, report exports, and Goals selection helpers.
- Phone List and Miniatures browser/report secondary action buttons now use shared token controls/actions across headers, filters, imports, and edit forms.
- Music browser and Metal Archives gap-finder action buttons now use shared token controls/actions across headers, artist creation, edit resets, search/compare actions, and missing-release selection helpers.
- Comics and MTG browser/report action buttons now use shared token controls/actions across exports, filters, imports, edit form cancellation/reset, and MTG detail filter helpers.
- Barcode staging action buttons now use shared token controls/actions across batch refresh/staging, lookup providers, import validation preview downloads, batch/history downloads, and candidate selection.
- External Imports action buttons now use shared token controls/actions across navigation, provider settings saves, preview/ignore actions, and staged-item filter clearing.
- Alcohol browser action buttons and primary form controls now use shared token controls/actions across header exports, filtering, reports, lookup merge, import staging, and item editing.
- Chore manager report exports, form reset, recurrence templates, activity refresh, and row edit actions now use shared token action styling.
- Finance tracker report dates, print/export controls, month navigation, refresh, and focused CSV actions now use shared token controls/actions across dashboard, reports, bills, and donations panels.

### 21. Identity / Authorization

Password-protected app exists.

Continue enforcing:

- Viewer: view-only.
- User: view plus reviews where applicable.
- Contributor: everything except admin.
- Admin: full access.
- Identity admin role matrix and safety checks added with per-role coverage cards, access descriptions, identity review warnings, and last-Admin delete/demotion protection enforced in both UI and API.
- Identity audit CSV export added with generated-at metadata, role counts, permission matrix rows, current warnings, and sorted account rows for portable admin review.

### 22. Azure Hosting Plan

- Environment-based API URLs and Azure-safe config baseline added with Angular production environment replacement, API CORS allowed-origins configuration, local-only development connection/JWT settings, production JWT issuer/audience validation flags, and startup failure when `Jwt:Key` is missing.
- SQL Server hosting/migration workflow documented with Azure SQL checklist, App Service connection string guidance, idempotent EF migration SQL script generation, and optional EF migration bundle script.
- GitHub Actions CI/publish pipeline scaffold added for API, Angular, and public site artifact builds, with manual Azure App Service deploy jobs for API/site behind repository variables and publish-profile secrets.
- Hosting shape decision documented: use a separate static Angular app, ASP.NET API App Service, and public MVC App Service; keep the single-host option deferred unless cost/domain simplicity outweighs independent deploys.
- Database backup/restore plan documented with Azure SQL point-in-time restore, pre-migration exports, restore drills, incident restore flow, and local `.bacpac` verification guidance.
- Logging/diagnostics baseline added with production exception handling, HTTP request logging, correlation IDs, anonymous `/api/health` SQL connectivity check, logging config defaults, Azure App Service diagnostics guidance, and future Application Insights notes.
- Production CORS review completed with startup validation for non-development origins, placeholder/local/wildcard rejection, allowed-origin startup logging, and deployment guidance for Angular/public-site origins.
- File/image storage needs reviewed and documented: current Home Inventory binary images remain SQL-backed for initial Azure deployment, external cover/artwork fields stay URL-based, and Azure Blob Storage is planned as the longer-term media store with metadata, migration, validation, and backup implications captured.

## Performance / Bundle Size Refactors

- Status: closed for now; continue monitoring with `npm run bundle:check` before Angular route/shared/dependency/style changes and reopen only when the report shows over-threshold lazy chunks or the initial bundle approaches the warning budget.
- Initial bundle warning resolved in the current refactor pass.
  - Converted remaining eager route imports for Home, Tasks, Backups, and Home Inventory to lazy `loadComponent`.
  - Current production build initial bundle: 430.87 kB, below the 550 kB warning budget.
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
- Goals reporting split completed.
  - Extracted deferred Goals reporting panel so year/section progress cards and report tables load when the Reporting section enters the viewport.
- Continue enforcing route-level lazy loading for major sections: Gardening, Finance, Fish, Goals, Barcode, Shopping, Recipes, Software, Minis, Shows, Comics, Alcohol, Guitar, and other large feature areas.
- Split oversized feature pages into child routes/components when they become hard to maintain or slow to load.
  - Gardening candidates: trays, beds, seeds, harvests, reports.
  - Finance candidates: dashboard, accounts, bills, donations, reports/exports.
  - Goals candidates: outline, staging/import, reports, schedule integration.
- Keep shared/root imports lean: app shell, navigation, auth, home widgets, and shared controls should not import heavy feature-only code.
- Lazy-load charting/report-heavy UI where practical, especially Finance, Fish, Gardening, and Goals reports.
  - Fish water reading trend panel extracted into a deferred child component so chart rendering loads when the panel enters the viewport.
  - Fish report-table panel split evaluated and deferred for now; the first attempted `vm` pass-through component made Angular compilation unreliable in this workspace, so revisit with a narrower typed panel contract instead of a whole-section move.
  - Fish reports panel extracted with a narrower deferred child contract for overdue tasks, water-test due rows, replacement products, profile/food gaps, and quarantine attention.
  - Fish species profile/food browser extracted into a deferred child component so profile import, profile list, food import, and food inventory matching tables load when the panel enters the viewport.
  - Fish livestock event history/quarantine tracker extracted into a deferred child component so dense event tables load when the panel enters the viewport.
  - Fish aquarium products browser/import panel extracted into a deferred child component so product filters, bulk import preview, and product inventory tables load when the panel enters the viewport.
  - Fish product usage history panel extracted into a deferred child component so usage filters and shopping-candidate history tables load when the panel enters the viewport.
  - Fish tank timeline panel extracted into a deferred child component so history grouping and timeline cards load when the panel enters the viewport.
  - Fish generated schedule occurrence panel extracted into a deferred child component so schedule-action controls load with the occurrence list instead of the main Fish route.
  - Fish task list/schedule generation panel extracted into a deferred child component so task filters, schedule preview controls, and task action tables load when the panel enters the viewport.
  - Barcode duplicate scan panel extracted into a deferred child component so duplicate review rendering loads when the panel enters the viewport.
  - Barcode import validation preview panel extracted into a deferred child component so commit preview tables load when the panel enters the viewport.
  - Barcode batch history/reporting panel extracted into a deferred child component so history, provider-health, and cleanup tables load when the panel enters the viewport.
  - Finance reports/export action panel extracted into a deferred child component so print/export controls load when the panel enters the viewport.
  - Finance recurring bill reports panel extracted into a deferred child component so bill analytics tables load when the Bills tab report area enters the viewport.
  - Finance donations review panel extracted into a deferred child component so donation summaries, filters, and review tables load when the Donations tab panel enters the viewport.
  - Goals archive/new-year rollover panel extracted into a deferred child component so archived-year lists, rollover preview tables, and archive comparison tools load when the panel enters the viewport.
  - Goals section summaries panel extracted into a deferred child component so per-section progress cards and queue-focus shortcuts load when the panel enters the viewport.
  - Goals focused work report extracted into a deferred child component so active, overdue, unscheduled, and blocked task report tables load when that view enters the viewport.
  - Goals grid mass-edit panel extracted into a deferred child component so queue mass-edit controls and editable grid tables load only when Grid view enters the viewport.
  - Goals outline browser/detail panel extracted into a deferred child component so the outline table, dependency editor, move tools, and selected-item sidebar are split from the route chunk.
  - Gardening seed-start planning report extracted into a deferred child component so month summary cards, tray/area summaries, and planning rows load when the report panel enters the viewport.
  - Gardening harvest report panel extracted into a deferred child component so harvest summary cards and top month/crop/area totals load when the report card enters the viewport.
  - Shared Material form-control chunk reviewed and removed by converting Links and RPG browser/detail/edit controls to Bootstrap/native form controls and buttons.
  - Links accordion converted from Angular Material expansion panels to native details/summary panels, removing the last feature-level Material import from the Angular app while preserving collapsible topic/subtopic browsing.
  - Global Angular Material Sass theme removed after feature-level Material cleanup, replacing unused --mat-* defaults with plain app body colors and removing @angular/material from Angular dependencies.
  - Unused Angular CDK package removed after Material cleanup confirmed no CDK imports or directives remain in the Angular source tree.
  - Unused direct PostCSS helper dependencies removed after confirming Tailwind's configured PostCSS plugin and Angular builds work without top-level autoprefixer or postcss entries.
  - Bootstrap Sass import deprecation warnings silenced through Angular Sass preprocessor options while keeping the existing selective Bootstrap partial bundle intact.
  - Bootstrap utility coverage tightened with targeted shell/menu shims for the small set of utility class names used by templates, avoiding a full Bootstrap utilities import while keeping responsive navigation layout explicit.
  - Initial bundle stats inspected after lazy route cleanup; the largest initial JS chunks are framework/runtime dominated (Angular core/common/router/platform-browser) with no heavy feature module leaking into startup.
- Angular bundle analysis workflow added with `npm run bundle:report`, a repo script that builds production output and writes an initial/lazy JS/CSS report to `artifacts/bundle/angular-bundle-report.md`.
- Bundle report guardrails polished with configurable initial budget and lazy-review thresholds, summary status labels, largest-initial tracking, and a dedicated lazy split candidate table.
- Bundle report lazy summary status now derives from the same over-threshold asset list used by the Lazy Split Candidates table, so an empty candidate table reports Lazy JS/CSS as OK.
- Bundle report source labeling added with Angular `stats.json` generation, stats metadata discovery, source-path columns for largest assets and lazy split candidates, and a note that shared chunks may remain unlabeled.
- Bundle threshold check added with `npm run bundle:check`, reusing the report thresholds and failing the command when the initial bundle is over budget or lazy split candidates exceed the review threshold.
- GitHub Actions Angular job now runs `npm run bundle:check` and uploads the generated bundle report artifact so CI enforces the same local bundle guardrails.
- Bundle analysis docs updated with when to run `bundle:report` versus `bundle:check`, the CI artifact behavior, and the current no-over-threshold lazy chunk baseline.
- Current bundle report snapshot: initial JS/CSS 430.87 kB, lazy JS/CSS 2346.25 kB, no lazy split candidates above the 125 kB review threshold, and largest initial asset 175.93 kB.
- Watch lazy chunk sizes as well as initial bundle size; a large lazy page is acceptable, but it should eventually be split if it becomes unpleasant to use or maintain.



