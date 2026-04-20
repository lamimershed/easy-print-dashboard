# Upload Module

Handles all file uploads for the Easy Print backend. Provides a storage-agnostic API that works with local disk today and can be migrated to AWS S3 by changing a single environment variable.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [Disk Folder Structure](#disk-folder-structure)
5. [API Reference](#api-reference)
6. [Environment Variables](#environment-variables)
7. [Registration Logo Flow](#registration-logo-flow)
8. [S3 Migration Guide](#s3-migration-guide)
9. [Extending the Module](#extending-the-module)
10. [Security Notes](#security-notes)

---

## Overview

- **Module:** `src/upload/upload.module.ts`
- **Controller:** `POST /upload/logo/pre-register`, `POST /upload/client-logo`
- **Storage drivers:** `local` (disk) | `s3` (AWS S3)
- **Current use case:** Client logo uploads (pre-registration and post-registration)
- **Designed for:** General-purpose image uploads — adding new categories requires no changes to the storage layer

---

## Architecture

The module uses the **Strategy / Provider pattern** for storage. The application code never knows which backend is active — it only calls `provider.upload()` and receives a URL back.

```
UploadController
      │
      ▼
 UploadService
      │  injects STORAGE_PROVIDER token
      ▼
 IStorageProvider  ◄─── interface (storage.interface.ts)
      │
      ├── LocalStorageProvider  (STORAGE_DRIVER=local)
      │     saves to uploads/ on disk
      │     returns http://PUBLIC_URL/uploads/...
      │
      └── S3StorageProvider     (STORAGE_DRIVER=s3)
            uploads to AWS S3
            returns https://bucket.s3.amazonaws.com/... or CloudFront URL
```

**How the provider is selected** (`upload.module.ts`):

```ts
{
  provide: STORAGE_PROVIDER,
  useFactory: (config: ConfigService) => {
    return config.get('STORAGE_DRIVER') === 's3'
      ? new S3StorageProvider(config)
      : new LocalStorageProvider(config);
  },
  inject: [ConfigService],
}
```

Swapping storage = changing one env var. Zero application code changes.

---

## Directory Structure

```
src/upload/
├── UPLOAD.md                          ← this file
├── upload.module.ts                   ← NestJS module; registers storage provider via DI
├── upload.controller.ts               ← Route handlers for both upload endpoints
├── upload.service.ts                  ← Validation, storage orchestration, DB update
├── dto/
│   └── upload-response.dto.ts         ← Response shape: { url, path }
└── providers/
    ├── storage.interface.ts           ← IStorageProvider interface + STORAGE_PROVIDER token
    ├── local-storage.provider.ts      ← Saves files to disk; serves via ServeStaticModule
    └── s3-storage.provider.ts         ← AWS S3 upload/delete; includes migration guide in comments
```

---

## Disk Folder Structure

Files are stored under the `uploads/` directory at the project root (configurable via `UPLOADS_DIR`).

```
uploads/
├── pre-register/
│   └── {uuid}/
│       └── {timestamp}-{uuid}.{ext}   ← Temporary. Uploaded before registration.
│                                          Can be pruned after 24h if no client was created.
└── clients/
    └── {clientId}/
        └── logo/
            └── {timestamp}-{uuid}.{ext}  ← Permanent. Linked to Client.logoUrl in DB.
```

**Filename format:** `{Date.now()}-{uuidv4()}.{ext}`  
Example: `1714000000000-815cd8d4-d77e-439e-ab54-540bfd2e6d60.jpg`

This format guarantees:

- No filename collisions (UUID suffix)
- Files are naturally ordered by upload time (timestamp prefix)
- Original filename is not exposed (prevents path traversal / enumeration)

**S3 equivalent:** The same relative path is used as the S3 object key (no `uploads/` prefix for S3 — just `clients/{clientId}/logo/...`).

---

## API Reference

### `POST /upload/logo/pre-register`

Upload a logo image **before** creating an account. Returns a URL to pass as `logoUrl` in `POST /auth/register`.

| Property          | Value                                                |
| ----------------- | ---------------------------------------------------- |
| **Auth**          | None (public)                                        |
| **Rate limit**    | 30 req/min per IP (global ThrottlerGuard)            |
| **Content-Type**  | `multipart/form-data`                                |
| **Field name**    | `file`                                               |
| **Allowed types** | `image/jpeg`, `image/png`, `image/webp`, `image/gif` |
| **Max size**      | 5 MB (configurable via `UPLOAD_MAX_SIZE_MB`)         |

**Response `201`:**

```json
{
  "url": "http://localhost:3001/uploads/pre-register/151bce7e-.../1714000000000-uuid.jpg",
  "path": "uploads/pre-register/151bce7e-.../1714000000000-uuid.jpg"
}
```

**curl example:**

```bash
curl -X POST http://localhost:3001/upload/logo/pre-register \
  -F "file=@/path/to/logo.png"
```

---

### `POST /upload/client-logo`

Upload or replace a client logo after authentication. Automatically updates `Client.logoUrl` in the database.

| Property          | Value                                                                |
| ----------------- | -------------------------------------------------------------------- |
| **Auth**          | JWT Bearer token required                                            |
| **Roles**         | `CLIENT` (own profile) · `SUPER_ADMIN` (any client via `?clientId=`) |
| **Content-Type**  | `multipart/form-data`                                                |
| **Field name**    | `file`                                                               |
| **Allowed types** | `image/jpeg`, `image/png`, `image/webp`, `image/gif`                 |
| **Max size**      | 5 MB (configurable via `UPLOAD_MAX_SIZE_MB`)                         |

| Query param | Required for       | Description                         |
| ----------- | ------------------ | ----------------------------------- |
| `clientId`  | `SUPER_ADMIN` only | Target client ID to upload logo for |

**Response `201`:**

```json
{
  "url": "http://localhost:3001/uploads/clients/clxxx/logo/1714000000000-uuid.png",
  "path": "uploads/clients/clxxx/logo/1714000000000-uuid.png"
}
```

**curl example (CLIENT):**

```bash
curl -X POST http://localhost:3001/upload/client-logo \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/logo.png"
```

**curl example (SUPER_ADMIN uploading for a specific client):**

```bash
curl -X POST "http://localhost:3001/upload/client-logo?clientId=clxxx" \
  -H "Authorization: Bearer <admin-token>" \
  -F "file=@/path/to/logo.png"
```

**Error responses:**

| Status | Reason                                       |
| ------ | -------------------------------------------- |
| `400`  | Invalid file type or file exceeds size limit |
| `401`  | Missing or invalid JWT                       |
| `403`  | SUPER_ADMIN did not provide `?clientId=`     |
| `404`  | Client profile not found                     |

---

## Environment Variables

| Variable                | Default                 | Description                                                                                                               | Required                      |
| ----------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `STORAGE_DRIVER`        | `local`                 | Storage backend: `local` or `s3`                                                                                          | No                            |
| `UPLOADS_DIR`           | `uploads`               | Local directory for uploaded files (relative to project root)                                                             | No                            |
| `UPLOAD_MAX_SIZE_MB`    | `5`                     | Maximum upload size in megabytes                                                                                          | No                            |
| `PUBLIC_URL`            | `http://localhost:3001` | Base URL prepended to local file paths to construct public URLs. **Set to your production domain in Railway.**            | No (but must be set in prod)  |
| `AWS_S3_BUCKET`         | —                       | S3 bucket name                                                                                                            | Only when `STORAGE_DRIVER=s3` |
| `AWS_S3_REGION`         | `us-east-1`             | AWS region                                                                                                                | Only when `STORAGE_DRIVER=s3` |
| `AWS_ACCESS_KEY_ID`     | —                       | AWS access key                                                                                                            | Only when `STORAGE_DRIVER=s3` |
| `AWS_SECRET_ACCESS_KEY` | —                       | AWS secret key                                                                                                            | Only when `STORAGE_DRIVER=s3` |
| `AWS_CLOUDFRONT_URL`    | —                       | CloudFront CDN domain (e.g. `https://d1234.cloudfront.net`). If set, returned URLs use this instead of the S3 bucket URL. | No                            |

---

## Registration Logo Flow

`POST /auth/register` accepts `logoUrl` as an optional string. Since registration is not yet authenticated, the upload must happen first to obtain the URL.

```
Step 1 — Upload logo (no auth required)

  POST /upload/logo/pre-register
  Body: multipart/form-data  { file: <image> }

  Response: { url: "http://localhost:3001/uploads/pre-register/uuid/file.jpg" }

Step 2 — Register with the returned URL

  POST /auth/register
  Body: {
    "email": "user@example.com",
    "password": "Secret@123",
    "companyName": "Acme Print Co.",
    "phoneNumber": "+1234567890",
    "logoUrl": "http://localhost:3001/uploads/pre-register/uuid/file.jpg"
  }

  Response: { accessToken, user, client }
```

If the user does not upload a logo during registration, `logoUrl` can be omitted. They can update it later via `POST /upload/client-logo` after authentication.

---

## S3 Migration Guide

No application code changes are required to migrate from local storage to S3.

### Steps

1. **Create an S3 bucket** in your AWS account.

   Recommended bucket policy for public read access:

   ```json
   {
     "Effect": "Allow",
     "Principal": "*",
     "Action": "s3:GetObject",
     "Resource": "arn:aws:s3:::your-bucket-name/*"
   }
   ```

2. **Set environment variables** in Railway (or your deployment environment):

   ```env
   STORAGE_DRIVER=s3
   AWS_S3_BUCKET=your-bucket-name
   AWS_S3_REGION=us-east-1
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_CLOUDFRONT_URL=https://d1234.cloudfront.net   # optional, for CDN URLs
   ```

3. **Deploy.** The `UploadModule` will inject `S3StorageProvider` automatically.

4. **Existing local URLs** in `Client.logoUrl` continue to work as long as the old local files are accessible. There is no required backfill — migrate them opportunistically when clients re-upload.

### What changes, what doesn't

|                  | Local                                            | S3                                                              |
| ---------------- | ------------------------------------------------ | --------------------------------------------------------------- |
| Storage          | `uploads/` directory on server disk              | AWS S3 bucket                                                   |
| Returned URL     | `https://api.yourdomain.com/uploads/clients/...` | `https://bucket.s3.amazonaws.com/clients/...` or CloudFront URL |
| Path structure   | Same                                             | Same (used as S3 object key)                                    |
| Application code | Unchanged                                        | Unchanged                                                       |
| Deletion         | `fs.unlink()`                                    | `DeleteObjectCommand`                                           |

---

## Extending the Module

To add a new upload category (e.g. product images, banners):

### 1. Add a new method to `UploadService`

```ts
async uploadProductImage(file: Express.Multer.File, productId: string): Promise<UploadResponseDto> {
  this.validateFile(file);
  const filename = this.buildFilename(file.mimetype);
  const destPath = `products/${productId}/images/${filename}`;
  return this.storage.upload(file.buffer, destPath, file.mimetype);
}
```

### 2. Add a route to `UploadController`

```ts
@Post('product-image')
@UseInterceptors(FileInterceptor('file'))
uploadProductImage(
  @UploadedFile() file: Express.Multer.File,
  @Query('productId') productId: string,
): Promise<UploadResponseDto> {
  return this.uploadService.uploadProductImage(file, productId);
}
```

No changes needed to the storage providers, module wiring, or env vars.

**Resulting disk path:**

```
uploads/products/{productId}/images/{timestamp}-{uuid}.jpg
```

---

## Security Notes

| Concern                                      | Current mitigation                                                                                                                                                                                                   |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Anonymous abuse of pre-register endpoint** | Global `ThrottlerGuard` (30 req/min per IP). Tighten with `@Throttle` decorator if needed.                                                                                                                           |
| **File type spoofing**                       | MIME type checked against allowlist (`image/jpeg`, `image/png`, `image/webp`, `image/gif`). Note: MIME type comes from the multipart header — for stronger validation, add `file-type` package to check magic bytes. |
| **Oversized uploads**                        | Rejected at service layer if `file.size > UPLOAD_MAX_SIZE_MB * 1024 * 1024`. Multer's `limits.fileSize` can be added as a second layer.                                                                              |
| **Path traversal**                           | `destPath` is constructed server-side from trusted values (UUIDs, timestamps). User-supplied filenames are never used.                                                                                               |
| **Orphaned pre-register files**              | Files in `uploads/pre-register/` are temporary. A future cron job should prune directories older than 24h.                                                                                                           |
| **Direct access to other clients' logos**    | `uploads/clients/{clientId}/logo/` files are publicly served (by design — logos are public). No sensitive content should be placed in `uploads/clients/`.                                                            |
