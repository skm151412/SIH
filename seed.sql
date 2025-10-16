-- Use the application database (must exist beforehand)
USE civic_issues;

-- This file used to contain fake seed data but has been modified to only include admin user(s)
-- Note: In production, you should hash passwords before inserting
-- The actual values below are placeholder hashes
INSERT INTO users (name, email, phone, password_hash, role)
SELECT 'Admin User', 'admin@example.com', '9876543210', 
    '$2a$10$hCsgQjAR0aYXKbk8HQ4xBeuDCGq1qnRZ9XZgfDJGcVlyl5MU8yk1S', 'ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com');

-- No fake complaints or notifications are inserted
-- All complaints will now be added through the complaint submission form with real data

/*
Note: To create BCrypt password hashes manually, you can use this Java code:

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordEncoder {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println(encoder.encode("Admin@123"));
        System.out.println(encoder.encode("Staff@123"));
        System.out.println(encoder.encode("User@123"));
    }
}
*/