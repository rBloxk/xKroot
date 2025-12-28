# xKroot Storage Structure

All company and candidate data files are stored in the Supabase Storage bucket: **`xkroot-data`**

## Bucket Structure

```
xkroot-data/
├── company/
│   ├── logo/
│   │   └── {user_id}-logo-{timestamp}.{ext}
│   └── cover/
│       └── {user_id}-cover-{timestamp}.{ext}
└── candidate/
    ├── avatar/
    │   └── {user_id}-avatar-{timestamp}.{ext}
    ├── resume/
    │   └── {user_id}-resume-{timestamp}.{ext}
    ├── portfolio/
    │   └── {user_id}-portfolio-{timestamp}.{ext}
    └── cover/
        └── {user_id}-cover-{timestamp}.{ext}
```

## File Types

### Company Files
- **Logo**: Images only (JPEG, PNG, GIF, WebP) - Max 10MB
- **Cover Image**: Images only (JPEG, PNG, GIF, WebP) - Max 10MB

### Candidate Files
- **Avatar**: Images only (JPEG, PNG, GIF, WebP) - Max 10MB
- **Resume**: Images (JPEG, PNG, GIF, WebP) or Documents (PDF, DOC, DOCX) - Max 20MB
- **Portfolio**: Images only (JPEG, PNG, GIF, WebP) - Max 10MB
- **Cover Image**: Images only (JPEG, PNG, GIF, WebP) - Max 10MB

## API Endpoints

### Company Image Upload
- **Endpoint**: `/api/company/upload-image`
- **Method**: POST
- **Form Data**:
  - `file`: The image file
  - `type`: Either "logo" or "cover"

### Candidate File Upload
- **Endpoint**: `/api/candidate/upload-image`
- **Method**: POST
- **Form Data**:
  - `file`: The file to upload
  - `type`: One of "avatar", "resume", "portfolio", or "cover"

## Setup Instructions

1. **Create the Storage Bucket**:
   - Go to Supabase Dashboard → Storage
   - Create a new bucket named `xkroot-data`
   - Set it to **Public** (or configure RLS policies as needed)

2. **Configure RLS Policies** (if bucket is not public):
   ```sql
   -- Allow authenticated users to upload their own files
   CREATE POLICY "Users can upload own files"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'xkroot-data' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );

   -- Allow users to read their own files
   CREATE POLICY "Users can read own files"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (
     bucket_id = 'xkroot-data' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

3. **Run Database Migration**:
   - Apply `supabase/migrations/add_company_images.sql` to add logo and cover image fields

## File Naming Convention

Files are named using the pattern: `{user_id}-{type}-{timestamp}.{extension}`

Example:
- `550e8400-e29b-41d4-a716-446655440000-logo-1703847123456.png`
- `550e8400-e29b-41d4-a716-446655440000-avatar-1703847123456.jpg`

This ensures:
- Unique filenames
- Easy identification of file owner
- No conflicts between users
- Timestamp for versioning

