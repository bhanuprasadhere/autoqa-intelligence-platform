# Database Schema (PostgreSQL / Supabase)

## 1. Tables

### `profiles` (Extends Supabase Auth)
* `id`: UUID (Primary Key, links to auth.users)
* `full_name`: Text
* `avatar_url`: Text
* `created_at`: Timestamp

### `projects`
* `id`: UUID (Primary Key)
* `user_id`: UUID (Foreign Key -> profiles.id)
* `name`: Text (e.g., "My E-commerce Site")
* `base_url`: Text (e.g., "https://example.com")
* `created_at`: Timestamp

### `scans`
* `id`: UUID (Primary Key)
* `project_id`: UUID (Foreign Key -> projects.id)
* `status`: Enum ('queued', 'running', 'completed', 'failed')
* `started_at`: Timestamp
* `completed_at`: Timestamp
* `total_pages_scanned`: Integer
* `total_bugs_found`: Integer

### `scan_logs`
* `id`: UUID (Primary Key)
* `scan_id`: UUID (Foreign Key -> scans.id)
* `log_level`: Enum ('info', 'warning', 'error', 'critical')
* `message`: Text (e.g., "Input field 'email' crashed on input 'admin@'")
* `url_path`: Text (The specific page where it happened)
* `screenshot_url`: Text (Link to Supabase Storage)
* `created_at`: Timestamp

## 2. Row Level Security (RLS) Policies
* **Users:** Can only read/write their own `projects` and `scans`.
* **System:** The Backend API has `service_role` access to write all logs.