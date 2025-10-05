# Quickstart: Pin Button Layout Designer

## Development Setup

### Prerequisites
- Node.js 18+ installed
- Modern web browser with file system access support
- Code editor with TypeScript support

### Initial Setup
```bash
# Clone and navigate to project
cd pin-button-template-ui

# Install minimal dependencies
npm install vite typescript @types/node better-sqlite3

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Project Structure Verification
Ensure the following structure exists:
```
src/
├── components/     # UI components
├── models/         # Data models
├── services/       # Business logic
└── utils/          # Utility functions

tests/
├── unit/          # Unit tests
└── integration/   # Integration tests
```

## User Acceptance Testing

### Test Scenario 1: Basic Application Launch
**Given** the application is properly set up
**When** user opens the browser to the application URL
**Then** they should see:
- Letter-sized page canvas (8.5" x 11")
- Default circular button areas (2.75" diameter)
- Clean, minimal interface
- Print button in accessible location

**Validation Steps:**
1. Open application in browser
2. Verify canvas shows page outline
3. Count default button areas (should be optimally arranged)
4. Confirm print button is visible and enabled

### Test Scenario 2: Image Drag and Drop
**Given** the application is loaded with default button areas
**When** user drags an image file from their file system onto a button area
**Then** the image should:
- Appear within the circular boundary
- Maintain aspect ratio with circular masking
- Be positioned for optimal cropping
- Show visual feedback during drag operation

**Validation Steps:**
1. Open file explorer alongside browser
2. Select a test image (JPEG/PNG, <10MB)
3. Drag image onto a circular button area
4. Verify image appears with circular mask
5. Confirm image quality is preserved

### Test Scenario 3: Configuration Modal
**Given** a button area contains an image
**When** user clicks on the button area
**Then** a configuration modal should open allowing:
- Button size adjustment (0.5" - 4.0")
- Image upload as alternative to drag-drop
- Image positioning (crop X/Y)
- Zoom level adjustment (0.1x - 5.0x)
- Image rotation (0° - 360°)

**Validation Steps:**
1. Click on a button area with an image
2. Verify modal opens with current settings
3. Test each adjustment control
4. Save changes and verify they persist
5. Cancel changes and verify no modifications

### Test Scenario 4: Image Manipulation
**Given** the configuration modal is open with an image loaded
**When** user adjusts crop, zoom, and rotation controls
**Then** the preview should update in real-time showing:
- Circular crop area positioning
- Zoom level changes
- Image rotation effects
- Maintained image quality

**Validation Steps:**
1. Open modal for button with image
2. Move crop position controls
3. Adjust zoom slider
4. Rotate image using rotation control
5. Verify all changes preview correctly
6. Save and confirm changes apply to canvas

### Test Scenario 5: Session Management
**Given** the user has configured multiple button areas
**When** they create a named session
**Then** the application should:
- Persist all button configurations
- Store image references and settings
- Allow loading the session later
- Maintain temporary session for unsaved work

**Validation Steps:**
1. Configure 3-4 button areas with different images
2. Save session with a descriptive name
3. Create a new temporary session
4. Load the previously saved session
5. Verify all configurations are restored correctly

### Test Scenario 6: Print Functionality
**Given** a completed layout with multiple configured buttons
**When** user clicks the print button
**Then** the system should:
- Generate print-optimized layout
- Respect print configuration settings
- Open browser print dialog
- Maintain 300 DPI quality for images

**Validation Steps:**
1. Complete a layout with 4+ button areas
2. Click print button
3. Verify print preview shows circular buttons
4. Check that images are high-quality in preview
5. Test with different paper size settings

## Performance Validation

### Load Time Testing
- Application should load within 3 seconds
- Initial canvas render within 1 second
- Image processing under 2 seconds per image

### Responsiveness Testing
- UI interactions should respond within 100ms
- Image drag-drop feedback immediate
- Modal open/close animations smooth (60fps)

### Memory Usage Testing
- Application baseline memory <50MB
- Each loaded image adds <10MB
- No memory leaks after extended use

## Browser Compatibility

### Supported Browsers
- Chrome 100+
- Firefox 100+
- Safari 15+
- Edge 100+

### Required Features
- File System Access API (or fallback)
- Canvas 2D rendering
- CSS Grid and Flexbox
- ES2020+ JavaScript features

## Error Handling Validation

### File Upload Errors
- Unsupported file types show clear error message
- Oversized files (>50MB) rejected with explanation
- Corrupted images handled gracefully

### Database Errors
- SQLite connection failures show user-friendly messages
- Data corruption recovery mechanisms
- Backup/restore functionality working

### Print Errors
- No printer available: clear messaging
- Printer communication failures: retry options
- Invalid print settings: validation warnings

## Quick Smoke Test Checklist

Run through this 5-minute validation after any changes:

- [ ] Application loads without console errors
- [ ] Can drag image onto button area
- [ ] Modal opens when clicking button area
- [ ] Image adjustments work in modal
- [ ] Can save session with custom name
- [ ] Print dialog opens when clicking print
- [ ] All UI elements respond to interaction
- [ ] No visual layout breaks at different zoom levels

## Development Commands

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Troubleshooting

### Common Issues
1. **Images not loading**: Check file permissions and supported formats
2. **Database errors**: Ensure SQLite dependencies installed correctly
3. **Print not working**: Verify browser print permissions
4. **Slow performance**: Check browser DevTools for memory leaks

### Debug Mode
Set `DEBUG=true` in environment to enable:
- Console logging for all operations
- Performance timing information
- Database query logging
- Component lifecycle tracking