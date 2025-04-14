// Simple HTTP server to test GitHub Pages version locally
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = 8080;
const PUBLIC_DIR = __dirname;

// Debug logging
console.log('Starting test server for GitHub Pages version...');
console.log(`Serving files from: ${PUBLIC_DIR}`);
console.log(`Open http://localhost:${PORT} in your browser`);

// MIME types for different file extensions
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json'
};

// Create HTTP server
const server = http.createServer((req, res) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    
    // Normalize the URL to prevent directory traversal attacks
    let url = req.url;
    
    // Remove query parameters
    url = url.split('?')[0];
    
    // Default to index.html if requesting the root
    if (url === '/') {
        url = '/index.html';
    }
    
    // Resolve file path
    const filePath = path.join(PUBLIC_DIR, url);
    
    // Check if file exists
    fs.stat(filePath, (err, stats) => {
        if (err) {
            // File not found
            console.error(`File not found: ${filePath}`);
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('404 Not Found');
            return;
        }
        
        if (stats.isDirectory()) {
            // If it's a directory, try to serve index.html
            const indexPath = path.join(filePath, 'index.html');
            fs.stat(indexPath, (err, indexStats) => {
                if (err) {
                    res.writeHead(404, {'Content-Type': 'text/plain'});
                    res.end('404 Directory Index Not Found');
                    return;
                }
                
                serveFile(indexPath, res);
            });
        } else {
            // It's a file, serve it
            serveFile(filePath, res);
        }
    });
});

// Helper function to serve a file
function serveFile(filePath, res) {
    // Determine content type based on file extension
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    // Read and serve file
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(`Error reading file: ${filePath}`, err);
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('500 Internal Server Error');
            return;
        }
        
        // Add CORS headers to allow loading from different origins
        res.writeHead(200, {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        
        res.end(data);
        console.log(`Served file: ${filePath} (${contentType})`);
    });
}

// Start the server
server.listen(PORT, () => {
    console.log(`Test server running at http://localhost:${PORT}/`);
    console.log('Press Ctrl+C to stop the server');
}); 