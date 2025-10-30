/**
 * OpenMetadata Configuration
 * Provides integration with OpenMetadata for data catalog management
 */

const OPENMETADATA_CONFIG = {
  baseUrl: import.meta.env.VITE_OPENMETADATA_URL || "http://localhost:8585",
  apiVersion: "v1",
  token: import.meta.env.VITE_OPENMETADATA_TOKEN || "",
};

/**
 * Fetch data catalog from OpenMetadata
 */
export const fetchDataCatalog = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams({
      limit: filters.limit || 100,
      offset: filters.offset || 0,
      ...(filters.service && { service: filters.service }),
      ...(filters.database && { database: filters.database }),
    });

    const response = await fetch(
      `${OPENMETADATA_CONFIG.baseUrl}/api/${OPENMETADATA_CONFIG.apiVersion}/tables?${queryParams}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENMETADATA_CONFIG.token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`OpenMetadata API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || [],
      paging: data.paging || {},
    };
  } catch (error) {
    console.error("Error fetching data catalog:", error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

/**
 * Fetch specific table metadata from OpenMetadata
 */
export const fetchTableMetadata = async (tableId) => {
  try {
    const response = await fetch(
      `${OPENMETADATA_CONFIG.baseUrl}/api/${OPENMETADATA_CONFIG.apiVersion}/tables/${tableId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENMETADATA_CONFIG.token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`OpenMetadata API error: ${response.status}`);
    }

    return {
      success: true,
      data: await response.json(),
    };
  } catch (error) {
    console.error("Error fetching table metadata:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Search data catalog in OpenMetadata
 */
export const searchDataCatalog = async (query) => {
  try {
    const response = await fetch(
      `${OPENMETADATA_CONFIG.baseUrl}/api/${OPENMETADATA_CONFIG.apiVersion}/search/query?q=${encodeURIComponent(query)}&index=table_search_index`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENMETADATA_CONFIG.token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`OpenMetadata API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data.hits?.hits || [],
    };
  } catch (error) {
    console.error("Error searching data catalog:", error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

/**
 * Transform OpenMetadata table to Data Space format
 */
export const transformToDataSpaceFormat = (omTable) => {
  return {
    id: omTable.id,
    name: omTable.name,
    displayName: omTable.displayName || omTable.name,
    description: omTable.description || "",
    fullyQualifiedName: omTable.fullyQualifiedName,
    database: omTable.database?.name || "",
    service: omTable.service?.name || "",
    columns: omTable.columns?.map((col) => ({
      name: col.name,
      dataType: col.dataType,
      description: col.description || "",
    })) || [],
    tags: omTable.tags?.map((tag) => tag.tagFQN) || [],
    owner: omTable.owner?.name || "Unknown",
    tier: omTable.tier?.tagFQN || "Tier.Tier1",
    usageSummary: omTable.usageSummary || {},
  };
};

export default OPENMETADATA_CONFIG;
