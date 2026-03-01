import multer from 'multer';
import pdfParsePkg from 'pdf-parse/lib/pdf-parse.js';
const pdfParse = pdfParsePkg.default || pdfParsePkg;

// Setup multer to store uploaded files in memory
const upload = multer({ storage: multer.memoryStorage() });

// Vercel requires disabling the default body parser for file uploads
export const config = {
    api: {
        bodyParser: false,
    },
};

// Helper function to wrap multer in a Promise
const runMiddleware = (req, res, fn) => {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) return reject(result);
            return resolve(result);
        });
    });
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Run multer to extract the file from the multipart boundary
        await runMiddleware(req, res, upload.single('file'));

        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const maxFileSize = 10 * 1024 * 1024; // 10MB limit for Vercel free tier and cost control
        if (file.size > maxFileSize) {
            return res.status(400).json({ error: 'File size exceeds 10MB limit' });
        }

        let parsedText = '';

        if (file.mimetype === 'application/pdf') {
            // Parse PDF
            const pdfData = await pdfParse(file.buffer);
            parsedText = pdfData.text;
        } else if (file.mimetype === 'text/plain' || file.mimetype === 'text/markdown' || file.mimetype === 'text/csv') {
            // Parse text
            parsedText = file.buffer.toString('utf-8');
        } else {
            return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF, TXT, MD, or CSV file.' });
        }

        // Clean up excessive whitespace
        parsedText = parsedText.replace(/\s+/g, ' ').trim();

        // Optional: truncate if way too huge to prevent breaking LLM context
        const MAX_CHARS = 100000;
        if (parsedText.length > MAX_CHARS) {
            parsedText = parsedText.substring(0, MAX_CHARS) + '\n...[Content Truncated]...';
        }

        return res.status(200).json({ success: true, text: parsedText, name: file.originalname });

    } catch (error) {
        console.error('File parsing error:', error);
        return res.status(500).json({
            error: 'Failed to parse the uploaded document.'
        });
    }
}
