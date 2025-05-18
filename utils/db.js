// utils/db.js
import Database from 'better-sqlite3';

const db = new Database('matchmaker.db');

// Initialize tables and indexes
db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    user_id  TEXT PRIMARY KEY,
    name     TEXT NOT NULL,
    age      INTEGER NOT NULL,
    gender   TEXT NOT NULL,
    bio      TEXT NOT NULL,
    approved INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS queue (
    user_id TEXT PRIMARY KEY
  );
  CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
  CREATE INDEX IF NOT EXISTS idx_queue_user_id    ON queue(user_id);
`);

export default db;