PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alternatives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  province TEXT NOT NULL DEFAULT 'Nusa Tenggara Barat',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS criteria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  weight REAL NOT NULL CHECK (weight >= 0),
  type TEXT NOT NULL CHECK (type IN ('benefit', 'cost')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alternative_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alternative_id INTEGER NOT NULL,
  criteria_id INTEGER NOT NULL,
  value REAL NOT NULL,
  year INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alternative_id) REFERENCES alternatives(id) ON DELETE CASCADE,
  FOREIGN KEY (criteria_id) REFERENCES criteria(id) ON DELETE CASCADE,
  UNIQUE (alternative_id, criteria_id, year)
);

CREATE TABLE IF NOT EXISTS topsis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alternative_id INTEGER NOT NULL,
  year INTEGER NOT NULL,
  d_plus REAL NOT NULL,
  d_minus REAL NOT NULL,
  preference_value REAL NOT NULL,
  rank INTEGER NOT NULL,
  category TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alternative_id) REFERENCES alternatives(id) ON DELETE CASCADE,
  UNIQUE (alternative_id, year)
);

CREATE TABLE IF NOT EXISTS topsis_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL UNIQUE,
  criteria_json TEXT NOT NULL,
  decision_matrix_json TEXT NOT NULL,
  normalized_matrix_json TEXT NOT NULL,
  weighted_matrix_json TEXT NOT NULL,
  ideal_positive_json TEXT NOT NULL,
  ideal_negative_json TEXT NOT NULL,
  distances_json TEXT NOT NULL,
  results_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scores_year ON alternative_scores(year);
CREATE INDEX IF NOT EXISTS idx_topsis_results_year ON topsis_results(year);
