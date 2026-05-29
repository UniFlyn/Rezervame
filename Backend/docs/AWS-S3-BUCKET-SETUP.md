# AWS S3 bucket setup (Rezervame images)

Use the **same region as RDS** (`ap-southeast-2` Sydney) so uploads stay fast from Render.

| What | Where |
|------|--------|
| API | Render `https://rezervame.onrender.com` |
| Database | AWS RDS `rezervame-db` |
| Images | **S3 bucket** (this guide) |
| Web / Admin | Firebase Hosting (unchanged) |

---

## Step 1 — Create the bucket

1. Open [AWS S3 Console](https://s3.console.aws.amazon.com/) → **Create bucket**
2. **Bucket name:** `rezervame-assets-YOURNAME` (globally unique, lowercase)
3. **AWS Region:** `Asia Pacific (Sydney) ap-southeast-2`
4. **Object Ownership:** ACLs disabled (recommended)
5. **Block Public Access:** turn **off** all four checkboxes  
   (needed so Web/Mobile can load images via HTTPS URLs)
6. Confirm the warning → **Create bucket**

---

## Step 2 — Bucket policy (public read for `uploads/` only)

**Before editing:** S3 → your bucket → **Permissions** → **Block public access** → **Edit** → turn **off** all four → Save.

S3 → your bucket → **Permissions** → **Bucket policy** → **Edit**.

Replace **`rezervame-assets-prem`** below with your **exact bucket name** (copy from the bucket list — lowercase, no `s3://`, no URL).

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadUploads",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::rezervame-assets-prem/uploads/*"
    }
  ]
}
```

### If you see “Policy has invalid resource”

| Mistake | Wrong | Correct |
|---------|--------|---------|
| Placeholder left in | `YOUR_BUCKET_NAME` | Your real name, e.g. `rezervame-assets-prem` |
| Full URL | `https://bucket.s3.../uploads/*` | `arn:aws:s3:::bucket-name/uploads/*` |
| Missing colon | `arn:aws:s3::bucket/uploads/*` | `arn:aws:s3:::bucket/uploads/*` (**three** colons after `s3`) |
| Wrong bucket | ARN name ≠ bucket you’re editing | Must match **exactly** |
| Trailing slash only | `arn:aws:s3:::bucket/` | `arn:aws:s3:::bucket/uploads/*` |

**Easier (no JSON):** Permissions → **Bucket policy** → **Add statement** (or Policy generator):

- Effect: **Allow**
- Principal: `*`
- Action: **GetObject**
- Amazon Resource Name (ARN): `arn:aws:s3:::YOUR-BUCKET-NAME/uploads/*`

Or allow all objects in the bucket (simpler, slightly less locked down):

```json
"Resource": "arn:aws:s3:::rezervame-assets-prem/*"
```

**Note:** This JSON goes on the **S3 bucket policy**, not on the IAM user. IAM user policy uses the same ARN format but is attached under **IAM → Users**.

---

## Step 3 — CORS (optional)

Only needed if the browser uploads **directly** to S3 later. API uploads do not require CORS.

S3 → bucket → **Permissions** → **CORS**:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedOrigins": [
      "https://rezervame-web.web.app",
      "https://rezervame-admin.web.app",
      "http://localhost:3000",
      "http://localhost:3001"
    ],
    "ExposeHeaders": []
  }
]
```

---

## Step 4 — IAM user for Render (S3 access)

Do **not** use the root AWS account keys.

1. **IAM** → **Users** → **Create user** → name: `rezervame-render-s3`
2. **Attach policies directly** → create or use a custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME",
        "arn:aws:s3:::YOUR_BUCKET_NAME/uploads/*"
      ]
    }
  ]
}
```

3. User → **Security credentials** → **Create access key** → **Application running outside AWS**
4. Save **Access key ID** and **Secret access key** (shown once)

---

## Step 5 — Environment variables on Render

Render → **Rezervame** → **Environment**:

| Key | Example |
|-----|---------|
| `AWS_REGION` | `ap-southeast-2` |
| `S3_BUCKET_NAME` | `rezervame-assets-yourname` |
| `S3_UPLOAD_PREFIX` | `uploads` |
| `S3_PUBLIC_BASE_URL` | `https://rezervame-assets-yourname.s3.ap-southeast-2.amazonaws.com` |
| `AWS_ACCESS_KEY_ID` | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | `...` |

**Manual Deploy** after saving.

Local `Backend/.env` — same keys for dev/migration scripts.

---

## Step 6 — Migrate existing DB images to S3

From repo root (with `DATABASE_URL` pointing at RDS and S3 env set):

```bash
# Base64 / inline images only (safe default)
node scripts/migrate-images-to-s3.mjs

# Also copy external https images (Unsplash, etc.) into your bucket
node scripts/migrate-images-to-s3.mjs --include-http
```

Dry run:

```bash
node scripts/migrate-images-to-s3.mjs --dry-run
```

---

## S3 folder layout (automatic)

| Content | S3 folder |
|---------|-----------|
| Venue logo | `uploads/venues/logos/` |
| Venue banner | `uploads/venues/banners/` |
| Gallery | `uploads/venues/gallery/` |
| Service image | `uploads/venues/services/` |
| Category tile | `uploads/categories/` |
| Amenity | `uploads/amenities/` |
| Home hero / feature banner | `uploads/site/hero/` |
| Events | `uploads/events/` |
| Staff photo | `uploads/staff/` |
| User avatar | `uploads/avatars/` |
| Join documents | `uploads/documents/id|license|insurance/` |
| Support screenshots | `uploads/support/` |

**Public URL example:**

`https://YOUR_BUCKET.s3.ap-southeast-2.amazonaws.com/uploads/venues/logos/uuid.jpg`

---

## Verify

1. `GET https://rezervame.onrender.com/api/v1/health` → `"s3": "ok"` (when configured)
2. Admin → edit a category image → save → URL should start with your bucket host
3. Open that URL in a browser (should load, not 403)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Images 403 in browser | Bucket policy missing or wrong `uploads/*` ARN |
| Build OK but images still base64 in DB | S3 env missing on Render; redeploy |
| `S3 is not configured` on upload | Set all three: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME` |
| Upload works, health shows `s3: not_configured` | Redeploy after adding env vars |

---

## Free tier tips

- Stay under **5 GB** total storage
- Compress images in Admin/Web before upload
- Do **not** enable S3 Transfer Acceleration (paid)
- Set a **billing alarm** at $10 in AWS Billing

See also: [AWS-EC2-S3-SETUP.md](./AWS-EC2-S3-SETUP.md) if you later move the API to EC2.
