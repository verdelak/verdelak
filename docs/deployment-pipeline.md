# Deployment Pipeline

The baseline CI/publish workflow lives at `.github/workflows/ci-publish.yml`.

## What it builds

- `Verdelak.Api` with .NET 8.
- `Verdelak.Angular` with Node 22 and `npm ci`.
- `VerdelakCDSite` with .NET 10.

Each build uploads a separate artifact:

- `verdelak-api`
- `verdelak-angular`
- `verdelak-public-site`

## Optional Azure deploys

Deploys are manual-only through `workflow_dispatch` inputs so regular pushes and pull requests only build and package artifacts.

Required repository variables:

- `AZURE_API_APP_NAME`
- `AZURE_SITE_APP_NAME`

Required repository secrets:

- `AZURE_API_PUBLISH_PROFILE`
- `AZURE_SITE_PUBLISH_PROFILE`

The Angular artifact is packaged but not deployed yet. The recommended hosting shape is documented in `docs/azure-hosting-shape.md`: Angular as a static app, Verdelak.Api as a separate App Service, and VerdelakCDSite as a separate public App Service.

## Release order

1. Generate and review the idempotent migration SQL script.
2. Confirm backup coverage and create a manual export for high-risk schema changes.
3. Apply database migrations to the target Azure SQL database.
4. Run the `CI Publish` workflow with the appropriate deploy input enabled.
5. Confirm `/api/health`, authentication, CORS, and database read/write behavior.
6. Confirm the Angular app points at the production API URL.
7. Confirm production `Cors__AllowedOrigins__0` matches the deployed Angular origin.
