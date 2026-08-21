# Azure Hosting Shape

Recommended production shape:

- `Verdelak.Angular`: Azure Static Web Apps or Azure Storage Static Website plus CDN/Front Door.
- `Verdelak.Api`: Azure App Service connected to Azure SQL.
- `VerdelakCDSite`: separate Azure App Service for the public MVC site.

This keeps the admin/productivity Angular app independently deployable from the API and avoids mixing static app routing, authenticated API endpoints, and the public MVC site into one deployment package.

File and image storage planning is documented in `docs/file-image-storage.md`. The initial Azure shape can launch with current SQL-backed Home Inventory images, with Azure Blob Storage planned as the longer-term media store.

## Why this shape fits Verdelak

- The Angular app already has environment-based API URLs and can point at a separate production API origin.
- The API owns authentication, admin data, migrations, CORS, and database access.
- The public MVC site has a different audience and can stay small, cacheable, and independently deployable.
- The pipeline already packages API, Angular, and public site as separate artifacts.

## Production layout

Use clear hostnames so CORS, cookies, diagnostics, and future storage rules stay understandable:

```text
app.verdelak.example      -> Angular app
api.verdelak.example      -> Verdelak.Api
www.verdelak.example      -> public MVC site
```

The exact domains can change, but keeping app/API/public-site roles separate is the important part.

## Angular deployment options

Preferred option:

- Azure Static Web Apps for the Angular app.

Good fallback:

- Azure Storage Static Website behind Azure CDN or Front Door.

Use the Angular production environment value for the API base URL:

```typescript
apiUrl: 'https://api.verdelak.example/api'
```

## API deployment

Deploy `Verdelak.Api` to Azure App Service with:

- `ConnectionStrings__DefaultConnection`
- `Jwt__Key`
- `Jwt__Issuer`
- `Jwt__Audience`
- `Jwt__ValidateIssuer=true`
- `Jwt__ValidateAudience=true`
- `Cors__AllowedOrigins__0=https://app.verdelak.example`

Run reviewed EF migrations against Azure SQL before promoting each API release that changes the schema.

See `docs/cors-production-domains.md` for the production CORS allow-list rules.

## Public site deployment

Deploy `VerdelakCDSite` separately from the Angular app. This keeps public content changes isolated from admin app releases and allows the public site to use normal ASP.NET MVC routing without affecting Angular fallback routing.

## Deferred single-host option

A single hosted app can still work later, but it would add deployment coupling and routing complexity:

- Angular build output would need to be copied into an ASP.NET host.
- API routes and Angular fallback routes would need careful ordering.
- Public MVC routes would need to coexist with Angular routes.
- Every front-end-only change would redeploy the server host.

Use this only if infrastructure cost or domain simplicity becomes more important than independent deploys.
