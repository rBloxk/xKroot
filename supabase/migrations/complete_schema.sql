-- ============================================
-- xKroot Complete Database Schema
-- PostgreSQL/Supabase Ready
-- All tables, columns, indexes, triggers, and RLS policies
-- ============================================
-- This is a complete schema file that includes everything.
-- Drop all tables and run this to start fresh.

-- ============================================
-- DROP ALL EXISTING TABLES (if needed)
-- ============================================
-- ⚠️ WARNING: Uncomment the following lines to drop all tables first
-- This will DELETE ALL DATA. Make sure to backup first!
-- DROP TABLE IF EXISTS ai_consensus_result CASCADE;
-- DROP TABLE IF EXISTS ai_model_run CASCADE;
-- DROP TABLE IF EXISTS notification CASCADE;
-- DROP TABLE IF EXISTS application CASCADE;
-- DROP TABLE IF EXISTS match_factor CASCADE;
-- DROP TABLE IF EXISTS match_result CASCADE;
-- DROP TABLE IF EXISTS ai_output CASCADE;
-- DROP TABLE IF EXISTS ai_prompt CASCADE;
-- DROP TABLE IF EXISTS subscription CASCADE;
-- DROP TABLE IF EXISTS role_requirement CASCADE;
-- DROP TABLE IF EXISTS company_need CASCADE;
-- DROP TABLE IF EXISTS company_profile CASCADE;
-- DROP TABLE IF EXISTS candidate_behavior_signal CASCADE;
-- DROP TABLE IF EXISTS candidate_assessment CASCADE;
-- DROP TABLE IF EXISTS candidate_skill CASCADE;
-- DROP TABLE IF EXISTS candidate_profile CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- 1️⃣ AUTH & BASE USERS (Foundation)
-- ============================================

-- users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  user_type VARCHAR(50) NOT NULL DEFAULT 'candidate' CHECK (user_type IN ('candidate', 'company', 'admin')),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2️⃣ CANDIDATE INTELLIGENCE (People Understanding)
-- ============================================

-- candidate_profile
CREATE TABLE IF NOT EXISTS candidate_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  location VARCHAR(255),
  current_position VARCHAR(255),
  years_experience INTEGER,
  education_level VARCHAR(100),
  availability_status VARCHAR(50) DEFAULT 'available' CHECK (availability_status IN ('available', 'open', 'not_looking', 'passive')),
  salary_expectation_min DECIMAL(10, 2),
  salary_expectation_max DECIMAL(10, 2),
  preferred_work_type VARCHAR(50) CHECK (preferred_work_type IN ('remote', 'hybrid', 'onsite', 'flexible')),
  preferred_location VARCHAR(255),
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  raw_resume_text TEXT,
  resume_file_url TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  onboarding_answers JSONB,
  profile_completeness INTEGER DEFAULT 0 CHECK (profile_completeness >= 0 AND profile_completeness <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- candidate_skill
CREATE TABLE IF NOT EXISTS candidate_skill (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidate_profile(id) ON DELETE CASCADE,
  skill_name VARCHAR(255) NOT NULL,
  skill_category VARCHAR(100),
  proficiency_level VARCHAR(50) DEFAULT 'intermediate' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_experience DECIMAL(4, 1),
  verified BOOLEAN DEFAULT false,
  source VARCHAR(50) DEFAULT 'self_reported' CHECK (source IN ('self_reported', 'assessment', 'endorsement', 'ai_inferred')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- candidate_assessment
CREATE TABLE IF NOT EXISTS candidate_assessment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidate_profile(id) ON DELETE CASCADE,
  assessment_type VARCHAR(100) NOT NULL,
  assessment_data JSONB NOT NULL,
  ai_model_version VARCHAR(50),
  score DECIMAL(5, 2),
  score_breakdown JSONB,
  strengths TEXT[],
  areas_for_improvement TEXT[],
  recommendations TEXT[],
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- candidate_behavior_signal
CREATE TABLE IF NOT EXISTS candidate_behavior_signal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidate_profile(id) ON DELETE CASCADE,
  signal_type VARCHAR(100) NOT NULL,
  signal_data JSONB,
  signal_strength DECIMAL(3, 2) DEFAULT 1.0,
  interpreted_meaning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3️⃣ COMPANY INTELLIGENCE (Business Understanding)
-- ============================================

-- company_profile
CREATE TABLE IF NOT EXISTS company_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  company_size VARCHAR(50) CHECK (company_size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  industry VARCHAR(255),
  description TEXT,
  website_url TEXT,
  location VARCHAR(255),
  headquarters_location VARCHAR(255),
  company_type VARCHAR(50) CHECK (company_type IN ('public', 'private', 'nonprofit', 'government')),
  funding_stage VARCHAR(50),
  startup_stage VARCHAR(50) CHECK (startup_stage IN ('idea', 'mvp', 'scale')),
  company_culture JSONB,
  benefits_offered TEXT[],
  tech_stack TEXT[],
  logo_url TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- company_need
CREATE TABLE IF NOT EXISTS company_need (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES company_profile(id) ON DELETE CASCADE,
  need_type VARCHAR(100) NOT NULL,
  priority_level VARCHAR(50) DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  required_skills TEXT[],
  preferred_skills TEXT[],
  nice_to_have_skills TEXT[],
  urgency_score INTEGER DEFAULT 50 CHECK (urgency_score >= 0 AND urgency_score <= 100),
  budget_range_min DECIMAL(10, 2),
  budget_range_max DECIMAL(10, 2),
  timeline VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled', 'on_hold')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- role_requirement
CREATE TABLE IF NOT EXISTS role_requirement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES company_profile(id) ON DELETE CASCADE,
  company_need_id UUID REFERENCES company_need(id) ON DELETE SET NULL,
  role_title VARCHAR(255) NOT NULL,
  role_level VARCHAR(50) CHECK (role_level IN ('intern', 'junior', 'mid', 'senior', 'lead', 'principal', 'executive')),
  department VARCHAR(255),
  job_description TEXT NOT NULL,
  required_skills JSONB NOT NULL,
  preferred_qualifications TEXT[],
  responsibilities TEXT[],
  work_type VARCHAR(50) CHECK (work_type IN ('remote', 'hybrid', 'onsite', 'flexible')),
  location VARCHAR(255),
  salary_min DECIMAL(10, 2),
  salary_max DECIMAL(10, 2),
  equity_offered BOOLEAN DEFAULT false,
  benefits TEXT[],
  application_deadline TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed', 'filled', 'cancelled')),
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4️⃣ MATCHING & DECISION INTELLIGENCE
-- ============================================

-- match_result
CREATE TABLE IF NOT EXISTS match_result (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidate_profile(id) ON DELETE CASCADE,
  role_requirement_id UUID NOT NULL REFERENCES role_requirement(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES company_profile(id) ON DELETE CASCADE,
  match_score DECIMAL(5, 2) NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  match_confidence DECIMAL(3, 2) DEFAULT 0.5 CHECK (match_confidence >= 0 AND match_confidence <= 1),
  match_reasoning TEXT,
  skill_match_percentage DECIMAL(5, 2),
  cultural_fit_score DECIMAL(5, 2),
  overall_fit_score DECIMAL(5, 2),
  match_status VARCHAR(50) DEFAULT 'pending' CHECK (match_status IN ('pending', 'presented', 'viewed', 'interested', 'applied', 'rejected', 'hired')),
  ai_model_version VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(candidate_id, role_requirement_id)
);

-- match_factor
CREATE TABLE IF NOT EXISTS match_factor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_result_id UUID NOT NULL REFERENCES match_result(id) ON DELETE CASCADE,
  factor_type VARCHAR(100) NOT NULL,
  factor_name VARCHAR(255) NOT NULL,
  factor_score DECIMAL(5, 2) NOT NULL,
  factor_weight DECIMAL(3, 2) DEFAULT 1.0,
  factor_explanation TEXT,
  evidence JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5️⃣ APPLICATIONS
-- ============================================

-- application
CREATE TABLE IF NOT EXISTS application (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidate_profile(id) ON DELETE CASCADE,
  role_requirement_id UUID NOT NULL REFERENCES role_requirement(id) ON DELETE CASCADE,
  cover_letter TEXT,
  resume_url TEXT,
  portfolio_url TEXT,
  application_status VARCHAR(50) DEFAULT 'submitted' CHECK (application_status IN (
    'submitted',
    'under_review',
    'shortlisted',
    'interview_scheduled',
    'interview_completed',
    'offer_extended',
    'offer_accepted',
    'offer_declined',
    'rejected',
    'withdrawn'
  )),
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shortlisted_at TIMESTAMP WITH TIME ZONE,
  interview_scheduled_at TIMESTAMP WITH TIME ZONE,
  offer_extended_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(candidate_id, role_requirement_id)
);

-- ============================================
-- 6️⃣ NOTIFICATIONS
-- ============================================

-- notification
CREATE TABLE IF NOT EXISTS notification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7️⃣ AI SYSTEM & CONTROL
-- ============================================

-- ai_prompt
CREATE TABLE IF NOT EXISTS ai_prompt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_name VARCHAR(255) UNIQUE NOT NULL,
  prompt_version VARCHAR(50) NOT NULL,
  prompt_category VARCHAR(100),
  prompt_template TEXT NOT NULL,
  variables JSONB,
  model_config JSONB,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prompt_name, prompt_version)
);

-- ai_output
CREATE TABLE IF NOT EXISTS ai_output (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES ai_prompt(id) ON DELETE SET NULL,
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  model_name VARCHAR(100),
  model_version VARCHAR(50),
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8️⃣ PAYMENTS & ACCESS
-- ============================================

-- subscription
CREATE TABLE IF NOT EXISTS subscription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_type VARCHAR(50) NOT NULL CHECK (subscription_type IN ('free', 'basic', 'premium', 'enterprise')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  features JSONB,
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- Candidate indexes
CREATE INDEX IF NOT EXISTS idx_candidate_profile_user_id ON candidate_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_profile_availability ON candidate_profile(availability_status);
CREATE INDEX IF NOT EXISTS idx_candidate_skill_candidate_id ON candidate_skill(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_skill_name ON candidate_skill(skill_name);
CREATE INDEX IF NOT EXISTS idx_candidate_assessment_candidate_id ON candidate_assessment(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_behavior_signal_candidate_id ON candidate_behavior_signal(candidate_id);

-- Company indexes
CREATE INDEX IF NOT EXISTS idx_company_profile_user_id ON company_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_company_profile_startup_stage ON company_profile(startup_stage);
CREATE INDEX IF NOT EXISTS idx_company_need_company_id ON company_need(company_id);
CREATE INDEX IF NOT EXISTS idx_company_need_status ON company_need(status);
CREATE INDEX IF NOT EXISTS idx_role_requirement_company_id ON role_requirement(company_id);
CREATE INDEX IF NOT EXISTS idx_role_requirement_status ON role_requirement(status);

-- Matching indexes
CREATE INDEX IF NOT EXISTS idx_match_result_candidate_id ON match_result(candidate_id);
CREATE INDEX IF NOT EXISTS idx_match_result_role_id ON match_result(role_requirement_id);
CREATE INDEX IF NOT EXISTS idx_match_result_company_id ON match_result(company_id);
CREATE INDEX IF NOT EXISTS idx_match_result_score ON match_result(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_match_result_status ON match_result(match_status);
CREATE INDEX IF NOT EXISTS idx_match_factor_match_result_id ON match_factor(match_result_id);

-- Application indexes
CREATE INDEX IF NOT EXISTS idx_application_candidate_id ON application(candidate_id);
CREATE INDEX IF NOT EXISTS idx_application_role_requirement_id ON application(role_requirement_id);
CREATE INDEX IF NOT EXISTS idx_application_status ON application(application_status);
CREATE INDEX IF NOT EXISTS idx_application_submitted_at ON application(submitted_at);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notification_user_id ON notification(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_is_read ON notification(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON notification(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_user_read ON notification(user_id, is_read);

-- AI indexes
CREATE INDEX IF NOT EXISTS idx_ai_prompt_active ON ai_prompt(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_output_prompt_id ON ai_output(prompt_id);
CREATE INDEX IF NOT EXISTS idx_ai_output_created_at ON ai_output(created_at DESC);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_subscription_user_id ON subscription(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_status ON subscription(status);

-- ============================================
-- TRIGGERS for auto-updating updated_at
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidate_profile_updated_at BEFORE UPDATE ON candidate_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidate_skill_updated_at BEFORE UPDATE ON candidate_skill
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidate_assessment_updated_at BEFORE UPDATE ON candidate_assessment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_profile_updated_at BEFORE UPDATE ON company_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_need_updated_at BEFORE UPDATE ON company_need
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_requirement_updated_at BEFORE UPDATE ON role_requirement
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_result_updated_at BEFORE UPDATE ON match_result
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_updated_at BEFORE UPDATE ON application
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_prompt_updated_at BEFORE UPDATE ON ai_prompt
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_updated_at BEFORE UPDATE ON subscription
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGERS for application count
-- ============================================

-- Function to update applications_count on role_requirement
CREATE OR REPLACE FUNCTION update_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE role_requirement
    SET applications_count = applications_count + 1
    WHERE id = NEW.role_requirement_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE role_requirement
    SET applications_count = GREATEST(applications_count - 1, 0)
    WHERE id = OLD.role_requirement_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes that affect count
    IF OLD.application_status != 'withdrawn' AND NEW.application_status = 'withdrawn' THEN
      UPDATE role_requirement
      SET applications_count = GREATEST(applications_count - 1, 0)
      WHERE id = NEW.role_requirement_id;
    ELSIF OLD.application_status = 'withdrawn' AND NEW.application_status != 'withdrawn' THEN
      UPDATE role_requirement
      SET applications_count = applications_count + 1
      WHERE id = NEW.role_requirement_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_applications_count
  AFTER INSERT OR UPDATE OR DELETE ON application
  FOR EACH ROW
  EXECUTE FUNCTION update_applications_count();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notification
  SET is_read = true, read_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_skill ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_assessment ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_behavior_signal ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_need ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_requirement ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_result ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_factor ENABLE ROW LEVEL SECURITY;
ALTER TABLE application ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_output ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Candidate policies
CREATE POLICY "Candidates can manage own profile" ON candidate_profile
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Candidates can manage own skills" ON candidate_skill
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM candidate_profile
      WHERE candidate_profile.id = candidate_skill.candidate_id
      AND candidate_profile.user_id = auth.uid()
    )
  );

CREATE POLICY "Candidates can manage own assessments" ON candidate_assessment
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM candidate_profile
      WHERE candidate_profile.id = candidate_assessment.candidate_id
      AND candidate_profile.user_id = auth.uid()
    )
  );

-- Company policies
CREATE POLICY "Companies can manage own profile" ON company_profile
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Companies can manage own needs" ON company_need
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_profile
      WHERE company_profile.id = company_need.company_id
      AND company_profile.user_id = auth.uid()
    )
  );

CREATE POLICY "Companies can manage own roles" ON role_requirement
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM company_profile
      WHERE company_profile.id = role_requirement.company_id
      AND company_profile.user_id = auth.uid()
    )
  );

-- Match results policies
CREATE POLICY "Candidates can view own matches" ON match_result
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM candidate_profile
      WHERE candidate_profile.id = match_result.candidate_id
      AND candidate_profile.user_id = auth.uid()
    )
  );

CREATE POLICY "Companies can view matches for their roles" ON match_result
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_profile
      WHERE company_profile.id = match_result.company_id
      AND company_profile.user_id = auth.uid()
    )
  );

-- Application policies
CREATE POLICY "Candidates can manage own applications" ON application
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM candidate_profile
      WHERE candidate_profile.id = application.candidate_id
      AND candidate_profile.user_id = auth.uid()
    )
  );

CREATE POLICY "Companies can view applications for their roles" ON application
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM role_requirement
      JOIN company_profile ON company_profile.id = role_requirement.company_id
      WHERE role_requirement.id = application.role_requirement_id
      AND company_profile.user_id = auth.uid()
    )
  );

CREATE POLICY "Companies can update applications for their roles" ON application
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM role_requirement
      JOIN company_profile ON company_profile.id = role_requirement.company_id
      WHERE role_requirement.id = application.role_requirement_id
      AND company_profile.user_id = auth.uid()
    )
  );

-- Notification policies
CREATE POLICY "Users can view own notifications" ON notification
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notification
  FOR UPDATE USING (auth.uid() = user_id);

-- Public role listings (read-only for candidates)
CREATE POLICY "Public can view open roles" ON role_requirement
  FOR SELECT USING (status = 'open');

-- ============================================
-- COMMENTS for Documentation
-- ============================================

COMMENT ON COLUMN users.last_active IS 'Last time the user was active in the system';
COMMENT ON COLUMN company_profile.startup_stage IS 'Startup stage: idea, MVP, or scale';
COMMENT ON COLUMN candidate_profile.onboarding_answers IS 'JSONB storing answers from AI-driven onboarding questions';
COMMENT ON COLUMN candidate_profile.avatar_url IS 'URL to candidate profile picture/avatar';
COMMENT ON COLUMN candidate_profile.cover_image_url IS 'URL to candidate cover/banner image';
COMMENT ON COLUMN company_profile.logo_url IS 'URL to company logo image';
COMMENT ON COLUMN company_profile.cover_image_url IS 'URL to company cover/banner image';

-- ============================================
-- 9️⃣ MULTI-MODEL INTELLIGENCE (MMI) SYSTEM
-- ============================================

-- ai_model_run
-- Track each model response for every task
CREATE TABLE IF NOT EXISTS ai_model_run (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id VARCHAR(255) NOT NULL, -- e.g., 'skill_extraction_<candidate_id>'
  task_type VARCHAR(100) NOT NULL, -- e.g., 'skill_extraction', 'role_clarity', 'match_reasoning'
  model_name VARCHAR(50) NOT NULL, -- 'gpt-4', 'claude-3', 'gemini-pro'
  model_version VARCHAR(50),
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  raw_response TEXT, -- Store raw API response for debugging
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  cost_usd DECIMAL(10, 6),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  confidence_score DECIMAL(3, 2), -- Model's own confidence (if provided)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ai_consensus_result
-- Final xKroot decision after consensus
CREATE TABLE IF NOT EXISTS ai_consensus_result (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id VARCHAR(255) NOT NULL UNIQUE,
  task_type VARCHAR(100) NOT NULL,
  model_runs JSONB NOT NULL, -- Array of ai_model_run IDs
  consensus_output JSONB NOT NULL, -- Final merged result
  consensus_method VARCHAR(50) NOT NULL, -- 'highest_score', 'merge', 'weighted_average'
  confidence_level VARCHAR(20) NOT NULL, -- 'high', 'medium', 'low'
  confidence_score DECIMAL(3, 2) NOT NULL, -- 0.0 to 1.0
  judge_scores JSONB, -- Scores from judge function
  explanation TEXT, -- Human-readable explanation
  model_agreement DECIMAL(3, 2), -- How much models agreed (0.0 to 1.0)
  fallback_used BOOLEAN DEFAULT false, -- If any model was dropped
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for MMI tables
CREATE INDEX IF NOT EXISTS idx_ai_model_run_task_id ON ai_model_run(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_model_run_task_type ON ai_model_run(task_type);
CREATE INDEX IF NOT EXISTS idx_ai_model_run_created_at ON ai_model_run(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_consensus_task_id ON ai_consensus_result(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_consensus_task_type ON ai_consensus_result(task_type);
CREATE INDEX IF NOT EXISTS idx_ai_consensus_confidence ON ai_consensus_result(confidence_level);

-- Trigger for ai_consensus_result updated_at
CREATE TRIGGER update_ai_consensus_result_updated_at BEFORE UPDATE ON ai_consensus_result
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS for MMI tables
ALTER TABLE ai_model_run ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_consensus_result ENABLE ROW LEVEL SECURITY;

-- Only admins and system can view model runs (sensitive data)
CREATE POLICY "Admins can view model runs" ON ai_model_run
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- Only admins and system can view consensus results
CREATE POLICY "Admins can view consensus results" ON ai_consensus_result
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- Comments for documentation
COMMENT ON TABLE ai_model_run IS 'Stores individual model responses for multi-model intelligence system';
COMMENT ON TABLE ai_consensus_result IS 'Stores final consensus decisions after comparing multiple model outputs';
COMMENT ON COLUMN ai_consensus_result.confidence_level IS 'High: models agree, Medium: partial disagreement, Low: models diverge';

-- ============================================
-- END OF SCHEMA
-- ============================================
-- Total: 18 tables (16 core + 2 MMI)
-- This is the complete schema with all columns and features.
-- Ready for xKroot Core MVP + Multi-Model Intelligence! 🌱

