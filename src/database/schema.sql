-- Pin Button Layout Designer Database Schema
-- Based on data-model.md specifications

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE,
    is_temporary BOOLEAN NOT NULL DEFAULT false,
    page_width REAL NOT NULL DEFAULT 8.5,
    page_height REAL NOT NULL DEFAULT 11.0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Image assets table
CREATE TABLE IF NOT EXISTS image_assets (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    file_size INTEGER NOT NULL,
    data_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    uploaded_at TEXT NOT NULL,
    last_used_at TEXT NOT NULL
);

-- Button areas table
CREATE TABLE IF NOT EXISTS button_areas (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    x REAL NOT NULL,
    y REAL NOT NULL,
    diameter REAL NOT NULL DEFAULT 2.75,
    image_asset_id TEXT REFERENCES image_assets(id) ON DELETE SET NULL,
    crop_x REAL NOT NULL DEFAULT 0.5,
    crop_y REAL NOT NULL DEFAULT 0.5,
    zoom REAL NOT NULL DEFAULT 1.0,
    rotation REAL NOT NULL DEFAULT 0.0
);

-- Print configurations table
CREATE TABLE IF NOT EXISTS print_configurations (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    dpi INTEGER NOT NULL DEFAULT 300,
    paper_size TEXT NOT NULL DEFAULT 'letter',
    margins TEXT NOT NULL, -- JSON object
    include_bleed BOOLEAN NOT NULL DEFAULT false,
    bleed_size REAL NOT NULL DEFAULT 0.125,
    color_mode TEXT NOT NULL DEFAULT 'rgb',
    created_at TEXT NOT NULL
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_button_areas_session_id ON button_areas(session_id);
CREATE INDEX IF NOT EXISTS idx_button_areas_image_asset_id ON button_areas(image_asset_id);
CREATE INDEX IF NOT EXISTS idx_sessions_is_temporary ON sessions(is_temporary);
CREATE INDEX IF NOT EXISTS idx_image_assets_last_used_at ON image_assets(last_used_at);
CREATE INDEX IF NOT EXISTS idx_print_configurations_session_id ON print_configurations(session_id);