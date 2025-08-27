# YouTube MP3 Downloader - Render Version

Optimized version for Render deployment with web interface.

## Features

- Web interface for easy URL input
- Enhanced headers to avoid bot detection
- Disabled update checks
- Optimized for server deployment

## Deployment

1. Connect your GitHub repo to Render
2. Select this directory
3. Render will auto-detect Node.js
4. Deploy with free plan

## Environment Variables

- `YTDL_NO_UPDATE=true` - Disables update checks
- `PORT` - Server port (auto-set by Render)

## Usage

1. Enter YouTube URL
2. Click Download
3. Wait for completion
4. File saved as `{VIDEO_ID}.mp3`
