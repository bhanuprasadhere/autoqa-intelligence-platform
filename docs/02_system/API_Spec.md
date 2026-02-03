# API Specification

## Base URL
`/api/v1`

## Authentication
All endpoints require a Bearer Token (Supabase JWT) in the header.

## Endpoints

### Projects
* `GET /projects` - List all projects for the user.
* `POST /projects` - Create a new project.
    * Body: `{ "name": "string", "baseUrl": "string" }`

### Scans
* `POST /scans/start` - Trigger a new automated test.
    * Body: `{ "projectId": "uuid", "depth": "number" }`
* `GET /scans/:id` - Get status and summary of a specific scan.
* `GET /scans/:id/logs` - Get detailed logs (the JSON report data).

### Real-time (WebSockets)
* **Event:** `scan.update`
    * Payload: `{ "scanId": "uuid", "status": "running", "log": "Found login form..." }`
    * Usage: To show the "Terminal" effect on the dashboard.