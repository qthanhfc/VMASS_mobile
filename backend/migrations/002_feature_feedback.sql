CREATE TABLE IF NOT EXISTS feature_feedback (
  id SERIAL PRIMARY KEY,
  category VARCHAR(30) NOT NULL DEFAULT 'feature',
  title VARCHAR(255),
  content TEXT NOT NULL,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  company_name VARCHAR(255),
  source VARCHAR(80),
  status VARCHAR(30) NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
