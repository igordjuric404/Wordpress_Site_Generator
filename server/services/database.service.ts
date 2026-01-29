import mysql from 'mysql2/promise';
import fs from 'fs-extra';
import { createServiceLogger } from '../utils/logger.js';
import { sanitizeDbName } from '../utils/sanitize.js';

const logger = createServiceLogger('database');

let connection: mysql.Connection | null = null;

const DEFAULT_MYSQL_SOCKETS = [
  '/tmp/mysql.sock',
  '/opt/homebrew/var/mysql/mysql.sock',
  '/usr/local/var/mysql/mysql.sock',
  '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock',
  '/Applications/MAMP/tmp/mysql/mysql.sock',
];

function resolveMysqlSocket(): string | undefined {
  if (process.env.MYSQL_SOCKET) {
    return process.env.MYSQL_SOCKET;
  }

  for (const socketPath of DEFAULT_MYSQL_SOCKETS) {
    if (fs.pathExistsSync(socketPath)) {
      return socketPath;
    }
  }
  return undefined;
}

/**
 * Create a MySQL connection using local configuration
 */
export async function createConnection(): Promise<mysql.Connection> {
  if (connection) {
    try {
      await connection.ping();
      return connection;
    } catch {
      // Connection is stale, create a new one
      connection = null;
    }
  }

  // XAMPP uses empty password by default, MAMP uses 'root'
  const password = process.env.MYSQL_PASSWORD !== undefined 
    ? process.env.MYSQL_PASSWORD 
    : (process.env.MYSQL_PORT === '3306' ? '' : 'root'); // XAMPP default port is 3306

  const socketPath = resolveMysqlSocket();

  connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: password,
    ...(socketPath ? { socketPath } : {}),
  });

  logger.info('MySQL connection established');
  return connection;
}

/**
 * Close the MySQL connection
 */
export async function closeConnection(): Promise<void> {
  if (connection) {
    await connection.end();
    connection = null;
    logger.info('MySQL connection closed');
  }
}

/**
 * Check if a database exists
 */
export async function databaseExists(dbName: string): Promise<boolean> {
  const conn = await createConnection();
  const [rows] = await conn.query(
    'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
    [dbName]
  );
  return (rows as any[]).length > 0;
}

/**
 * Create a new database for a WordPress site
 */
export async function createDatabase(dbName: string): Promise<void> {
  const conn = await createConnection();
  const sanitized = sanitizeDbName(dbName);

  // Use backticks to escape the database name
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${sanitized}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

  logger.info({ dbName: sanitized }, 'Database created');
}

/**
 * Drop a database (used for cleanup)
 */
export async function dropDatabase(dbName: string): Promise<void> {
  const conn = await createConnection();
  const sanitized = sanitizeDbName(dbName);

  await conn.query(`DROP DATABASE IF EXISTS \`${sanitized}\``);

  logger.info({ dbName: sanitized }, 'Database dropped');
}

/**
 * Find next available database name with incrementing suffix
 * e.g., joes_plumbing_1, joes_plumbing_2, etc.
 */
export async function getNextAvailableDbName(baseName: string): Promise<string> {
  const sanitized = sanitizeDbName(baseName);
  let counter = 1;

  while (await databaseExists(`${sanitized}_${counter}`)) {
    counter++;
  }

  return `${sanitized}_${counter}`;
}

/**
 * Test MySQL connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const conn = await createConnection();
    await conn.ping();
    return true;
  } catch (err) {
    logger.error({ error: err }, 'MySQL connection test failed');
    return false;
  }
}
