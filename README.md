# Pin Button Layout Designer

A desktop application for creating printable pin button layouts with drag-and-drop functionality.

## Features

- Interactive canvas for button layout design
- Drag-and-drop image support
- Print-ready output
- Session management with localStorage persistence
- Auto-arrange and manual positioning
- Circular image masking for pin buttons

## Deployment

This application is automatically deployed to GitHub Pages on every push to the main branch.

**Live Application**: [View on GitHub Pages](https://your-username.github.io/pin-button-template-ui/)

### Automatic Deployment

The application deploys automatically via GitHub Actions when changes are pushed to the `main` branch. The workflow:

1. Builds the TypeScript/Vite application
2. Validates the build succeeds
3. Deploys to GitHub Pages
4. Makes the application publicly accessible

See [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) for workflow configuration.

### Session Persistence

User sessions are automatically persisted using browser localStorage:
- Sessions survive page refreshes
- No server-side storage required
- Storage capacity: ~10-20 sessions with images (~5-10MB total)

If storage quota is exceeded, users will see a friendly error message suggesting they delete old sessions.

### Deployment Setup

For detailed deployment setup instructions, see the [Quickstart Guide](specs/002-in-addition-already/quickstart.md).

Quick steps:
1. Enable GitHub Pages in repository Settings → Pages
2. Select "GitHub Actions" as the source
3. Push changes to main branch
4. Wait 2-3 minutes for deployment
5. Access your application at the GitHub Pages URL

### Manual Deployment

To deploy manually:
```bash
npm run build
# Upload dist/ contents to your hosting provider
```

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) to view the application.

### Build

```bash
npm run build
```

Build artifacts are output to `dist/` directory.

### Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration
```

## Tech Stack

- TypeScript 5.2+
- Vite 5.0 (build tool)
- Vanilla JavaScript/HTML/CSS
- localStorage (session persistence)
- Vitest (unit testing)
- Playwright (integration testing)

## Project Structure

```
├── src/
│   ├── components/     # UI components
│   ├── models/         # Data models
│   ├── services/       # Business logic services
│   └── utils/          # Utility functions
├── public/             # Static assets
├── tests/              # Unit and integration tests
└── dist/               # Build output (git-ignored)
```

## License

MIT
