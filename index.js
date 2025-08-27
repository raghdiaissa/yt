const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Disable update checks
process.env.YTDL_NO_UPDATE = 'true';

// Enhanced headers to avoid bot detection
const ENHANCED_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0'
};

function extractVideoId(url) {
    if (url.includes('youtu.be/')) {
        return url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/watch')) {
        const urlParams = new URL(url).searchParams;
        return urlParams.get('v');
    }
    return 'unknown_video';
}

function convertToFullUrl(url) {
    if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1].split('?')[0];
        return `https://www.youtube.com/watch?v=${videoId}`;
    }
    return url;
}

async function downloadMP3(url) {
    try {
        const videoId = extractVideoId(url);
        const fileName = `${videoId}.mp3`;
        
        console.log(`🚀 Starting download for: ${videoId}`);
        
        const audioStream = ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            requestOptions: {
                timeout: 10000,
                headers: ENHANCED_HEADERS
            }
        });

        const writeStream = fs.createWriteStream(fileName);
        audioStream.pipe(writeStream);

        let downloadedBytes = 0;

        audioStream.on('progress', (chunkLength, downloaded, total) => {
            downloadedBytes = downloaded;
            if (total > 0) {
                const percent = (downloaded / total * 100).toFixed(2);
                console.log(`Downloaded: ${percent}% (${(downloaded / 1024 / 1024).toFixed(2)} MB)`);
            }
        });

        return new Promise((resolve, reject) => {
            writeStream.on('finish', () => {
                const fileSize = (downloadedBytes / 1024 / 1024).toFixed(2);
                console.log(`✅ Download completed: ${fileName} (${fileSize} MB)`);
                resolve({ fileName, fileSize: fileSize + ' MB' });
            });

            audioStream.on('error', (err) => {
                console.error('❌ Download error:', err.message);
                reject(err);
            });

            writeStream.on('error', (err) => {
                console.error('❌ File write error:', err.message);
                reject(err);
            });
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

// Express routes
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>YouTube MP3 Downloader</title>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                input[type="text"] { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; }
                button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
                button:hover { background: #0056b3; }
                .result { margin-top: 20px; padding: 15px; border-radius: 4px; }
                .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
                .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
            </style>
        </head>
        <body>
            <h1>🎵 YouTube MP3 Downloader</h1>
            <p>Enter a YouTube URL to download as MP3:</p>
            <input type="text" id="url" placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/...">
            <button onclick="download()">Download MP3</button>
            <div id="result"></div>
            
            <script>
                async function download() {
                    const url = document.getElementById('url').value;
                    const resultDiv = document.getElementById('result');
                    
                    if (!url) {
                        resultDiv.innerHTML = '<div class="result error">Please enter a YouTube URL</div>';
                        return;
                    }
                    
                    resultDiv.innerHTML = '<div class="result">Downloading... Please wait...</div>';
                    
                    try {
                        const response = await fetch('/download', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: url })
                        });
                        
                        const data = await response.json();
                        
                        if (response.ok) {
                            resultDiv.innerHTML = '<div class="result success">✅ Download completed!<br>File: ' + data.fileName + '<br>Size: ' + data.fileSize + '</div>';
                        } else {
                            resultDiv.innerHTML = '<div class="result error">❌ Error: ' + data.error + '</div>';
                        }
                    } catch (error) {
                        resultDiv.innerHTML = '<div class="result error">❌ Network error: ' + error.message + '</div>';
                    }
                }
            </script>
        </body>
        </html>
    `);
});

app.post('/download', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        
        const result = await downloadMP3(url);
        res.json(result);
        
    } catch (error) {
        console.error('Download error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🎵 YouTube MP3 Downloader running on port ${PORT}`);
    console.log(`🌐 Open http://localhost:${PORT} in your browser`);
});
