import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Log startup info
console.log('🚀 Starting server...');
console.log('📁 Current directory:', __dirname);
console.log('📦 Dist directory:', join(__dirname, 'dist'));
console.log('📄 Dist exists:', existsSync(join(__dirname, 'dist')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Serve static files from the dist directory
app.use(express.static(join(__dirname, 'dist')));

// Handle client-side routing - serve index.html for all routes
app.get('*', (req, res) => {
    const indexPath = join(__dirname, 'dist', 'index.html');
    if (existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(500).send('Application not built correctly - index.html not found');
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
    console.log(`🏥 Health check available at http://0.0.0.0:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📛 SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('👋 Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('📛 SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('👋 Server closed');
        process.exit(0);
    });
});
