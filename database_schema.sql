-- ================================================
-- Data Space Database Schema
-- IDSA/DSSC Compliant Implementation
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. DATA CATALOG TABLE
-- Stores metadata about available datasets
-- Can be synced from OpenMetadata
-- ================================================

CREATE TABLE IF NOT EXISTS data_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    fully_qualified_name VARCHAR(500) UNIQUE,
    database_name VARCHAR(255),
    service_name VARCHAR(255),
    owner VARCHAR(255),
    tier VARCHAR(50) DEFAULT 'Tier.Tier1',
    tags TEXT[], -- Array of tag FQNs
    columns JSONB, -- Column schema information
    metadata JSONB, -- Additional metadata
    openmetadata_id VARCHAR(255), -- Reference to OpenMetadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_catalog_name ON data_catalog(name);
CREATE INDEX idx_catalog_fqn ON data_catalog(fully_qualified_name);
CREATE INDEX idx_catalog_service ON data_catalog(service_name);

-- ================================================
-- 2. DATA PUBLICATIONS TABLE
-- Datasets published by data providers
-- ================================================

CREATE TABLE IF NOT EXISTS data_publications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    format VARCHAR(50),
    usage_policy VARCHAR(100),
    license VARCHAR(100) DEFAULT 'CC-BY-4.0',
    price DECIMAL(10, 2) DEFAULT 0.00,
    is_paid BOOLEAN DEFAULT FALSE,
    file_path TEXT, -- Path in storage bucket
    file_size BIGINT, -- File size in bytes
    metadata JSONB, -- Additional metadata
    publisher_role VARCHAR(100),
    publisher_id UUID, -- Reference to user/organization
    status VARCHAR(50) DEFAULT 'Active', -- Active, Inactive, Archived
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pub_category ON data_publications(category);
CREATE INDEX idx_pub_status ON data_publications(status);
CREATE INDEX idx_pub_publisher ON data_publications(publisher_id);

-- ================================================
-- 3. DATA REQUESTS TABLE
-- Access requests from data consumers
-- ================================================

CREATE TABLE IF NOT EXISTS data_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publication_id UUID REFERENCES data_publications(id) ON DELETE CASCADE,
    catalog_item_id UUID REFERENCES data_catalog(id) ON DELETE SET NULL,
    requester_role VARCHAR(100),
    requester_id UUID, -- Reference to user/organization
    request_type VARCHAR(100), -- Data Access Request, API Access Request, etc.
    message TEXT,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Rejected, Negotiating, Expired
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

CREATE INDEX idx_req_publication ON data_requests(publication_id);
CREATE INDEX idx_req_status ON data_requests(status);
CREATE INDEX idx_req_requester ON data_requests(requester_id);

-- ================================================
-- 4. DATA CONTRACTS TABLE
-- Contracts between providers and consumers
-- Created automatically when requests are approved
-- ================================================

CREATE TABLE IF NOT EXISTS data_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES data_requests(id) ON DELETE SET NULL,
    publication_id UUID REFERENCES data_publications(id) ON DELETE CASCADE,
    provider_role VARCHAR(100),
    provider_id UUID, -- Reference to user/organization
    consumer_role VARCHAR(100),
    consumer_id UUID, -- Reference to user/organization
    status VARCHAR(50) DEFAULT 'Active', -- Draft, Active, Completed, Terminated, Suspended
    contract_terms JSONB NOT NULL, -- Usage policies, restrictions, etc.
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    terminated_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

CREATE INDEX idx_contract_publication ON data_contracts(publication_id);
CREATE INDEX idx_contract_provider ON data_contracts(provider_id);
CREATE INDEX idx_contract_consumer ON data_contracts(consumer_id);
CREATE INDEX idx_contract_status ON data_contracts(status);

-- ================================================
-- 5. DATA TRANSFERS TABLE
-- Actual data transfers based on contracts
-- ================================================

CREATE TABLE IF NOT EXISTS data_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES data_contracts(id) ON DELETE CASCADE,
    publication_id UUID REFERENCES data_publications(id) ON DELETE CASCADE,
    provider_role VARCHAR(100),
    provider_id UUID,
    consumer_role VARCHAR(100),
    consumer_id UUID,
    transfer_method VARCHAR(100) DEFAULT 'Direct Download', -- Direct Download, API, Streaming
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, In Progress, Completed, Failed, Cancelled
    bytes_transferred BIGINT DEFAULT 0,
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    transfer_logs JSONB, -- Array of log entries
    metadata JSONB
);

CREATE INDEX idx_transfer_contract ON data_transfers(contract_id);
CREATE INDEX idx_transfer_status ON data_transfers(status);

-- ================================================
-- 6. AUDIT LOG TABLE
-- IDSA compliance - track all data space activities
-- ================================================

CREATE TABLE IF NOT EXISTS data_space_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL, -- Publication, Request, Contract, Transfer, etc.
    actor_role VARCHAR(100),
    actor_id UUID,
    resource_type VARCHAR(100), -- What was acted upon
    resource_id UUID,
    action VARCHAR(100), -- Create, Read, Update, Delete, Approve, Reject, etc.
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_event_type ON data_space_audit_log(event_type);
CREATE INDEX idx_audit_actor ON data_space_audit_log(actor_id);
CREATE INDEX idx_audit_timestamp ON data_space_audit_log(timestamp);

-- ================================================
-- TRIGGERS FOR UPDATED_AT
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_data_catalog_updated_at BEFORE UPDATE ON data_catalog
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_publications_updated_at BEFORE UPDATE ON data_publications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS for all tables
-- Note: Customize these policies based on your authentication system
-- ================================================

ALTER TABLE data_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_space_audit_log ENABLE ROW LEVEL SECURITY;

-- Example policies (adjust based on your auth system)

-- Data Catalog: Public read access
CREATE POLICY "Public read access for catalog"
    ON data_catalog FOR SELECT
    USING (true);

-- Publications: Users can read all, but only modify their own
CREATE POLICY "Public read access for publications"
    ON data_publications FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own publications"
    ON data_publications FOR INSERT
    WITH CHECK (auth.uid() = publisher_id);

CREATE POLICY "Users can update their own publications"
    ON data_publications FOR UPDATE
    USING (auth.uid() = publisher_id);

CREATE POLICY "Users can delete their own publications"
    ON data_publications FOR DELETE
    USING (auth.uid() = publisher_id);

-- Requests: Users can see requests they sent or received
CREATE POLICY "Users can see their own requests"
    ON data_requests FOR SELECT
    USING (
        auth.uid() = requester_id OR
        publication_id IN (
            SELECT id FROM data_publications WHERE publisher_id = auth.uid()
        )
    );

CREATE POLICY "Users can create requests"
    ON data_requests FOR INSERT
    WITH CHECK (auth.uid() = requester_id);

-- Contracts: Users can see contracts they're part of
CREATE POLICY "Users can see their contracts"
    ON data_contracts FOR SELECT
    USING (
        auth.uid() = provider_id OR
        auth.uid() = consumer_id
    );

-- Transfers: Users can see transfers they're part of
CREATE POLICY "Users can see their transfers"
    ON data_transfers FOR SELECT
    USING (
        auth.uid() = provider_id OR
        auth.uid() = consumer_id
    );

-- ================================================
-- SAMPLE DATA (Optional - for testing)
-- ================================================

/*
-- Insert sample catalog item
INSERT INTO data_catalog (name, display_name, description, database_name, service_name, owner, tags)
VALUES (
    'customer_data',
    'Customer Data',
    'Customer information including demographics and purchase history',
    'production',
    'postgres',
    'Data Team',
    ARRAY['PII', 'Customer', 'Production']
);

-- Insert sample publication
INSERT INTO data_publications (title, description, category, format, usage_policy, license, publisher_role)
VALUES (
    'Sales Dataset 2024',
    'Quarterly sales data with anonymized customer information',
    'Structured Data',
    'CSV',
    'Commercial Use',
    'CC-BY-NC-4.0',
    'Data Provider'
);
*/

-- ================================================
-- VIEWS FOR REPORTING
-- ================================================

-- Active contracts summary
CREATE OR REPLACE VIEW active_contracts_summary AS
SELECT 
    dc.id,
    dp.title as dataset_title,
    dc.provider_role,
    dc.consumer_role,
    dc.signed_at,
    dc.valid_until,
    COUNT(dt.id) as transfer_count
FROM data_contracts dc
JOIN data_publications dp ON dc.publication_id = dp.id
LEFT JOIN data_transfers dt ON dt.contract_id = dc.id
WHERE dc.status = 'Active'
GROUP BY dc.id, dp.title, dc.provider_role, dc.consumer_role, dc.signed_at, dc.valid_until;

-- Request statistics
CREATE OR REPLACE VIEW request_statistics AS
SELECT 
    status,
    COUNT(*) as count,
    MIN(requested_at) as first_request,
    MAX(requested_at) as last_request
FROM data_requests
GROUP BY status;

-- ================================================
-- FUNCTIONS
-- ================================================

-- Function to create contract from approved request
CREATE OR REPLACE FUNCTION create_contract_from_request(request_id UUID)
RETURNS UUID AS $$
DECLARE
    new_contract_id UUID;
    req RECORD;
BEGIN
    -- Get request details
    SELECT * INTO req FROM data_requests WHERE id = request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found';
    END IF;
    
    IF req.status != 'Approved' THEN
        RAISE EXCEPTION 'Request must be approved first';
    END IF;
    
    -- Create contract
    INSERT INTO data_contracts (
        request_id,
        publication_id,
        consumer_role,
        contract_terms,
        valid_until
    )
    VALUES (
        request_id,
        req.publication_id,
        req.requester_role,
        jsonb_build_object('autoCreated', true, 'duration', '1 year'),
        NOW() + INTERVAL '1 year'
    )
    RETURNING id INTO new_contract_id;
    
    RETURN new_contract_id;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- COMMENTS FOR DOCUMENTATION
-- ================================================

COMMENT ON TABLE data_catalog IS 'Centralized data catalog, can be synced from OpenMetadata';
COMMENT ON TABLE data_publications IS 'Datasets published by data providers in the Data Space';
COMMENT ON TABLE data_requests IS 'Access requests from data consumers to data providers';
COMMENT ON TABLE data_contracts IS 'Contracts between providers and consumers, created when requests are approved';
COMMENT ON TABLE data_transfers IS 'Actual data transfers based on active contracts';
COMMENT ON TABLE data_space_audit_log IS 'IDSA compliance - audit log of all data space activities';

-- ================================================
-- END OF SCHEMA
-- ================================================
