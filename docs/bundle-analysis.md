# Bundle Analysis

The Angular app already uses route-level lazy loading for the main feature areas. Use the bundle report before choosing the next split so refactors follow actual bundle size pressure.

Run from `Verdelak.Angular`:

```powershell
npm run bundle:report
```

The script builds production output, reads the generated `index.html`, identifies initial JS/CSS assets, and writes:

```text
artifacts\bundle\angular-bundle-report.md
```

Use the report to watch:

- Initial JS/CSS size against the production warning budget.
- Oversized lazy chunks that should become child routes or deferred panels.
- Accidental feature imports from shared/root code.

Good candidates for future splits remain Finance reports, Fish reporting, Gardening reports, and any large single-page admin workbench that starts to feel slow or hard to maintain.
