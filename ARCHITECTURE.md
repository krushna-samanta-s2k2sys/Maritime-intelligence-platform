# S&P Maritime Intelligence Platform — System Architecture

> **Version:** 1.0 | **Date:** 2026-05-12 | **Status:** Draft for Review

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [External Data Ingestion — D6 Pipeline](#3-external-data-ingestion--d6-pipeline)
4. [Database Architecture — Medallion Lakehouse](#4-database-architecture--medallion-lakehouse)
5. [Edit, Draft & Approval Workflow](#5-edit-draft--approval-workflow)
6. [Entity Resolution — Terahelix & Gearbox](#6-entity-resolution--terahelix--gearbox)
7. [AI Engine — Source Hierarchy & Confidence Scoring](#7-ai-engine--source-hierarchy--confidence-scoring)
8. [Real-Time Search Engine](#8-real-time-search-engine)
9. [Application Layer](#9-application-layer)
10. [Delivery Channels](#10-delivery-channels)
11. [File & Image Management](#11-file--image-management)
12. [Notification System](#12-notification-system)
13. [Authentication & Authorization — Okta](#13-authentication--authorization--okta)
14. [Data Migration & Backfill](#14-data-migration--backfill)
15. [Monitoring, Alerting & Observability](#15-monitoring-alerting--observability)
16. [Audit System](#16-audit-system)
17. [Security & Governance](#17-security--governance)
18. [Technology Stack Summary](#18-technology-stack-summary)

---

## 1. Executive Overview

The S&P Maritime Intelligence Platform is a cloud-native, multi-tenant data intelligence system that aggregates, cleanses, resolves, and distributes maritime data from 200+ external sources to internal analysts and external customers. The platform is built on GCP, anchored on BigQuery as the analytical backbone, and designed for:

- **Scale** — ~1TB of historical data, growing continuously; thousands of daily feed updates
- **Accuracy** — AI-assisted source hierarchy and confidence scoring with human-in-the-loop approval
- **Extensibility** — Medallion-layered database; plug-and-play feed connectors
- **Compliance** — Okta-managed authentication, RBAC, full audit trails, column-level security
- **Performance** — Elasticsearch for real-time search; CDN-backed file delivery; materialized analytical views
- **Operability** — End-to-end observability, PagerDuty-integrated alerting, migration tooling

---

## 2. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL DATA SOURCES (200+ Feeds)                                 │
│  CSV · Excel · XML · JSON · Email · SFTP · APIs (REST/SOAP) · Data Providers · AIS Streams     │
└─────────────────────────┬───────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              D6 INGESTION PLATFORM (Internal)                                   │
│  Feed Registry · Protocol Adapters · Format Parsers · Schema Normalizer · Delivery Router       │
└─────────────────────────┬───────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         BIGQUERY MEDALLION LAKEHOUSE                                            │
│                                                                                                 │
│  ┌─────────────┐   ┌────────────────┐   ┌──────────────────┐   ┌──────────────────────────┐   │
│  │   BRONZE    │   │     SILVER     │   │       GOLD       │   │   DRAFT / EDIT LAYER     │   │
│  │  Landing /  │──▶│  Validated /   │──▶│  Master / Curated│◀─▶│  Change Proposals /      │   │
│  │    Raw      │   │   Staged       │   │  Approved        │   │  Approval Workflow       │   │
│  └─────────────┘   └────────────────┘   └──────────────────┘   └──────────────────────────┘   │
│                                                  │                                              │
│                       Terahelix (Mapping) ◀──────┤──────▶ Gearbox (Linking)                    │
│                                                  │                                              │
│                              AI Engine ◀─────────┘                                             │
│                     (Source Hierarchy · Confidence Scoring · Auto-Apply)                        │
└─────────────────────────┬───────────────────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────────┐
          ▼               ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐
│ ELASTICSEARCH│  │  FILE & IMAGE│  │   NOTIFICATION       │
│  Real-Time   │  │  MANAGEMENT  │  │   ENGINE             │
│  Search      │  │  GCS + CDN   │  │   (Pub/Sub backbone) │
└──────┬───────┘  └──────────────┘  └──────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION LAYER                                                  │
│  Maritime Intelligence UX · CMS · Analytics Platform · Admin Console · ETL Monitor             │
│                         (Auth: Okta · RBAC · JWT/OIDC)                                         │
└─────────────────────────┬───────────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────────────────────────────┐
│                  DELIVERY CHANNELS                                                │
│  REST API ·  Data Feeds  ·  Snowflake  ·  GCP EDO-Fabric  ·  External Portals   │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. External Data Ingestion — D6 Pipeline

### 3.1 Feed Landscape

| Category | Formats | Delivery Mechanism | Volume (est.) |
|---|---|---|---|
| Vessel Registry Data | XML, CSV | SFTP, API | Daily batch |
| AIS Position Streams | JSON, binary | REST API, WebSocket | Real-time / near-real-time |
| Port & Terminal Data | CSV, Excel | SFTP, Email | Weekly / monthly |
| Company & Ownership | JSON, XML | REST API | Daily |
| Casualty & Incidents | CSV, Email | SFTP, Email | As-available |
| Sanctions & Compliance | XML, JSON | API | Daily |
| Cargo & Fixtures | CSV, Excel | SFTP, Email | Daily |
| Classification Societies | XML, JSON | API, SFTP | Daily |
| Flag State Registries | CSV, HTML scrape | SFTP, API | Weekly |
| Market Intelligence | Excel, CSV | Email, SFTP | Weekly |

### 3.2 D6 Platform Architecture

```
External Sources
      │
      ├── SFTP Listener (polling + event-triggered)
      ├── Email Ingestion (IMAP reader → attachment extractor)
      ├── REST API Poller (configurable schedule + pagination)
      ├── WebSocket/Stream Subscriber (AIS, real-time feeds)
      └── Manual Upload Portal
            │
            ▼
      ┌────────────────────────────────────────┐
      │          D6 ADAPTER LAYER              │
      │  Format Parsers:                       │
      │  CSV/Excel → JSON  |  XML → JSON       │
      │  Binary → JSON     |  Email text → JSON│
      └────────────────┬───────────────────────┘
                       │
                       ▼
      ┌────────────────────────────────────────┐
      │          D6 NORMALIZER                 │
      │  - Character encoding normalization    │
      │  - Schema validation (per feed config) │
      │  - Mandatory field checks              │
      │  - Data type coercion                  │
      │  - Feed metadata envelope attachment   │
      └────────────────┬───────────────────────┘
                       │
                       ▼
      ┌────────────────────────────────────────┐
      │          D6 ROUTER                     │
      │  - Routes to BigQuery landing tables   │
      │  - Feed → target table mapping config  │
      │  - Dead-letter queue on parse failure  │
      │  - Delivery receipts & retry logic     │
      └────────────────┬───────────────────────┘
                       │
                       ▼
        BigQuery Bronze Landing Tables
```

### 3.3 Feed Registry Schema

Each feed is registered with metadata to drive the ingestion pipeline:

```sql
-- D6 Feed Registry (Cloud Spanner or BigQuery config table)
CREATE TABLE feed_registry (
  feed_id           STRING NOT NULL,
  feed_name         STRING,
  provider          STRING,
  domain            STRING,          -- vessel | port | company | cargo | compliance
  delivery_method   STRING,          -- sftp | email | api | websocket | manual
  format            STRING,          -- csv | excel | xml | json | binary
  schedule_cron     STRING,
  sftp_host         STRING,
  sftp_path_pattern STRING,
  email_filter      STRING,
  api_endpoint      STRING,
  api_auth_type     STRING,
  landing_table     STRING,          -- BigQuery target table
  schema_version    STRING,
  field_map         JSON,            -- source field → canonical field mapping
  is_active         BOOL,
  contact_owner     STRING,
  created_at        TIMESTAMP,
  updated_at        TIMESTAMP
);
```

### 3.4 Dead-Letter & Retry

- Parse failures → `d6_dead_letter` table with raw payload + error context
- Configurable retry: 3 attempts with exponential back-off
- Alert triggered when dead-letter queue exceeds threshold
- Manual reprocessing UI in Admin Console

---

## 4. Database Architecture — Medallion Lakehouse

The platform uses **BigQuery** as the primary analytical store, following the **Medallion Architecture** (Bronze → Silver → Gold) with an additional Draft/Approval layer. A **Cloud Spanner** or **AlloyDB** (PostgreSQL-compatible, with PostGIS) instance handles transactional edit/approval workflows and geospatially-intensive queries.

### 4.1 Architecture Layers Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  LAYER 0 — BRONZE (Raw Landing)                                              │
│  Immutable, append-only exact copies of source data                          │
│  Schema: source envelope + raw payload as JSON column                        │
│  Retention: 7 years (regulatory requirement)                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│  LAYER 1 — SILVER (Validated / Staged)                                       │
│  Parsed, type-checked, deduplicated, source-attributed                       │
│  Domain schemas applied (vessel_staging, port_staging, etc.)                 │
│  Data quality scores attached; conflicting records flagged                   │
├──────────────────────────────────────────────────────────────────────────────┤
│  LAYER 2 — GOLD (Curated Master)                                             │
│  Source hierarchy applied; AI confidence scored; human approved              │
│  Bi-temporal (valid_time + transaction_time)                                 │
│  Full geospatial support (GEOGRAPHY columns + GeoJSON)                       │
│  Primary source of truth for all delivery channels                           │
├──────────────────────────────────────────────────────────────────────────────┤
│  LAYER 3 — DRAFT / EDIT                                                      │
│  Pending change proposals against Gold records                               │
│  Workflow states: DRAFT → IN_REVIEW → APPROVED / REJECTED                   │
│  Prevents partial / accidental edits to live master data                     │
├──────────────────────────────────────────────────────────────────────────────┤
│  LAYER 4 — ANALYTICAL VIEWS & MARTS                                          │
│  Materialized views, pre-aggregations, denormalized wide tables              │
│  Optimized for dashboard queries, reporting, and exports                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Bronze Layer (Landing Tables)

```sql
-- Universal landing table pattern (one per feed domain)
CREATE TABLE bq_bronze.vessel_raw (
  ingestion_id      STRING NOT NULL,     -- UUID
  feed_id           STRING NOT NULL,     -- FK to feed_registry
  feed_name         STRING,
  source_file_ref   STRING,              -- GCS URI to original file
  ingestion_ts      TIMESTAMP NOT NULL,
  record_date       DATE,                -- partition column
  raw_payload       JSON,               -- full parsed row as JSON
  row_hash          STRING,             -- SHA-256 of raw_payload for dedup
  processing_status STRING DEFAULT 'PENDING', -- PENDING|PROCESSED|FAILED|SKIPPED
  error_detail      STRING
)
PARTITION BY record_date
CLUSTER BY feed_id, processing_status;
```

### 4.3 Silver Layer (Staging Tables)

```sql
-- Vessel staging table (representative; all domains follow same pattern)
CREATE TABLE bq_silver.vessel_staging (
  staging_id        STRING NOT NULL,
  source_id         STRING,             -- original entity ID from source
  ingestion_id      STRING,             -- FK to bronze
  feed_id           STRING,
  feed_name         STRING,
  feed_priority     INT64,              -- source hierarchy rank

  -- Core Identity
  imo_number        STRING,
  mmsi              STRING,
  vessel_name       STRING,
  call_sign         STRING,

  -- Classification
  vessel_type       STRING,
  vessel_sub_type   STRING,
  flag_code         STRING,             -- ISO 3166-1 alpha-2
  flag_name         STRING,

  -- Technical Dimensions
  gross_tonnage     NUMERIC,
  deadweight        NUMERIC,
  length_overall    FLOAT64,
  beam              FLOAT64,
  draft             FLOAT64,
  year_built        INT64,

  -- Current Status
  operational_status STRING,

  -- Position (geospatial)
  last_position     GEOGRAPHY,          -- BigQuery GEOGRAPHY point
  last_position_geojson JSON,           -- Full GeoJSON if available
  last_position_ts  TIMESTAMP,
  last_port_id      STRING,

  -- Data Quality
  completeness_score FLOAT64,           -- % of mandatory fields populated
  dq_flags          ARRAY<STRING>,      -- data quality issue codes

  -- Temporal
  source_valid_from TIMESTAMP,
  source_valid_to   TIMESTAMP,
  record_date       DATE,               -- partition column
  created_at        TIMESTAMP
)
PARTITION BY record_date
CLUSTER BY imo_number, feed_id;
```

### 4.4 Gold Layer (Master Tables)

```sql
-- Vessel master — bi-temporal, geospatial, confidence-scored
CREATE TABLE bq_gold.vessel_master (
  vessel_id         STRING NOT NULL,    -- canonical internal UUID
  imo_number        STRING NOT NULL,

  -- Bi-Temporal
  valid_from        TIMESTAMP NOT NULL, -- when fact was true in world
  valid_to          TIMESTAMP,          -- NULL = current
  sys_from          TIMESTAMP NOT NULL, -- when record entered system
  sys_to            TIMESTAMP,          -- NULL = current record version

  -- Core Identity
  vessel_name       STRING,
  call_sign         STRING,
  mmsi              STRING,

  -- Classification
  vessel_type       STRING,
  vessel_sub_type   STRING,
  flag_code         STRING,
  flag_name         STRING,
  class_society     STRING,

  -- Technical Dimensions
  gross_tonnage     NUMERIC,
  deadweight        NUMERIC,
  length_overall    FLOAT64,
  beam              FLOAT64,
  draft             FLOAT64,
  year_built        INT64,
  build_country     STRING,
  shipyard          STRING,

  -- Ownership
  owner_id          STRING,             -- FK to company_master
  operator_id       STRING,
  manager_id        STRING,

  -- Status
  operational_status STRING,
  registration_status STRING,

  -- Geospatial
  last_known_position  GEOGRAPHY,
  last_known_position_geojson JSON,
  last_position_ts     TIMESTAMP,
  ais_destination      STRING,
  ais_eta              TIMESTAMP,
  route_geojson        JSON,            -- last known route as LineString GeoJSON

  -- Confidence & Sourcing
  confidence_score     FLOAT64,         -- 0.0 – 1.0
  primary_source_id    STRING,
  contributing_sources ARRAY<STRING>,
  last_enriched_at     TIMESTAMP,

  -- Record Management
  record_status     STRING DEFAULT 'ACTIVE', -- ACTIVE|DEPRECATED|DELETED
  approved_by       STRING,
  approved_at       TIMESTAMP,
  created_by        STRING,
  created_at        TIMESTAMP,
  updated_at        TIMESTAMP
)
PARTITION BY DATE(valid_from)
CLUSTER BY imo_number, flag_code, vessel_type;
```

### 4.5 Geospatial Design

BigQuery GEOGRAPHY type handles all spatial data natively. Key capabilities used:

| Use Case | BigQuery Function | Example |
|---|---|---|
| Vessel last position | `GEOGRAPHY` point column | `ST_GEOGPOINT(lon, lat)` |
| Port boundary polygon | `GEOGRAPHY` polygon column | `ST_GEOGFROMGEOJSON(...)` |
| Route/voyage track | `GEOGRAPHY` linestring | Multi-point trajectory |
| Proximity search | `ST_DISTANCE()` | Vessels within N km of port |
| Containment check | `ST_WITHIN()` | Vessel inside port boundary |
| Bounding box query | `ST_GEOGFROMGEOJSON()` | Map viewport queries |
| GeoJSON interchange | `ST_ASGEOJSON()` | API response serialization |

```sql
-- Example: Find all vessels within 50km of Port of Singapore
SELECT
  vessel_id, vessel_name, imo_number,
  ST_DISTANCE(last_known_position,
    ST_GEOGPOINT(103.8198, 1.3521)) / 1000 AS distance_km
FROM bq_gold.vessel_master
WHERE
  record_status = 'ACTIVE'
  AND valid_to IS NULL
  AND ST_DWITHIN(last_known_position, ST_GEOGPOINT(103.8198, 1.3521), 50000)
ORDER BY distance_km;
```

### 4.6 Analytical Materialized Views

```sql
-- Materialized view: vessel counts by flag and type (refreshed hourly)
CREATE MATERIALIZED VIEW bq_analytics.mv_vessel_counts
PARTITION BY snapshot_date
AS
SELECT
  DATE(CURRENT_TIMESTAMP()) AS snapshot_date,
  flag_code,
  vessel_type,
  operational_status,
  COUNT(*) AS vessel_count,
  AVG(deadweight) AS avg_dwt,
  SUM(gross_tonnage) AS total_gt
FROM bq_gold.vessel_master
WHERE valid_to IS NULL AND record_status = 'ACTIVE'
GROUP BY 1, 2, 3, 4;
```

---

## 5. Edit, Draft & Approval Workflow

This layer protects Gold master tables from accidental or partial updates. All edits — whether human or AI-sourced — must pass through a change control workflow before being promoted to master.

### 5.1 Workflow States

```
  [System / AI / User creates edit]
           │
           ▼
        DRAFT ──── edit / discard
           │
     submit for review
           │
           ▼
       IN_REVIEW ──── request changes ──▶ DRAFT
           │
    approve / reject
           │
    ┌──────┴──────┐
    ▼             ▼
APPROVED       REJECTED
    │
  apply to Gold master
    │
    ▼
PUBLISHED (change is live, immutable)
```

### 5.2 Change Set Schema

```sql
CREATE TABLE bq_edit.change_set (
  change_set_id    STRING NOT NULL,
  entity_type      STRING NOT NULL,      -- vessel | port | company | cargo
  entity_id        STRING NOT NULL,      -- FK to master table
  imo_number       STRING,               -- denormalized for indexing
  change_source    STRING,               -- USER | AI_ENGINE | ETL_PIPELINE | IMPORT
  origin_feed_id   STRING,               -- if sourced from feed
  status           STRING DEFAULT 'DRAFT',
  title            STRING,
  description      STRING,
  priority         STRING DEFAULT 'NORMAL', -- LOW | NORMAL | HIGH | CRITICAL
  created_by       STRING NOT NULL,
  created_at       TIMESTAMP NOT NULL,
  submitted_at     TIMESTAMP,
  reviewed_by      STRING,
  reviewed_at      TIMESTAMP,
  review_notes     STRING,
  applied_at       TIMESTAMP,
  expires_at       TIMESTAMP             -- auto-expire stale drafts
);

CREATE TABLE bq_edit.change_field (
  change_field_id  STRING NOT NULL,
  change_set_id    STRING NOT NULL,      -- FK to change_set
  field_name       STRING NOT NULL,
  old_value        JSON,                -- snapshot of current Gold value
  new_value        JSON,                -- proposed value
  source_id        STRING,              -- which source provides this value
  confidence_score FLOAT64,
  auto_apply       BOOL DEFAULT FALSE,  -- high-confidence auto-applied
  conflict_flag    BOOL DEFAULT FALSE,  -- conflicting values from multiple sources
  conflict_detail  JSON,                -- all competing values with sources
  approved         BOOL,
  approved_by      STRING,
  approved_at      TIMESTAMP
);
```

### 5.3 Conflict Detection

Before any change set reaches IN_REVIEW, the Conflict Detector checks:
- Does the proposed value disagree with other active source values at the same confidence tier?
- Does the change affect a field locked by a previous in-progress change set?
- Is the proposed value within plausible range for the field type (e.g., DWT outlier detection)?

---

## 6. Entity Resolution — Terahelix & Gearbox

### 6.1 Terahelix — Identifier Mapping Engine

Terahelix resolves the many-to-one problem: external sources use different IDs for the same real-world entity. Terahelix maintains a canonical ID registry.

```
Incoming identifiers:
  IMO 9123456  ──────────────▶ ┌─────────────────────┐
  MMSI 123456789 ─────────────▶ │   TERAHELIX         │──▶  vessel_id: VES-UUID-001
  "EVER GIVEN" (name) ────────▶ │   Mapping Engine    │
  Lloyd's Register #4567 ─────▶ │                     │
  Flag cert #XYZ ─────────────▶ └─────────────────────┘
```

**Resolution Rules (in priority order):**
1. IMO number — definitive vessel identifier (never changes)
2. MMSI — may be reassigned; use only with temporal context
3. Call sign + flag — reasonably unique; use as secondary
4. Vessel name + build year + GT — fuzzy match with threshold
5. Manual override mappings (admin-managed exceptions)

**Terahelix Tables:**

```sql
CREATE TABLE terahelix.identifier_registry (
  registry_id      STRING NOT NULL,
  canonical_id     STRING NOT NULL,      -- internal entity UUID
  entity_type      STRING NOT NULL,
  identifier_type  STRING NOT NULL,      -- IMO | MMSI | CALL_SIGN | NAME | EXTERNAL_REF
  identifier_value STRING NOT NULL,
  source_id        STRING,
  confidence       FLOAT64 DEFAULT 1.0,
  is_primary       BOOL DEFAULT FALSE,
  valid_from       TIMESTAMP,
  valid_to         TIMESTAMP,
  created_at       TIMESTAMP,
  created_by       STRING
);
```

### 6.2 Gearbox — Entity Linking Engine

Gearbox builds and maintains the relationship graph between entities. Where Terahelix resolves identity, Gearbox resolves relationships.

**Core Relationship Types:**

| Relationship | Entity A | Entity B | Temporal? |
|---|---|---|---|
| `OWNED_BY` | Vessel | Company | Yes |
| `OPERATED_BY` | Vessel | Company | Yes |
| `MANAGED_BY` | Vessel | Company | Yes |
| `REGISTERED_UNDER` | Vessel | Flag State | Yes |
| `CLASSED_BY` | Vessel | Class Society | Yes |
| `PARENT_OF` | Company | Company | Yes |
| `LOCATED_AT` | Terminal | Port | No |
| `INSPECTED_AT` | PSC Inspection | Port | Event |
| `ENTERED_PORT` | Vessel | Port | Event |
| `FLAGGED_FOR` | Vessel | Compliance Event | Event |

```sql
CREATE TABLE gearbox.entity_relationship (
  relationship_id   STRING NOT NULL,
  rel_type          STRING NOT NULL,
  entity_a_id       STRING NOT NULL,
  entity_a_type     STRING NOT NULL,
  entity_b_id       STRING NOT NULL,
  entity_b_type     STRING NOT NULL,
  attributes        JSON,              -- additional relationship attributes
  source_id         STRING,
  confidence_score  FLOAT64,
  valid_from        TIMESTAMP NOT NULL,
  valid_to          TIMESTAMP,         -- NULL = current
  created_at        TIMESTAMP,
  created_by        STRING
);
```

**Gearbox Change Propagation:**
When a relationship changes (e.g., vessel changes owner), Gearbox propagates the change:
1. Closes the old relationship (`valid_to = now()`)
2. Opens a new relationship record
3. Publishes a `RELATIONSHIP_CHANGED` event to Pub/Sub
4. Downstream subscribers (Elasticsearch indexer, Notification Engine) react

---

## 7. AI Engine — Source Hierarchy & Confidence Scoring

### 7.1 Architecture

```
Silver staging records
        │
        ▼
┌────────────────────────────────────────┐
│     SOURCE HIERARCHY RESOLVER          │
│  Per-field priority rules              │
│  (e.g., IHS = rank 1 for vessel type,  │
│   Lloyd's = rank 1 for class status)   │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│     CONFLICT DETECTOR                  │
│  Identifies competing values from       │
│  sources at the same hierarchy tier    │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│     CONFIDENCE SCORER (ML)             │
│  Features: source rank, recency,        │
│  corroboration count, field volatility  │
│  Output: confidence score 0.0–1.0      │
└────────────┬───────────────────────────┘
             │
       ┌─────┴─────┐
  score ≥ 0.90   score < 0.90
       │               │
       ▼               ▼
  AUTO-APPLY      REVIEW QUEUE
  to Gold         (human approval
  master          required)
```

### 7.2 Source Registry

```sql
CREATE TABLE ai_engine.source_registry (
  source_id          STRING NOT NULL,
  source_name        STRING,
  provider           STRING,
  domain             STRING,
  global_rank        INT64,            -- default priority across all fields
  field_overrides    JSON,             -- { "vessel_type": 1, "class_status": 2 }
  reliability_score  FLOAT64,          -- historical accuracy vs ground truth
  coverage_score     FLOAT64,          -- % of vessels covered
  freshness_score    FLOAT64,          -- avg data age score
  last_evaluated_at  TIMESTAMP
);
```

### 7.3 Confidence Scoring Model

**Features used by the scoring model:**

| Feature | Description | Weight |
|---|---|---|
| `source_rank` | Global rank of the providing source | High |
| `field_source_rank` | Field-specific source rank override | High |
| `corroboration_count` | Number of other sources agreeing | High |
| `data_age_days` | Days since source last updated the value | Medium |
| `field_volatility` | Historical rate of change for this field type | Medium |
| `provider_reliability` | Historical accuracy of this source | Medium |
| `conflict_count` | Number of sources disagreeing | Negative weight |
| `outlier_score` | Statistical distance from field distribution | Negative weight |

**Auto-Apply Thresholds (configurable per field):**

| Field Type | Auto-Apply Threshold | Rationale |
|---|---|---|
| IMO Number | 1.0 (manual only) | Never auto-change identity fields |
| Vessel Name | 0.95 | High confidence needed; name changes are significant |
| Vessel Type | 0.90 | Stable field, multi-source corroboration sufficient |
| DWT / GT | 0.90 | Technical spec; verifiable |
| Owner / Manager | 0.85 | Changes frequently; well-covered by sources |
| Flag State | 0.90 | Regulatory significance; requires confidence |
| AIS Position | 0.70 | Real-time; accepted with lower bar |
| Class Status | 0.88 | Important compliance field |

### 7.4 Feedback Loop

Human approvals/rejections in the UI feed back to the model:
- Approval of a low-confidence AI suggestion → positive training signal
- Rejection of a high-confidence AI suggestion → negative signal; source reliability adjusted
- Model retrained nightly via BigQuery ML or Vertex AI pipeline

---

## 8. Real-Time Search Engine

### 8.1 Architecture

Elasticsearch (or OpenSearch) runs on top of the Gold layer, indexed via a **Change Data Capture (CDC)** pipeline. This offloads search pressure from BigQuery and provides sub-second query response.

```
BigQuery Gold Layer
      │
      │  (CDC via BigQuery Change History / Datastream)
      ▼
Pub/Sub Topic: `gold-change-events`
      │
      ▼
Elasticsearch Indexer (Cloud Run / GKE)
      │   - Reads change events
      │   - Transforms to ES document format
      │   - Upserts documents into relevant index
      ▼
Elasticsearch Cluster (Elastic Cloud on GCP)
      │
      ├── Index: vessels
      ├── Index: companies
      ├── Index: ports
      ├── Index: movements
      ├── Index: events
      └── Index: fixtures
            │
            ▼
     Search API Layer (GraphQL / REST)
            │
            ▼
     Maritime Intelligence UX + External API
```

### 8.2 Index Design (Vessels)

```json
{
  "mappings": {
    "properties": {
      "vessel_id":          { "type": "keyword" },
      "imo_number":         { "type": "keyword" },
      "mmsi":               { "type": "keyword" },
      "vessel_name":        { "type": "text", "analyzer": "maritime_name_analyzer",
                              "fields": { "keyword": { "type": "keyword" } } },
      "vessel_type":        { "type": "keyword" },
      "flag_code":          { "type": "keyword" },
      "flag_name":          { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
      "deadweight":         { "type": "float" },
      "gross_tonnage":      { "type": "float" },
      "year_built":         { "type": "integer" },
      "operational_status": { "type": "keyword" },
      "class_society":      { "type": "keyword" },
      "owner_name":         { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
      "last_known_position": { "type": "geo_point" },
      "last_port_name":     { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
      "confidence_score":   { "type": "float" },
      "updated_at":         { "type": "date" },
      "full_text":          { "type": "text", "analyzer": "maritime_analyzer" }
    }
  },
  "settings": {
    "analysis": {
      "analyzer": {
        "maritime_analyzer": {
          "tokenizer": "standard",
          "filter": ["lowercase", "maritime_synonyms", "edge_ngram_filter"]
        },
        "maritime_name_analyzer": {
          "tokenizer": "standard",
          "filter": ["lowercase", "vessel_name_normalization"]
        }
      }
    }
  }
}
```

### 8.3 Smart Search Capabilities

| Search Type | Example | Mechanism |
|---|---|---|
| Full-text | `"ever given containership"` | Multi-field text search with boosting |
| Exact ID | `IMO 9811000` | Keyword match on imo_number |
| Type alias | `"vlcc"` | Synonym → `vessel_type:Oil Tanker + DWT:[200000 TO 350000]` |
| Flag search | `flag:panama` | Keyword filter on flag_code |
| Range | `dwt>200000 built>2015` | Numeric range filters |
| Geo proximity | `near:singapore radius:50km` | Geo distance query |
| Status filter | `detained` | Keyword on operational_status |
| Combined | `"bulk carrier nyk flag:japan"` | Boolean combination |

---

## 9. Application Layer

### 9.1 Component Map

```
┌──────────────────────────────────────────────────────────────────────┐
│                   MARITIME INTELLIGENCE UX (React + Vite)            │
│                                                                       │
│  /dashboard    — Configurable card grid (persona-driven)             │
│  /vessels      — Vessel list + detail (AttrTree + 650+ attributes)   │
│  /companies    — Company list + ownership graph                      │
│  /ports        — Port list + map + terminal hierarchy                │
│  /movements    — Voyage tracking + AIS replay                        │
│  /fixtures     — Cargo fixtures and charter data                     │
│  /psc          — PSC inspections + detention records                 │
│  /compliance   — Sanctions, flags, compliance events                 │
│  /events       — Incidents, casualties, casualties                   │
│  /imo-core     — IMO Core bi-temporal viewer                         │
│  /gis-ais      — Live AIS map + route visualization                  │
│  /etl          — ETL pipeline monitor (feed health, job status)      │
│  /bigquery     — BigQuery console (query + result viewer)            │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐  ┌────────────────────────────────────────┐
│  CMS (Headless)          │  │  ANALYTICS PLATFORM                    │
│  - Reference data        │  │  - Looker / Looker Studio              │
│  - Announcements         │  │  - Pre-built maritime dashboards        │
│  - Help / documentation  │  │  - Self-service report builder         │
│  - Contentful / Sanity   │  │  - BigQuery BI Engine for low-latency  │
└──────────────────────────┘  └────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  ADMIN CONSOLE                                                       │
│  - User management (Okta groups sync)                                │
│  - Feed configuration (D6 registry management)                       │
│  - Source hierarchy rule editor (AI engine config)                   │
│  - Notification rule builder                                         │
│  - Data migration job runner                                         │
│  - Approval queue management                                         │
└──────────────────────────────────────────────────────────────────────┘
```

### 9.2 Persona-Driven Access Control

| Persona | Primary Domain | Key Capabilities |
|---|---|---|
| Full Access | All | Read + Write + Approve across all domains |
| Vessel Analyst | Vessels | Read + Edit vessels; submit change sets |
| Port Analyst | Ports | Read + Edit ports and terminals |
| Ownership Management | Companies | Read + Edit company and ownership data |
| Compliance Officer | Compliance / PSC | Read compliance; approve compliance edits; sanctions |
| Registry Analyst | IMO Core | Read + Edit registry and class data |
| Dimensions Analyst | Technical specs | Read + Edit technical dimension data |
| External Customer | Delivery API | Read-only via API; scoped to licensed data products |

---

## 10. Delivery Channels

### 10.1 REST API (External & Internal)

```
Client ──▶ API Gateway (Apigee / Cloud Endpoints)
              │
              ├── Rate limiting (per API key / per plan tier)
              ├── Auth validation (Okta JWT verification)
              ├── Request logging (Cloud Logging)
              │
              ▼
         API Service Layer (GKE / Cloud Run)
              │
              ├── /api/v2/vessels/{imo}
              ├── /api/v2/vessels?type=...&flag=...
              ├── /api/v2/companies/{id}
              ├── /api/v2/ports/{unlocode}
              ├── /api/v2/movements?vessel=...
              ├── /api/v2/search?q=...
              └── /api/v2/changes?entity=...&since=...
              │
              ▼
         Elasticsearch (search endpoints)
         BigQuery (complex analytical endpoints)
         GCS (file/image endpoints)
```

**Key Design Decisions:**
- OpenAPI 3.1 specification (auto-generated docs)
- GraphQL endpoint for flexible field selection (reduces over-fetching)
- Cursor-based pagination for all list endpoints
- ETags + conditional requests for efficient polling
- Delta endpoint: `/changes?since=ISO8601` for feed-style consumers

### 10.2 Data Feeds

Scheduled exports for customers consuming bulk data:

| Feed Type | Format | Cadence | Delivery |
|---|---|---|---|
| Full vessel dataset | CSV / JSON | Daily | SFTP / GCS presigned URL |
| Vessel delta feed | JSON | Hourly | Pub/Sub webhook / SFTP |
| Ownership changes | JSON | Daily | SFTP / email |
| Port activity | CSV | Daily | SFTP |
| Compliance events | JSON | Real-time | Webhook push |
| Custom extract | CSV / Excel | On-demand | UI download / SFTP |

### 10.3 Snowflake Integration

```
BigQuery Gold Tables
      │
      │  BigQuery → Snowflake connector
      │  (via Fivetran / custom Dataflow)
      ▼
Snowflake (S&P Enterprise DW)
  ├── MARITIME.VESSELS.MASTER
  ├── MARITIME.COMPANIES.MASTER
  ├── MARITIME.PORTS.MASTER
  └── MARITIME.EVENTS.MOVEMENTS

Snowflake Data Sharing ──▶ External Customer Snowflake Accounts
```

### 10.4 GCP EDO-Fabric Integration

The platform publishes curated data products to S&P's internal GCP EDO Data Fabric:

```
BigQuery Gold Layer
      │
      ▼
Data Product Catalog (EDO-Fabric)
  ├── Product: Maritime.Vessel.Master (daily snapshot)
  ├── Product: Maritime.Port.Master
  ├── Product: Maritime.Company.Master
  └── Product: Maritime.AIS.Positions (streaming)
      │
      ├── Data lineage tracked (source feed → Gold → product)
      ├── Schema registry entry per product
      └── Access controlled via EDO IAM policies
```

---

## 11. File & Image Management

### 11.1 Storage Architecture

**GCS Bucket Structure:**

```
gs://maritime-intelligence-files/
  ├── vessels/
  │   └── {imo_number}/
  │       ├── photos/
  │       ├── certificates/      -- class cert, flag cert, safety certs
  │       ├── inspection-reports/
  │       └── documents/
  ├── ports/
  │   └── {unlocode}/
  │       ├── charts/
  │       ├── photos/
  │       └── regulations/
  ├── companies/
  │   └── {company_id}/
  │       └── documents/
  └── reference/
      ├── flag-icons/
      ├── vessel-type-icons/
      └── port-icons/

gs://maritime-intelligence-files-cdn/     -- CDN-served public assets
  └── (images, thumbnails, flag icons)
```

### 11.2 File Registry Schema

```sql
CREATE TABLE bq_gold.file_registry (
  file_id          STRING NOT NULL,
  entity_type      STRING NOT NULL,    -- vessel | port | company
  entity_id        STRING NOT NULL,
  file_type        STRING NOT NULL,    -- PHOTO | CERTIFICATE | INSPECTION | DOCUMENT
  file_category    STRING,            -- class_cert | flag_cert | safety_cert | etc.
  file_name        STRING NOT NULL,
  storage_uri      STRING NOT NULL,   -- gs://... URI
  cdn_url          STRING,            -- Cloud CDN URL for public/image assets
  content_type     STRING,            -- MIME type
  size_bytes       INT64,
  checksum_sha256  STRING,
  metadata         JSON,              -- title, description, expiry_date, issuer, etc.
  is_public        BOOL DEFAULT FALSE,
  valid_from       DATE,              -- document validity start
  valid_to         DATE,              -- document expiry
  uploaded_by      STRING,
  uploaded_at      TIMESTAMP,
  deleted_at       TIMESTAMP          -- soft delete
);
```

### 11.3 Image Processing Pipeline

```
Upload (via UX or API)
      │
      ▼
Cloud Storage trigger (Pub/Sub)
      │
      ▼
Image Processing Service (Cloud Run)
  ├── Virus scan (Cloud DLP)
  ├── EXIF stripping (privacy)
  ├── Thumbnail generation (256px, 512px)
  ├── WebP conversion for web delivery
  └── Metadata extraction
      │
      ▼
Processed images → CDN bucket
Metadata → file_registry table
```

---

## 12. Notification System

### 12.1 Architecture

```
                     Event Sources
  ┌────────────────┬───────────────────┬──────────────────┐
  │  Gold layer    │  ETL pipeline     │  User/App actions│
  │  change events │  failure events   │  (watchlists)    │
  └───────┬────────┴────────┬──────────┴──────┬───────────┘
          │                 │                  │
          └─────────────────▼──────────────────┘
                     GCP Pub/Sub
                   (notification-events topic)
                           │
                           ▼
              ┌────────────────────────┐
              │  NOTIFICATION ENGINE   │
              │  (Cloud Run service)   │
              │                        │
              │  1. Read event         │
              │  2. Match against rules│
              │  3. Resolve recipients │
              │  4. Deduplicate        │
              │  5. Enqueue delivery   │
              └────────────┬───────────┘
                           │
         ┌─────────────────┼──────────────────┐
         ▼                 ▼                  ▼
   Email Adapter    Slack Adapter     In-App Adapter
   (SendGrid)       (Slack API)       (WebSocket push)
         │                 │                  │
         ▼                 ▼                  ▼
   notification_log table (tracking: sent, delivered, read, failed)
```

### 12.2 Notification Types

| Category | Trigger | Default Channel | Configurable |
|---|---|---|---|
| **Data Quality** | New conflict detected in Gold | In-App + Email | Yes |
| **Entity Change** | Vessel status changes | In-App + Email | Yes |
| **Ownership Change** | Owner/operator/manager changes | Email | Yes |
| **Watchlist Alert** | User-watched vessel enters/exits area | In-App + Email + Slack | Yes |
| **Compliance Event** | PSC detention, flag change, sanctions hit | Email + Slack | Yes |
| **Feed Health** | Feed delayed > threshold or failed | Slack + PagerDuty | Admin only |
| **ETL Alert** | Pipeline job failed / data gap detected | Slack + PagerDuty | Admin only |
| **Approval Request** | Change set submitted for review | In-App + Email | Yes |
| **System Alert** | Infrastructure health, quota warnings | PagerDuty | Admin only |

### 12.3 Notification Rule Schema

```sql
CREATE TABLE notifications.notification_rule (
  rule_id          STRING NOT NULL,
  rule_name        STRING,
  rule_type        STRING,             -- SYSTEM | USER_WATCHLIST | ADMIN
  event_type       STRING NOT NULL,   -- e.g., ENTITY_CHANGED
  entity_type      STRING,            -- filter: vessel | port | company
  conditions       JSON,              -- { "field": "operational_status", "op": "changed_to", "value": "Detained" }
  recipient_type   STRING,            -- USER | ROLE | GROUP | WEBHOOK
  recipient_ids    ARRAY<STRING>,
  channels         ARRAY<STRING>,     -- email | slack | in_app | webhook | pagerduty
  throttle_minutes INT64 DEFAULT 60,  -- deduplicate within window
  digest_mode      STRING,            -- INSTANT | HOURLY_DIGEST | DAILY_DIGEST
  is_active        BOOL DEFAULT TRUE,
  created_by       STRING,
  created_at       TIMESTAMP
);

CREATE TABLE notifications.notification_log (
  notification_id  STRING NOT NULL,
  rule_id          STRING,
  event_id         STRING,
  entity_type      STRING,
  entity_id        STRING,
  channel          STRING,
  recipient        STRING,
  subject          STRING,
  body_preview     STRING,
  status           STRING,            -- QUEUED | SENT | DELIVERED | READ | FAILED
  sent_at          TIMESTAMP,
  delivered_at     TIMESTAMP,
  read_at          TIMESTAMP,
  failure_reason   STRING,
  retry_count      INT64 DEFAULT 0
);
```

---

## 13. Authentication & Authorization — Okta

### 13.1 Identity Architecture

```
User / Service
      │
      ├── Browser (UX)    ──▶ Okta Hosted Login ──▶ OIDC Authorization Code Flow
      ├── External API    ──▶ API Key (Apigee) ──▶ Okta OAuth2 Client Credentials
      └── Machine (ETL)   ──▶ Okta Service Account ──▶ Client Credentials + mTLS
                                     │
                                     ▼
                              Okta Issues JWT
                                     │
                             ┌───────┴───────────────────┐
                             │  Application validates JWT │
                             │  - Signature (Okta JWKS)  │
                             │  - Expiry (15-min access)  │
                             │  - Audience claim          │
                             │  - Scopes/roles claim      │
                             └───────────────────────────┘
```

### 13.2 RBAC Design

**Okta Groups → Application Roles:**

| Okta Group | Application Role | Permissions |
|---|---|---|
| `maritime-admin` | ADMIN | Full access; manage users; approve any change |
| `maritime-full-access` | FULL_ACCESS | Read + Write + Approve all domains |
| `maritime-vessel-analyst` | VESSEL_ANALYST | Read all; Edit+Submit vessels |
| `maritime-port-analyst` | PORT_ANALYST | Read all; Edit+Submit ports |
| `maritime-compliance-officer` | COMPLIANCE_OFFICER | Read all; Edit+Approve compliance |
| `maritime-registry-analyst` | REGISTRY_ANALYST | Read all; Edit registry/class data |
| `maritime-read-only` | READ_ONLY | Read all; no edit |
| `maritime-external-api` | API_CONSUMER | API read access; scoped to licensed products |

**Resource-Level Permissions (enforced in API service):**

```
Permission format: {domain}:{action}
  vessels:read        vessels:write       vessels:approve
  ports:read          ports:write         ports:approve
  companies:read      companies:write     companies:approve
  compliance:read     compliance:write    compliance:approve
  feeds:read          feeds:admin
  users:admin
  audit:read
```

### 13.3 Session & Token Management

- **Access Token**: 15-minute expiry, JWT, contains roles + scopes
- **Refresh Token**: 8-hour sliding window; rotated on use
- **API Keys**: Long-lived; rate-limited per key; revocable; hashed in DB (never stored plain)
- **MFA**: Required for ADMIN, FULL_ACCESS, VESSEL_ANALYST, COMPLIANCE_OFFICER
- **SSO**: Okta SSO for all internal users via corporate IdP federation

---

## 14. Data Migration & Backfill

### 14.1 Scope

~1 TB of historical maritime data from legacy systems, flat files, and predecessor databases needs to be migrated and backfilled into the new Medallion architecture.

### 14.2 Migration Strategy

```
Phase 1: ASSESSMENT (2 weeks)
  ├── Inventory all legacy sources (location, format, quality, coverage dates)
  ├── Map legacy fields to target schemas (column mapping spreadsheet)
  ├── Identify data quality issues (nulls, encoding, outliers)
  ├── Estimate record volumes per entity type
  └── Define migration priority order (vessels > ports > companies > cargo > events)

Phase 2: TOOLING (2 weeks)
  ├── Migration harness (Python/Dataflow templates)
  ├── Field mapping config files (YAML per source)
  ├── Validation suite (row count, checksum, spot checks)
  └── Reconciliation dashboard (Cloud Data Studio)

Phase 3: DRY RUN (1 week)
  ├── Migrate 10% sample into staging environment
  ├── Run full validation suite
  ├── Manual spot-check by domain analysts
  └── Performance test (throughput, costs)

Phase 4: FULL MIGRATION (rolling, 4-6 weeks)
  ├── Migrate Bronze: push all historical raw data to bq_bronze
  ├── Migrate Silver: run transformation jobs per entity type
  ├── Entity resolution: run Terahelix on all historical records
  ├── Migrate Gold: apply source hierarchy + confidence scoring
  └── Backfill bi-temporal timestamps (derive from source timestamps)

Phase 5: VALIDATION & CUTOVER
  ├── Row count reconciliation
  ├── Key metric comparison (total vessels, active ports, etc.)
  ├── Side-by-side comparison with legacy system
  └── Final sign-off from domain owners
```

### 14.3 Migration Tooling

```python
# Dataflow template pattern (Python / Apache Beam)
# Located in: /tools/migration/

class MigrationPipeline:
    """
    Idempotent migration job. Safe to re-run; uses row_hash dedup.
    """
    def run(self, source_gcs_uri, target_bq_table, field_map_config):
        pipeline = beam.Pipeline(options=self.options)
        (
            pipeline
            | 'ReadSource'    >> beam.io.ReadFromText(source_gcs_uri)
            | 'ParseRows'     >> beam.ParDo(ParseRowFn(self.format))
            | 'ApplyMapping'  >> beam.ParDo(FieldMapFn(field_map_config))
            | 'Validate'      >> beam.ParDo(ValidationFn(self.schema))
            | 'AddMetadata'   >> beam.ParDo(EnvelopeFn(source_id='LEGACY_MIGRATION'))
            | 'DeduplicateHash' >> beam.Distinct()  # row_hash dedup
            | 'WriteBronze'   >> beam.io.WriteToBigQuery(target_bq_table)
        )
        pipeline.run()
```

**Scripts and Tools Structure:**

```
/tools/
  ├── migration/
  │   ├── assess/          -- source cataloging scripts
  │   ├── transform/       -- field mapping configs (YAML) + Beam jobs
  │   ├── validate/        -- reconciliation + checksum scripts
  │   └── backfill/        -- bi-temporal backfill scripts
  ├── data-quality/
  │   ├── completeness_check.py
  │   ├── outlier_detection.py
  │   └── dedup_report.py
  └── admin/
      ├── reindex_elasticsearch.py
      ├── rebuild_gearbox_links.py
      └── purge_expired_drafts.py
```

---

## 15. Monitoring, Alerting & Observability

### 15.1 Observability Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                     UNIFIED OBSERVABILITY PLANE                     │
│                                                                     │
│  METRICS          LOGS               TRACES              ALERTS    │
│  GCP Cloud        Cloud Logging      Cloud Trace         GCP       │
│  Monitoring       (structured JSON)  + OpenTelemetry     Alerting  │
│  + Datadog        Log Analytics      (distributed)       PagerDuty │
└─────────────────────────────────────────────────────────────────────┘
```

### 15.2 Monitoring Domains

**Infrastructure Monitoring**

| Resource | Key Metrics | Alert Threshold |
|---|---|---|
| GKE / Cloud Run | CPU, memory, pod restarts, latency | p99 > 2s; restart > 3/10min |
| BigQuery | Slot utilization, query bytes billed, failed jobs | Cost anomaly > 2x baseline |
| Elasticsearch | Cluster health, index lag, JVM heap | RED health; lag > 5min |
| GCS | Storage growth, access errors | Bucket ACL change; 403 spike |
| Pub/Sub | Message age, undelivered messages, subscriber lag | Age > 30min |
| Cloud Spanner | CPU utilization, query latency | CPU > 80% |

**Pipeline Monitoring**

| Check | Schedule | Alert Condition |
|---|---|---|
| Feed freshness check | Every 15 min | Feed not received within expected window |
| ETL job completion | Per job run | Job failed or duration > 2x baseline |
| Dead-letter queue size | Hourly | DLQ > 100 messages |
| Silver → Gold lag | Hourly | Unprocessed Silver records > 10k |
| Change set backlog | Daily | Pending approvals > 500 |

**Application Monitoring**

| Metric | Tool | SLO |
|---|---|---|
| API error rate | Cloud Trace / Datadog APM | < 0.1% 5xx |
| API p99 latency | Cloud Trace | < 500ms |
| Search query latency | Elasticsearch + Datadog | p95 < 200ms |
| UX Core Web Vitals | Cloud Monitoring + RUM | LCP < 2.5s |
| Auth failures | Okta Syslog + Cloud Logging | Spike > 5x baseline |

**Data Quality Monitoring**

```sql
-- Daily data quality dashboard query
SELECT
  entity_type,
  COUNT(*) AS total_records,
  COUNTIF(completeness_score < 0.7) AS low_completeness_count,
  AVG(completeness_score) AS avg_completeness,
  COUNTIF(conflict_flag = TRUE) AS conflict_count,
  COUNTIF(DATE(updated_at) = CURRENT_DATE()) AS updated_today
FROM bq_silver.vessel_staging
GROUP BY 1;
```

### 15.3 Alerting Runbook Structure

Each alert has a runbook entry:
```
Alert ID: FEED_FRESHNESS_001
Severity: HIGH
Description: Feed {feed_name} has not been received for {N} hours
Runbook:
  1. Check D6 feed registry for last delivery timestamp
  2. Verify source SFTP/API is reachable
  3. Check D6 connector logs for errors
  4. If source down: notify feed owner; set feed status = DELAYED
  5. If D6 issue: page D6 ops team
  6. Update incident ticket in Jira
```

### 15.4 SLI / SLO Definitions

| Service | SLI | SLO |
|---|---|---|
| External API | % of requests < 500ms | 95% over 30 days |
| External API | % of requests not 5xx | 99.9% over 30 days |
| Search | % of queries < 300ms | 95% over 30 days |
| Feed ingestion | % of feeds received within SLA window | 99% over 30 days |
| ETL pipeline | % of daily jobs completing successfully | 99.5% over 30 days |
| Data freshness | % of Gold records updated within 24h of source | 95% of active records |

---

## 16. Audit System

### 16.1 Audit Coverage

| Event Category | What Is Logged | Storage |
|---|---|---|
| **Data Changes** | Entity field changes (before/after), change set ID, approver | BigQuery append-only |
| **User Actions** | All UI actions (view, search, export, edit, approve, reject) | BigQuery append-only |
| **API Access** | All API calls (endpoint, method, params, user, response code) | Cloud Logging → BigQuery |
| **Authentication** | Login, logout, MFA, failed attempts, token issuance | Okta Syslog → Cloud Logging |
| **Feed Events** | Feed receipt, parse, routing, failure | BigQuery append-only |
| **System Events** | Config changes, user provisioning, role changes | Cloud Logging → BigQuery |

### 16.2 Audit Log Schema

```sql
CREATE TABLE bq_audit.audit_log (
  audit_id         STRING NOT NULL,
  event_type       STRING NOT NULL,   -- DATA_CHANGE | USER_ACTION | API_ACCESS | AUTH | FEED | SYSTEM
  event_subtype    STRING,
  event_ts         TIMESTAMP NOT NULL,
  actor_id         STRING,            -- user_id or service_account
  actor_type       STRING,            -- USER | SERVICE | SYSTEM
  actor_ip         STRING,
  session_id       STRING,
  entity_type      STRING,
  entity_id        STRING,
  action           STRING,            -- VIEW | CREATE | EDIT | APPROVE | REJECT | DELETE | EXPORT
  resource_path    STRING,            -- API path or UI route
  before_state     JSON,              -- snapshot before change
  after_state      JSON,              -- snapshot after change
  change_set_id    STRING,
  outcome          STRING,            -- SUCCESS | FAILURE | PARTIAL
  error_code       STRING,
  metadata         JSON,
  record_hash      STRING             -- SHA-256 of record fields (tamper detection)
)
PARTITION BY DATE(event_ts)
CLUSTER BY event_type, entity_type, actor_id;
```

### 16.3 Audit API

Internal audit endpoint (admin + compliance roles only):

```
GET /api/v2/audit?entity_type=vessel&entity_id={imo}&from=...&to=...
GET /api/v2/audit?actor_id={user}&from=...&to=...
GET /api/v2/audit?event_type=DATA_CHANGE&field=operational_status
```

---

## 17. Security & Governance

### 17.1 Data Security Controls

| Control | Implementation |
|---|---|
| **Encryption at Rest** | GCP default CMEK (Cloud KMS) for BigQuery, GCS, Spanner |
| **Encryption in Transit** | TLS 1.3 enforced on all endpoints; no TLS < 1.2 |
| **Column-Level Security** | BigQuery column-level access policies on PII/sensitive fields |
| **Row-Level Security** | BigQuery row access policies for data product segmentation |
| **VPC Service Controls** | BigQuery, GCS in VPC Service Controls perimeter (prevents exfiltration) |
| **Private Service Connect** | No public IPs on internal services; Google APIs via Private Service Connect |
| **Secret Management** | All credentials in Google Secret Manager; no secrets in code/config files |
| **Vulnerability Scanning** | Container images scanned (Artifact Registry + Cloud Security Scanner) |
| **DLP** | Cloud DLP on file uploads (PII detection, malware scan) |

### 17.2 Network Architecture

```
Internet
    │
    ▼
Cloud Armor (WAF + DDoS protection)
    │
    ▼
Google Cloud Load Balancer (global, anycast)
    │
    ▼
API Gateway (Apigee) — rate limiting, auth, logging
    │
    ▼
Internal VPC (RFC 1918 private only)
  ├── GKE cluster (application services)
  ├── Cloud Run services (ETL, notifications, indexer)
  ├── BigQuery (VPC Service Control)
  ├── Elasticsearch (private endpoint)
  └── Cloud Spanner (private endpoint)
```

### 17.3 Data Governance

| Practice | Implementation |
|---|---|
| **Data Catalog** | GCP Dataplex or Collibra — business glossary, schema docs, ownership |
| **Data Lineage** | OpenLineage / Dataplex lineage — feed → Bronze → Silver → Gold → Product |
| **Data Classification** | Tags: PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED (PII/sensitive pricing) |
| **Retention Policies** | Bronze: 7 years; Silver: 5 years; Gold: indefinite; Audit: 10 years |
| **Access Reviews** | Quarterly Okta group membership reviews (automated report) |
| **Data Contracts** | Per-feed schema contracts; breaking changes require migration plan |
| **GDPR/CCPA** | PII inventoried; right-to-erasure supported via soft-delete + audit |

### 17.4 Governance Operating Model

```
Data Owner (per domain) — accountable for data quality and access decisions
Data Steward (per domain) — day-to-day data quality, approval queue management
Data Engineer — pipeline and infrastructure
Security & Compliance — quarterly access reviews, incident response
Platform Ops — monitoring, on-call, SLO reviews
```

---

## 18. Technology Stack Summary

| Layer | Component | Technology Choice | Rationale |
|---|---|---|---|
| **Ingestion** | Feed adapters | D6 (internal) + Cloud Run | Internal standard; handles all 200+ feed types |
| **Message Bus** | Event streaming | GCP Pub/Sub | Native GCP; managed; scalable |
| **Data Lake** | Raw + staging storage | BigQuery (Bronze, Silver) | Petabyte scale; serverless; SQL |
| **Master DB** | Curated master data | BigQuery (Gold) | Analytical workloads; geospatial native |
| **Transactional** | Edit/approval workflow | AlloyDB (PostgreSQL + PostGIS) | ACID transactions; advanced geospatial |
| **Entity Resolution** | Identifier mapping | Terahelix (internal) | S&P standard for maritime IDs |
| **Relationship Graph** | Entity linking | Gearbox (internal) | S&P standard for entity relationships |
| **AI / ML** | Confidence scoring | Vertex AI + BigQuery ML | Native GCP; no infra overhead |
| **Search** | Real-time search | Elasticsearch (Elastic Cloud GCP) | Industry standard; rich maritime analyzers |
| **File Storage** | Documents + images | GCS + Cloud CDN | Native GCP; cost-effective; global CDN |
| **Auth / Identity** | SSO + RBAC | Okta + Okta Workforce | Enterprise standard; supports SAML + OIDC |
| **API Gateway** | Rate limiting + auth | Apigee | Enterprise-grade; developer portal |
| **Application** | Web UX | React + Vite (TypeScript) | Current platform; persona-driven |
| **CMS** | Content management | Contentful (headless) | Decoupled; API-driven; non-technical editors |
| **Analytics** | BI dashboards | Looker + BigQuery BI Engine | Native BigQuery integration; low-latency |
| **Notifications** | Multi-channel delivery | Cloud Run + SendGrid + Slack API | Flexible; channel-agnostic |
| **Monitoring** | Metrics + alerting | GCP Cloud Monitoring + Datadog | Unified; cross-service; PagerDuty integration |
| **Logging** | Structured logs | Cloud Logging + Log Analytics | Centralized; queryable; BigQuery export |
| **Tracing** | Distributed tracing | Cloud Trace + OpenTelemetry | Vendor-neutral instrumentation |
| **On-Call** | Incident alerting | PagerDuty | Industry standard; escalation policies |
| **Secrets** | Credential management | Google Secret Manager | Native GCP; audit logged; rotation support |
| **CI/CD** | Deployment pipeline | Cloud Build + Artifact Registry | Native GCP; container-native |
| **IaC** | Infrastructure | Terraform | Version-controlled infra; GCP provider |
| **Data Catalog** | Governance | GCP Dataplex | Native lineage + quality scoring |
| **Delivery (bulk)** | Data warehouse sync | Snowflake connector / Fivetran | S&P enterprise standard |
| **Delivery (fabric)** | Internal data products | GCP EDO-Fabric | S&P internal data distribution |

---

*This document represents the target architecture. Individual components may be at different stages of implementation. Consult the project roadmap for delivery phasing.*
