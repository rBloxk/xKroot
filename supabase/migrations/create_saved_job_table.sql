-- Create saved_job table for candidates to save jobs
CREATE TABLE IF NOT EXISTS saved_job (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidate_profile(id) ON DELETE CASCADE,
  role_requirement_id UUID NOT NULL REFERENCES role_requirement(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(candidate_id, role_requirement_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_job_candidate_id ON saved_job(candidate_id);
CREATE INDEX IF NOT EXISTS idx_saved_job_role_requirement_id ON saved_job(role_requirement_id);
CREATE INDEX IF NOT EXISTS idx_saved_job_saved_at ON saved_job(saved_at DESC);

