# 0027. Provider photos stored through MSFLib uploads

- Status: Accepted
- Date: 2026-10-09
- Depends on: ADR 0005, 0009, 0015, 0016; `docs/msflib-facts.md` "File uploads"

## Context

The project owner wants home-service providers (cleaners, private chefs, artisans) to "upload
their profile" so customers can see who is coming and what their work looks like. MSFLib core
already ships `msflib.utils.uploads` (local, Cloudinary, S3, GCS, Azure backends); the template
serves local files at `/uploads`. ADR 0015 forbids new packages, so photos must use this module.
The database is managed with `create_all` (ADR 0014): new tables are safe to add with
`python -m app.update_data`; new columns on existing tables are not.

## Decision

- New table `providerphoto` (`app/models/provider_photo.py`): `provider_workspace_id`, `kind`
  (`profile` | `work`), `url`, `caption`, and the `StorageBlob` locator fields
  (`storage_method`, `parent_folder`, `storage_bucket`, `filename`, `content_type`,
  `size_bytes`) so a photo can be deleted later. No column is added to `providerprofile`.
- At most one `profile` photo (a new one replaces and deletes the old file) and at most 8
  `work` photos per business (the 9th → 409).
- Uploads go through `validate_upload` (≤ 5 MB → else 413; `image/jpeg`, `image/png`,
  `image/webp` → else 415) **and** a magic-byte check of the first bytes (the MSFLib check
  trusts the client's `content_type`; a mismatch → 415). The stored filename is
  `{uuid4}.{ext}` chosen from the detected type, never the client's name. Files go to
  `images/providers/{workspace_id}/` with `save_file_blob(..., StorageMethod.file)`.
- Routes (provider, ADR 0005 dependencies): `POST /{slug}/provider/photo` (multipart `file`),
  `DELETE /{slug}/provider/photo`, `POST /{slug}/provider/photos` (`file`, optional
  `caption` ≤ 140), `DELETE /{slug}/provider/photos/{photo_id}` (another business's id → 404).
  Every route returns a JSON body (the updated `ProviderMine`, or the new photo), never 204:
  the MSFLib client always parses JSON (`docs/msflib-facts.md`).
- Reads: `ProviderDetail` (public provider page) and `ProviderMine` gain `photo_url`
  (nullable) and `photos` (work photos, oldest first). List endpoints (search cards, map pins)
  stay unchanged, so they need no extra query. URLs are the relative `/uploads/...` path; the
  frontend resolves them against the API origin (`utils/media.utils.ts`).
- Frontend: the provider profile screen has a Photos card using `FormBuilder` `upload`
  fields and `apiFormDataClient`; the public provider page shows the profile photo and a work
  gallery with `alt` text from the caption or business name.

## Alternatives considered

- A `photo_url` column on `providerprofile`: needs a migration (ADR 0014 has no Alembic
  baseline yet) and still needs the locator to delete the file.
- Cloudinary/S3: needs credentials and network; local storage is enough for the demo and the
  same code switches backend through `STORAGE_METHOD`.
- MSFLib's profile avatar (`update_profile_avatar`): belongs to the person's account, not the
  business, and one account can own several businesses (ADR 0004/0005).

## Consequences

- Photos live on the API server's disk under `backend/uploads/` (git-ignored); a deploy needs
  persistent storage or a switch to a cloud `STORAGE_METHOD`.
- No image resizing: the 5 MB cap and fixed display sizes keep pages reasonable.
- Run `python -m app.update_data` once to create the table on an existing database.
