-- SQL Script to add app_ref column to agents table for agent-to-agent autopilot integration
-- This script should be run manually or integrated into your database init scripts

-- Check if app_ref column exists, if not add it
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'agents' 
AND COLUMN_NAME = 'app_ref';

SET @query = IF(@column_exists = 0, 
    'ALTER TABLE agents ADD COLUMN app_ref VARCHAR(255) DEFAULT NULL;', 
    'SELECT "Column app_ref already exists" AS message;');

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create index for app_ref if it doesn't exist
SELECT COUNT(*) INTO @index_exists 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'agents' 
AND INDEX_NAME = 'idx_agents_app_ref';

SET @create_index = IF(@index_exists = 0, 
    'CREATE INDEX idx_agents_app_ref ON agents(app_ref);', 
    'SELECT "Index idx_agents_app_ref already exists" AS message;');

PREPARE stmt FROM @create_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update default extension logic
INSERT INTO global_vars (var_name, var_val, description)
SELECT 'AGENT_APP_REF_ENABLED', 'true', 'Whether agent app reference functionality is enabled'
WHERE NOT EXISTS (
    SELECT 1 FROM global_vars WHERE var_name = 'AGENT_APP_REF_ENABLED'
);
