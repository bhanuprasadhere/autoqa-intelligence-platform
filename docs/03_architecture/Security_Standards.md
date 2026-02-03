# Security Standards

## 1. Authentication
* Never store passwords in plain text. Use Supabase Auth (GoTrue).
* All API routes must check for a valid `Authorization: Bearer <token>` header.

## 2. Data Protection
* **Project Credentials:** If the user saves their own website login details, they must be encrypted using AES-256 before saving to the DB.
* **Logs:** Do not log sensitive user data (like passwords) in the scan logs.

## 3. Rate Limiting
* The "Start Scan" endpoint must be rate-limited (e.g., 5 scans per hour per user) to prevent abuse.

## 4. Robots.txt Compliance
* By default, the crawler must respect `User-Agent: *` rules in `robots.txt` unless the user explicitly overrides this (verifying ownership).