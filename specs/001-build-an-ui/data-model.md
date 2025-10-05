# Data Model: Pin Button Layout Designer

## Core Entities

### ButtonArea
Represents a circular button region on the canvas where users can place and configure images.

**Fields**:
- `id: string` - Unique identifier (UUID)
- `x: number` - X coordinate on canvas (inches)
- `y: number` - Y coordinate on canvas (inches)
- `diameter: number` - Button diameter (inches, default: 2.75)
- `imageAssetId: string | null` - Reference to associated image
- `cropX: number` - Image crop offset X (0-1 normalized)
- `cropY: number` - Image crop offset Y (0-1 normalized)
- `zoom: number` - Image zoom level (1.0 = original size)
- `rotation: number` - Image rotation in degrees (0-360)
- `sessionId: string` - Reference to parent session

**Validation Rules**:
- diameter: 0.5 <= diameter <= 4.0 inches
- x, y: must fit within Letter page bounds (8.5" x 11")
- cropX, cropY: 0.0 <= value <= 1.0
- zoom: 0.1 <= zoom <= 5.0
- rotation: 0 <= rotation < 360

**State Transitions**:
- Empty -> HasImage (when image dropped/uploaded)
- HasImage -> Configuring (when modal opened)
- Configuring -> HasImage (when modal saved)
- HasImage -> Empty (when image removed)

### ImageAsset
Represents an uploaded or imported image file with metadata for rendering and storage.

**Fields**:
- `id: string` - Unique identifier (UUID)
- `filename: string` - Original filename
- `mimeType: string` - Image MIME type (image/jpeg, image/png, etc.)
- `width: number` - Original image width in pixels
- `height: number` - Original image height in pixels
- `fileSize: number` - File size in bytes
- `dataUrl: string` - Base64 encoded image data for storage
- `thumbnailUrl: string` - Optimized thumbnail for UI display
- `uploadedAt: Date` - Timestamp of upload/import
- `lastUsedAt: Date` - Last time image was used in any session

**Validation Rules**:
- mimeType: must be supported format (image/jpeg, image/png, image/svg+xml)
- width, height: 1 <= dimension <= 8192 pixels
- fileSize: <= 50MB per image
- dataUrl: valid base64 image data

### Session
Represents a saved or temporary layout session containing multiple button areas and their configurations.

**Fields**:
- `id: string` - Unique identifier (UUID)
- `name: string | null` - User-assigned name (null for temporary sessions)
- `isTemporary: boolean` - True for unsaved working sessions
- `pageWidth: number` - Canvas width in inches (default: 8.5)
- `pageHeight: number` - Canvas height in inches (default: 11.0)
- `createdAt: Date` - Session creation timestamp
- `updatedAt: Date` - Last modification timestamp
- `buttonAreas: ButtonArea[]` - Associated button areas (1:N relationship)

**Validation Rules**:
- name: if not null, 1-100 characters, unique among non-temporary sessions
- pageWidth: 4.0 <= width <= 17.0 inches
- pageHeight: 6.0 <= height <= 22.0 inches
- buttonAreas: maximum 50 button areas per session

**State Transitions**:
- New -> Temporary (auto-created on app start)
- Temporary -> Named (when user saves with name)
- Named -> Named (subsequent saves update existing)
- Any -> Deleted (when user explicitly deletes)

### PrintConfiguration
Represents print settings and output parameters for generating physical layouts.

**Fields**:
- `sessionId: string` - Reference to session being printed
- `dpi: number` - Print resolution (dots per inch, default: 300)
- `paperSize: string` - Target paper size ('letter', 'a4', 'custom')
- `margins: object` - Print margins in inches {top, right, bottom, left}
- `includeBleed: boolean` - Add bleed area for professional printing
- `bleedSize: number` - Bleed area size in inches (default: 0.125)
- `colorMode: string` - Color output mode ('rgb', 'cmyk')
- `createdAt: Date` - Configuration timestamp

**Validation Rules**:
- dpi: 150 <= dpi <= 600
- margins: 0.0 <= margin <= 2.0 inches
- bleedSize: 0.0 <= bleed <= 0.25 inches

## Entity Relationships

### Session → ButtonArea (1:N)
- One session contains multiple button areas
- ButtonArea.sessionId references Session.id
- Cascade delete: removing session deletes all associated button areas

### ButtonArea → ImageAsset (N:1)
- Multiple button areas can reference the same image asset
- ButtonArea.imageAssetId references ImageAsset.id
- Null allowed: button areas can exist without images
- No cascade: deleting image asset sets references to null

### Session → PrintConfiguration (1:N)
- Sessions can have multiple print configurations (different settings)
- PrintConfiguration.sessionId references Session.id
- Cascade delete: removing session deletes associated print configs

## Database Schema

### SQL Tables
```sql
-- Sessions table
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE,
    is_temporary BOOLEAN NOT NULL DEFAULT false,
    page_width REAL NOT NULL DEFAULT 8.5,
    page_height REAL NOT NULL DEFAULT 11.0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Image assets table
CREATE TABLE image_assets (
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
CREATE TABLE button_areas (
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
CREATE TABLE print_configurations (
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
```

### Indexes for Performance
```sql
CREATE INDEX idx_button_areas_session_id ON button_areas(session_id);
CREATE INDEX idx_button_areas_image_asset_id ON button_areas(image_asset_id);
CREATE INDEX idx_sessions_is_temporary ON sessions(is_temporary);
CREATE INDEX idx_image_assets_last_used_at ON image_assets(last_used_at);
CREATE INDEX idx_print_configurations_session_id ON print_configurations(session_id);
```

## Data Flow Patterns

### Image Upload Flow
1. User selects/drags image file
2. Validate file type and size
3. Generate thumbnail and optimize for storage
4. Create ImageAsset record in database
5. Create or update ButtonArea with imageAssetId reference

### Session Auto-Save Flow
1. User modifies button area (move, zoom, crop)
2. Update ButtonArea record immediately
3. Update Session.updatedAt timestamp
4. Debounce rapid changes (500ms delay)

### Print Preparation Flow
1. User clicks print button
2. Create PrintConfiguration record
3. Generate high-resolution canvas for each button area
4. Apply circular masking and quality settings
5. Convert to print-optimized format
6. Trigger browser print dialog