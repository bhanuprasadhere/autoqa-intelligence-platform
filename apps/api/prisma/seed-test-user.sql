-- Create test user profile for development
-- This profile is referenced by the hardcoded userId in the frontend

INSERT INTO profiles (id, full_name, role, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Test User',
    'admin',
    NOW()
)
ON CONFLICT (id) DO NOTHING;
