import pdfParsePkg from 'pdf-parse/lib/pdf-parse.js';
const pdfParse = pdfParsePkg.default || pdfParsePkg;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { driveLink, providerToken } = req.body;

    if (!driveLink || !providerToken) {
        return res.status(400).json({ error: 'Missing driveLink or providerToken in request' });
    }

    try {
        // Extract the File ID from common Google Drive URL formats
        // e.g. https://docs.google.com/document/d/1XyZ_abc123/edit
        // e.g. https://drive.google.com/file/d/1XyZ_abc123/view
        const fileIdMatch = driveLink.match(/\/d\/([a-zA-Z0-9_-]+)/);

        if (!fileIdMatch || !fileIdMatch[1]) {
            return res.status(400).json({ error: 'Could not extract a valid Google Drive File ID from the provided link.' });
        }

        const fileId = fileIdMatch[1];

        // 1. Fetch file metadata to get the MIME type and name
        const metadataRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${providerToken}`
            }
        });

        if (!metadataRes.ok) {
            const errBody = await metadataRes.text();
            console.error('Drive API Metadata Error:', errBody);
            return res.status(metadataRes.status).json({ error: `Failed to fetch file metadata from Google Drive. Ensure you have access and the file is not trashed.`, details: errBody });
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
            const errBody = await contentRes.text();
            console.error('Drive API Content Error:', errBody);
            return res.status(contentRes.status).json({ error: `Failed to download file content from Google Drive.`, details: errBody });
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
            error: 'An internal server error occurred while processing the Google Drive link.',
            details: error.message
        });
    }
}
