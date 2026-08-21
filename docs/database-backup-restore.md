# Database Backup and Restore Plan

This plan covers Azure SQL production data for `Verdelak.Api`.

## Backup strategy

Use Azure SQL automatic backups as the primary protection layer:

- Enable point-in-time restore for the production database.
- Keep the default retention for low-risk personal deployments.
- Increase retention before larger public use, multi-user use, or major data entry periods.
- Use long-term retention for monthly or yearly snapshots once the database becomes difficult to recreate manually.

Create an explicit export before higher-risk changes:

- Before the first production migration.
- Before migrations that drop columns, rename tables, reshape required fields, or bulk-update records.
- Before importing large external data sets.
- Before changing authentication or user/role data.

Store exports in a private storage account/container with lifecycle rules. Do not commit `.bacpac`, `.bak`, SQL dumps, or exported user data to the repository.

Home Inventory images currently live in SQL, so database backups include them. If Azure Blob Storage is introduced later, restore drills must validate SQL metadata and Blob content together.

## Pre-release checklist

Before deploying an API release that changes the schema:

1. Generate and review the idempotent migration SQL script.
2. Confirm the current Azure SQL backup retention policy.
3. Create a manual database export when the migration is high-risk.
4. Record the database name, export location, migration script path, and deployment timestamp in the release notes.
5. Apply migrations before promoting the API release.

## Restore drills

Run a restore drill after the first Azure SQL deployment, then repeat quarterly or before major schema work.

Recommended drill:

1. Restore production to a temporary Azure SQL database using point-in-time restore.
2. Point a temporary API slot or local API configuration at the restored database.
3. Confirm login, admin user listing, recipes, shopping, inventory, schedules, and at least one media-heavy section.
4. Delete the temporary database after validation.

## Incident restore flow

For accidental bad data or a failed migration:

1. Stop or slot-swap the API to prevent more writes.
2. Identify the last known-good restore point.
3. Restore to a new database first; do not overwrite the original database immediately.
4. Validate the restored database with the API using production-equivalent settings.
5. Update the API connection string or swap the App Service slot to the restored database.
6. Keep the damaged database until the issue is understood and any missing records are reconciled.

## Local restore verification

For `.bacpac` exports, verify they can be imported into a local SQL Server or Azure SQL test database before relying on them for a major release.

At minimum, confirm:

- EF migrations history exists.
- Admin login works.
- Core list/detail screens load.
- Recently edited records are present.
- Scheduled and recurring data still has expected dates.

## Open decisions

- Final production backup retention window.
- Long-term retention cadence.
- Storage account/container name for exports.
- Whether release notes live in GitHub releases, a deployment log document, or both.
