import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL environment variable is required. Set it to your Neon PostgreSQL connection string.');
  process.exit(1);
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err.message);
});

/** Convenience wrapper – use query(sql, params) everywhere */
export async function query(sql, params) {
  const result = await pool.query(sql, params);
  return result;
}

/** Create all tables if they don't exist. Called once at startup. */
export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            TEXT PRIMARY KEY,
        email         TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role          TEXT NOT NULL CHECK (role IN ('student','recruiter','mentor','admin')),
        name          TEXT NOT NULL DEFAULT '',
        approval      TEXT NOT NULL DEFAULT 'approved' CHECK (approval IN ('approved','pending','rejected')),
        profile       JSONB NOT NULL DEFAULT '{}',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked    BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS assessments (
        id          TEXT PRIMARY KEY,
        category    TEXT NOT NULL DEFAULT 'general',
        title       TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        duration_minutes INTEGER NOT NULL DEFAULT 15,
        passing_score    INTEGER NOT NULL DEFAULT 70,
        questions   JSONB NOT NULL DEFAULT '[]',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS assessment_attempts (
        id             TEXT PRIMARY KEY,
        user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assessment_id  TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
        answers        JSONB NOT NULL DEFAULT '{}',
        score          INTEGER NOT NULL DEFAULT 0,
        passed         BOOLEAN NOT NULL DEFAULT false,
        completed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(user_id, assessment_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS opportunities (
        id              TEXT PRIMARY KEY,
        posted_by       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_name    TEXT NOT NULL DEFAULT '',
        title           TEXT NOT NULL,
        type            TEXT NOT NULL DEFAULT 'Internship',
        location        TEXT NOT NULL DEFAULT 'Remote',
        stipend         TEXT NOT NULL DEFAULT 'Unpaid',
        duration        TEXT NOT NULL DEFAULT '3 Months',
        openings        INTEGER NOT NULL DEFAULT 1,
        status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('approved','pending','rejected')),
        required_skills JSONB NOT NULL DEFAULT '[]',
        description     TEXT NOT NULL DEFAULT '',
        eligibility     TEXT NOT NULL DEFAULT '',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_opp_posted_by ON opportunities(posted_by);
      CREATE INDEX IF NOT EXISTS idx_opp_status ON opportunities(status);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id               TEXT PRIMARY KEY,
        student_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        opportunity_id   TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
        status           TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','under_review','shortlisted','interview_scheduled','offered','accepted','rejected')),
        match_snapshot   JSONB NOT NULL DEFAULT '{}',
        interview_details JSONB,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(student_id, opportunity_id)
      );
      CREATE INDEX IF NOT EXISTS idx_app_student ON applications(student_id);
      CREATE INDEX IF NOT EXISTS idx_app_opportunity ON applications(opportunity_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS mentorship_assignments (
        id         TEXT PRIMARY KEY,
        mentor_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(mentor_id, student_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS mentor_feedback (
        id          TEXT PRIMARY KEY,
        assignment_id TEXT NOT NULL REFERENCES mentorship_assignments(id) ON DELETE CASCADE,
        author_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        feedback    TEXT NOT NULL DEFAULT '',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS learning_goals (
        id            TEXT PRIMARY KEY,
        assignment_id TEXT NOT NULL REFERENCES mentorship_assignments(id) ON DELETE CASCADE,
        title         TEXT NOT NULL,
        description   TEXT NOT NULL DEFAULT '',
        status        TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title       TEXT NOT NULL,
        message     TEXT NOT NULL DEFAULT '',
        read        BOOLEAN NOT NULL DEFAULT false,
        ref_type    TEXT,
        ref_id      TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
    `);

    await client.query('COMMIT');
    console.log('✓ Database tables initialized');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to initialize database tables:', err.message);
    throw err;
  } finally {
    client.release();
  }
}
