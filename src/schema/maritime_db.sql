-- =============================================================================
-- Maritime Intelligence Platform — PostgreSQL Schema v4
-- Architecture: Per-entity schemas with standardized bi-temporal EAV template
-- Last updated: 2026-05-13 — aligned with full JSON data layer (all 30 JSON files)
--   attribute_definitions.json  → registry schema (attribute_def, filter/column groups)
--   personas.json               → ui.persona (icon, color, attr_sections, vessel_columns)
--   vessels.json + vessels.js   → vessel.v_current (all 50+ display fields)
--   ports_detail.json           → port.v_current (harbour, channel, PSC, traffic)
--   companies_detail.json       → company.v_current (fleet, credit, KYC, ESG)
--   etl_feeds.json              → ingest.feed_config seed rows
--   psc_inspections.json        → compliance.psc_inspection + compliance.psc_deficiency
--   psc_summary.json            → derived; computed by compliance materialized views
--   movements.json              → voyage.voyage + voyage.route_waypoint
--   port_calls.json             → voyage.port_call
--   fixtures.json               → market.fixture
--   freight_routes.json         → market.route_benchmark + market.route_benchmark_value
--   tc_contracts.json           → market.tc_contract
--   market_indices.json         → market.index_definition + market.index_value
--   choke_points.json           → geo.choke_point
--   mou_zones.json              → geo.mou_zone
--   ais_positions.json          → vessel.position (live AIS feed target)
--   gis_ports.json              → port.entity + port.location (GIS display layer)
--   gis_companies.json          → company.entity (GIS display layer)
-- =============================================================================
-- Design principles:
--   1. Each core entity has its own schema (vessel, port, company)
--   2. Every schema follows the same structural template (entity → attr_value
--      (bi-temporal EAV) → raw_ingest → v_current) — extensible to any new entity
--   3. Bi-temporal: valid_from/valid_to (real-world) + sys_from/sys_to (system)
--   4. Bronze layer is immutable; attr_value is insert-only (no UPDATE/DELETE)
--   5. Attribute configuration lives in DB (registry schema), not hardcoded JS
--   6. Feed-to-master field mappings live in DB (ingest schema) with full history
--   7. The JS layer (attributeRegistry.js) reads these definitions at build time;
--      vessel_field / col_id columns are the bridge between DB and frontend
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_partman";


-- =============================================================================
-- SHARED SCHEMAS
-- =============================================================================

-- ─── registry — attribute catalog, source registry ────────────────────────────

CREATE SCHEMA IF NOT EXISTS registry;

-- Data source / vendor registry
-- Mirrors: src/data/json/etl_feeds.json (source_code, source_name, feed_format, etc.)
CREATE TABLE registry.source_def (
    source_id       SMALLINT        PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    source_code     VARCHAR(30)     NOT NULL UNIQUE,   -- e.g. 'IHS_SEAWEB', 'AIS_ORBCOMM'
    source_name     VARCHAR(120)    NOT NULL,
    source_type     VARCHAR(30)     NOT NULL
                    CHECK (source_type IN (
                        'COMMERCIAL_DATA','AIS',
                        'FLAG_REGISTRY','CLASS_SOCIETY',
                        'PSC_MOU','PORT_AUTHORITY',
                        'WEATHER','SANCTIONS',
                        'MANUAL','INTERNAL'
                    )),
    base_url        TEXT,
    auth_type       VARCHAR(20)     DEFAULT 'API_KEY',
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    default_weight  NUMERIC(4,3)    NOT NULL DEFAULT 0.5  CHECK (default_weight BETWEEN 0 AND 1),
    notes           TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Attribute definition catalog — single source of truth for all entity attributes.
-- Mirrors: src/data/json/attribute_definitions.json (each leaf node in "entities")
-- Column naming aligned with JSON field names used in attributeRegistry.js:
--   vessel_field  ← JSON "vessel_field"  (e.g. 'nm','imo','dwt') — field on the JS VESSELS object
--   filter_field  ← JSON "filter_field"  (field used by applyFilters)
--   filter_xfm    ← JSON "filter_field_transform" (e.g. 'numOf')
--   col_id        ← COL_ID_MAP in attributeRegistry.js (short UI preference ID, e.g. 'name','dwt')
CREATE TABLE registry.attribute_def (
    attr_id             SERIAL          PRIMARY KEY,
    entity_type         VARCHAR(30)     NOT NULL,              -- 'vessel' | 'port' | 'company'
    attr_key            VARCHAR(80)     NOT NULL,              -- JSON "key", unique within entity
    attr_id_ui          VARCHAR(80)     NOT NULL,              -- JSON "id" (af-* / po-* / co-* prefix)
    attr_label          VARCHAR(120)    NOT NULL,              -- JSON "label"
    section_id          VARCHAR(60)     NOT NULL,              -- JSON section "id"
    section_label       VARCHAR(120)    NOT NULL,              -- JSON section "label"
    group_id            VARCHAR(60)     NOT NULL,              -- JSON group "id"
    group_label         VARCHAR(120)    NOT NULL,              -- JSON group "label"
    section_order       SMALLINT        NOT NULL DEFAULT 0,    -- JSON section "order"
    group_order         SMALLINT        NOT NULL DEFAULT 0,    -- JSON group "order"
    display_order       SMALLINT        NOT NULL DEFAULT 0,    -- JSON "display_order"
    data_type           VARCHAR(20)     NOT NULL
                        CHECK (data_type IN ('text','numeric','boolean','date','geometry','json')),
    unit                VARCHAR(30),                           -- JSON "unit"
    -- Bridge to JS data layer (kept in sync with attributeRegistry.js COL_ID_MAP)
    vessel_field        VARCHAR(80),                           -- JSON "vessel_field" → VESSELS[field]
    filter_field        VARCHAR(80),                           -- JSON "filter_field"
    filter_xfm          VARCHAR(30),                          -- JSON "filter_field_transform"
    col_id              VARCHAR(60),                           -- Short UI col ID (COL_ID_MAP value)
    -- UI filter configuration (mirrors attribute_definitions.json filter flags)
    is_filterable       BOOLEAN         NOT NULL DEFAULT FALSE,
    filter_type         VARCHAR(20)     CHECK (filter_type IN ('typeahead','multiselect','range','date_range')),
    filter_group_id     VARCHAR(60),
    -- UI column configuration (mirrors attribute_definitions.json column flags)
    is_column           BOOLEAN         NOT NULL DEFAULT FALSE,
    column_group_key    VARCHAR(60),
    column_always       BOOLEAN         NOT NULL DEFAULT FALSE,
    column_width        SMALLINT        DEFAULT 100,
    -- Search configuration
    is_searchable       BOOLEAN         NOT NULL DEFAULT FALSE,
    search_boost        NUMERIC(4,2)    DEFAULT 1.0,
    -- Validation
    validation_regex    TEXT,
    validation_min      NUMERIC,
    validation_max      NUMERIC,
    allowed_values      TEXT[],
    is_required         BOOLEAN         NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    deprecated_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (entity_type, attr_key),
    UNIQUE (entity_type, attr_id_ui)
);

CREATE INDEX idx_attr_def_entity      ON registry.attribute_def (entity_type);
CREATE INDEX idx_attr_def_filterable  ON registry.attribute_def (entity_type, is_filterable) WHERE is_filterable;
CREATE INDEX idx_attr_def_column      ON registry.attribute_def (entity_type, is_column)     WHERE is_column;
CREATE INDEX idx_attr_def_ui_id       ON registry.attribute_def (attr_id_ui);
CREATE INDEX idx_attr_def_col_id      ON registry.attribute_def (entity_type, col_id)        WHERE col_id IS NOT NULL;

-- Source-level attribute weight overrides
CREATE TABLE registry.source_attr_weight (
    source_id       SMALLINT        NOT NULL REFERENCES registry.source_def (source_id),
    attr_id         INTEGER         NOT NULL REFERENCES registry.attribute_def (attr_id),
    weight          NUMERIC(4,3)    NOT NULL CHECK (weight BETWEEN 0 AND 1),
    effective_from          DATE        NOT NULL DEFAULT CURRENT_DATE,
    effective_to            DATE,
    auto_promote_to_master  BOOLEAN     NOT NULL DEFAULT FALSE,
    PRIMARY KEY (source_id, attr_id, effective_from)
);

-- Filter group definitions — mirrors attribute_definitions.json "filter_groups" array
CREATE TABLE registry.filter_group_def (
    filter_group_id     VARCHAR(60)     PRIMARY KEY,
    entity_type         VARCHAR(30)     NOT NULL DEFAULT 'vessel',
    label               VARCHAR(120)    NOT NULL,
    display_order       SMALLINT        NOT NULL DEFAULT 0,
    icon                VARCHAR(10),
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE
);

-- Column group definitions — mirrors attribute_definitions.json "column_groups" array
CREATE TABLE registry.column_group_def (
    column_group_key    VARCHAR(60)     PRIMARY KEY,
    entity_type         VARCHAR(30)     NOT NULL DEFAULT 'vessel',
    label               VARCHAR(120)    NOT NULL,
    display_order       SMALLINT        NOT NULL DEFAULT 0,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE
);


-- ─── ingest — feed configuration & field mappings ────────────────────────────
-- Mirrors: src/data/json/etl_feeds.json, etl_runs.json, etl_conflicts.json

CREATE SCHEMA IF NOT EXISTS ingest;

CREATE TABLE ingest.feed_config (
    feed_id         SERIAL          PRIMARY KEY,
    source_id       SMALLINT        NOT NULL REFERENCES registry.source_def (source_id),
    entity_type     VARCHAR(30)     NOT NULL,
    feed_name       VARCHAR(120)    NOT NULL,
    feed_format     VARCHAR(20)     NOT NULL
                    CHECK (feed_format IN ('JSON','XML','CSV','FTP_CSV','API_REST','SFTP_XML','KAFKA','WEBSOCKET')),
    endpoint_url    TEXT,
    cron_schedule   VARCHAR(60),
    batch_size      INTEGER         DEFAULT 500,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    config_json     JSONB           DEFAULT '{}',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Feed field → attribute_def mapping (versioned; mirrors ingest.feed_field_map in etl_feeds.json)
CREATE TABLE ingest.feed_field_map (
    map_id          SERIAL          PRIMARY KEY,
    feed_id         INTEGER         NOT NULL REFERENCES ingest.feed_config (feed_id),
    source_field    VARCHAR(200)    NOT NULL,              -- JSONPath or CSV column name
    attr_id         INTEGER         NOT NULL REFERENCES registry.attribute_def (attr_id),
    transform_expr  TEXT,
    valid_from      DATE            NOT NULL DEFAULT CURRENT_DATE,
    valid_to        DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (feed_id, source_field, valid_from)
);

CREATE INDEX idx_feed_field_map_active ON ingest.feed_field_map (feed_id, attr_id)
    WHERE valid_to IS NULL;

-- QC rules per attribute
CREATE TABLE ingest.qc_rule (
    rule_id         SERIAL          PRIMARY KEY,
    attr_id         INTEGER         NOT NULL REFERENCES registry.attribute_def (attr_id),
    rule_type       VARCHAR(30)     NOT NULL
                    CHECK (rule_type IN ('NOT_NULL','RANGE','REGEX','ENUM','CUSTOM_SQL')),
    rule_expr       TEXT            NOT NULL,
    severity        VARCHAR(10)     NOT NULL DEFAULT 'WARN'
                    CHECK (severity IN ('WARN','ERROR','BLOCK')),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE
);

-- Feed run log — mirrors src/data/json/etl_runs.json structure
CREATE TABLE ingest.feed_run (
    run_id          BIGSERIAL       PRIMARY KEY,
    feed_id         INTEGER         NOT NULL REFERENCES ingest.feed_config (feed_id),
    started_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    status          VARCHAR(20)     NOT NULL DEFAULT 'RUNNING'
                    CHECK (status IN ('RUNNING','SUCCESS','PARTIAL','FAILED')),
    rows_received   INTEGER         DEFAULT 0,
    rows_ingested   INTEGER         DEFAULT 0,
    rows_rejected   INTEGER         DEFAULT 0,
    conflict_count  INTEGER         DEFAULT 0,             -- mirrors etl_runs.json conflicts field
    error_summary   TEXT,
    run_metadata    JSONB           DEFAULT '{}'
);

CREATE INDEX idx_feed_run_feed ON ingest.feed_run (feed_id, started_at DESC);

-- Conflict resolution queue — mirrors src/data/json/etl_conflicts.json
CREATE TABLE ingest.conflict_queue (
    conflict_id     BIGSERIAL       PRIMARY KEY,
    run_id          BIGINT          NOT NULL REFERENCES ingest.feed_run (run_id),
    entity_type     VARCHAR(30)     NOT NULL,
    entity_id       TEXT            NOT NULL,
    attr_id         INTEGER         NOT NULL REFERENCES registry.attribute_def (attr_id),
    source_a_id     SMALLINT        NOT NULL REFERENCES registry.source_def (source_id),
    value_a         TEXT,
    score_a         NUMERIC(4,3),
    source_b_id     SMALLINT        NOT NULL REFERENCES registry.source_def (source_id),
    value_b         TEXT,
    score_b         NUMERIC(4,3),
    conflict_type   VARCHAR(20)     NOT NULL DEFAULT 'VALUE_MISMATCH'
                    CHECK (conflict_type IN ('VALUE_MISMATCH','FORMAT','MISSING','RANGE_BREACH')),
    severity        VARCHAR(10)     NOT NULL DEFAULT 'LOW'
                    CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    detected_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ,
    resolution      VARCHAR(20)
                    CHECK (resolution IN ('ACCEPTED_A','ACCEPTED_B','MANUAL','DEFERRED','AUTO'))
);

CREATE INDEX idx_cq_entity     ON ingest.conflict_queue (entity_type, entity_id) WHERE resolved_at IS NULL;
CREATE INDEX idx_cq_run        ON ingest.conflict_queue (run_id);
CREATE INDEX idx_cq_unresolved ON ingest.conflict_queue (severity, detected_at DESC) WHERE resolved_at IS NULL;


-- ─── workflow — human-in-the-loop & edit drafts ───────────────────────────────

CREATE SCHEMA IF NOT EXISTS workflow;

CREATE TABLE workflow.conflict (
    conflict_id     BIGSERIAL       PRIMARY KEY,
    entity_type     VARCHAR(30)     NOT NULL,
    entity_id       TEXT            NOT NULL,
    attr_id         INTEGER         NOT NULL REFERENCES registry.attribute_def (attr_id),
    source_a_id     SMALLINT        NOT NULL REFERENCES registry.source_def (source_id),
    value_a         TEXT,
    source_b_id     SMALLINT        NOT NULL REFERENCES registry.source_def (source_id),
    value_b         TEXT,
    detected_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ,
    resolved_by     INTEGER,
    resolution      VARCHAR(20)     CHECK (resolution IN ('ACCEPTED_A','ACCEPTED_B','MANUAL','DEFERRED')),
    notes           TEXT
);

CREATE INDEX idx_conflict_entity ON workflow.conflict (entity_type, entity_id, attr_id)
    WHERE resolved_at IS NULL;

CREATE TABLE workflow.edit_draft (
    draft_id        BIGSERIAL       PRIMARY KEY,
    entity_type     VARCHAR(30)     NOT NULL,
    entity_id       TEXT            NOT NULL,
    attr_id         INTEGER         NOT NULL REFERENCES registry.attribute_def (attr_id),
    draft_value     TEXT,
    draft_note      TEXT,
    state           VARCHAR(20)     NOT NULL DEFAULT 'PENDING'
                    CHECK (state IN ('PENDING','APPROVED','REJECTED','WITHDRAWN')),
    created_by      INTEGER,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    reviewed_by     INTEGER,
    reviewed_at     TIMESTAMPTZ
);

CREATE TABLE workflow.draft_transition (
    transition_id   BIGSERIAL       PRIMARY KEY,
    draft_id        BIGINT          NOT NULL REFERENCES workflow.edit_draft (draft_id),
    from_state      VARCHAR(20),
    to_state        VARCHAR(20)     NOT NULL,
    actor_id        INTEGER,
    reason          TEXT,
    transitioned_at TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Explicit promotion gate between the vendor layer (*.attr_value) and master layer (*.master_value).
-- The ETL pipeline creates a PENDING request for every new or changed vendor value that differs
-- from the current master. Conflict resolution and manual triggers also create requests here.
-- No value enters *.master_value without either:
--   (a) an APPROVED promotion_request  (vendor-sourced path)
--   (b) an APPROVED edit_draft         (manual entry / backdated path)
-- The only exception is sources where registry.source_attr_weight.auto_promote_to_master = TRUE,
-- in which case the pipeline may approve the request programmatically.
CREATE TABLE workflow.promotion_request (
    pr_id           BIGSERIAL       PRIMARY KEY,
    entity_type     VARCHAR(30)     NOT NULL,
    entity_id       TEXT            NOT NULL,
    attr_id         INTEGER         NOT NULL REFERENCES registry.attribute_def (attr_id),
    av_id           BIGINT          NOT NULL,   -- *.attr_value.av_id — no FK, table is partitioned
    source_id       SMALLINT        NOT NULL REFERENCES registry.source_def (source_id),
    candidate_value TEXT,                       -- denormalised snapshot for the review UI
    confidence      NUMERIC(4,3),              -- composite score from source_attr_weight at creation time
    trigger_type    VARCHAR(20)     NOT NULL
                    CHECK (trigger_type IN ('NEW_VALUE','CHANGED_VALUE','CONFLICT_RESOLVED','MANUAL_TRIGGER')),
    cq_id           BIGINT          REFERENCES ingest.conflict_queue (conflict_id),
    wf_conflict_id  BIGINT          REFERENCES workflow.conflict (conflict_id),
    draft_id        BIGINT          REFERENCES workflow.edit_draft (draft_id),
    state           VARCHAR(20)     NOT NULL DEFAULT 'PENDING'
                    CHECK (state IN ('PENDING','APPROVED','REJECTED','SUPERSEDED','WITHDRAWN')),
    reviewed_by     INTEGER,                    -- auth.app_user.user_id (no FK — auth schema defined later)
    reviewed_at     TIMESTAMPTZ,
    rejection_note  TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pr_entity  ON workflow.promotion_request (entity_type, entity_id, attr_id) WHERE state = 'PENDING';
CREATE INDEX idx_pr_pending ON workflow.promotion_request (created_at DESC)                 WHERE state = 'PENDING';
CREATE INDEX idx_pr_source  ON workflow.promotion_request (source_id, state);


-- ─── audit — immutable change log ────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE audit.change_log (
    log_id          BIGSERIAL       PRIMARY KEY,
    entity_type     VARCHAR(30)     NOT NULL,
    entity_id       TEXT            NOT NULL,
    attr_id         INTEGER         REFERENCES registry.attribute_def (attr_id),
    operation       VARCHAR(10)     NOT NULL
                    CHECK (operation IN ('INSERT','UPDATE','DELETE','APPROVE','REJECT')),
    old_value       JSONB,
    new_value       JSONB,
    actor_id        INTEGER,
    actor_source    VARCHAR(30),
    source_ref      TEXT,
    logged_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE RULE audit_no_update AS ON UPDATE TO audit.change_log DO INSTEAD NOTHING;
CREATE RULE audit_no_delete AS ON DELETE TO audit.change_log DO INSTEAD NOTHING;

CREATE INDEX idx_audit_entity ON audit.change_log (entity_type, entity_id, logged_at DESC);
CREATE INDEX idx_audit_attr   ON audit.change_log (attr_id, logged_at DESC);


-- ─── ui — personas, saved filters, dashboard config ──────────────────────────
-- Mirrors: src/data/json/personas.json exactly
--   persona_key     → JSON "id"
--   label           → JSON "name"
--   icon            → JSON "icon"
--   color           → JSON "color"
--   attr_sections   → JSON "attr_sections" (ordered list of attribute section IDs)
--   vessel_columns  → JSON "vessel_columns" (ordered short column IDs, per COL_ID_MAP)
--   dashboard_cards → JSON "dashboard_cards" [{card_id, width}, ...]

CREATE SCHEMA IF NOT EXISTS ui;

CREATE TABLE ui.persona (
    persona_id      SERIAL          PRIMARY KEY,
    persona_key     VARCHAR(60)     NOT NULL UNIQUE,       -- matches JSON "id"
    label           VARCHAR(120)    NOT NULL,              -- matches JSON "name"
    description     TEXT,
    icon            VARCHAR(10),                           -- emoji icon from JSON
    color           VARCHAR(7),                            -- hex color e.g. '#1558d6'
    attr_sections   TEXT[]          DEFAULT '{}',          -- ordered section IDs
    vessel_columns  TEXT[]          DEFAULT '{}',          -- short col IDs (COL_ID_MAP)
    dashboard_cards JSONB           DEFAULT '[]',          -- [{card_id, width}, ...]
    default_filters JSONB           DEFAULT '[]',
    is_system       BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Per-persona attribute visibility overrides (fine-grained, optional)
CREATE TABLE ui.persona_attr_config (
    persona_id      INTEGER         NOT NULL REFERENCES ui.persona (persona_id),
    attr_id         INTEGER         NOT NULL REFERENCES registry.attribute_def (attr_id),
    is_visible      BOOLEAN         NOT NULL DEFAULT TRUE,
    column_order    SMALLINT,
    PRIMARY KEY (persona_id, attr_id)
);

-- User-saved filter presets
CREATE TABLE ui.saved_filter (
    filter_id       SERIAL          PRIMARY KEY,
    user_id         INTEGER,
    persona_id      INTEGER         REFERENCES ui.persona (persona_id),
    entity_type     VARCHAR(30)     NOT NULL DEFAULT 'vessel',
    label           VARCHAR(120)    NOT NULL,
    filter_json     JSONB           NOT NULL,
    is_shared       BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Dashboard card layout overrides (per user/persona)
-- Mirrors: src/data/json/dashboard_cards.json card definitions
CREATE TABLE ui.dashboard_layout (
    layout_id       SERIAL          PRIMARY KEY,
    user_id         INTEGER,                               -- NULL = persona default
    persona_id      INTEGER         REFERENCES ui.persona (persona_id),
    card_id         VARCHAR(60)     NOT NULL,              -- matches dashboard_cards.json card_id
    col_span        SMALLINT        NOT NULL DEFAULT 4,    -- width in 12-col grid
    row_order       SMALLINT        NOT NULL DEFAULT 0,
    is_visible      BOOLEAN         NOT NULL DEFAULT TRUE,
    UNIQUE (user_id, persona_id, card_id)
);


-- ─── auth — users, roles, permissions ────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE auth.app_user (
    user_id         SERIAL          PRIMARY KEY,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    display_name    VARCHAR(120),
    default_persona INTEGER         REFERENCES ui.persona (persona_id),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE auth.role (
    role_id         SERIAL          PRIMARY KEY,
    role_key        VARCHAR(60)     NOT NULL UNIQUE,
    label           VARCHAR(120)    NOT NULL,
    description     TEXT
);

CREATE TABLE auth.user_role (
    user_id         INTEGER         NOT NULL REFERENCES auth.app_user (user_id),
    role_id         INTEGER         NOT NULL REFERENCES auth.role (role_id),
    granted_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    granted_by      INTEGER         REFERENCES auth.app_user (user_id),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE auth.permission (
    permission_id   SERIAL          PRIMARY KEY,
    role_id         INTEGER         NOT NULL REFERENCES auth.role (role_id),
    resource        VARCHAR(60)     NOT NULL,
    action          VARCHAR(20)     NOT NULL
                    CHECK (action IN ('READ','WRITE','APPROVE','ADMIN')),
    UNIQUE (role_id, resource, action)
);

ALTER TABLE workflow.conflict      ADD CONSTRAINT fk_conflict_resolver  FOREIGN KEY (resolved_by)  REFERENCES auth.app_user (user_id);
ALTER TABLE workflow.edit_draft    ADD CONSTRAINT fk_draft_creator      FOREIGN KEY (created_by)   REFERENCES auth.app_user (user_id);
ALTER TABLE workflow.edit_draft    ADD CONSTRAINT fk_draft_reviewer     FOREIGN KEY (reviewed_by)  REFERENCES auth.app_user (user_id);
ALTER TABLE workflow.draft_transition ADD CONSTRAINT fk_dt_actor        FOREIGN KEY (actor_id)     REFERENCES auth.app_user (user_id);
ALTER TABLE audit.change_log       ADD CONSTRAINT fk_audit_actor        FOREIGN KEY (actor_id)     REFERENCES auth.app_user (user_id);
ALTER TABLE ui.saved_filter        ADD CONSTRAINT fk_sf_user            FOREIGN KEY (user_id)      REFERENCES auth.app_user (user_id);
ALTER TABLE ui.dashboard_layout    ADD CONSTRAINT fk_dl_user            FOREIGN KEY (user_id)      REFERENCES auth.app_user (user_id);


-- =============================================================================
-- ENTITY SCHEMA: vessel
-- Mirrors: src/data/json/vessels.json + src/data/vessels.js (VESSELS mapping)
-- All field names in v_current align with the VESSELS object properties in vessels.js
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS vessel;

CREATE TABLE vessel.entity (
    vessel_id       BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    imo_number      CHAR(7)         UNIQUE,          -- NULL for vessels without an assigned IMO number
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    first_seen_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    first_source_id SMALLINT        REFERENCES registry.source_def (source_id)
);

-- Bi-temporal EAV — insert-only, never UPDATE/DELETE
CREATE TABLE vessel.attr_value (
    av_id           BIGSERIAL       NOT NULL,
    vessel_id       BIGINT          NOT NULL REFERENCES vessel.entity (vessel_id),
    attr_id         INTEGER         NOT NULL REFERENCES registry.attribute_def (attr_id),
    value_text      TEXT,
    value_numeric   NUMERIC(20,6),
    value_boolean   BOOLEAN,
    value_date      DATE,
    value_json      JSONB,
    source_id       SMALLINT        NOT NULL REFERENCES registry.source_def (source_id),
    source_ref      TEXT,
    confidence      NUMERIC(4,3)    NOT NULL DEFAULT 0.5   CHECK (confidence BETWEEN 0 AND 1),
    valid_from      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    valid_to        TIMESTAMPTZ,
    sys_from        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    sys_to          TIMESTAMPTZ,
    workflow_state  VARCHAR(20)     NOT NULL DEFAULT 'APPROVED'
                    CHECK (workflow_state IN ('PENDING','APPROVED','REJECTED','SUPERSEDED')),
    draft_id        BIGINT          REFERENCES workflow.edit_draft (draft_id),
    run_id          BIGINT          REFERENCES ingest.feed_run (run_id),
    qc_flags        TEXT[],
    qc_passed       BOOLEAN         NOT NULL DEFAULT TRUE,
    PRIMARY KEY (av_id)
) PARTITION BY RANGE (sys_from);

CREATE TABLE vessel.attr_value_2020 PARTITION OF vessel.attr_value FOR VALUES FROM ('2020-01-01') TO ('2021-01-01');
CREATE TABLE vessel.attr_value_2021 PARTITION OF vessel.attr_value FOR VALUES FROM ('2021-01-01') TO ('2022-01-01');
CREATE TABLE vessel.attr_value_2022 PARTITION OF vessel.attr_value FOR VALUES FROM ('2022-01-01') TO ('2023-01-01');
CREATE TABLE vessel.attr_value_2023 PARTITION OF vessel.attr_value FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');
CREATE TABLE vessel.attr_value_2024 PARTITION OF vessel.attr_value FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE vessel.attr_value_2025 PARTITION OF vessel.attr_value FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE vessel.attr_value_2026 PARTITION OF vessel.attr_value FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE vessel.attr_value_2027 PARTITION OF vessel.attr_value FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
CREATE TABLE vessel.attr_value_2028 PARTITION OF vessel.attr_value FOR VALUES FROM ('2028-01-01') TO ('2029-01-01');
CREATE TABLE vessel.attr_value_2029 PARTITION OF vessel.attr_value FOR VALUES FROM ('2029-01-01') TO ('2030-01-01');
CREATE TABLE vessel.attr_value_overflow PARTITION OF vessel.attr_value DEFAULT;

CREATE INDEX idx_vav_vessel_attr ON vessel.attr_value (vessel_id, attr_id);
CREATE INDEX idx_vav_current     ON vessel.attr_value (vessel_id, attr_id, confidence DESC)
    WHERE valid_to IS NULL AND sys_to IS NULL AND workflow_state = 'APPROVED';
CREATE INDEX idx_vav_run         ON vessel.attr_value (run_id) WHERE run_id IS NOT NULL;

CREATE RULE vessel_av_no_update AS ON UPDATE TO vessel.attr_value DO INSTEAD NOTHING;
CREATE RULE vessel_av_no_delete AS ON DELETE TO vessel.attr_value DO INSTEAD NOTHING;

-- Gold layer — explicitly curated master record for vessel attributes.
-- A row enters here only via:
--   (a) APPROVED workflow.promotion_request  → entry_type VENDOR_PROMOTED or CONFLICT_RESOLVED
--   (b) APPROVED workflow.edit_draft         → entry_type MANUAL_ENTRY or BACKDATED
-- Insert-only: supersede a row by setting its sys_to / valid_to before inserting the replacement.
-- workflow_state = APPROVED means this row IS the current master for the given attribute period.
CREATE TABLE vessel.master_value (
    mv_id           BIGSERIAL       NOT NULL,
    vessel_id       BIGINT          NOT NULL REFERENCES vessel.entity (vessel_id),
    attr_id         INTEGER         NOT NULL REFERENCES registry.attribute_def (attr_id),
    value_text      TEXT,
    value_numeric   NUMERIC(20,6),
    value_boolean   BOOLEAN,
    value_date      DATE,
    value_json      JSONB,
    entry_type      VARCHAR(20)     NOT NULL
                    CHECK (entry_type IN (
                        'VENDOR_PROMOTED',   -- approved promotion_request from a vendor row
                        'MANUAL_ENTRY',      -- user-entered value with no vendor source
                        'BACKDATED',         -- manual entry where valid_from is in the past
                        'CONFLICT_RESOLVED'  -- resolved via workflow.conflict
                    )),
    source_av_id    BIGINT,                     -- vessel.attr_value.av_id when VENDOR_PROMOTED (no FK — partitioned)
    source_id       SMALLINT        REFERENCES registry.source_def (source_id),
    pr_id           BIGINT          REFERENCES workflow.promotion_request (pr_id),
    draft_id        BIGINT          REFERENCES workflow.edit_draft (draft_id),
    entered_by      INTEGER,                    -- auth.app_user.user_id
    approved_by     INTEGER,                    -- auth.app_user.user_id
    valid_from      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    valid_to        TIMESTAMPTZ,
    sys_from        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    sys_to          TIMESTAMPTZ,
    workflow_state  VARCHAR(20)     NOT NULL DEFAULT 'APPROVED'
                    CHECK (workflow_state IN ('APPROVED','SUPERSEDED','REJECTED')),
    PRIMARY KEY (mv_id)
) PARTITION BY RANGE (sys_from);

CREATE TABLE vessel.master_value_2020 PARTITION OF vessel.master_value FOR VALUES FROM ('2020-01-01') TO ('2021-01-01');
CREATE TABLE vessel.master_value_2021 PARTITION OF vessel.master_value FOR VALUES FROM ('2021-01-01') TO ('2022-01-01');
CREATE TABLE vessel.master_value_2022 PARTITION OF vessel.master_value FOR VALUES FROM ('2022-01-01') TO ('2023-01-01');
CREATE TABLE vessel.master_value_2023 PARTITION OF vessel.master_value FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');
CREATE TABLE vessel.master_value_2024 PARTITION OF vessel.master_value FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE vessel.master_value_2025 PARTITION OF vessel.master_value FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE vessel.master_value_2026 PARTITION OF vessel.master_value FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE vessel.master_value_2027 PARTITION OF vessel.master_value FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
CREATE TABLE vessel.master_value_2028 PARTITION OF vessel.master_value FOR VALUES FROM ('2028-01-01') TO ('2029-01-01');
CREATE TABLE vessel.master_value_2029 PARTITION OF vessel.master_value FOR VALUES FROM ('2029-01-01') TO ('2030-01-01');
CREATE TABLE vessel.master_value_overflow PARTITION OF vessel.master_value DEFAULT;

CREATE INDEX idx_vmv_vessel_attr ON vessel.master_value (vessel_id, attr_id);
CREATE INDEX idx_vmv_current     ON vessel.master_value (vessel_id, attr_id)
    WHERE valid_to IS NULL AND sys_to IS NULL AND workflow_state = 'APPROVED';

-- Vessel-level source preference — feeds the confidence scoring engine when generating
-- promotion_requests. Does NOT auto-promote. Overrides the global source_attr_weight for
-- this specific vessel+attribute combination.
CREATE TABLE vessel.attr_source_preference (
    vessel_id       BIGINT          NOT NULL REFERENCES vessel.entity (vessel_id),
    attr_id         INTEGER         NOT NULL REFERENCES registry.attribute_def (attr_id),
    source_id       SMALLINT        NOT NULL REFERENCES registry.source_def (source_id),
    weight_override NUMERIC(4,3)    NOT NULL DEFAULT 1.0 CHECK (weight_override BETWEEN 0 AND 1),
    set_by          INTEGER,                    -- auth.app_user.user_id
    set_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    PRIMARY KEY (vessel_id, attr_id)
);

-- Bronze layer — raw feed payloads
CREATE TABLE vessel.raw_ingest (
    raw_id          BIGSERIAL       NOT NULL,
    feed_id         INTEGER         NOT NULL REFERENCES ingest.feed_config (feed_id),
    run_id          BIGINT          NOT NULL REFERENCES ingest.feed_run (run_id),
    imo_number      CHAR(7),
    vessel_id       BIGINT          REFERENCES vessel.entity (vessel_id),
    received_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    raw_payload     JSONB           NOT NULL,
    parse_status    VARCHAR(20)     NOT NULL DEFAULT 'PENDING'
                    CHECK (parse_status IN ('PENDING','MAPPED','PARTIAL','REJECTED')),
    parse_errors    JSONB,
    PRIMARY KEY (raw_id, received_at)
) PARTITION BY RANGE (received_at);

CREATE TABLE vessel.raw_ingest_2024_q1 PARTITION OF vessel.raw_ingest FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
CREATE TABLE vessel.raw_ingest_2024_q2 PARTITION OF vessel.raw_ingest FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');
CREATE TABLE vessel.raw_ingest_2024_q3 PARTITION OF vessel.raw_ingest FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');
CREATE TABLE vessel.raw_ingest_2024_q4 PARTITION OF vessel.raw_ingest FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');
CREATE TABLE vessel.raw_ingest_2025_q1 PARTITION OF vessel.raw_ingest FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE vessel.raw_ingest_2025_q2 PARTITION OF vessel.raw_ingest FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
CREATE TABLE vessel.raw_ingest_2025_q3 PARTITION OF vessel.raw_ingest FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
CREATE TABLE vessel.raw_ingest_2025_q4 PARTITION OF vessel.raw_ingest FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');
CREATE TABLE vessel.raw_ingest_2026_q1 PARTITION OF vessel.raw_ingest FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE vessel.raw_ingest_overflow PARTITION OF vessel.raw_ingest DEFAULT;

-- AIS position — high-volume, NOT EAV
CREATE TABLE vessel.position (
    pos_id          BIGSERIAL       NOT NULL,
    vessel_id       BIGINT          NOT NULL REFERENCES vessel.entity (vessel_id),
    mmsi            CHAR(9),
    latitude        NUMERIC(9,6)    NOT NULL CHECK (latitude  BETWEEN -90  AND 90),
    longitude       NUMERIC(9,6)    NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    geom            GEOMETRY(Point, 4326),
    speed_kn        NUMERIC(5,2),
    course_deg      NUMERIC(6,2),
    heading_deg     NUMERIC(6,2),
    nav_status      SMALLINT,
    draught_m       NUMERIC(4,2),
    destination     VARCHAR(30),
    eta             TIMESTAMPTZ,
    position_ts     TIMESTAMPTZ     NOT NULL,
    received_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    source_id       SMALLINT        NOT NULL REFERENCES registry.source_def (source_id),
    PRIMARY KEY (pos_id, position_ts)
) PARTITION BY RANGE (position_ts);

CREATE TABLE vessel.position_2024_q1 PARTITION OF vessel.position FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
CREATE TABLE vessel.position_2024_q2 PARTITION OF vessel.position FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');
CREATE TABLE vessel.position_2024_q3 PARTITION OF vessel.position FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');
CREATE TABLE vessel.position_2024_q4 PARTITION OF vessel.position FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');
CREATE TABLE vessel.position_2025_q1 PARTITION OF vessel.position FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE vessel.position_2025_q2 PARTITION OF vessel.position FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
CREATE TABLE vessel.position_2025_q3 PARTITION OF vessel.position FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
CREATE TABLE vessel.position_2025_q4 PARTITION OF vessel.position FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');
CREATE TABLE vessel.position_2026_q1 PARTITION OF vessel.position FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE vessel.position_overflow PARTITION OF vessel.position DEFAULT;

CREATE INDEX idx_vpos_vessel_ts ON vessel.position (vessel_id, position_ts DESC);
CREATE INDEX idx_vpos_geom   ON vessel.position USING GIST (geom);

CREATE MATERIALIZED VIEW vessel.latest_position AS
SELECT DISTINCT ON (vessel_id)
    vessel_id, mmsi, latitude, longitude, geom,
    speed_kn, course_deg, heading_deg, nav_status,
    draught_m, destination, eta, position_ts, source_id
FROM vessel.position
ORDER BY vessel_id, position_ts DESC;

CREATE UNIQUE INDEX ON vessel.latest_position (vessel_id);
CREATE INDEX ON vessel.latest_position USING GIST (geom);

-- Current-state wide view — column aliases match vessels.js VESSELS property names
-- so the API layer can serve this view directly without field remapping.
-- Attribute keys align with attribute_definitions.json "key" values.
-- Source: vessel.master_value (gold layer) — only explicitly approved master values appear here.
CREATE MATERIALIZED VIEW vessel.v_current AS
SELECT
    e.vessel_id,
    e.imo_number,
    -- Identity (vessels.js fields: nm, imo, mmsi, cs, fn, fl, flag, ty, st, up)
    MAX(CASE WHEN ad.attr_key = 'vessel_name'        THEN mv.value_text    END) AS nm,
    MAX(CASE WHEN ad.attr_key = 'imo_number'         THEN mv.value_text    END) AS imo,
    MAX(CASE WHEN ad.attr_key = 'mmsi_number'        THEN mv.value_text    END) AS mmsi,
    MAX(CASE WHEN ad.attr_key = 'call_sign'          THEN mv.value_text    END) AS cs,
    MAX(CASE WHEN ad.attr_key = 'flag_name'          THEN mv.value_text    END) AS fn,
    MAX(CASE WHEN ad.attr_key = 'flag_code'          THEN mv.value_text    END) AS fl,
    MAX(CASE WHEN ad.attr_key = 'vessel_type'        THEN mv.value_text    END) AS ty,
    MAX(CASE WHEN ad.attr_key = 'vessel_status'      THEN mv.value_text    END) AS st,
    MAX(CASE WHEN ad.attr_key = 'last_updated'       THEN mv.value_text    END) AS up,
    -- Dimensions (vessels.js: loa, lbp, beam, depth, maxDraft, sumDraft)
    MAX(CASE WHEN ad.attr_key = 'length_overall'     THEN mv.value_numeric END) AS loa_m,
    MAX(CASE WHEN ad.attr_key = 'length_bp'          THEN mv.value_numeric END) AS lbp_m,
    MAX(CASE WHEN ad.attr_key = 'beam'               THEN mv.value_numeric END) AS beam_m,
    MAX(CASE WHEN ad.attr_key = 'depth_moulded'      THEN mv.value_numeric END) AS depth_m,
    MAX(CASE WHEN ad.attr_key = 'max_draft'          THEN mv.value_numeric END) AS max_draft_m,
    MAX(CASE WHEN ad.attr_key = 'summer_draft'       THEN mv.value_numeric END) AS summer_draft_m,
    -- Tonnage (vessels.js: dwt, gt, nt — stored as formatted strings; raw numerics below)
    MAX(CASE WHEN ad.attr_key = 'deadweight'         THEN mv.value_numeric END) AS dwt_mt,
    MAX(CASE WHEN ad.attr_key = 'gross_tonnage'      THEN mv.value_numeric END) AS gt,
    MAX(CASE WHEN ad.attr_key = 'net_tonnage'        THEN mv.value_numeric END) AS nt,
    -- Construction (vessels.js: yr, yard, hn, builtYard)
    MAX(CASE WHEN ad.attr_key = 'year_built'         THEN mv.value_numeric END) AS yr,
    MAX(CASE WHEN ad.attr_key = 'shipyard'           THEN mv.value_text    END) AS yard,
    MAX(CASE WHEN ad.attr_key = 'hull_number'        THEN mv.value_text    END) AS hn,
    MAX(CASE WHEN ad.attr_key = 'build_country_code' THEN mv.value_text    END) AS built_yard_cc,
    -- Machinery (vessels.js: eng, mcr, spd, fuel, prp)
    MAX(CASE WHEN ad.attr_key = 'main_engine'        THEN mv.value_text    END) AS eng,
    MAX(CASE WHEN ad.attr_key = 'mcr_kw'             THEN mv.value_numeric END) AS mcr_kw,
    MAX(CASE WHEN ad.attr_key = 'service_speed'      THEN mv.value_numeric END) AS spd_kn,
    MAX(CASE WHEN ad.attr_key = 'fuel_type'          THEN mv.value_text    END) AS fuel,
    MAX(CASE WHEN ad.attr_key = 'propulsion_type'    THEN mv.value_text    END) AS prp,
    -- Classification (vessels.js: cls, clsNot, ice, dp)
    MAX(CASE WHEN ad.attr_key = 'class_society'      THEN mv.value_text    END) AS cls,
    MAX(CASE WHEN ad.attr_key = 'class_notation'     THEN mv.value_text    END) AS cls_not,
    MAX(CASE WHEN ad.attr_key = 'ice_class'          THEN mv.value_text    END) AS ice,
    MAX(CASE WHEN ad.attr_key = 'dp_class'           THEN mv.value_text    END) AS dp,
    -- Ownership (vessels.js: ow, bo, op, mg, pi)
    MAX(CASE WHEN ad.attr_key = 'registered_owner'   THEN mv.value_text    END) AS ow,
    MAX(CASE WHEN ad.attr_key = 'beneficial_owner'   THEN mv.value_text    END) AS bo,
    MAX(CASE WHEN ad.attr_key = 'commercial_operator'THEN mv.value_text    END) AS op,
    MAX(CASE WHEN ad.attr_key = 'technical_manager'  THEN mv.value_text    END) AS mg,
    MAX(CASE WHEN ad.attr_key = 'pi_club'            THEN mv.value_text    END) AS pi,
    -- Safety & Green Tech (vessels.js: scrubberFitted, igs, cow, bowDisch, sternDisch, heli, bwmp, ffCap)
    MAX(CASE WHEN ad.attr_key = 'scrubber_type'      THEN mv.value_text    END) AS scrubber_fitted,
    MAX(CASE WHEN ad.attr_key = 'igs_fitted'         THEN mv.value_boolean END) AS igs,
    MAX(CASE WHEN ad.attr_key = 'crude_oil_washing'  THEN mv.value_boolean END) AS cow,
    MAX(CASE WHEN ad.attr_key = 'bow_discharge'      THEN mv.value_boolean END) AS bow_disch,
    MAX(CASE WHEN ad.attr_key = 'stern_discharge'    THEN mv.value_boolean END) AS stern_disch,
    MAX(CASE WHEN ad.attr_key = 'helideck'           THEN mv.value_boolean END) AS heli,
    MAX(CASE WHEN ad.attr_key = 'bwmp_fitted'        THEN mv.value_boolean END) AS bwmp,
    MAX(CASE WHEN ad.attr_key = 'firefighting_cap'   THEN mv.value_boolean END) AS ff_cap,
    -- Cargo (vessels.js: teu, teu_r, ceu, pax, holds, hatches, lanm)
    MAX(CASE WHEN ad.attr_key = 'teu_nominal'        THEN mv.value_numeric END) AS teu,
    MAX(CASE WHEN ad.attr_key = 'teu_reefer'         THEN mv.value_numeric END) AS teu_r,
    MAX(CASE WHEN ad.attr_key = 'car_units'          THEN mv.value_numeric END) AS ceu,
    MAX(CASE WHEN ad.attr_key = 'passengers'         THEN mv.value_numeric END) AS pax,
    MAX(CASE WHEN ad.attr_key = 'cargo_holds'        THEN mv.value_numeric END) AS holds,
    MAX(CASE WHEN ad.attr_key = 'cargo_hatches'      THEN mv.value_numeric END) AS hatches,
    MAX(CASE WHEN ad.attr_key = 'lane_metres'        THEN mv.value_numeric END) AS lanm,
    -- Current position (vessels.js: lat, lon, sog, cog)
    lp.latitude                                                                  AS lat,
    lp.longitude                                                                 AS lon,
    lp.speed_kn                                                                  AS sog,
    lp.course_deg                                                                AS cog,
    lp.nav_status,
    lp.destination,
    lp.eta,
    lp.position_ts  AS last_position_ts
FROM vessel.entity e
LEFT JOIN vessel.master_value mv
    ON  mv.vessel_id      = e.vessel_id
    AND mv.valid_to       IS NULL
    AND mv.sys_to         IS NULL
    AND mv.workflow_state = 'APPROVED'
LEFT JOIN registry.attribute_def ad ON ad.attr_id = mv.attr_id
LEFT JOIN vessel.latest_position  lp ON lp.vessel_id = e.vessel_id
GROUP BY e.vessel_id, e.imo_number,
         lp.latitude, lp.longitude, lp.speed_kn, lp.course_deg,
         lp.nav_status, lp.destination, lp.eta, lp.position_ts;

CREATE UNIQUE INDEX ON vessel.v_current (vessel_id);
CREATE INDEX ON vessel.v_current (ty);
CREATE INDEX ON vessel.v_current (fn);
CREATE INDEX ON vessel.v_current (st);
CREATE INDEX ON vessel.v_current (dwt_mt);
CREATE INDEX ON vessel.v_current (cls);
CREATE INDEX ON vessel.v_current (ow);


-- =============================================================================
-- ENTITY SCHEMA: port
-- Mirrors: src/data/json/ports_detail.json + src/data/ports.js
-- v_current column names align with port object properties in ports_detail.json
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS port;

CREATE TABLE port.entity (
    unlocode        VARCHAR(5)      PRIMARY KEY,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    first_seen_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    first_source_id SMALLINT        REFERENCES registry.source_def (source_id)
);

CREATE TABLE port.attr_value (
    av_id           BIGSERIAL       NOT NULL,
    unlocode        VARCHAR(5)      NOT NULL REFERENCES port.entity (unlocode),
    attr_id         INTEGER         NOT NULL REFERENCES registry.attribute_def (attr_id),
    value_text      TEXT,
    value_numeric   NUMERIC(20,6),
    value_boolean   BOOLEAN,
    value_date      DATE,
    value_json      JSONB,
    source_id       SMALLINT        NOT NULL REFERENCES registry.source_def (source_id),
    source_ref      TEXT,
    confidence      NUMERIC(4,3)    NOT NULL DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
    valid_from      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    valid_to        TIMESTAMPTZ,
    sys_from        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    sys_to          TIMESTAMPTZ,
    workflow_state  VARCHAR(20)     NOT NULL DEFAULT 'APPROVED'
                    CHECK (workflow_state IN ('PENDING','APPROVED','REJECTED','SUPERSEDED')),
    draft_id        BIGINT          REFERENCES workflow.edit_draft (draft_id),
    run_id          BIGINT          REFERENCES ingest.feed_run (run_id),
    qc_flags        TEXT[],
    qc_passed       BOOLEAN         NOT NULL DEFAULT TRUE,
    PRIMARY KEY (av_id)
) PARTITION BY RANGE (sys_from);

CREATE TABLE port.attr_value_2024 PARTITION OF port.attr_value FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE port.attr_value_2025 PARTITION OF port.attr_value FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE port.attr_value_2026 PARTITION OF port.attr_value FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE port.attr_value_overflow PARTITION OF port.attr_value DEFAULT;

CREATE INDEX idx_pav_unlocode_attr ON port.attr_value (unlocode, attr_id);
CREATE INDEX idx_pav_current ON port.attr_value (unlocode, attr_id, confidence DESC)
    WHERE valid_to IS NULL AND sys_to IS NULL AND workflow_state = 'APPROVED';

CREATE RULE port_av_no_update AS ON UPDATE TO port.attr_value DO INSTEAD NOTHING;
CREATE RULE port_av_no_delete AS ON DELETE TO port.attr_value DO INSTEAD NOTHING;

-- Gold layer — explicitly approved master record for port attributes.
CREATE TABLE port.master_value (
    mv_id           BIGSERIAL       NOT NULL,
    unlocode        VARCHAR(5)      NOT NULL REFERENCES port.entity (unlocode),
    attr_id         INTEGER         NOT NULL REFERENCES registry.attribute_def (attr_id),
    value_text      TEXT,
    value_numeric   NUMERIC(20,6),
    value_boolean   BOOLEAN,
    value_date      DATE,
    value_json      JSONB,
    entry_type      VARCHAR(20)     NOT NULL
                    CHECK (entry_type IN ('VENDOR_PROMOTED','MANUAL_ENTRY','BACKDATED','CONFLICT_RESOLVED')),
    source_av_id    BIGINT,
    source_id       SMALLINT        REFERENCES registry.source_def (source_id),
    pr_id           BIGINT          REFERENCES workflow.promotion_request (pr_id),
    draft_id        BIGINT          REFERENCES workflow.edit_draft (draft_id),
    entered_by      INTEGER,
    approved_by     INTEGER,
    valid_from      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    valid_to        TIMESTAMPTZ,
    sys_from        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    sys_to          TIMESTAMPTZ,
    workflow_state  VARCHAR(20)     NOT NULL DEFAULT 'APPROVED'
                    CHECK (workflow_state IN ('APPROVED','SUPERSEDED','REJECTED')),
    PRIMARY KEY (mv_id)
) PARTITION BY RANGE (sys_from);

CREATE TABLE port.master_value_2024 PARTITION OF port.master_value FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE port.master_value_2025 PARTITION OF port.master_value FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE port.master_value_2026 PARTITION OF port.master_value FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE port.master_value_overflow PARTITION OF port.master_value DEFAULT;

CREATE INDEX idx_pmv_unlocode_attr ON port.master_value (unlocode, attr_id);
CREATE INDEX idx_pmv_current       ON port.master_value (unlocode, attr_id)
    WHERE valid_to IS NULL AND sys_to IS NULL AND workflow_state = 'APPROVED';

-- Port geometry — NOT EAV
CREATE TABLE port.location (
    unlocode        VARCHAR(5)      PRIMARY KEY REFERENCES port.entity (unlocode),
    geom            GEOMETRY(Point, 4326)  NOT NULL,
    latitude        NUMERIC(9,6)    GENERATED ALWAYS AS (ST_Y(geom)) STORED,
    longitude       NUMERIC(9,6)    GENERATED ALWAYS AS (ST_X(geom)) STORED,
    country_code    CHAR(2),
    timezone        VARCHAR(60),
    utc_offset      SMALLINT,
    coastline       TEXT,
    source_id       SMALLINT        REFERENCES registry.source_def (source_id),
    valid_from      DATE            NOT NULL DEFAULT CURRENT_DATE,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_port_location_geom ON port.location USING GIST (geom);

-- Bronze layer
CREATE TABLE port.raw_ingest (
    raw_id          BIGSERIAL       NOT NULL,
    feed_id         INTEGER         NOT NULL REFERENCES ingest.feed_config (feed_id),
    run_id          BIGINT          NOT NULL REFERENCES ingest.feed_run (run_id),
    unlocode        VARCHAR(5),
    received_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    raw_payload     JSONB           NOT NULL,
    parse_status    VARCHAR(20)     NOT NULL DEFAULT 'PENDING'
                    CHECK (parse_status IN ('PENDING','MAPPED','PARTIAL','REJECTED')),
    parse_errors    JSONB,
    PRIMARY KEY (raw_id, received_at)
) PARTITION BY RANGE (received_at);

CREATE TABLE port.raw_ingest_2024 PARTITION OF port.raw_ingest FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE port.raw_ingest_2025 PARTITION OF port.raw_ingest FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE port.raw_ingest_2026 PARTITION OF port.raw_ingest FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE port.raw_ingest_overflow PARTITION OF port.raw_ingest DEFAULT;

-- Current-state view — columns mirror ports_detail.json top-level and nested fields
-- Nested JSON objects (harbour, channel, berths, etc.) are flattened to named columns
-- with the same dot-path naming as ports.js accessor functions (po-* attribute IDs)
-- Source: port.master_value (gold layer) — only explicitly approved master values appear here.
CREATE MATERIALIZED VIEW port.v_current AS
SELECT
    e.unlocode,
    -- Identity (ports_detail.json: name, fullName, country, region, type, mou, status)
    MAX(CASE WHEN ad.attr_key = 'port_name'          THEN mv.value_text    END) AS name,
    MAX(CASE WHEN ad.attr_key = 'port_full_name'     THEN mv.value_text    END) AS full_name,
    MAX(CASE WHEN ad.attr_key = 'country'            THEN mv.value_text    END) AS country,
    MAX(CASE WHEN ad.attr_key = 'region'             THEN mv.value_text    END) AS region,
    MAX(CASE WHEN ad.attr_key = 'port_type'          THEN mv.value_text    END) AS type,
    MAX(CASE WHEN ad.attr_key = 'port_status'        THEN mv.value_text    END) AS status,
    MAX(CASE WHEN ad.attr_key = 'psc_mou'            THEN mv.value_text    END) AS mou,
    MAX(CASE WHEN ad.attr_key = 'wpi_number'         THEN mv.value_text    END) AS wpi,
    MAX(CASE WHEN ad.attr_key = 'port_authority'     THEN mv.value_text    END) AS authority,
    MAX(CASE WHEN ad.attr_key = 'year_established'   THEN mv.value_numeric END) AS established,
    MAX(CASE WHEN ad.attr_key = 'eca_zone'           THEN mv.value_boolean END) AS eca_zone,
    MAX(CASE WHEN ad.attr_key = 'seca_zone'          THEN mv.value_boolean END) AS seca_zone,
    -- Channel limits (ports_detail.json: channel.maxDraft, maxLoa, maxBeam, nightEntry)
    MAX(CASE WHEN ad.attr_key = 'ch_max_draft'       THEN mv.value_numeric END) AS ch_max_draft_m,
    MAX(CASE WHEN ad.attr_key = 'ch_max_loa'         THEN mv.value_numeric END) AS ch_max_loa_m,
    MAX(CASE WHEN ad.attr_key = 'ch_max_beam'        THEN mv.value_numeric END) AS ch_max_beam_m,
    MAX(CASE WHEN ad.attr_key = 'ch_max_dwt'         THEN mv.value_text    END) AS ch_max_dwt,
    MAX(CASE WHEN ad.attr_key = 'ch_max_air_draft'   THEN mv.value_numeric END) AS ch_max_air_draft_m,
    MAX(CASE WHEN ad.attr_key = 'night_entry'        THEN mv.value_boolean END) AS night_entry,
    -- Berths (ports_detail.json: berths.count, maxLoa, maxDraft)
    MAX(CASE WHEN ad.attr_key = 'berth_count'        THEN mv.value_numeric END) AS berth_count,
    MAX(CASE WHEN ad.attr_key = 'berth_max_loa'      THEN mv.value_numeric END) AS berth_max_loa_m,
    MAX(CASE WHEN ad.attr_key = 'berth_max_draft'    THEN mv.value_numeric END) AS berth_max_draft_m,
    -- Services (ports_detail.json: services.*)
    MAX(CASE WHEN ad.attr_key = 'pilotage'           THEN mv.value_boolean END) AS pilotage,
    MAX(CASE WHEN ad.attr_key = 'pilotage_compulsory'THEN mv.value_boolean END) AS pilotage_compulsory,
    MAX(CASE WHEN ad.attr_key = 'towage'             THEN mv.value_boolean END) AS towage,
    MAX(CASE WHEN ad.attr_key = 'tug_count'          THEN mv.value_numeric END) AS tugs,
    MAX(CASE WHEN ad.attr_key = 'freshwater'         THEN mv.value_boolean END) AS freshwater,
    MAX(CASE WHEN ad.attr_key = 'drydock'            THEN mv.value_boolean END) AS drydock,
    MAX(CASE WHEN ad.attr_key = 'drydock_count'      THEN mv.value_numeric END) AS drydock_count,
    MAX(CASE WHEN ad.attr_key = 'vts_available'      THEN mv.value_boolean END) AS vts,
    -- Bunkering (ports_detail.json: bunker.*)
    MAX(CASE WHEN ad.attr_key = 'bunker_available'   THEN mv.value_boolean END) AS bunker_available,
    MAX(CASE WHEN ad.attr_key = 'bunker_hfo'         THEN mv.value_boolean END) AS bunker_hfo,
    MAX(CASE WHEN ad.attr_key = 'bunker_vlsfo'       THEN mv.value_boolean END) AS bunker_vlsfo,
    MAX(CASE WHEN ad.attr_key = 'bunker_mgo'         THEN mv.value_boolean END) AS bunker_mgo,
    MAX(CASE WHEN ad.attr_key = 'bunker_lng'         THEN mv.value_boolean END) AS bunker_lng,
    MAX(CASE WHEN ad.attr_key = 'bunker_methanol'    THEN mv.value_boolean END) AS bunker_methanol,
    -- Traffic & Congestion (ports_detail.json: traffic.*, congestion.*)
    MAX(CASE WHEN ad.attr_key = 'annual_calls'       THEN mv.value_numeric END) AS annual_calls,
    MAX(CASE WHEN ad.attr_key = 'annual_cargo_mt'    THEN mv.value_text    END) AS annual_cargo,
    MAX(CASE WHEN ad.attr_key = 'annual_teu'         THEN mv.value_text    END) AS teu,
    MAX(CASE WHEN ad.attr_key = 'world_rank'         THEN mv.value_numeric END) AS world_rank,
    MAX(CASE WHEN ad.attr_key = 'avg_waiting_hrs'    THEN mv.value_numeric END) AS avg_waiting_hrs,
    MAX(CASE WHEN ad.attr_key = 'avg_turnaround_hrs' THEN mv.value_numeric END) AS avg_turnaround_hrs,
    MAX(CASE WHEN ad.attr_key = 'congestion_risk'    THEN mv.value_text    END) AS congestion_risk,
    -- PSC (ports_detail.json: psc.*)
    MAX(CASE WHEN ad.attr_key = 'psc_total_insp'     THEN mv.value_numeric END) AS psc_total_insp,
    MAX(CASE WHEN ad.attr_key = 'psc_detentions'     THEN mv.value_numeric END) AS psc_detentions,
    MAX(CASE WHEN ad.attr_key = 'psc_det_rate'       THEN mv.value_numeric END) AS psc_det_rate_pct,
    MAX(CASE WHEN ad.attr_key = 'psc_avg_def'        THEN mv.value_numeric END) AS psc_avg_def,
    -- Location
    pl.latitude,
    pl.longitude,
    pl.geom,
    pl.timezone,
    pl.utc_offset,
    pl.coastline
FROM port.entity e
LEFT JOIN port.master_value mv
    ON  mv.unlocode       = e.unlocode
    AND mv.valid_to       IS NULL
    AND mv.sys_to         IS NULL
    AND mv.workflow_state = 'APPROVED'
LEFT JOIN registry.attribute_def ad ON ad.attr_id = mv.attr_id
LEFT JOIN port.location          pl ON pl.unlocode = e.unlocode
GROUP BY e.unlocode,
         pl.latitude, pl.longitude, pl.geom, pl.timezone, pl.utc_offset, pl.coastline;

CREATE UNIQUE INDEX ON port.v_current (unlocode);
CREATE INDEX ON port.v_current (country);
CREATE INDEX ON port.v_current (mou);
CREATE INDEX ON port.v_current (type);
CREATE INDEX ON port.v_current USING GIST (geom);


-- =============================================================================
-- ENTITY SCHEMA: company
-- Mirrors: src/data/json/companies_detail.json + src/data/companies.js
-- v_current columns match companies_detail.json top-level and nested field names
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS company;

CREATE TABLE company.entity (
    company_id      VARCHAR(20)     PRIMARY KEY,
    id_type         VARCHAR(10)     NOT NULL DEFAULT 'INTERNAL'
                    CHECK (id_type IN ('LRNO','LEI','DUNS','INTERNAL')),
    lrno            VARCHAR(10)     UNIQUE,
    lei             CHAR(20)        UNIQUE,
    duns            VARCHAR(9)      UNIQUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    first_seen_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    first_source_id SMALLINT        REFERENCES registry.source_def (source_id)
);

CREATE INDEX idx_company_lrno ON company.entity (lrno) WHERE lrno IS NOT NULL;
CREATE INDEX idx_company_lei  ON company.entity (lei)  WHERE lei  IS NOT NULL;

CREATE TABLE company.attr_value (
    av_id           BIGSERIAL       NOT NULL,
    company_id      VARCHAR(20)     NOT NULL REFERENCES company.entity (company_id),
    attr_id         INTEGER         NOT NULL REFERENCES registry.attribute_def (attr_id),
    value_text      TEXT,
    value_numeric   NUMERIC(20,6),
    value_boolean   BOOLEAN,
    value_date      DATE,
    value_json      JSONB,
    source_id       SMALLINT        NOT NULL REFERENCES registry.source_def (source_id),
    source_ref      TEXT,
    confidence      NUMERIC(4,3)    NOT NULL DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
    valid_from      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    valid_to        TIMESTAMPTZ,
    sys_from        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    sys_to          TIMESTAMPTZ,
    workflow_state  VARCHAR(20)     NOT NULL DEFAULT 'APPROVED'
                    CHECK (workflow_state IN ('PENDING','APPROVED','REJECTED','SUPERSEDED')),
    draft_id        BIGINT          REFERENCES workflow.edit_draft (draft_id),
    run_id          BIGINT          REFERENCES ingest.feed_run (run_id),
    qc_flags        TEXT[],
    qc_passed       BOOLEAN         NOT NULL DEFAULT TRUE,
    PRIMARY KEY (av_id)
) PARTITION BY RANGE (sys_from);

CREATE TABLE company.attr_value_2024 PARTITION OF company.attr_value FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE company.attr_value_2025 PARTITION OF company.attr_value FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE company.attr_value_2026 PARTITION OF company.attr_value FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE company.attr_value_overflow PARTITION OF company.attr_value DEFAULT;

CREATE INDEX idx_cav_company_attr ON company.attr_value (company_id, attr_id);
CREATE INDEX idx_cav_current ON company.attr_value (company_id, attr_id, confidence DESC)
    WHERE valid_to IS NULL AND sys_to IS NULL AND workflow_state = 'APPROVED';

CREATE RULE company_av_no_update AS ON UPDATE TO company.attr_value DO INSTEAD NOTHING;
CREATE RULE company_av_no_delete AS ON DELETE TO company.attr_value DO INSTEAD NOTHING;

-- Gold layer — explicitly approved master record for company attributes.
CREATE TABLE company.master_value (
    mv_id           BIGSERIAL       NOT NULL,
    company_id      VARCHAR(20)     NOT NULL REFERENCES company.entity (company_id),
    attr_id         INTEGER         NOT NULL REFERENCES registry.attribute_def (attr_id),
    value_text      TEXT,
    value_numeric   NUMERIC(20,6),
    value_boolean   BOOLEAN,
    value_date      DATE,
    value_json      JSONB,
    entry_type      VARCHAR(20)     NOT NULL
                    CHECK (entry_type IN ('VENDOR_PROMOTED','MANUAL_ENTRY','BACKDATED','CONFLICT_RESOLVED')),
    source_av_id    BIGINT,
    source_id       SMALLINT        REFERENCES registry.source_def (source_id),
    pr_id           BIGINT          REFERENCES workflow.promotion_request (pr_id),
    draft_id        BIGINT          REFERENCES workflow.edit_draft (draft_id),
    entered_by      INTEGER,
    approved_by     INTEGER,
    valid_from      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    valid_to        TIMESTAMPTZ,
    sys_from        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    sys_to          TIMESTAMPTZ,
    workflow_state  VARCHAR(20)     NOT NULL DEFAULT 'APPROVED'
                    CHECK (workflow_state IN ('APPROVED','SUPERSEDED','REJECTED')),
    PRIMARY KEY (mv_id)
) PARTITION BY RANGE (sys_from);

CREATE TABLE company.master_value_2024 PARTITION OF company.master_value FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE company.master_value_2025 PARTITION OF company.master_value FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE company.master_value_2026 PARTITION OF company.master_value FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE company.master_value_overflow PARTITION OF company.master_value DEFAULT;

CREATE INDEX idx_cmv_company_attr ON company.master_value (company_id, attr_id);
CREATE INDEX idx_cmv_current      ON company.master_value (company_id, attr_id)
    WHERE valid_to IS NULL AND sys_to IS NULL AND workflow_state = 'APPROVED';

-- Bronze layer
CREATE TABLE company.raw_ingest (
    raw_id          BIGSERIAL       NOT NULL,
    feed_id         INTEGER         NOT NULL REFERENCES ingest.feed_config (feed_id),
    run_id          BIGINT          NOT NULL REFERENCES ingest.feed_run (run_id),
    company_id      VARCHAR(20),
    received_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    raw_payload     JSONB           NOT NULL,
    parse_status    VARCHAR(20)     NOT NULL DEFAULT 'PENDING'
                    CHECK (parse_status IN ('PENDING','MAPPED','PARTIAL','REJECTED')),
    parse_errors    JSONB,
    PRIMARY KEY (raw_id, received_at)
) PARTITION BY RANGE (received_at);

CREATE TABLE company.raw_ingest_2024 PARTITION OF company.raw_ingest FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE company.raw_ingest_2025 PARTITION OF company.raw_ingest FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE company.raw_ingest_2026 PARTITION OF company.raw_ingest FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE company.raw_ingest_overflow PARTITION OF company.raw_ingest DEFAULT;

-- Current-state view — columns mirror companies_detail.json field names
-- Nested objects (fleet, doc, ism, psc, financial, credit, sanctions, kyc, esg) flattened
-- Source: company.master_value (gold layer) — only explicitly approved master values appear here.
CREATE MATERIALIZED VIEW company.v_current AS
SELECT
    e.company_id,
    e.id_type,
    e.lrno,
    e.lei,
    e.duns,
    -- Core identity (companies_detail.json: name, fullName, country, city, type, status)
    MAX(CASE WHEN ad.attr_key = 'company_name'        THEN mv.value_text    END) AS name,
    MAX(CASE WHEN ad.attr_key = 'company_full_name'   THEN mv.value_text    END) AS full_name,
    MAX(CASE WHEN ad.attr_key = 'company_type'        THEN mv.value_text    END) AS type,
    MAX(CASE WHEN ad.attr_key = 'company_status'      THEN mv.value_text    END) AS status,
    MAX(CASE WHEN ad.attr_key = 'country_of_control'  THEN mv.value_text    END) AS country,
    MAX(CASE WHEN ad.attr_key = 'city'                THEN mv.value_text    END) AS city,
    MAX(CASE WHEN ad.attr_key = 'company_roles'       THEN mv.value_text    END) AS roles,
    MAX(CASE WHEN ad.attr_key = 'established_year'    THEN mv.value_numeric END) AS established,
    -- Fleet (companies_detail.json: fleet.owned, fleet.managed, fleet.totalDwt)
    MAX(CASE WHEN ad.attr_key = 'fleet_owned'         THEN mv.value_numeric END) AS vessels_owned,
    MAX(CASE WHEN ad.attr_key = 'fleet_managed'       THEN mv.value_numeric END) AS vessels_managed,
    MAX(CASE WHEN ad.attr_key = 'fleet_total_dwt'     THEN mv.value_numeric END) AS total_dwt_mt,
    MAX(CASE WHEN ad.attr_key = 'fleet_avg_age'       THEN mv.value_numeric END) AS avg_fleet_age,
    -- DOC & ISM (companies_detail.json: doc.*, ism.*)
    MAX(CASE WHEN ad.attr_key = 'doc_issued'          THEN mv.value_text    END) AS doc_issued,
    MAX(CASE WHEN ad.attr_key = 'doc_expiry'          THEN mv.value_text    END) AS doc_expiry,
    MAX(CASE WHEN ad.attr_key = 'ism_audit_date'      THEN mv.value_text    END) AS ism_audit_date,
    MAX(CASE WHEN ad.attr_key = 'ism_status'          THEN mv.value_text    END) AS ism_status,
    -- PSC record (companies_detail.json: psc.*)
    MAX(CASE WHEN ad.attr_key = 'psc_inspections'     THEN mv.value_numeric END) AS psc_total_insp,
    MAX(CASE WHEN ad.attr_key = 'psc_detentions'      THEN mv.value_numeric END) AS psc_detentions,
    MAX(CASE WHEN ad.attr_key = 'psc_det_rate'        THEN mv.value_numeric END) AS psc_det_rate_pct,
    -- Financial (companies_detail.json: financial.*)
    MAX(CASE WHEN ad.attr_key = 'revenue_usd'         THEN mv.value_numeric END) AS revenue_usd_m,
    MAX(CASE WHEN ad.attr_key = 'ebitda_usd'          THEN mv.value_numeric END) AS ebitda_usd_m,
    MAX(CASE WHEN ad.attr_key = 'net_profit_usd'      THEN mv.value_numeric END) AS net_profit_usd_m,
    -- Credit (companies_detail.json: credit.*)
    MAX(CASE WHEN ad.attr_key = 'credit_rating'       THEN mv.value_text    END) AS credit_rating,
    MAX(CASE WHEN ad.attr_key = 'credit_agency'       THEN mv.value_text    END) AS credit_agency,
    MAX(CASE WHEN ad.attr_key = 'credit_outlook'      THEN mv.value_text    END) AS credit_outlook,
    -- Sanctions (companies_detail.json: sanctions.*)
    MAX(CASE WHEN ad.attr_key = 'sanctions_clear'     THEN mv.value_boolean END) AS sanctions_clear,
    MAX(CASE WHEN ad.attr_key = 'sanctions_screened'  THEN mv.value_text    END) AS sanctions_screened_at,
    -- KYC (companies_detail.json: kyc.*)
    MAX(CASE WHEN ad.attr_key = 'kyc_status'          THEN mv.value_text    END) AS kyc_status,
    MAX(CASE WHEN ad.attr_key = 'kyc_reviewed'        THEN mv.value_text    END) AS kyc_reviewed_at,
    MAX(CASE WHEN ad.attr_key = 'kyc_risk_level'      THEN mv.value_text    END) AS kyc_risk_level,
    -- ESG (companies_detail.json: esg.*)
    MAX(CASE WHEN ad.attr_key = 'esg_score'           THEN mv.value_numeric END) AS esg_score,
    MAX(CASE WHEN ad.attr_key = 'esg_env_score'       THEN mv.value_numeric END) AS esg_env_score,
    MAX(CASE WHEN ad.attr_key = 'esg_rating'          THEN mv.value_text    END) AS esg_rating
FROM company.entity e
LEFT JOIN company.master_value mv
    ON  mv.company_id     = e.company_id
    AND mv.valid_to       IS NULL
    AND mv.sys_to         IS NULL
    AND mv.workflow_state = 'APPROVED'
LEFT JOIN registry.attribute_def ad ON ad.attr_id = mv.attr_id
GROUP BY e.company_id, e.id_type, e.lrno, e.lei, e.duns;

CREATE UNIQUE INDEX ON company.v_current (company_id);
CREATE INDEX ON company.v_current (name);
CREATE INDEX ON company.v_current (country);
CREATE INDEX ON company.v_current (type);
CREATE INDEX ON company.v_current (status);
CREATE INDEX ON company.v_current (kyc_risk_level);
CREATE INDEX ON company.v_current (sanctions_clear);


-- =============================================================================
-- SPECIALIZED RELATIONAL SCHEMAS (non-EAV domain data)
-- =============================================================================

-- ─── voyage — port calls & sea passages ──────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS voyage;

CREATE TABLE voyage.voyage (
    voyage_id       BIGSERIAL       PRIMARY KEY,
    vessel_id       BIGINT          NOT NULL REFERENCES vessel.entity (vessel_id),
    voyage_number   VARCHAR(30),
    departure_port  VARCHAR(5)      REFERENCES port.entity (unlocode),
    arrival_port    VARCHAR(5)      REFERENCES port.entity (unlocode),
    departure_at    TIMESTAMPTZ,
    arrival_at      TIMESTAMPTZ,
    voyage_status   VARCHAR(20)     NOT NULL DEFAULT 'PLANNED'
                    CHECK (voyage_status IN ('PLANNED','UNDERWAY','COMPLETED','CANCELLED')),
    cargo_type      VARCHAR(60),
    cargo_qty_mt    NUMERIC(12,3),
    charterer       VARCHAR(120),
    source_id       SMALLINT        REFERENCES registry.source_def (source_id),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_voyage_vessel ON voyage.voyage (vessel_id, departure_at DESC);
CREATE INDEX idx_voyage_ports ON voyage.voyage (departure_port, arrival_port);

CREATE TABLE voyage.port_call (
    call_id         BIGSERIAL       PRIMARY KEY,
    voyage_id       BIGINT          REFERENCES voyage.voyage (voyage_id),
    vessel_id       BIGINT          NOT NULL REFERENCES vessel.entity (vessel_id),
    unlocode        VARCHAR(5)      NOT NULL REFERENCES port.entity (unlocode),
    port_name       VARCHAR(120),                         -- denormalised; matches port_calls.json "port"
    ata             TIMESTAMPTZ,                          -- actual time of arrival  (port_calls.json "ata")
    atd             TIMESTAMPTZ,                          -- actual/estimated time of departure (port_calls.json "atd")
    berth_name      VARCHAR(60),                          -- port_calls.json "berth"
    call_type       VARCHAR(20)
                    CHECK (call_type IN ('CARGO','BUNKER','REPAIR','CREW_CHANGE','ANCHOR','TRANSIT')),
    purpose         TEXT,                                 -- port_calls.json "purpose" free-text (e.g. 'Transit / Suez')
    cargo_volume    TEXT,                                 -- port_calls.json "volume" (e.g. '800 MT IFO380')
    source_id       SMALLINT        REFERENCES registry.source_def (source_id),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pcall_vessel   ON voyage.port_call (vessel_id, ata DESC);
CREATE INDEX idx_pcall_unlocode ON voyage.port_call (unlocode,   ata DESC);

-- Voyage route waypoints — normalised from movements.json nested "route" array.
-- Each row is one scheduled or completed waypoint on an active voyage.
CREATE TABLE voyage.route_waypoint (
    waypoint_id     BIGSERIAL       PRIMARY KEY,
    voyage_id       BIGINT          REFERENCES voyage.voyage (voyage_id),
    vessel_id       BIGINT          NOT NULL REFERENCES vessel.entity (vessel_id),
    seq_no          SMALLINT        NOT NULL DEFAULT 0,   -- waypoint order along the route
    port_name       VARCHAR(120)    NOT NULL,
    unlocode        VARCHAR(10),                          -- movements.json "locode" (space-separated: 'SG SIN')
    latitude        NUMERIC(9,6),
    longitude       NUMERIC(9,6),
    geom            GEOMETRY(Point, 4326),
    ata             TIMESTAMPTZ,                          -- actual arrival (NULL if not yet reached)
    atd             TIMESTAMPTZ,                          -- actual departure (NULL if current/future)
    eta             TIMESTAMPTZ,                          -- estimated arrival for future waypoints
    waypoint_type   VARCHAR(10)     NOT NULL DEFAULT 'future'
                    CHECK (waypoint_type IN ('done','current','future')),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rwp_voyage   ON voyage.route_waypoint (voyage_id, seq_no);
CREATE INDEX idx_rwp_vessel   ON voyage.route_waypoint (vessel_id);
CREATE INDEX idx_rwp_geom     ON voyage.route_waypoint USING GIST (geom) WHERE geom IS NOT NULL;


-- ─── compliance — PSC inspections, certificates, sanctions ───────────────────

CREATE SCHEMA IF NOT EXISTS compliance;

CREATE TABLE compliance.psc_inspection (
    inspection_id       BIGSERIAL       PRIMARY KEY,
    external_id         VARCHAR(40)     UNIQUE,               -- psc_inspections.json "id" (e.g. 'PSC-2024-0130-001')
    vessel_id           BIGINT          NOT NULL REFERENCES vessel.entity (vessel_id),
    vessel_name         VARCHAR(120),                         -- denormalised for PSC reporting
    inspection_date     DATE            NOT NULL,
    inspection_type     VARCHAR(20)
                        CHECK (inspection_type IN ('Initial','Expanded')),
    port_unlocode       VARCHAR(5)      REFERENCES port.entity (unlocode),
    port_name           VARCHAR(120),                         -- denormalised; matches psc_inspections.json "port_name"
    authority           VARCHAR(60),
    mou_region          VARCHAR(30),                          -- 'Paris','Tokyo','USCG','Indian Ocean','Mediterranean','Riyadh'
    deficiency_count    SMALLINT        NOT NULL DEFAULT 0,
    detained            BOOLEAN         NOT NULL DEFAULT FALSE,
    detention_start     DATE,                                 -- psc_inspections.json "detention_start"
    detention_end       DATE,                                 -- psc_inspections.json "detention_end" (NULL = still detained)
    inspection_status   VARCHAR(30),                          -- 'Detained' | 'No detention' (display string)
    result_code         VARCHAR(20),                          -- PSC authority result code
    source_id           SMALLINT        REFERENCES registry.source_def (source_id),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_psc_vessel ON compliance.psc_inspection (vessel_id, inspection_date DESC);
CREATE INDEX idx_psc_port ON compliance.psc_inspection (port_unlocode, inspection_date DESC);
CREATE INDEX idx_psc_mou  ON compliance.psc_inspection (mou_region, inspection_date DESC);

CREATE TABLE compliance.psc_deficiency (
    deficiency_id   BIGSERIAL       PRIMARY KEY,
    inspection_id   BIGINT          NOT NULL REFERENCES compliance.psc_inspection (inspection_id),
    deficiency_code VARCHAR(10),                          -- psc_inspections.json "code" (e.g. '07106')
    category        VARCHAR(60),                          -- 'Fire safety','ISM','MARPOL','Life-saving appliances', etc.
    description     TEXT,
    severity        VARCHAR(10)
                    CHECK (severity IN ('high','medium','low')),
    action_taken    TEXT,                                 -- 'Detain' | 'Rectify before departure' | 'Rectify at next port'
    action_code     VARCHAR(10),                          -- PSC authority action code (legacy / authority-specific)
    rectified       BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_pscdef_inspection ON compliance.psc_deficiency (inspection_id);
CREATE INDEX idx_pscdef_category   ON compliance.psc_deficiency (category);

CREATE TABLE compliance.certificate (
    cert_id         BIGSERIAL       PRIMARY KEY,
    vessel_id       BIGINT          NOT NULL REFERENCES vessel.entity (vessel_id),
    cert_type       VARCHAR(60)     NOT NULL,             -- 'SMC','DOC','ISSC','MLC','IOPP', etc.
    issuing_authority VARCHAR(120),
    issue_date      DATE,
    expiry_date     DATE,
    is_valid        BOOLEAN         NOT NULL DEFAULT TRUE,
    survey_date     DATE,
    source_id       SMALLINT        REFERENCES registry.source_def (source_id),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cert_vessel ON compliance.certificate (vessel_id, cert_type);
CREATE INDEX idx_cert_expiry ON compliance.certificate (expiry_date) WHERE is_valid;

CREATE TABLE compliance.sanction (
    sanction_id     BIGSERIAL       PRIMARY KEY,
    entity_type     VARCHAR(20)     NOT NULL
                    CHECK (entity_type IN ('vessel','company','person')),
    entity_id       TEXT            NOT NULL,
    sanction_list   VARCHAR(60)     NOT NULL,             -- 'OFAC_SDN','EU_CONS','UN_SC', etc.
    sanction_type   VARCHAR(30),
    listed_at       DATE,
    delisted_at     DATE,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    description     TEXT,
    source_id       SMALLINT        REFERENCES registry.source_def (source_id),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sanction_entity ON compliance.sanction (entity_type, entity_id) WHERE is_active;
CREATE INDEX idx_sanction_list   ON compliance.sanction (sanction_list)           WHERE is_active;


-- ─── market — freight indices, rates, valuations ─────────────────────────────

CREATE SCHEMA IF NOT EXISTS market;

CREATE TABLE market.index_definition (
    index_id        SERIAL          PRIMARY KEY,
    index_code      VARCHAR(20)     NOT NULL UNIQUE,      -- market_indices.json "code": 'BDI','BDTI','BCTI','BCI','BLNG', etc.
    index_name      VARCHAR(120)    NOT NULL,             -- market_indices.json "name"
    index_type      VARCHAR(30)
                    CHECK (index_type IN ('DRY','TANKER','LNG','LPG','CONTAINER','COMPOSITE')),
    provider        VARCHAR(60),
    unit            VARCHAR(20),
    color           VARCHAR(40),                          -- market_indices.json "color" (CSS var or hex, e.g. 'var(--blue)')
    description     TEXT,                                 -- market_indices.json "description"
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE
);

CREATE TABLE market.index_value (
    value_id        BIGSERIAL       PRIMARY KEY,
    index_id        INTEGER         NOT NULL REFERENCES market.index_definition (index_id),
    value_date      DATE            NOT NULL,
    value           NUMERIC(12,4)   NOT NULL,             -- market_indices.json "value"
    prev_value      NUMERIC(12,4),                        -- market_indices.json "prev" (previous day)
    daily_change    NUMERIC(10,4),
    pct_change      NUMERIC(8,4),
    direction       VARCHAR(4)      CHECK (direction IN ('up','down','flat')),
    w52_low         NUMERIC(12,4),                        -- market_indices.json "w52_low"
    w52_high        NUMERIC(12,4),                        -- market_indices.json "w52_high"
    sparkline       NUMERIC(8,2)[],                       -- market_indices.json "sparkline" (15-value array)
    source_id       SMALLINT        REFERENCES registry.source_def (source_id),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (index_id, value_date)
);

CREATE INDEX idx_miv_index_date ON market.index_value (index_id, value_date DESC);

CREATE TABLE market.freight_rate (
    rate_id         BIGSERIAL       PRIMARY KEY,
    vessel_type     VARCHAR(60)     NOT NULL,
    route_code      VARCHAR(30),
    load_port       VARCHAR(5)      REFERENCES port.entity (unlocode),
    discharge_port  VARCHAR(5)      REFERENCES port.entity (unlocode),
    rate_date       DATE            NOT NULL,
    rate_type       VARCHAR(20)
                    CHECK (rate_type IN ('SPOT','TC_6M','TC_1Y','TC_3Y','VOYAGE')),
    rate_value      NUMERIC(14,4)   NOT NULL,
    rate_unit       VARCHAR(20),
    source_id       SMALLINT        REFERENCES registry.source_def (source_id),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_freight_type_date ON market.freight_rate (vessel_type, rate_date DESC);

CREATE TABLE market.valuation (
    val_id          BIGSERIAL       PRIMARY KEY,
    vessel_id       BIGINT          NOT NULL REFERENCES vessel.entity (vessel_id),
    val_date        DATE            NOT NULL,
    val_type        VARCHAR(20)
                    CHECK (val_type IN ('MARKET','SCRAP','INSURANCE','BOOK')),
    value_usd       NUMERIC(16,2)   NOT NULL,
    currency        CHAR(3)         NOT NULL DEFAULT 'USD',
    methodology     VARCHAR(60),
    source_id       SMALLINT        REFERENCES registry.source_def (source_id),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (vessel_id, val_date, val_type, source_id)
);

CREATE INDEX idx_val_vessel_date ON market.valuation (vessel_id, val_date DESC);

-- Fixture reports — mirrors src/data/json/fixtures.json
-- One row per chartering fixture (voyage charter, spot fixture, etc.)
CREATE TABLE market.fixture (
    fixture_id      BIGSERIAL       PRIMARY KEY,
    external_id     VARCHAR(10)     UNIQUE,               -- fixtures.json "id" (e.g. 'F001')
    vessel_id       BIGINT          REFERENCES vessel.entity (vessel_id),
    vessel_name     VARCHAR(120)    NOT NULL,
    vessel_type     VARCHAR(60),                          -- 'VLCC','Suezmax','Capesize','LNG', etc.
    dwt             INTEGER,
    charterer       VARCHAR(120),
    owner           VARCHAR(120),
    cargo           VARCHAR(120),
    cargo_qty       VARCHAR(60),                          -- display string: '2,000,000 BBL' or '175,000 MT'
    load_port       VARCHAR(120),                         -- free text from fixture report (not always a LOCODE)
    discharge_port  VARCHAR(120),
    laycan          VARCHAR(40),                          -- e.g. '05-08 May 2025'
    rate_text       VARCHAR(60),                          -- fixtures.json "rate": 'WS 82' | '$14.50/MT' | '$85,000/day TC'
    tce_usd         INTEGER,                              -- TCE $/day
    fixture_status  VARCHAR(20)     NOT NULL DEFAULT 'Fixed'
                    CHECK (fixture_status IN ('Fixed','On Subjects','Rumoured','Failed','Withdrawn')),
    broker          VARCHAR(120),
    fixture_date    DATE,
    source_id       SMALLINT        REFERENCES registry.source_def (source_id),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fixture_vessel ON market.fixture (vessel_id)                    WHERE vessel_id IS NOT NULL;
CREATE INDEX idx_fixture_status ON market.fixture (fixture_status, fixture_date DESC);
CREATE INDEX idx_fixture_date   ON market.fixture (fixture_date DESC);

-- Time charter and bareboat contracts — mirrors src/data/json/tc_contracts.json
CREATE TABLE market.tc_contract (
    contract_id     BIGSERIAL       PRIMARY KEY,
    vessel_id       BIGINT          REFERENCES vessel.entity (vessel_id),
    vessel_name     VARCHAR(120)    NOT NULL,
    charter_type    VARCHAR(30)     NOT NULL
                    CHECK (charter_type IN ('Time Charter','Bareboat Charter','Demise Charter')),
    term_text       VARCHAR(30),                          -- tc_contracts.json "term": '12 months', '15 years'
    start_date      DATE,
    end_date        DATE,
    daily_rate_usd  INTEGER,                              -- tc_contracts.json "rate" ($/day)
    charterer       VARCHAR(120),
    redelivery_zone VARCHAR(120),                         -- e.g. 'Worldwide', 'Pacific', 'DWWD'
    options_text    TEXT,                                 -- e.g. '2×6M at $23,000/day' | 'Purchase option at $45M'
    source_id       SMALLINT        REFERENCES registry.source_def (source_id),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tc_vessel ON market.tc_contract (vessel_id) WHERE vessel_id IS NOT NULL;
CREATE INDEX idx_tc_dates ON market.tc_contract (start_date, end_date);

-- Baltic route benchmark definitions — mirrors src/data/json/freight_routes.json route codes
-- (TD3C, 5TC, TC2, etc. — published benchmarks, not individual voyage fixtures)
CREATE TABLE market.route_benchmark (
    benchmark_id    SERIAL          PRIMARY KEY,
    route_code      VARCHAR(30)     NOT NULL UNIQUE,      -- freight_routes.json "route" short code (e.g. 'TD3C')
    route_label     VARCHAR(120)    NOT NULL,             -- full description: 'TD3C — AG/China (VLCC)'
    segment         VARCHAR(20)     NOT NULL
                    CHECK (segment IN ('VLCC','Suezmax','Aframax','Product','Capesize','Panamax','Supramax','LNG','LPG')),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE
);

-- Daily values for each benchmark — each row is one day's observation
CREATE TABLE market.route_benchmark_value (
    value_id        BIGSERIAL       PRIMARY KEY,
    benchmark_id    INTEGER         NOT NULL REFERENCES market.route_benchmark (benchmark_id),
    value_date      DATE            NOT NULL,
    ws              NUMERIC(8,2),                         -- Worldscale points (NULL for dry bulk TC routes)
    tce_usd         INTEGER         NOT NULL,             -- freight_routes.json "tce" ($/day)
    prev_tce_usd    INTEGER,                              -- freight_routes.json "prev_tce"
    lo_52w          INTEGER,                              -- freight_routes.json "lo"
    hi_52w          INTEGER,                              -- freight_routes.json "hi"
    source_id       SMALLINT        REFERENCES registry.source_def (source_id),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (benchmark_id, value_date)
);

CREATE INDEX idx_rbv_benchmark_date ON market.route_benchmark_value (benchmark_id, value_date DESC);


-- =============================================================================
-- SCHEMA: geo — GIS display layer (choke points, MOU patrol zones)
-- Not EAV — these are quasi-static reference geometries used by the map layer.
-- Mirrors: src/data/json/choke_points.json, src/data/json/mou_zones.json
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS geo;

-- Maritime chokepoints — Suez, Hormuz, Malacca, Bab-el-Mandeb, Panama, etc.
-- Mirrors choke_points.json fields: name, latitude, longitude, volume_label, risk_level
CREATE TABLE geo.choke_point (
    choke_id        SERIAL          PRIMARY KEY,
    name            VARCHAR(120)    NOT NULL UNIQUE,
    geom            GEOMETRY(Point, 4326)  NOT NULL,
    latitude        NUMERIC(9,6)    GENERATED ALWAYS AS (ST_Y(geom)) STORED,
    longitude       NUMERIC(9,6)    GENERATED ALWAYS AS (ST_X(geom)) STORED,
    volume_label    VARCHAR(40),                          -- choke_points.json "volume_label" (e.g. '~18.5M bbl/day')
    risk_level      VARCHAR(10)
                    CHECK (risk_level IN ('High','Medium','Low')),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_choke_geom ON geo.choke_point USING GIST (geom);

-- PSC MOU patrol zone polygons — mirrors mou_zones.json fields: name, color, bounds
-- bounds is stored as a polygon geometry; the "bounds" array in JSON is [[lat,lon],...] ring
CREATE TABLE geo.mou_zone (
    zone_id         SERIAL          PRIMARY KEY,
    name            VARCHAR(120)    NOT NULL UNIQUE,      -- e.g. 'Paris MOU', 'Tokyo MOU'
    color           VARCHAR(7)      NOT NULL,             -- hex color for map overlay
    geom            GEOMETRY(Polygon, 4326),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mou_zone_geom ON geo.mou_zone USING GIST (geom);


-- =============================================================================
-- GENERIC POINT-IN-TIME FUNCTION
-- Works for any entity following the standardized schema template
-- =============================================================================

CREATE OR REPLACE FUNCTION registry.attr_at(
    p_entity_schema TEXT,
    p_entity_id     TEXT,
    p_attr_key      TEXT,
    p_valid_at      TIMESTAMPTZ DEFAULT NOW(),
    p_sys_at        TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    value_text      TEXT,
    value_numeric   NUMERIC,
    value_boolean   BOOLEAN,
    value_date      DATE,
    value_json      JSONB,
    confidence      NUMERIC,
    source_code     TEXT,
    valid_from      TIMESTAMPTZ,
    sys_from        TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_sql    TEXT;
    v_pk_col TEXT;
BEGIN
    v_pk_col := CASE p_entity_schema
        WHEN 'vessel'  THEN 'imo_number'
        WHEN 'port'    THEN 'unlocode'
        WHEN 'company' THEN 'company_id'
        ELSE p_entity_schema || '_id'
    END;

    v_sql := format($sql$
        SELECT
            av.value_text,
            av.value_numeric,
            av.value_boolean,
            av.value_date,
            av.value_json,
            av.confidence,
            sd.source_code::TEXT,
            av.valid_from,
            av.sys_from
        FROM %I.attr_value av
        JOIN registry.attribute_def ad
            ON ad.attr_id = av.attr_id AND ad.attr_key = $2 AND ad.entity_type = $5
        JOIN registry.source_def sd
            ON sd.source_id = av.source_id
        WHERE av.%I = $1
          AND av.valid_from <= $3 AND (av.valid_to IS NULL OR av.valid_to > $3)
          AND av.sys_from   <= $4 AND (av.sys_to   IS NULL OR av.sys_to   > $4)
          AND av.workflow_state = 'APPROVED'
        ORDER BY av.confidence DESC NULLS LAST, av.sys_from DESC
        LIMIT 1
    $sql$, p_entity_schema, v_pk_col);

    RETURN QUERY EXECUTE v_sql
        USING p_entity_id, p_attr_key, p_valid_at, p_sys_at, p_entity_schema;
END;
$$;

COMMENT ON FUNCTION registry.attr_at IS
    'Point-in-time attribute lookup for any entity following the standardized schema template.
     Example: SELECT * FROM registry.attr_at(''vessel'', ''9234567'', ''deadweight'', ''2024-06-01'', NOW())';


-- =============================================================================
-- MATERIALIZED VIEW REFRESH HELPER
-- =============================================================================

CREATE OR REPLACE FUNCTION registry.refresh_all_current_views()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY vessel.latest_position;
    REFRESH MATERIALIZED VIEW CONCURRENTLY vessel.v_current;
    REFRESH MATERIALIZED VIEW CONCURRENTLY port.v_current;
    REFRESH MATERIALIZED VIEW CONCURRENTLY company.v_current;
END;
$$;

COMMENT ON FUNCTION registry.refresh_all_current_views IS
    'Call after each ingest run. CONCURRENTLY = zero-downtime refresh.
     geo.choke_point and geo.mou_zone are base tables (not views) — updated directly by the ingest pipeline, no refresh needed.';


-- =============================================================================
-- SEED DATA — Source definitions
-- Mirrors: src/data/json/etl_feeds.json sourceCode / sourceName values
-- =============================================================================

INSERT INTO registry.source_def (source_code, source_name, source_type, default_weight) VALUES
('IHS_SEAWEB',       'IHS Markit Sea-web',               'COMMERCIAL_DATA',  0.95),
('EQUASIS',          'Equasis (EMSA)',                    'COMMERCIAL_DATA',  0.90),
('CLARKSONS',        'Clarksons Research Services',       'COMMERCIAL_DATA',  0.90),
('LRFAIRPLAY',       'Lloyd''s Register Fairplay',        'COMMERCIAL_DATA',  0.90),
('VESSELTRACKER',    'VesselTracker.com',                 'COMMERCIAL_DATA',  0.75),
('FLEETMON',         'FleetMon',                          'COMMERCIAL_DATA',  0.75),
('MARINETRAFFIC',    'MarineTraffic',                     'COMMERCIAL_DATA',  0.80),
('AIS_ORBCOMM',      'Orbcomm AIS Network',               'AIS',              0.85),
('AIS_EXACTEARTH',   'exactEarth Satellite AIS',          'AIS',              0.85),
('AIS_SPIRE',        'Spire Maritime AIS',                'AIS',              0.85),
('AIS_DATALASTIC',   'Datalastic AIS',                    'AIS',              0.80),
('FLAG_PANAMA',      'Panama Maritime Authority',          'FLAG_REGISTRY',    0.95),
('FLAG_BAHAMAS',     'Bahamas Maritime Authority',         'FLAG_REGISTRY',    0.95),
('FLAG_LIBERIA',     'Liberian Registry (LISCR)',          'FLAG_REGISTRY',    0.95),
('FLAG_MARSHALL_IS', 'Marshall Islands Registry',          'FLAG_REGISTRY',    0.95),
('CLASS_LR',         'Lloyd''s Register',                 'CLASS_SOCIETY',    0.95),
('CLASS_DNV',        'DNV',                               'CLASS_SOCIETY',    0.95),
('CLASS_BV',         'Bureau Veritas',                    'CLASS_SOCIETY',    0.95),
('CLASS_ABS',        'American Bureau of Shipping',       'CLASS_SOCIETY',    0.95),
('CLASS_NK',         'Nippon Kaiji Kyokai (ClassNK)',      'CLASS_SOCIETY',    0.95),
('PSC_PARIS_MOU',    'Paris MoU on Port State Control',      'PSC_MOU',          0.95),
('PSC_TOKYO_MOU',    'Tokyo MoU on Port State Control',      'PSC_MOU',          0.95),
('PSC_USCG',         'US Coast Guard (USCG)',                 'PSC_MOU',          0.95),
('PSC_INDIAN_OCEAN', 'Indian Ocean MOU on Port State Control','PSC_MOU',          0.95),
('PSC_MED_MOU',      'Mediterranean MOU on Port State Control','PSC_MOU',         0.95),
('PSC_RIYADH_MOU',   'Riyadh MOU on Port State Control',     'PSC_MOU',          0.95),
('OFAC',             'US Treasury OFAC SDN List',          'SANCTIONS',        1.00),
('EU_SANCTIONS',     'EU Consolidated Sanctions List',     'SANCTIONS',        1.00),
('INTERNAL',         'Manual Data Entry / Internal',       'INTERNAL',         0.60);


-- =============================================================================
-- SEED DATA — Filter group definitions
-- Mirrors: attribute_definitions.json "filter_groups" array
-- =============================================================================

INSERT INTO registry.filter_group_def (filter_group_id, entity_type, label, display_order) VALUES
('identity',   'vessel', 'Identity',                1),
('type',       'vessel', 'Vessel Type',             2),
('status',     'vessel', 'Status & Compliance',     3),
('tonnage',    'vessel', 'Tonnage & Size',          4),
('dimensions', 'vessel', 'Dimensions',              5),
('ownership',  'vessel', 'Ownership & Management',  6),
('class',      'vessel', 'Classification',          7),
('technical',  'vessel', 'Technical',               8),
('cargo',      'vessel', 'Cargo & Capacity',        9),
('safety',     'vessel', 'Safety & Green Tech',    10);


-- =============================================================================
-- SEED DATA — Column group definitions
-- Mirrors: attribute_definitions.json "column_groups" array
-- Also mirrors attributeRegistry.js COL_ID_MAP key groupings
-- =============================================================================

INSERT INTO registry.column_group_def (column_group_key, entity_type, label, display_order) VALUES
('identity',     'vessel', 'Identity & Status',    1),
('tonnage',      'vessel', 'Tonnage',              2),
('dimensions',   'vessel', 'Dimensions',           3),
('ownership',    'vessel', 'Ownership & Mgmt',     4),
('class',        'vessel', 'Classification',       5),
('machinery',    'vessel', 'Machinery',            6),
('cargo',        'vessel', 'Cargo Capacity',       7),
('construction', 'vessel', 'Construction',         8),
('safety',       'vessel', 'Safety & Green Tech',  9),
('operations',   'vessel', 'Operations',          10);


-- =============================================================================
-- SEED DATA — System personas
-- Mirrors: src/data/json/personas.json exactly
-- persona_key = JSON "id"; vessel_columns use COL_ID_MAP short IDs
-- =============================================================================

INSERT INTO ui.persona
    (persona_key, label, description, icon, color, attr_sections, vessel_columns, dashboard_cards, is_system)
VALUES
(
    'full-access',
    'Full Access',
    'Complete access to all maritime data and features',
    '🔐', '#1558d6',
    ARRAY['general','construction','machinery','ownership','classification','safety','cargo','compliance'],
    ARRAY['name','imo','flag','type','dwt','gt','built','loa','owner','manager','class','status'],
    '[{"card_id":"kpi-row","width":12},{"card_id":"live-map","width":8},{"card_id":"live-activity","width":4},{"card_id":"fleet-types","width":4},{"card_id":"flag-states","width":4},{"card_id":"certs-expiring","width":4},{"card_id":"psc-detentions","width":6},{"card_id":"market-snapshot","width":6}]'::JSONB,
    TRUE
),
(
    'vessel-analyst',
    'Vessel Analyst',
    'Vessel registry, technical data and certification analyst',
    '🚢', '#0094b3',
    ARRAY['general','construction','machinery','classification','safety','ownership','cargo','compliance'],
    ARRAY['name','imo','flag','type','dwt','gt','built','loa','beam','depth','class','class-notation','status'],
    '[{"card_id":"kpi-fleet","width":3},{"card_id":"kpi-active","width":3},{"card_id":"kpi-psc","width":3},{"card_id":"kpi-certs","width":3},{"card_id":"live-map","width":8},{"card_id":"live-activity","width":4},{"card_id":"fleet-types","width":6},{"card_id":"certs-expiring","width":6}]'::JSONB,
    TRUE
),
(
    'port-analyst',
    'Port Analyst',
    'Port operations and vessel arrival/departure analyst',
    '⚓', '#137333',
    ARRAY['general','cargo','construction','safety','machinery','classification','ownership','compliance'],
    ARRAY['name','imo','flag','type','dwt','loa','max-draft','sum-draft','status'],
    '[{"card_id":"kpi-fleet","width":4},{"card_id":"kpi-ports","width":4},{"card_id":"kpi-psc","width":4},{"card_id":"live-map","width":8},{"card_id":"live-activity","width":4},{"card_id":"psc-detentions","width":12}]'::JSONB,
    TRUE
),
(
    'companies-analyst',
    'Companies Analyst',
    'Company registry, ownership structures and corporate hierarchy',
    '🏢', '#ea580c',
    ARRAY['ownership','general','compliance','classification','safety','construction','machinery','cargo'],
    ARRAY['name','imo','flag','type','owner','beneficial-owner','operator','manager','pi','status'],
    '[{"card_id":"kpi-fleet","width":3},{"card_id":"kpi-companies","width":3},{"card_id":"kpi-sanctions","width":3},{"card_id":"kpi-active","width":3},{"card_id":"live-activity","width":4},{"card_id":"fleet-types","width":4},{"card_id":"flag-states","width":4},{"card_id":"market-snapshot","width":12}]'::JSONB,
    TRUE
),
(
    'registry-analyst',
    'Vessel Registry',
    'Vessel registration, flag state data and IMO identity',
    '📋', '#6200ea',
    ARRAY['general','classification','safety','ownership','construction','machinery','cargo','compliance'],
    ARRAY['name','imo','flag','type','built','loa','class','status'],
    '[{"card_id":"kpi-fleet","width":4},{"card_id":"kpi-active","width":4},{"card_id":"kpi-companies","width":4},{"card_id":"flag-states","width":6},{"card_id":"fleet-types","width":6},{"card_id":"live-map","width":12}]'::JSONB,
    TRUE
),
(
    'ownership-management',
    'Ownership Mgmt',
    'Beneficial ownership, management and P&I club tracking',
    '🤝', '#c8102e',
    ARRAY['ownership','compliance','general','classification','safety','construction','machinery','cargo'],
    ARRAY['name','imo','flag','owner','beneficial-owner','operator','manager','pi','type','dwt','status'],
    '[{"card_id":"kpi-fleet","width":3},{"card_id":"kpi-companies","width":3},{"card_id":"kpi-sanctions","width":3},{"card_id":"kpi-active","width":3},{"card_id":"live-activity","width":6},{"card_id":"flag-states","width":6},{"card_id":"market-snapshot","width":12}]'::JSONB,
    TRUE
),
(
    'dimensions-analyst',
    'Dimensions Analyst',
    'Physical dimensions, technical specifications and machinery',
    '📐', '#b45309',
    ARRAY['construction','machinery','general','classification','safety','ownership','cargo','compliance'],
    ARRAY['name','imo','type','dwt','gt','nt','loa','lbp','beam','depth','max-draft','sum-draft','built','class'],
    '[{"card_id":"kpi-fleet","width":4},{"card_id":"kpi-active","width":4},{"card_id":"kpi-certs","width":4},{"card_id":"fleet-types","width":6},{"card_id":"live-map","width":6},{"card_id":"certs-expiring","width":12}]'::JSONB,
    TRUE
),
(
    'compliance-officer',
    'Compliance Officer',
    'Sanctions screening, PSC compliance and risk monitoring',
    '🚨', '#c8102e',
    ARRAY['compliance','safety','classification','ownership','general','construction','machinery','cargo'],
    ARRAY['name','imo','flag','type','owner','manager','class','status'],
    '[{"card_id":"kpi-sanctions","width":3},{"card_id":"kpi-psc","width":3},{"card_id":"kpi-certs","width":3},{"card_id":"kpi-active","width":3},{"card_id":"psc-detentions","width":8},{"card_id":"live-activity","width":4},{"card_id":"certs-expiring","width":6},{"card_id":"live-map","width":6}]'::JSONB,
    TRUE
);


-- =============================================================================
-- SEED DATA — Default auth roles
-- =============================================================================

INSERT INTO auth.role (role_key, label, description) VALUES
('ADMIN',        'Administrator',  'Full access to all schemas and operations'),
('DATA_MANAGER', 'Data Manager',   'Can approve/reject workflow items and manage attribute definitions'),
('ANALYST',      'Analyst',        'Read access to all entity and market schemas'),
('VIEWER',       'Viewer',         'Read-only access to current-state views only');


-- =============================================================================
-- SEED DATA — Default permissions per role
-- =============================================================================

INSERT INTO auth.permission (role_id, resource, action)
SELECT r.role_id, res.resource, res.action
FROM auth.role r
CROSS JOIN (VALUES
    ('vessel.v_current',           'READ'),
    ('port.v_current',             'READ'),
    ('company.v_current',          'READ'),
    ('compliance.psc_inspection',  'READ'),
    ('compliance.certificate',     'READ'),
    ('compliance.sanction',        'READ'),
    ('market.index_value',         'READ'),
    ('market.freight_rate',        'READ')
) AS res(resource, action)
WHERE r.role_key IN ('VIEWER','ANALYST','DATA_MANAGER','ADMIN')

UNION ALL

SELECT r.role_id, res.resource, res.action
FROM auth.role r
CROSS JOIN (VALUES
    ('vessel.attr_value',          'WRITE'),
    ('port.attr_value',            'WRITE'),
    ('company.attr_value',         'WRITE'),
    ('workflow.edit_draft',        'WRITE'),
    ('ingest.feed_config',         'READ')
) AS res(resource, action)
WHERE r.role_key IN ('DATA_MANAGER','ADMIN')

UNION ALL

SELECT r.role_id, res.resource, res.action
FROM auth.role r
CROSS JOIN (VALUES
    ('workflow.edit_draft',        'APPROVE'),
    ('registry.attribute_def',     'WRITE'),
    ('ingest.feed_config',         'WRITE'),
    ('auth.app_user',              'ADMIN')
) AS res(resource, action)
WHERE r.role_key = 'ADMIN';
