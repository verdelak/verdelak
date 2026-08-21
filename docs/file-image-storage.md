# File and Image Storage

Current recommendation: keep the existing SQL-backed image flow for now, but plan Azure Blob Storage before production use grows.

## Current state

Most Verdelak image fields are external URLs from lookup/import services:

- Book, album, barcode, Steam, Open Food Facts, Wikidata, and similar cover/artwork URLs.
- Dino content image URLs.
- External links and source URLs.

The main binary storage case is Home Inventory:

- Angular uploads an image file through `multipart/form-data`.
- `HomeInventoryController` stores the bytes in `HomeInventoryImages.Image`.
- The API returns images as base64 inside `HomeInventoryImageDto`.
- Angular renders those images with `data:{contentType};base64,...`.

That works locally, but it makes SQL backups larger, increases API response size, and makes thumbnails/CDN/caching harder.

## Production decision

For initial Azure deployment:

- Do not block deployment on a Blob migration.
- Keep current SQL image storage if the image count and file sizes are small.
- Add upload limits and image validation before broad use.

For longer-term production:

- Move Home Inventory image bytes to Azure Blob Storage.
- Keep image metadata in SQL.
- Serve images through API-authorized endpoints or short-lived SAS URLs.

## Proposed Blob metadata shape

Add metadata columns to `HomeInventoryImages` when ready:

```text
BlobContainer
BlobName
BlobUrl
ThumbnailBlobName
SizeBytes
Checksum
UploadedAtUtc
StorageProvider
```

Keep the existing SQL `Image` column during migration so old images can still render until all records are copied.

## Migration plan

1. Add nullable Blob metadata columns.
2. Add an image storage abstraction in the API.
3. Keep uploads writing to SQL until Blob configuration exists.
4. Add Blob-backed writes when `Storage:Images:Provider=AzureBlob`.
5. Add a backfill script to copy existing SQL bytes to Blob Storage.
6. Update API read paths to prefer Blob URLs or image streams when Blob metadata exists.
7. Remove or archive SQL image bytes only after restore testing confirms Blob backups are covered.

## Azure configuration

Future App Service settings:

```text
Storage__Images__Provider=AzureBlob
Storage__Images__Container=home-inventory-images
Storage__Images__UsePrivateContainer=true
Storage__Images__MaxUploadBytes=10485760
```

Use managed identity for Blob access when possible. If a connection string is required, store it in App Service configuration or Key Vault, not source control.

## Validation rules to add before public use

- Restrict uploads to known image MIME types.
- Enforce a maximum file size.
- Generate normalized blob names instead of trusting uploaded filenames.
- Strip unsafe metadata when image processing is introduced.
- Add thumbnails for gallery views.
- Return compact image metadata from list endpoints and fetch full images separately.

## Backup implications

Once Blob Storage is introduced, database restore is no longer enough for image recovery. Add:

- Blob soft delete.
- Blob versioning or point-in-time restore where appropriate.
- Storage account lifecycle rules.
- Restore drill that verifies SQL metadata and Blob image content together.
