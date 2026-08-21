# Azure SQL Migrations

This is the deployment baseline for moving Verdelak.Api database changes into Azure SQL without storing production secrets in the repository.

## App Service configuration

Set production values in Azure App Service configuration, deployment slots, or Key Vault-backed settings.

- `ConnectionStrings__DefaultConnection`: Azure SQL connection string.
- `Jwt__Key`: production signing key.
- `Jwt__Issuer`: production issuer.
- `Jwt__Audience`: production audience.
- `Jwt__ValidateIssuer`: `true`.
- `Jwt__ValidateAudience`: `true`.
- `Cors__AllowedOrigins__0`: production Angular origin.
- `Cors__AllowedOrigins__1`: additional trusted origins, when needed.

Keep local development values in `appsettings.Development.json` or user secrets. Do not commit production connection strings, SQL credentials, or JWT keys.

## Migration workflow

Generate an idempotent migration script:

```powershell
.\scripts\generate-migration-sql.ps1
```

Review the generated script:

```text
artifacts\sql\verdelak-migrations.sql
```

Apply the reviewed script through Azure Data Studio, SQL Server Management Studio, Azure Portal Query Editor, `sqlcmd`, or the release pipeline. Idempotent scripts are preferred for deployment because they can safely skip migrations that the target database has already applied.

Optionally generate an EF migration bundle:

```powershell
.\scripts\generate-migration-bundle.ps1
```

The default bundle target is:

```text
artifacts\migrations\verdelak-migrate.exe
```

Use the bundle when the deployment environment should run migrations as an executable instead of applying a reviewed SQL script.

## Azure SQL checklist

- Provision an Azure SQL server and database.
- Decide whether database access is public-firewall, VNet-integrated, private endpoint, or pipeline-only.
- Create a least-privileged database user for the API.
- Store the connection string in App Service configuration or Key Vault, not in source control.
- Generate and review the idempotent migration script before each release that changes the schema.
- Take a database backup or export before the first production migration and before high-risk schema changes.
- Apply migrations before swapping deployment slots or promoting the API release.
- Confirm the API can start with production configuration and read/write the migrated database.

See `docs/database-backup-restore.md` for the backup, restore, and restore-drill runbook.
