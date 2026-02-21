import React, { useState } from 'react';
import { X, Database, FileText, Upload, Link, Loader2, Cloud } from 'lucide-react';
import styles from './DataConnectModal.module.css';

const DataConnectModal = ({ onClose, onConnect, auth }) => {
    const { providerToken, connectGoogleDrive } = auth;
    const [tab, setTab] = useState('database'); // 'database' or 'document'
    const [dbType, setDbType] = useState('postgres');
    const [connectionString, setConnectionString] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Document state
    const [file, setFile] = useState(null);

    // Drive state
    const [driveLink, setDriveLink] = useState('');

    const handleDatabaseConnect = async (e) => {
        e.preventDefault();
        if (!connectionString.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/db-schema', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ connectionString, type: dbType })
            });

            const textResponse = await res.text();
            let data;
            try {
                data = JSON.parse(textResponse);
            } catch (e) {
                throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 50)}... Check Vercel Function Logs.`);
            }

            if (!res.ok) {
                throw new Error(data.error || 'Failed to connect to database');
            }

            // Pass the extracted schema to App.jsx to use for the mind map
            onConnect({
                type: 'database',
                topic: `Database Schema: ${dbType.toUpperCase()}`,
                content: data.schema
            });
            onClose();

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/document-parse', {
                method: 'POST',
                body: formData
            });

            const textResponse = await res.text();
            let data;
            try {
                data = JSON.parse(textResponse);
            } catch (e) {
                throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 50)}... Check Vercel Function Logs.`);
            }

            if (!res.ok) {
                throw new Error(data.error || 'Failed to parse document');
            }

            onConnect({
                type: 'document',
                topic: `Document: ${data.name}`,
                content: data.text
            });
            onClose();

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDriveConnect = async (e) => {
        e.preventDefault();
        setError(null);

        if (!driveLink.trim()) {
            setError('Please enter a valid Google Drive link.');
            return;
        }

        // 1. If we don't have a provider token, the user must authorize Drive access first.
        if (!providerToken) {
            try {
                // This triggers the Google Pop-up window for OAuth Consent
                await connectGoogleDrive();
                // The connect window redirects the app entirely if on the same page in Supabase, 
                // but if they are already authed, they might just get a silent token refresh.
                // Assuming silent update works, we'll tell them to try clicking again if it didn't immediately loop.
                setError('Google Drive access requested. If a popup appeared, please authorize and try clicking Connect again.');
                return;
            } catch (err) {
                setError('Failed to request Google Drive authorization.');
                return;
            }
        }

        setLoading(true);

        // 2. We have the token, let's fetch the file from our secure serverless endpoint
        try {
            const res = await fetch('/api/drive-fetch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driveLink, providerToken })
            });

            const textResponse = await res.text();
            let data;
            try {
                data = JSON.parse(textResponse);
            } catch (err) {
                throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 50)}...`);
            }

            if (!res.ok) {
                // Determine if it's an auth issue so we can prompt re-auth
                if (res.status === 401 || res.status === 403) {
                    setError('Google Drive access denied. Your session may have expired, or you may not have granted the necessary read permissions during sign-in.');
                    return;
                }
                throw new Error(data.error || 'Failed to fetch Google Drive document.');
            }

            // 3. Success! Pass the raw text back to the Map Generator
            onConnect({
                type: 'drive',
                topic: `Drive Doc: ${data.name || 'External'}`,
                content: data.text
            });
            onClose();

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div>
                        <h2>Data Integration Explorer</h2>
                        <p>Connect your personal data to generate a dynamic map.</p>
                    </div>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${tab === 'database' ? styles.activeTab : ''}`}
                        onClick={() => setTab('database')}
                    >
                        <Database size={16} /> Database
                    </button>
                    <button
                        className={`${styles.tab} ${tab === 'document' ? styles.activeTab : ''}`}
                        onClick={() => setTab('document')}
                    >
                        <FileText size={16} /> Document
                    </button>
                    <button
                        className={`${styles.tab} ${tab === 'drive' ? styles.activeTab : ''}`}
                        onClick={() => setTab('drive')}
                    >
                        <Cloud size={16} /> Drive Link
                    </button>
                </div>

                <div className={styles.content}>
                    {error && <div className={styles.error}>{error}</div>}

                    {tab === 'database' && (
                        <form onSubmit={handleDatabaseConnect} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Database Type</label>
                                <select
                                    value={dbType}
                                    onChange={(e) => setDbType(e.target.value)}
                                    className={styles.input}
                                >
                                    <option value="postgres">PostgreSQL</option>
                                    <option value="mysql">MySQL</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Connection String</label>
                                <input
                                    type="text"
                                    value={connectionString}
                                    onChange={(e) => setConnectionString(e.target.value)}
                                    placeholder="postgresql://user:password@hostname:5432/dbname"
                                    className={styles.input}
                                    required
                                />
                                <small style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '11px', display: 'block' }}>
                                    Your connection string is sent securely and never stored. We only extract the table schema (structure), not your actual row data.
                                </small>
                            </div>

                            <button type="submit" disabled={loading} className={styles.submitBtn}>
                                {loading ? <><Loader2 size={16} className={styles.spin} /> Connecting...</> : <><Link size={16} /> Connect & Map</>}
                            </button>
                        </form>
                    )}

                    {tab === 'document' && (
                        <form onSubmit={handleFileUpload} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Upload File (PDF, TXT, MD)</label>
                                <div className={styles.fileUploadArea}>
                                    <input
                                        type="file"
                                        onChange={(e) => setFile(e.target.files[0])}
                                        accept=".pdf,.txt,.md,.csv"
                                        id="file-upload"
                                        className={styles.fileInput}
                                    />
                                    <label htmlFor="file-upload" className={styles.fileLabel}>
                                        <Upload size={24} style={{ marginBottom: '8px', color: 'var(--accent-cyan)' }} />
                                        <span>{file ? file.name : 'Click to select a file or drag and drop'}</span>
                                    </label>
                                </div>
                            </div>

                            <button type="submit" disabled={loading || !file} className={styles.submitBtn}>
                                {loading ? <><Loader2 size={16} className={styles.spin} /> Parsing...</> : <><FileText size={16} /> Map Document</>}
                            </button>
                        </form>
                    )}

                    {tab === 'drive' && (
                        <form onSubmit={handleDriveConnect} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Google Drive URL</label>
                                <input
                                    type="url"
                                    value={driveLink}
                                    onChange={(e) => setDriveLink(e.target.value)}
                                    placeholder="https://docs.google.com/document/d/..."
                                    className={styles.input}
                                    required
                                />
                                <small style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '11px', display: 'block' }}>
                                    Paste a publicly accessible or shared Google Drive link to a document, spreadsheet, or presentation.
                                </small>
                            </div>

                            <button type="submit" disabled={!driveLink} className={styles.submitBtn}>
                                <Cloud size={16} /> Connect Drive Document
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DataConnectModal;
