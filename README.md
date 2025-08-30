# Universal File Converter - Electron Desktop App

A privacy-first file conversion tool built with Electron, Next.js, and React. Convert files locally without uploading to any servers.

## Features

- **100% Local Processing**: All file conversions happen locally in your browser/app
- **Multiple Format Support**: 
  - Images: JPG, PNG, WebP, GIF, BMP, TIFF, SVG
  - Videos: MP4, AVI, MOV, MKV, WebM, FLV, WMV
  - Audio: MP3, WAV, AAC, OGG, FLAC, M4A
  - Documents: PDF, DOCX, TXT, CSV, XLSX, HTML
- **Batch Processing**: Convert multiple files at once
- **Advanced Settings**: Quality, dimensions, compression controls
- **Cross-Platform**: Available as desktop app for Linux, Windows, and macOS

## Development

### Prerequisites
- Node.js 18+ 
- Bun (recommended) or npm

### Setup
```bash
# Install dependencies
bun install

# Start development server (web version)
bun run dev

# Start Electron development mode
bun run electron-dev
```

### Building

#### Web Version
```bash
# Build for web deployment
bun run build
```

#### Desktop App
```bash
# Build Electron app (Linux AppImage)
bun run build-electron

# The built app will be in the dist/ directory
```

## Usage

### Web Version
1. Visit the deployed web app
2. Drag and drop files or click to select
3. Choose output formats for each file
4. Adjust settings if needed
5. Click "Convert All" to process files
6. Download converted files

### Desktop App
1. Launch the Universal File Converter app
2. Use File > Open Files or drag and drop
3. Select output formats and settings
4. Convert and save files locally

## Architecture

- **Frontend**: Next.js 15 with React 19
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS
- **File Processing**: 
  - FFmpeg WASM for video/audio conversion
  - Browser APIs for image processing
  - Specialized libraries for document conversion
- **Desktop**: Electron for cross-platform desktop app

## Privacy & Security

- All processing happens locally - no files are uploaded to servers
- No data collection or tracking
- Open source and transparent
- Works offline after initial load

## License

MIT License - see LICENSE file for details
