# Logging and Diagnostics

`Verdelak.Api` has a small production diagnostics baseline:

- HTTP request method/path/status logging through ASP.NET Core HTTP logging.
- `X-Correlation-ID` response headers for tracing a request through logs.
- Production exception handling at `/api/error`.
- Anonymous health endpoint at `/api/health` with SQL connectivity status.
- Logging level defaults in `appsettings.json` and `appsettings.Production.json`.

## Health check

Use this endpoint for App Service availability checks and post-deploy smoke tests:

```text
GET /api/health
```

Expected healthy response:

```json
{
  "ok": true,
  "service": "Verdelak.Api",
  "database": "reachable",
  "checkedAtUtc": "2026-08-09T00:00:00+00:00"
}
```

If the API can start but cannot reach SQL Server, the endpoint returns HTTP `503`.

## Azure App Service recommendations

- Enable App Service application logging for initial production rollout.
- Send logs to Log Analytics or Application Insights once the Azure resource group is created.
- Configure an availability check against `/api/health`.
- Include `X-Correlation-ID` when reporting API issues from the browser or public site.
- Keep EF SQL command logging at `Warning` in production unless diagnosing a data issue.

## Future Application Insights pass

Add Application Insights after the Azure subscription/resource group details are known. At that point, wire the API to an instrumentation connection string through App Service configuration and add dashboard queries for:

- Failed requests.
- Slowest endpoints.
- SQL connection failures.
- Authentication failures.
- Background scheduler exceptions.
