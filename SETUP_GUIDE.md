# Data Space Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- OpenMetadata instance (optional but recommended)

## Step-by-Step Setup

### 1. Environment Configuration

Create or update your `.env` file with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON=your_supabase_anon_key

# Storage Buckets
VITE_SUPABASE_BUCKET=logictrack360
VITE_SUPABASE_BUCKET_DATA=data-space
VITE_SUPABASE_BUCKET_TEMPLATES=templates

# OpenMetadata Configuration (Optional)
VITE_OPENMETADATA_URL=http://localhost:8585
VITE_OPENMETADATA_TOKEN=your_openmetadata_jwt_token
```

### 2. Database Setup

#### Option A: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database_schema.sql`
4. Execute the script

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

### 3. Storage Buckets Setup

Create the required storage buckets in Supabase:

1. Go to Storage in your Supabase dashboard
2. Create the following buckets:
   - `logictrack360` (for general documents)
   - `data-space` (for data space files)
   - `templates` (for templates)

3. Configure bucket policies:

```sql
-- Make data-space bucket publicly readable
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'data-space');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'data-space' AND
  auth.role() = 'authenticated'
);
```

### 4. OpenMetadata Setup (Optional)

If you want to use OpenMetadata for catalog management:

#### Option A: Docker Installation

```bash
# Clone OpenMetadata
git clone https://github.com/open-metadata/OpenMetadata.git
cd OpenMetadata

# Start with Docker Compose
docker compose up -d

# Access at http://localhost:8585
# Default credentials: admin / admin
```

#### Option B: Kubernetes Installation

Follow the official guide: https://docs.open-metadata.org/deployment/kubernetes

#### Configure OpenMetadata

1. Access OpenMetadata UI at http://localhost:8585
2. Login with default credentials
3. Add your data sources (PostgreSQL, MySQL, etc.)
4. Generate a JWT token:
   - Go to Settings → Bots
   - Create a new bot or use existing
   - Generate JWT token
5. Add the token to your `.env` file

### 5. Install Dependencies

```bash
npm install
```

### 6. Run the Application

#### Development Mode

```bash
npm run dev
```

Access the application at http://localhost:5173

#### Production Build

```bash
npm run build
npm run preview
```

### 7. Verify Installation

1. Navigate to the application
2. Click on "📊 Datos" in the sidebar
3. You should see the Data Space interface with 5 tabs

### 8. Test the Data Space

#### Without OpenMetadata

1. Go to "📤 Mis Publicaciones"
2. Create a test publication
3. Go to "📚 Catálogo de Datos"
4. Uncheck "Usar OpenMetadata"
5. You should see your publication

#### With OpenMetadata

1. Ensure OpenMetadata is running
2. Add some data sources to OpenMetadata
3. Go to "📚 Catálogo de Datos"
4. Check "Usar OpenMetadata"
5. You should see datasets from OpenMetadata

## Common Issues and Solutions

### Issue: OpenMetadata Connection Failed

**Solution:**
- Check that OpenMetadata is running
- Verify the URL in `.env` is correct
- Ensure the JWT token is valid
- Check CORS settings in OpenMetadata

### Issue: Database Policies Error

**Solution:**
- Ensure all RLS policies are created
- Check that you're authenticated in Supabase
- Verify the policies match your auth.uid()

### Issue: File Upload Fails

**Solution:**
- Check storage bucket exists
- Verify bucket policies allow uploads
- Ensure file size is within limits
- Check browser console for detailed errors

### Issue: Catalog is Empty

**Solution:**
- Publish some test data first
- If using OpenMetadata, add data sources
- Check database connection
- Verify RLS policies allow reading

## Data Space Workflows

### Workflow 1: Publishing Data

```
Provider → Mis Publicaciones → Nueva Publicación → 
Fill Form → Upload File → Publicar → ✅ Published
```

### Workflow 2: Requesting Data

```
Consumer → Catálogo → Find Dataset → Solicitar Acceso → 
Wait for Approval → ✅ Request Sent
```

### Workflow 3: Approving Request

```
Provider → Solicitudes → Recibidas → Review Request → 
Aprobar → ✅ Contract Created
```

### Workflow 4: Data Transfer

```
Provider → Contratos → Select Contract → Iniciar Transferencia →
Consumer → Transferencias → Wait → Descargar → ✅ Complete
```

## Security Considerations

### Authentication

The current implementation assumes Supabase authentication. Update RLS policies if using a different auth system:

```sql
-- Example: Custom auth field
CREATE POLICY "Custom auth policy"
ON data_publications FOR SELECT
USING (publisher_id = current_user_id());
```

### Data Encryption

- Enable encryption at rest in Supabase
- Use HTTPS for all communications
- Consider end-to-end encryption for sensitive data

### Access Control

- Review and customize RLS policies
- Implement role-based access control
- Use Supabase Auth for user management

## Monitoring and Maintenance

### Database Maintenance

```sql
-- Check active contracts
SELECT * FROM active_contracts_summary;

-- View request statistics
SELECT * FROM request_statistics;

-- Audit recent activities
SELECT * FROM data_space_audit_log 
ORDER BY timestamp DESC 
LIMIT 100;
```

### Performance Optimization

- Add indexes for frequently queried fields
- Monitor storage bucket usage
- Implement caching for catalog data
- Use pagination for large datasets

## Support and Documentation

- **Data Space README**: See `DATA_SPACE_README.md`
- **Database Schema**: See `database_schema.sql`
- **OpenMetadata Docs**: https://docs.open-metadata.org
- **Supabase Docs**: https://supabase.com/docs

## Next Steps

1. ✅ Complete setup
2. ✅ Test all workflows
3. 📝 Customize for your use case
4. 🔐 Review security settings
5. 📊 Add monitoring
6. 🚀 Deploy to production

---

**Need Help?** Contact the development team or check the documentation.
