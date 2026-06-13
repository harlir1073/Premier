-- ============ USERS & PERMISSIONS ============

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    UNIQUE(module, action)
);

CREATE TABLE role_permissions (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT REFERENCES roles(id),
    status VARCHAR(20) DEFAULT 'active',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT now()
);

-- ============ CLIENTS / AGENTS ============

CREATE TABLE clients_agents (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(150),
    email VARCHAR(150),
    phone VARCHAR(50),
    address TEXT,
    currency VARCHAR(10) DEFAULT 'USD',
    credit_terms_days INT DEFAULT 0,
    commission_percent NUMERIC(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- ============ SUPPLIERS ============

CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    supplier_type VARCHAR(30) NOT NULL,
    contact_person VARCHAR(150),
    email VARCHAR(150),
    phone VARCHAR(50),
    address TEXT,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_terms_days INT DEFAULT 0,
    bank_details TEXT,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE hotels (
    supplier_id INT PRIMARY KEY REFERENCES suppliers(id) ON DELETE CASCADE,
    city VARCHAR(100),
    country VARCHAR(100),
    star_rating SMALLINT,
    hotel_category VARCHAR(50)
);

CREATE TABLE airlines (
    supplier_id INT PRIMARY KEY REFERENCES suppliers(id) ON DELETE CASCADE,
    iata_code VARCHAR(5),
    country VARCHAR(100)
);

CREATE TABLE transfer_companies (
    supplier_id INT PRIMARY KEY REFERENCES suppliers(id) ON DELETE CASCADE,
    region VARCHAR(100),
    vehicle_types TEXT
);

CREATE TABLE cruise_lines (
    supplier_id INT PRIMARY KEY REFERENCES suppliers(id) ON DELETE CASCADE,
    fleet_info TEXT
);

-- ============ RESERVATIONS ============

CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    booking_reference VARCHAR(30) UNIQUE NOT NULL,
    agent_id INT REFERENCES clients_agents(id),
    lead_passenger_name VARCHAR(150) NOT NULL,
    passenger_count INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pending',
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    notes TEXT
);

CREATE TABLE reservation_items (
    id SERIAL PRIMARY KEY,
    reservation_id INT REFERENCES reservations(id) ON DELETE CASCADE,
    product_type VARCHAR(30) NOT NULL,
    supplier_id INT REFERENCES suppliers(id),
    description VARCHAR(255),
    start_date DATE,
    end_date DATE,

    agent_price NUMERIC(12,2) DEFAULT 0,
    agent_currency VARCHAR(10) DEFAULT 'USD',
    agent_payment_due_date DATE,
    agent_payment_status VARCHAR(20) DEFAULT 'unpaid',
    agent_paid_date DATE,

    supplier_price NUMERIC(12,2) DEFAULT 0,
    supplier_currency VARCHAR(10) DEFAULT 'USD',
    supplier_payment_due_date DATE,
    supplier_payment_status VARCHAR(20) DEFAULT 'unpaid',
    supplier_paid_date DATE,

    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT now()
);

-- ============ PAYMENTS ============

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    reservation_item_id INT REFERENCES reservation_items(id) ON DELETE CASCADE,
    direction VARCHAR(10) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_date DATE NOT NULL,
    method VARCHAR(30),
    reference VARCHAR(100),
    recorded_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT now()
);

-- ============ PAYMENT REQUESTS (to clients/agents) ============

CREATE TABLE payment_requests (
    id SERIAL PRIMARY KEY,
    agent_id INT REFERENCES clients_agents(id),
    request_number VARCHAR(30) UNIQUE NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'draft',
    issued_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE payment_request_items (
    payment_request_id INT REFERENCES payment_requests(id) ON DELETE CASCADE,
    reservation_item_id INT REFERENCES reservation_items(id),
    amount NUMERIC(12,2) NOT NULL,
    PRIMARY KEY (payment_request_id, reservation_item_id)
);

-- ============ NOTIFICATIONS / ALERTS ============

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    reference_table VARCHAR(50),
    reference_id INT,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now()
);

-- ============ AUDIT LOG ============

CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    table_name VARCHAR(50),
    record_id INT,
    action VARCHAR(20),
    changes JSONB,
    created_at TIMESTAMP DEFAULT now()
);

-- ============ SEED DATA ============

INSERT INTO roles (name, description) VALUES
    ('Admin', 'Full system access'),
    ('Accountant', 'Financial data, payments, reports'),
    ('Booker', 'Create and manage reservations'),
    ('Viewer', 'Read-only access');

INSERT INTO permissions (module, action) VALUES
    ('clients_agents','view'), ('clients_agents','create'), ('clients_agents','edit'), ('clients_agents','delete'),
    ('suppliers','view'), ('suppliers','create'), ('suppliers','edit'), ('suppliers','delete'),
    ('reservations','view'), ('reservations','create'), ('reservations','edit'), ('reservations','delete'),
    ('payments','view'), ('payments','create'),
    ('payment_requests','view'), ('payment_requests','create'), ('payment_requests','approve'),
    ('reports','view'),
    ('users','view'), ('users','create'), ('users','edit'), ('users','delete');

-- Admin gets everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name='Admin'), id FROM permissions;

-- Accountant: financial-related
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name='Accountant'), id FROM permissions
WHERE module IN ('clients_agents','suppliers','reservations','payments','payment_requests','reports')
  AND action IN ('view','create','edit','approve');

-- Booker: reservations + read-only master data
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name='Booker'), id FROM permissions
WHERE (module IN ('clients_agents','suppliers') AND action = 'view')
   OR (module = 'reservations' AND action IN ('view','create','edit'));

-- Viewer: view-only across the board
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name='Viewer'), id FROM permissions
WHERE action = 'view';

-- Default admin user (password: Admin123! -- bcrypt hash, change after first login)
INSERT INTO users (full_name, email, password_hash, role_id, status)
VALUES ('System Admin', 'admin@example.com', '$2b$10$8K1p/a0dURXAm7QiTRqHQ.r8c8m6kEMltcF1QY7BdQ2OmRgPNa0Cm', (SELECT id FROM roles WHERE name='Admin'), 'active');
