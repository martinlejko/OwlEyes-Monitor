-- Sample seed data for OwlEyes
-- Run this after the schema creation (database.sql) has been applied

-- Insert sample projects
INSERT INTO projects (label, description, tags)
VALUES
    ('Web Platform', 'Our main web platform services', '["web", "production", "critical"]'),
    ('Backend APIs', 'Internal and external API services', '["api", "backend", "services"]'),
    ('Dev Infrastructure', 'Development and staging infrastructure', '["dev", "infrastructure", "internal"]'),
    ('Mobile Services', 'Mobile application backend services', '["mobile", "api", "external"]');

-- Insert sample ping monitors
INSERT INTO monitors (project_id, label, periodicity, type, badge_label, host, port)
VALUES
    (1, 'Main DB Server', 60, 'ping', 'Database', 'db.example.com', 5432),
    (1, 'Cache Server', 30, 'ping', 'Cache', 'redis.example.com', 6379),
    (2, 'API Gateway', 60, 'ping', 'API Gateway', 'api.example.com', 443),
    (3, 'Test Server', 120, 'ping', 'Test Environment', 'test.example.com', 22);

-- Insert sample website monitors
INSERT INTO monitors (project_id, label, periodicity, type, badge_label, url, check_status, keywords)
VALUES
    (1, 'Homepage', 60, 'website', 'Website', 'https://www.example.com', true, '["welcome", "login"]'),
    (1, 'Documentation', 120, 'website', 'Docs', 'https://docs.example.com', true, '["documentation", "guide"]'),
    (2, 'Public API Docs', 300, 'website', 'API Docs', 'https://api.example.com/docs', true, '["API", "reference"]'),
    (4, 'Mobile Landing Page', 180, 'website', 'Mobile', 'https://m.example.com', true, '["download", "app"]');

-- Insert sample monitor status (last 24 hours with some failures)
-- For the first monitor (Main DB Server)
INSERT INTO monitor_status (monitor_id, start_time, status, response_time)
VALUES
    (1, NOW() - INTERVAL '24 HOURS', true, 45),
    (1, NOW() - INTERVAL '20 HOURS', true, 48),
    (1, NOW() - INTERVAL '16 HOURS', true, 52),
    (1, NOW() - INTERVAL '12 HOURS', false, 2000), -- An outage
    (1, NOW() - INTERVAL '11 HOURS', false, 2000), -- Still down
    (1, NOW() - INTERVAL '10 HOURS', true, 65),    -- Back up
    (1, NOW() - INTERVAL '6 HOURS', true, 49),
    (1, NOW() - INTERVAL '2 HOURS', true, 51),
    (1, NOW(), true, 47);

-- For the second monitor (Cache Server)
INSERT INTO monitor_status (monitor_id, start_time, status, response_time)
VALUES
    (2, NOW() - INTERVAL '24 HOURS', true, 15),
    (2, NOW() - INTERVAL '20 HOURS', true, 14),
    (2, NOW() - INTERVAL '16 HOURS', true, 16),
    (2, NOW() - INTERVAL '12 HOURS', true, 17),
    (2, NOW() - INTERVAL '8 HOURS', true, 15),
    (2, NOW() - INTERVAL '4 HOURS', true, 14),
    (2, NOW() - INTERVAL '1 HOUR', true, 15),
    (2, NOW(), true, 14);

-- For the third monitor (API Gateway)
INSERT INTO monitor_status (monitor_id, start_time, status, response_time)
VALUES
    (3, NOW() - INTERVAL '24 HOURS', true, 120),
    (3, NOW() - INTERVAL '20 HOURS', true, 125),
    (3, NOW() - INTERVAL '16 HOURS', true, 118),
    (3, NOW() - INTERVAL '12 HOURS', true, 130),
    (3, NOW() - INTERVAL '8 HOURS', false, 3000), -- An outage
    (3, NOW() - INTERVAL '7 HOURS', false, 3000), -- Still down
    (3, NOW() - INTERVAL '6 HOURS', false, 3000), -- Still down
    (3, NOW() - INTERVAL '5 HOURS', true, 150),   -- Back up but slower
    (3, NOW() - INTERVAL '4 HOURS', true, 145),
    (3, NOW() - INTERVAL '2 HOURS', true, 135),
    (3, NOW(), true, 125);

-- For the fourth monitor (Test Server)
INSERT INTO monitor_status (monitor_id, start_time, status, response_time)
VALUES
    (4, NOW() - INTERVAL '24 HOURS', true, 85),
    (4, NOW() - INTERVAL '12 HOURS', true, 92),
    (4, NOW() - INTERVAL '1 HOUR', true, 87),
    (4, NOW(), true, 90);

-- For the fifth monitor (Homepage)
INSERT INTO monitor_status (monitor_id, start_time, status, response_time)
VALUES
    (5, NOW() - INTERVAL '24 HOURS', true, 320),
    (5, NOW() - INTERVAL '20 HOURS', true, 315),
    (5, NOW() - INTERVAL '16 HOURS', true, 330),
    (5, NOW() - INTERVAL '12 HOURS', true, 345),
    (5, NOW() - INTERVAL '8 HOURS', true, 325),
    (5, NOW() - INTERVAL '4 HOURS', true, 318),
    (5, NOW(), true, 310);

-- For the sixth monitor (Documentation)
INSERT INTO monitor_status (monitor_id, start_time, status, response_time)
VALUES
    (6, NOW() - INTERVAL '24 HOURS', true, 410),
    (6, NOW() - INTERVAL '12 HOURS', true, 425),
    (6, NOW() - INTERVAL '6 HOURS', false, 4000), -- Outage
    (6, NOW() - INTERVAL '5 HOURS', true, 450),   -- Back up but slow
    (6, NOW() - INTERVAL '4 HOURS', true, 440),
    (6, NOW() - INTERVAL '2 HOURS', true, 420),
    (6, NOW(), true, 415);

-- For the seventh monitor (Public API Docs)
INSERT INTO monitor_status (monitor_id, start_time, status, response_time)
VALUES
    (7, NOW() - INTERVAL '24 HOURS', true, 280),
    (7, NOW() - INTERVAL '18 HOURS', true, 275),
    (7, NOW() - INTERVAL '12 HOURS', true, 290),
    (7, NOW() - INTERVAL '6 HOURS', true, 285),
    (7, NOW(), true, 278);

-- For the eighth monitor (Mobile Landing Page)
INSERT INTO monitor_status (monitor_id, start_time, status, response_time)
VALUES
    (8, NOW() - INTERVAL '24 HOURS', true, 350),
    (8, NOW() - INTERVAL '18 HOURS', true, 340),
    (8, NOW() - INTERVAL '12 HOURS', false, 4500), -- Outage
    (8, NOW() - INTERVAL '11 HOURS', false, 4200), -- Still down
    (8, NOW() - INTERVAL '10 HOURS', true, 380),  -- Back up but slow
    (8, NOW() - INTERVAL '8 HOURS', true, 365), 
    (8, NOW() - INTERVAL '6 HOURS', true, 360),
    (8, NOW(), true, 345);
