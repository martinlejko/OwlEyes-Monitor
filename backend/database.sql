-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    tags JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create monitors table
CREATE TABLE IF NOT EXISTS monitors (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    label VARCHAR(255) NOT NULL,
    periodicity INTEGER NOT NULL CHECK (periodicity >= 5 AND periodicity <= 300),
    type VARCHAR(50) NOT NULL,
    badge_label VARCHAR(255) NOT NULL,
    
    -- Ping monitor specific
    host VARCHAR(255),
    port INTEGER,
    
    -- Website monitor specific
    url VARCHAR(2083), -- Max URL length
    check_status BOOLEAN DEFAULT FALSE,
    keywords JSONB DEFAULT '[]'::JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_project
        FOREIGN KEY(project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE
);

-- Create monitor status table
CREATE TABLE IF NOT EXISTS monitor_status (
    id SERIAL PRIMARY KEY,
    monitor_id INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    status BOOLEAN NOT NULL,
    response_time INTEGER NOT NULL,
    
    CONSTRAINT fk_monitor
        FOREIGN KEY(monitor_id)
        REFERENCES monitors(id)
        ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_label ON projects(label);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_monitors_project_id ON monitors(project_id);
CREATE INDEX IF NOT EXISTS idx_monitors_type ON monitors(type);
CREATE INDEX IF NOT EXISTS idx_monitors_label ON monitors(label);

CREATE INDEX IF NOT EXISTS idx_monitor_status_monitor_id ON monitor_status(monitor_id);
CREATE INDEX IF NOT EXISTS idx_monitor_status_start_time ON monitor_status(start_time);
CREATE INDEX IF NOT EXISTS idx_monitor_status_status ON monitor_status(status);

-- Create a function for finding monitors with specific status
CREATE OR REPLACE FUNCTION get_monitors_with_status(status_filter BOOLEAN)
RETURNS TABLE (
    monitor_id INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ms.monitor_id
    FROM monitor_status ms
    WHERE ms.start_time = (
        SELECT MAX(start_time)
        FROM monitor_status
        WHERE monitor_id = ms.monitor_id
    )
    AND ms.status = status_filter;
END;
$$ LANGUAGE plpgsql; 