# Data Space - IDSA/DSSC Compliant

## Overview

This Data Space implementation provides a comprehensive, IDSA (International Data Spaces Association) and DSSC (Data Spaces Support Centre) compliant platform for managing data sharing within organizations and between trusted partners.

## Features

### 1. **Data Catalog** 📚
- Integration with OpenMetadata for centralized data catalog management
- Browse and search available datasets
- View detailed metadata including schemas, owners, and tags
- Request access to datasets
- Fallback to local catalog when OpenMetadata is unavailable

### 2. **Data Publications** 📤
- Publish datasets to the Data Space
- Define usage policies and licenses
- Support for multiple data formats (CSV, JSON, XML, Parquet, etc.)
- Paid and free data offerings
- Metadata management

### 3. **Request Management** 📨
- Send data access requests to data providers
- Receive and manage incoming requests
- Approve/reject requests
- Automatic contract creation upon approval
- Track request status

### 4. **Contract Management** 📋
- Implicit contract signing upon request approval
- Define contract terms and conditions
- Set validity periods
- Manage active contracts
- Terminate contracts when needed

### 5. **Data Transfers** 🔄
- Initiate data transfers based on contracts
- Track transfer progress
- Direct download or API-based transfers
- Transfer logs and monitoring
- Multiple transfer methods support

## IDSA/DSSC Compliance

This implementation follows key principles of the International Data Spaces:

### Data Sovereignty
- Data owners maintain control over their data
- Usage policies enforced through contracts
- Explicit consent required for data access

### Trust and Security
- Role-based access control
- Contract-based data sharing
- Audit trail for all transactions

### Standardized Architecture
- Connector pattern for data exchange
- Metadata standardization via OpenMetadata
- Clear separation of concerns

## User Roles

The system supports multiple IDSA-defined roles:

- **Data Provider**: Publishes and shares data
- **Data Consumer**: Requests and consumes data
- **Service Provider**: Offers data processing services
- **Broker Service Provider**: Facilitates data discovery
- **Clearing House**: Logs transactions for accountability
- **App Store Provider**: Provides data apps
- **Vocabulary Provider**: Manages semantic models

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Data Space UI                         │
├─────────┬──────────┬──────────┬──────────┬──────────────────┤
│ Catalog │ Publish  │ Requests │ Contracts│ Transfers        │
└─────────┴──────────┴──────────┴──────────┴──────────────────┘
           │          │          │          │
           ▼          ▼          ▼          ▼
    ┌──────────────────────────────────────────┐
    │          Supabase Backend                │
    │  ┌──────────┐  ┌──────────┐             │
    │  │ Database │  │ Storage  │             │
    │  └──────────┘  └──────────┘             │
    └──────────────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────────────┐
    │        OpenMetadata Integration          │
    │   (Data Catalog & Metadata Management)   │
    └──────────────────────────────────────────┘
```

## Database Schema

### Tables

#### `data_catalog`
- Stores local catalog entries
- Can be synced from OpenMetadata

#### `data_publications`
- Published datasets
- Includes metadata, pricing, usage policies

#### `data_requests`
- Access requests from consumers
- Links to catalog items or publications

#### `data_contracts`
- Automatically created contracts
- Terms, conditions, validity periods

#### `data_transfers`
- Actual data transfers
- Status, progress, logs

## Configuration

### Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON=your_supabase_anon_key
VITE_SUPABASE_BUCKET_DATA=data-space

# OpenMetadata
VITE_OPENMETADATA_URL=http://localhost:8585
VITE_OPENMETADATA_TOKEN=your_openmetadata_token
```

### OpenMetadata Setup

1. Install OpenMetadata (version 1.0+)
2. Configure connectors for your data sources
3. Generate an API token
4. Update the environment variables

## Usage Workflows

### Publishing Data

1. Navigate to "📤 Mis Publicaciones"
2. Click "➕ Nueva Publicación"
3. Fill in dataset information
4. Select category, format, and usage policy
5. Upload file or provide API endpoint
6. Click "📤 Publicar Datos"

### Requesting Data Access

1. Browse "📚 Catálogo de Datos"
2. Find desired dataset
3. Click "📨 Solicitar Acceso"
4. Wait for provider approval

### Approving Requests (Provider)

1. Go to "📨 Solicitudes" → "📥 Recibidas"
2. Review incoming requests
3. Click "✅ Aprobar" or "❌ Rechazar"
4. Contract is automatically created upon approval

### Transferring Data

1. Go to "📋 Contratos"
2. Find active contract
3. Click "🔄 Iniciar Transferencia"
4. Monitor progress in "🔄 Transferencias"
5. Consumer can download when complete

## Usage Policies

Supported policies include:
- Commercial Use
- Non-Commercial Use
- Research Only
- Internal Use Only
- Restricted Distribution
- Time Limited
- Geographic Restricted

## Data Formats

Supported formats:
- CSV
- JSON
- XML
- Parquet
- Avro
- ORC
- Excel
- SQL
- API

## Security Considerations

### Access Control
- Row Level Security (RLS) in Supabase
- Role-based permissions
- Contract-based access

### Data Protection
- Encrypted storage
- Secure file transfer
- Audit logging

### Compliance
- GDPR-ready architecture
- Data lineage tracking
- Usage monitoring

## Future Enhancements

- [ ] Advanced search with semantic queries
- [ ] Real-time data streaming
- [ ] Blockchain-based contract verification
- [ ] Machine learning for data recommendations
- [ ] Multi-party computation support
- [ ] Federated learning capabilities
- [ ] Enhanced monitoring and analytics
- [ ] API marketplace integration

## Support

For issues or questions:
1. Check the documentation
2. Review the code comments
3. Contact the development team

## License

This implementation is part of LogicTrack360 and follows the same licensing terms.

---

**Built with ❤️ for secure, sovereign data sharing**
