-- Simple sites table creation (MySQL compatible)
CREATE TABLE sites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_name VARCHAR(100) NOT NULL UNIQUE,
    client_name VARCHAR(255),
    address TEXT,
    phone_primary VARCHAR(20),
    phone_secondary VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add index
CREATE INDEX idx_site_name ON sites(site_name);