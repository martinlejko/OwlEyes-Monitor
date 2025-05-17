-- Sample seed data for OwlEyes
-- Run this after the schema creation (database.sql) has been applied

-- First, clean up any existing data
TRUNCATE TABLE monitor_status CASCADE;
TRUNCATE TABLE monitors CASCADE;
TRUNCATE TABLE projects CASCADE;

-- Insert sample projects
INSERT INTO projects (id, label, description, tags)
VALUES
    (1, 'Social Media', 'Popular social media platforms monitoring', '["social", "production", "critical"]'),
    (2, 'Development', 'Development platforms and tools', '["dev", "github", "critical"]'),
    (3, 'Search Engines', 'Search engine monitoring', '["search", "production", "critical"]'),
    (4, 'Entertainment', 'Entertainment platforms monitoring', '["streaming", "video", "external"]');

-- Reset the sequence for projects
SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects));

-- Insert sample ping monitors
INSERT INTO monitors (project_id, label, periodicity, type, badge_label, host, port)
VALUES
    (1, 'Reddit Server', 60, 'ping', 'Reddit', 'reddit.com', 443),
    (2, 'GitHub API', 30, 'ping', 'GitHub', 'api.github.com', 443),
    (3, 'Google DNS', 60, 'ping', 'Google DNS', '8.8.8.8', 53),
    (4, 'YouTube CDN', 120, 'ping', 'YouTube', 'youtube.com', 443);

-- Insert sample website monitors
INSERT INTO monitors (project_id, label, periodicity, type, badge_label, url, check_status, keywords)
VALUES
    (1, 'Reddit Homepage', 60, 'website', 'Reddit', 'https://www.reddit.com', true, '["reddit", "popular"]'),
    (2, 'GitHub Status', 120, 'website', 'GitHub', 'https://www.githubstatus.com', true, '["All Systems Operational", "status"]'),
    (3, 'Google Search', 300, 'website', 'Google', 'https://www.google.com', true, '["search", "google"]'),
    (4, 'YouTube Homepage', 180, 'website', 'YouTube', 'https://www.youtube.com', true, '["youtube", "video"]');

-- Generate monitor status for the past month with proper intervals
DO $$
DECLARE
    v_start_date TIMESTAMP;
    v_current_date TIMESTAMP;
    v_end_date TIMESTAMP;
    v_monitor RECORD;
    v_status_value BOOLEAN;
    v_response_time_value INTEGER;
    v_base_response_time INTEGER;
    v_interval_seconds INTEGER;
    v_weekend_multiplier FLOAT;
    v_business_hours_multiplier FLOAT;
    v_maintenance_window BOOLEAN;
BEGIN
    -- Set fixed current timestamp to May 6, 2025 (for consistent data generation)
    v_end_date := '2025-05-06 23:59:59'::TIMESTAMP;
    v_start_date := v_end_date - INTERVAL '1 month';
    
    -- For each monitor
    FOR v_monitor IN SELECT id, type, periodicity FROM monitors ORDER BY id
    LOOP
        v_current_date := v_start_date;
        
        -- Set base response time based on monitor type
        IF v_monitor.type = 'ping' THEN
            v_base_response_time := 50; -- Base response time for ping
        ELSE
            v_base_response_time := 250; -- Base response time for website
        END IF;

        -- Generate entries until end date
        WHILE v_current_date <= v_end_date LOOP
            -- Calculate time-based multipliers
            v_weekend_multiplier := CASE 
                WHEN EXTRACT(DOW FROM v_current_date) IN (0, 6) THEN 1.5
                ELSE 1.0
            END;
            
            v_business_hours_multiplier := CASE 
                WHEN EXTRACT(HOUR FROM v_current_date) BETWEEN 9 AND 17 THEN 1.3
                ELSE 1.0
            END;
            
            -- Check if it's maintenance window (Tuesdays 2-4 AM)
            v_maintenance_window := EXTRACT(DOW FROM v_current_date) = 2 
                AND EXTRACT(HOUR FROM v_current_date) BETWEEN 2 AND 4;
            
            -- Determine status (different probabilities based on conditions)
            IF v_maintenance_window THEN
                v_status_value := FALSE; -- Always down during maintenance
            ELSE
                -- 98% uptime normally, 95% during peak hours
                v_status_value := random() > CASE 
                    WHEN EXTRACT(HOUR FROM v_current_date) BETWEEN 9 AND 17 THEN 0.05
                    ELSE 0.02
                END;
            END IF;
            
            -- Calculate response time with realistic patterns
            IF v_status_value THEN
                -- Normal operation with time-based variations
                v_response_time_value := (
                    v_base_response_time * v_weekend_multiplier * v_business_hours_multiplier +
                    (random() * 0.4 - 0.2) * v_base_response_time
                )::INTEGER;
            ELSE
                -- Failure response times
                v_response_time_value := CASE 
                    WHEN v_maintenance_window THEN 0 -- Maintenance window shows as 0ms
                    ELSE (v_base_response_time * 10 + (random() * 1000))::INTEGER -- Regular failure
                END;
            END IF;

            -- Insert the status
            INSERT INTO monitor_status (monitor_id, start_time, status, response_time)
            VALUES (v_monitor.id, v_current_date, v_status_value, v_response_time_value);

            -- Move to next interval using monitor's actual periodicity
            v_current_date := v_current_date + (v_monitor.periodicity || ' seconds')::interval;
        END LOOP;
    END LOOP;
END $$;

-- Add some specific patterns

-- GitHub major outage (3 hours) in the last week
UPDATE monitor_status 
SET status = false, 
    response_time = 3000
WHERE monitor_id IN (2, 6) -- GitHub API and Status page
AND start_time BETWEEN '2025-05-01 10:00:00' AND '2025-05-01 13:00:00';

-- YouTube weekend peak hours pattern (higher response times)
UPDATE monitor_status 
SET response_time = response_time * 2
WHERE monitor_id IN (4, 8) -- YouTube CDN and Homepage
AND EXTRACT(DOW FROM start_time) IN (0, 6) -- Saturday and Sunday
AND EXTRACT(HOUR FROM start_time) BETWEEN 18 AND 22; -- Peak hours

-- Google Search business hours pattern
UPDATE monitor_status 
SET response_time = CASE 
    WHEN random() > 0.5 THEN response_time * 1.5 
    ELSE response_time * 1.3 
END
WHERE monitor_id IN (3, 7) -- Google DNS and Search
AND EXTRACT(HOUR FROM start_time) BETWEEN 9 AND 17 -- Business hours
AND EXTRACT(DOW FROM start_time) BETWEEN 1 AND 5; -- Weekdays
