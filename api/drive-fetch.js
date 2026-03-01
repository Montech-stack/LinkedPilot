import pdfParsePkg from 'pdf-parse/lib/pdf-parse.js';
const pdfParse = pdfParsePkg.default || pdfParsePkg;

const ALLOWED_DRIVE_HOSTS = new Set([
    'drive.google.com',
    'docs.google.com',
]);

// Google Drive file IDs are base64url strings, 25-44 chars
const FILE_ID_RE = /^[A-Za-z0-9_-]{25,44}$/;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { driveLink, providerToken } = req.body;

    if (!driveLink || !providerToken) {
        return res.status(400).json({ error: 'Missing driveLink or providerToken in request.' });
    }

    // Validate driveLink is a string within safe length
    if (typeof driveLink !== 'string' || driveLink.length > 512) {
        return res.status(400).json({ error: 'Invalid drive link.' });
    }

    // Enforce allowlisted Google Drive hostnames (prevents SSRF)
    let parsedUrl;
    try {
        parsedUrl = new URL(driveLink);
    } catch {
        return res.status(400).json({ error: 'Invalid drive link URL.' });
    }

    if (!ALLOWED_DRIVE_HOSTS.has(parsedUrl.hostname)) {
        return res.status(400).json({ error: 'Only Google Drive and Docs links are supported.' });
    }

    // Validate providerToken is a non-empty string (basic sanity)
    if (typeof providerToken !== 'string' || providerToken.length < 10 || providerToken.length > 2048) {
        return res.status(400).json({ error: 'Invalid provider token.' });
    }

    try {
        // Extract the File ID from common Google Drive URL formats
        // e.g. https://docs.google.com/document/d/1XyZ_abc123/edit
        // e.g. https://drive.google.com/file/d/1XyZ_abc123/view
        const fileIdMatch = driveLink.match(/\/d\/([A-Za-z0-9_-]{25,44})/);

        if (!fileIdMatch || !fileIdMatch[1]) {
            return res.status(400).json({ error: 'Could not extract a valid Google Drive File ID from the provided link.' });
        }

        const fileId = fileIdMatch[1];

        // Double-check extracted file ID matches expected format
        if (!FILE_ID_RE.test(fileId)) {
            return res.status(400).json({ error: 'Could not extract a valid Google Drive File ID from the provided link.' });
        }

        // 1. Fetch file metadata to get the MIME type and name
        const metadataRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${providerToken}`
            }
        });

        if (!metadataRes.ok) {
            console.error('Drive API Metadata Error:', await metadataRes.text());
            return res.status(metadataRes.status).json({ error: 'Failed to fetch file metadata from Google Drive. Ensure you have access and the file is not trashed.' });
        }

        const metadata = await metadataRes.json();
        const { name, mimeType } = metadata;

        let exportMimeType = null;
        let isExport = false;

        // Determine how to fetch the file content based on its type
        if (mimeType === 'application/vnd.google-apps.document') {
            // Google Doc -> export as plain text
            exportMimeType = 'text/plain';
            isExport = true;
        } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
            // Google Sheet -> export as CSV
            exportMimeType = 'text/csv';
            isExport = true;
        } else if (mimeType === 'application/vnd.google-apps.presentation') {
            // Google Slides -> export as plain text (best effort)
            exportMimeType = 'text/plain';
            isExport = true;
        } else if (mimeType === 'application/pdf' || mimeType === 'text/plain' || mimeType === 'text/markdown' || mimeType === 'text/csv') {
            // Standard files -> download directly
            isExport = false;
        } else {
            return res.status(400).json({ error: `Unsupported Google Drive file type: ${mimeType}. Please link a Document, Spreadsheet, Presentation, PDF, or text file.` });
        }

        // 2. Fetch the actual content
        const fetchUrl = isExport
            ? `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${exportMimeType}`
            : `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

        const contentRes = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${providerToken}`
            }
        });

        if (!contentRes.ok) {
            console.error('Drive API Content Error:', await contentRes.text());
            return res.status(contentRes.status).json({ error: 'Failed to download file content from Google Drive.' });
        }

        let parsedText = '';

        if (mimeType === 'application/pdf') {
            // Parse PDF content
            const buffer = await contentRes.arrayBuffer();
            const pdfData = await pdfParse(Buffer.from(buffer));
            parsedText = pdfData.text;
        } else {
            // Direct text content (Docs, Sheets, plain text)
            parsedText = await contentRes.text();
        }

        // Clean up excessive whitespace
        parsedText = parsedText.replace(/\s+/g, ' ').trim();

        // Optional: truncate if way too huge to prevent breaking LLM context
        const MAX_CHARS = 100000;
        if (parsedText.length > MAX_CHARS) {
            parsedText = parsedText.substring(0, MAX_CHARS) + '\n...[Content Truncated]...';
        }

        return res.status(200).json({ success: true, text: parsedText, name: name });

    } catch (error) {
        console.error('Drive fetching error:', error);
        return res.status(500).json({
            error: 'An internal server error occurred while processing the Google Drive link.'
        });
    }
}
