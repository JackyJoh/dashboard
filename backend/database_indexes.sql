-- Run these commands in your Neon SQL console to add indexes
-- These will dramatically improve query performance on date-based lookups

-- Index for closure_percentage table (gaps data)
CREATE INDEX IF NOT EXISTS idx_closure_percentage_date ON closure_percentage(date DESC);

-- Index for risk_closure table (risk score data)
CREATE INDEX IF NOT EXISTS idx_risk_closure_date ON risk_closure(date DESC);

-- Index for pt_outreach table (outreach data)
CREATE INDEX IF NOT EXISTS idx_pt_outreach_date ON pt_outreach(date DESC);

-- Index for priority_gaps table
CREATE INDEX IF NOT EXISTS idx_priority_gaps_date ON priority_gaps(date DESC);

-- Verify indexes were created
SELECT 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename IN ('closure_percentage', 'risk_closure', 'pt_outreach', 'priority_gaps')
ORDER BY tablename, indexname;
