# Bundle Analysis

The Angular app already uses route-level lazy loading for the main feature areas. Use the bundle report before choosing the next split so refactors follow actual bundle size pressure.

Run from `Verdelak.Angular`:

```powershell
npm run bundle:report
```

The report command builds production output, reads the generated `index.html`, identifies initial JS/CSS assets, and writes:

```text
artifacts\bundle\angular-bundle-report.md
```

Use the threshold check before commits that touch Angular routes, shared shell code, dependencies, or global styles:

```powershell
npm run bundle:check
```

The check command generates the same report and exits non-zero if the initial bundle exceeds the configured budget or any lazy chunk crosses the lazy-review threshold. GitHub Actions runs this same command in the Angular build job and uploads the generated report as an artifact.

Use the report to watch:

- Initial JS/CSS size against the production warning budget.
- Oversized lazy chunks that should become child routes or deferred panels.
- Accidental feature imports from shared/root code.

The current healthy state is no lazy split candidates over the review threshold. Future split candidates should come from the report after new feature work, especially any large single-page admin workbench that starts to feel slow or hard to maintain.
