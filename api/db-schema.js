import pg from 'pg';
const { Client } = pg;
import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { connectionString, type } = req.body;

    if (!connectionString) {
        return res.status(400).json({ error: 'Connection string is required' });
    }

    try {
        let schemaData = null;

        if (type === 'postgres' || connectionString.startsWith('postgres')) {
            schemaData = await extractPostgresSchema(connectionString);
        } else if (type === 'mysql' || connectionString.startsWith('mysql')) {
            schemaData = await extractMysqlSchema(connectionString);
        } else {
            return res.status(400).json({ error: 'Unsupported database type. Use PostgreSQL or MySQL.' });
        }

        return res.status(200).json({ success: true, schema: schemaData });

    } catch (error) {
        console.error('Database connection error:', error);
        return res.status(500).json({
            error: 'Failed to connect to the database. Please verify your credentials and network access.',
            details: error.message
        });
    }
}

async function extractPostgresSchema(connectionString) {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase, Neon, etc.
    });

    await client.connect();

    try {
        // Query to get tables and their columns using the standard information_schema
        const query = `
            SELECT 
                tables.table_name, 
                columns.column_name, 
                columns.data_type
            FROM 
                information_schema.tables
            JOIN 
                information_schema.columns 
            ON 
                tables.table_schema = columns.table_schema 
                AND tables.table_name = columns.table_name
            WHERE 
                tables.table_schema = 'public' 
                AND tables.table_type = 'BASE TABLE'
            ORDER BY 
                tables.table_name, columns.ordinal_position;
        `;

        const { rows } = await client.query(query);

        return processSchemaRows(rows);
    } finally {
        await client.end();
    }
}

async function extractMysqlSchema(uri) {
    const connection = await mysql.createConnection(uri);

    try {
        // Query to get tables and columns for the current database
        const [rows] = await connection.execute(`
            SELECT 
                TABLE_NAME as table_name, 
                COLUMN_NAME as column_name, 
                DATA_TYPE as data_type
            FROM 
                INFORMATION_SCHEMA.COLUMNS
            WHERE 
                TABLE_SCHEMA = DATABASE()
            ORDER BY 
                TABLE_NAME, ORDINAL_POSITION;
        `);

        return processSchemaRows(rows);
    } finally {
        await connection.end();
    }
}

function processSchemaRows(rows) {
    const schema = {};

    rows.forEach(row => {
        const tableName = row.table_name;
        if (!schema[tableName]) {
            schema[tableName] = [];
        }
        schema[tableName].push({
            column: row.column_name,
            type: row.data_type
        });
    });

    // Format as a string for LLM parsing
    return Object.entries(schema).map(([table, columns]) => {
        const colDefs = columns.map(c => `${c.column} (${c.type})`).join(', ');
        return `Table: ${table}\nColumns: ${colDefs}`;
    }).join('\n\n');
}
