
-- Disaster Preparedness Education System - Database Schema
-- PostgreSQL/SQLite compatible

-- Create database
CREATE DATABASE disaster_education_db;
USE disaster_education_db;

-- Enable UUID extension for PostgreSQL
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Institutions table
CREATE TABLE institutions (
    id SERIAL PRIMARY KEY,
    institution_uuid UUID DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('school', 'college', 'university')),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(10),
    contact_email VARCHAR(120),
    contact_phone VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    emergency_contact VARCHAR(20),
    capacity INTEGER,
    established_year INTEGER,
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_uuid UUID DEFAULT gen_random_uuid(),
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin', 'coordinator', 'parent')),
    institution_id INTEGER REFERENCES institutions(id),
    grade_level VARCHAR(10),
    class_section VARCHAR(10),
    employee_id VARCHAR(50),
    phone_number VARCHAR(20),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10),
    profile_image_url VARCHAR(255),
    preferred_language VARCHAR(10) DEFAULT 'en',
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Disaster types table
CREATE TABLE disaster_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('natural', 'man-made', 'health', 'security', 'technological')),
    severity_levels JSONB DEFAULT '["low", "medium", "high", "critical"]',
    description TEXT,
    icon_url VARCHAR(200),
    color_code VARCHAR(7) DEFAULT '#e74c3c',
    prevention_tips JSONB,
    immediate_actions JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Educational modules table
CREATE TABLE educational_modules (
    id SERIAL PRIMARY KEY,
    module_uuid UUID DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    detailed_description TEXT,
    disaster_type_id INTEGER REFERENCES disaster_types(id),
    target_audience VARCHAR(50) NOT NULL CHECK (target_audience IN ('primary', 'secondary', 'college', 'teacher', 'all')),
    difficulty_level VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('video', 'interactive', 'quiz', 'simulation', 'document', 'game')),
    content_url VARCHAR(300),
    content_data JSONB, -- For storing structured content
    duration_minutes INTEGER DEFAULT 30,
    language VARCHAR(10) DEFAULT 'en',
    tags JSONB DEFAULT '[]',
    prerequisites JSONB DEFAULT '[]', -- Array of required module IDs
    learning_objectives JSONB,
    thumbnail_url VARCHAR(255),
    is_mandatory BOOLEAN DEFAULT FALSE,
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    max_attempts INTEGER DEFAULT 3,
    created_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approval_date TIMESTAMP,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User progress tracking
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    module_id INTEGER REFERENCES educational_modules(id) NOT NULL,
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'certified')),
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    time_spent_minutes INTEGER DEFAULT 0,
    score DECIMAL(5,2),
    attempts_count INTEGER DEFAULT 0,
    best_score DECIMAL(5,2),
    current_section INTEGER DEFAULT 1,
    bookmarks JSONB DEFAULT '[]',
    notes TEXT,
    started_at TIMESTAMP,
    last_accessed TIMESTAMP,
    completed_at TIMESTAMP,
    certification_date TIMESTAMP,
    certification_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, module_id)
);

-- Emergency protocols
CREATE TABLE emergency_protocols (
    id SERIAL PRIMARY KEY,
    protocol_uuid UUID DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    disaster_type_id INTEGER REFERENCES disaster_types(id),
    institution_type VARCHAR(20) CHECK (institution_type IN ('school', 'college', 'university', 'all')),
    severity_level VARCHAR(20) DEFAULT 'medium',
    protocol_steps JSONB NOT NULL, -- Array of step objects
    evacuation_routes JSONB DEFAULT '[]',
    assembly_points JSONB DEFAULT '[]',
    emergency_contacts JSONB DEFAULT '[]',
    resources_needed JSONB DEFAULT '[]',
    safety_equipment JSONB DEFAULT '[]',
    communication_channels JSONB DEFAULT '[]',
    roles_responsibilities JSONB DEFAULT '{}',
    special_considerations JSONB DEFAULT '[]', -- For disabled individuals, etc.
    floor_plans JSONB DEFAULT '[]', -- URLs to floor plan images
    estimated_duration_minutes INTEGER,
    last_drill_date DATE,
    next_scheduled_drill DATE,
    drill_frequency_days INTEGER DEFAULT 90,
    created_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approval_date TIMESTAMP,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts system
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    alert_uuid UUID DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    detailed_message TEXT,
    disaster_type_id INTEGER REFERENCES disaster_types(id),
    severity_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    alert_type VARCHAR(30) DEFAULT 'general' CHECK (alert_type IN ('emergency', 'drill', 'weather', 'security', 'maintenance', 'general')),
    scope VARCHAR(20) DEFAULT 'institution' CHECK (scope IN ('global', 'regional', 'institution', 'grade', 'class')),
    institution_id INTEGER REFERENCES institutions(id),
    target_audience JSONB DEFAULT '["all"]', -- Array of roles/grades to target
    affected_areas JSONB DEFAULT '[]', -- Array of building/area names
    coordinates JSONB, -- Geographic coordinates for location-based alerts
    radius_km DECIMAL(8,2), -- Alert radius in kilometers
    action_required TEXT,
    instructions JSONB DEFAULT '[]', -- Step by step instructions
    contact_info JSONB DEFAULT '[]', -- Emergency contact information
    attachments JSONB DEFAULT '[]', -- URLs to images/documents
    auto_escalate BOOLEAN DEFAULT FALSE,
    escalation_time_minutes INTEGER,
    acknowledgment_required BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id)
);

-- Alert acknowledgments
CREATE TABLE alert_acknowledgments (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER REFERENCES alerts(id) NOT NULL,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    location JSONB, -- User's location when acknowledged
    notes TEXT,
    UNIQUE(alert_id, user_id)
);

-- Assessments
CREATE TABLE assessments (
    id SERIAL PRIMARY KEY,
    assessment_uuid UUID DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    module_id INTEGER REFERENCES educational_modules(id),
    assessment_type VARCHAR(20) DEFAULT 'quiz' CHECK (assessment_type IN ('quiz', 'exam', 'simulation', 'practical')),
    questions JSONB NOT NULL, -- Array of question objects
    total_questions INTEGER NOT NULL,
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    time_limit_minutes INTEGER DEFAULT 30,
    max_attempts INTEGER DEFAULT 3,
    randomize_questions BOOLEAN DEFAULT TRUE,
    randomize_options BOOLEAN DEFAULT TRUE,
    immediate_feedback BOOLEAN DEFAULT FALSE,
    show_correct_answers BOOLEAN DEFAULT TRUE,
    is_certification BOOLEAN DEFAULT FALSE,
    certificate_template VARCHAR(255),
    difficulty_level VARCHAR(20) DEFAULT 'intermediate',
    tags JSONB DEFAULT '[]',
    created_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approval_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User assessment attempts
CREATE TABLE user_assessment_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    assessment_id INTEGER REFERENCES assessments(id) NOT NULL,
    attempt_number INTEGER DEFAULT 1,
    answers JSONB NOT NULL, -- Array of answer objects
    score DECIMAL(5,2),
    total_possible_score DECIMAL(5,2),
    passed BOOLEAN,
    time_taken_minutes INTEGER,
    ip_address INET,
    user_agent TEXT,
    browser_info JSONB,
    proctoring_data JSONB, -- For online proctoring
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Drill records
CREATE TABLE drill_records (
    id SERIAL PRIMARY KEY,
    drill_uuid UUID DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    drill_type VARCHAR(30) NOT NULL CHECK (drill_type IN ('fire', 'earthquake', 'lockdown', 'evacuation', 'medical', 'severe_weather')),
    institution_id INTEGER REFERENCES institutions(id) NOT NULL,
    protocol_id INTEGER REFERENCES emergency_protocols(id),
    scheduled_date TIMESTAMP,
    actual_date TIMESTAMP,
    duration_minutes INTEGER,
    participants_expected INTEGER,
    participants_actual INTEGER,
    evacuation_time_minutes DECIMAL(5,2),
    areas_covered JSONB DEFAULT '[]',
    observers JSONB DEFAULT '[]',
    notes TEXT,
    issues_identified TEXT,
    improvements_suggested TEXT,
    photos JSONB DEFAULT '[]',
    weather_conditions VARCHAR(100),
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    conducted_by INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User drill participation
CREATE TABLE user_drill_participation (
    id SERIAL PRIMARY KEY,
    drill_id INTEGER REFERENCES drill_records(id) NOT NULL,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    participation_status VARCHAR(20) DEFAULT 'expected' CHECK (participation_status IN ('expected', 'participated', 'absent', 'excused')),
    evacuation_time_minutes DECIMAL(5,2),
    assembly_point VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gamification - Achievements
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    category VARCHAR(30) DEFAULT 'learning',
    criteria JSONB NOT NULL, -- Conditions to unlock achievement
    points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User achievements
CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    achievement_id INTEGER REFERENCES achievements(id) NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress_data JSONB,
    UNIQUE(user_id, achievement_id)
);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    notification_uuid UUID DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success', 'alert')),
    category VARCHAR(30) DEFAULT 'system',
    action_url VARCHAR(255),
    action_label VARCHAR(50),
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- System logs
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    log_level VARCHAR(10) NOT NULL CHECK (log_level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
    category VARCHAR(50) DEFAULT 'SYSTEM',
    message TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    request_id UUID,
    session_id VARCHAR(100),
    additional_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_institution ON users(institution_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_module ON user_progress(module_id);
CREATE INDEX idx_user_progress_status ON user_progress(status);
CREATE INDEX idx_alerts_institution ON alerts(institution_id);
CREATE INDEX idx_alerts_active ON alerts(is_active);
CREATE INDEX idx_alerts_severity ON alerts(severity_level);
CREATE INDEX idx_alerts_expires ON alerts(expires_at);
CREATE INDEX idx_modules_audience ON educational_modules(target_audience);
CREATE INDEX idx_modules_type ON educational_modules(content_type);
CREATE INDEX idx_modules_active ON educational_modules(is_active);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Sample data insertion
INSERT INTO disaster_types (name, category, description, icon_url) VALUES
('Earthquake', 'natural', 'Ground shaking caused by tectonic movements', '/icons/earthquake.svg'),
('Fire', 'man-made', 'Uncontrolled burning that threatens life and property', '/icons/fire.svg'),
('Flood', 'natural', 'Overflow of water that submerges usually dry land', '/icons/flood.svg'),
('Cyclone', 'natural', 'Violent rotating storm with high winds', '/icons/cyclone.svg'),
('Pandemic', 'health', 'Disease outbreak affecting large populations', '/icons/pandemic.svg'),
('Chemical Spill', 'man-made', 'Accidental release of hazardous chemicals', '/icons/chemical.svg'),
('Building Collapse', 'man-made', 'Structural failure of buildings', '/icons/building.svg'),
('Severe Weather', 'natural', 'Extreme weather conditions like storms', '/icons/weather.svg');

INSERT INTO achievements (name, description, icon, category, criteria, points) VALUES
('First Steps', 'Complete your first disaster preparedness module', 'medal', 'learning', '{"modules_completed": 1}', 50),
('Fire Safety Expert', 'Complete all fire safety modules with 90%+ score', 'fire', 'expertise', '{"fire_modules_score": 90}', 200),
('Quick Learner', 'Complete 3 modules in one day', 'clock', 'speed', '{"modules_per_day": 3}', 100),
('Perfect Score', 'Get 100% on any assessment', 'trophy', 'achievement', '{"perfect_assessment": 1}', 150),
('Drill Participant', 'Participate in 5 emergency drills', 'shield', 'participation', '{"drills_participated": 5}', 100),
('Helper', 'Help 10 other students with modules', 'helping-hand', 'social', '{"students_helped": 10}', 75),
('Consistency', 'Log in for 7 consecutive days', 'calendar', 'engagement', '{"consecutive_days": 7}', 80),
('Knowledge Seeker', 'Complete modules from 5 different disaster types', 'book', 'diversity', '{"disaster_types_learned": 5}', 250);
