# CORS Production Domains

`Verdelak.Api` reads trusted browser origins from `Cors:AllowedOrigins`.

Production must set explicit HTTPS origins. The API now fails startup outside development when `Cors:AllowedOrigins` is empty, contains a wildcard, contains local development origins, or still contains the placeholder production value.

## Recommended production values

For the preferred separate-hosting shape:

```text
Cors__AllowedOrigins__0=https://app.verdelak.example
Cors__AllowedOrigins__1=https://www.verdelak.example
```

Use only origins that make browser calls directly to `Verdelak.Api`.

Do not include:

- API hostnames such as `https://api.verdelak.example`.
- Paths such as `https://app.verdelak.example/dashboard`.
- Wildcards.
- Localhost values in production.
- HTTP origins for production domains.

## Local development

Local origins live in `appsettings.Development.json`:

```json
[
  "http://localhost:4200",
  "http://localhost:4201",
  "http://127.0.0.1:4200",
  "http://127.0.0.1:4201",
  "http://[::1]:4200",
  "http://[::1]:4201"
]
```

The API falls back to those local origins only in development.

## Deployment checklist

- Set `Cors__AllowedOrigins__0` to the final Angular production origin.
- Add the public MVC site origin only if it calls the API from browser JavaScript.
- Confirm the Angular production `apiUrl` points to the API host.
- Confirm preflight requests succeed from the deployed Angular domain.
- Check API startup logs for the allowed-origin list.
