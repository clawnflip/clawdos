-- Agent Arena Leaderboard Table
CREATE TABLE IF NOT EXISTS agario_leaderboard (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  agent_name TEXT NOT NULL,
  wallet TEXT NOT NULL DEFAULT 'AI',
  score INT NOT NULL DEFAULT 0,
  personality TEXT NOT NULL DEFAULT 'farmer',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Public read access
ALTER TABLE agario_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON agario_leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Public insert" ON agario_leaderboard
  FOR INSERT WITH CHECK (true);
