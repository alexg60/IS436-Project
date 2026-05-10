CREATE TABLE departments (
  department_id INT AUTO_INCREMENT PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL UNIQUE,
  location VARCHAR(100)
);

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  department_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_users_role CHECK (role IN ('employee', 'it_technician', 'it_manager', 'admin')),
  CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

CREATE TABLE categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE tickets (
  ticket_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category_id INT NOT NULL,
  priority VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Open',
  submitted_by INT NOT NULL,
  assigned_to INT,
  store_location VARCHAR(100),
  device_type VARCHAR(100),
  device_id VARCHAR(100),
  resolution_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  CONSTRAINT chk_tickets_priority CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  CONSTRAINT chk_tickets_status CHECK (status IN ('Open', 'In Progress', 'Pending', 'Resolved', 'Closed')),
  CONSTRAINT fk_tickets_category FOREIGN KEY (category_id) REFERENCES categories(category_id),
  CONSTRAINT fk_tickets_submitted_by FOREIGN KEY (submitted_by) REFERENCES users(user_id),
  CONSTRAINT fk_tickets_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(user_id)
);

CREATE TABLE ticket_status (
  status_id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  changed_by INT NOT NULL,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ticket_status_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id),
  CONSTRAINT fk_ticket_status_user FOREIGN KEY (changed_by) REFERENCES users(user_id)
);

CREATE TABLE comments (
  comment_id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  user_id INT NOT NULL,
  comment_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id),
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE assets (
  asset_id INT AUTO_INCREMENT PRIMARY KEY,
  asset_name VARCHAR(100) NOT NULL UNIQUE,
  device_type VARCHAR(50) NOT NULL,
  make_model VARCHAR(100),
  serial_number VARCHAR(100) UNIQUE,
  purchase_date DATE,
  warranty_expiry DATE,
  assigned_to INT,
  store_location VARCHAR(100),
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_assets_device_type CHECK (device_type IN ('Laptop', 'POS Terminal', 'Tablet', 'Scanner', 'Printer', 'Other')),
  CONSTRAINT chk_assets_status CHECK (status IN ('Active', 'In Repair', 'Retired', 'Missing')),
  CONSTRAINT fk_assets_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(user_id)
);

CREATE TABLE licenses (
  license_id INT AUTO_INCREMENT PRIMARY KEY,
  software_name VARCHAR(150) NOT NULL,
  vendor VARCHAR(100),
  license_key VARCHAR(200),
  total_seats INT DEFAULT 1,
  seats_in_use INT DEFAULT 0,
  expiry_date DATE,
  purchased_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO departments (department_name, location) VALUES
('IT', 'Corporate HQ'),
('Marketing', 'Corporate HQ'),
('Finance', 'Corporate HQ'),
('Retail Downtown', 'Downtown Store'),
('Retail Uptown', 'Uptown Store'),
('Retail Eastside', 'Eastside Store');

INSERT INTO users (full_name, email, password, role, department_id) VALUES
('Marcus Leo', 'marcus.leo@summitridge.com', 'marcus123', 'admin', 1),
('Jordan Lee', 'jordan.lee@summitridge.com', 'jordan123', 'it_technician', 1),
('Sarah Kim', 'sarah.kim@summitridge.com', 'sarah123', 'it_technician', 1),
('Priya Sharma', 'priya.sharma@summitridge.com', 'priya123', 'it_manager', 1),
('David Nguyen', 'david.nguyen@summitridge.com', 'david123', 'employee', 2),
('Emily Torres', 'emily.torres@summitridge.com', 'emily123', 'employee', 4),
('Carlos Brown', 'carlos.brown@summitridge.com', 'carlos123', 'employee', 5),
('Lisa Chen', 'lisa.chen@summitridge.com', 'lisa123', 'employee', 4),
('Brace Patel', 'brace.patel@summitridge.com', 'brace123', 'employee', 3),
('Nina Watson', 'nina.watson@summitridge.com', 'nina123', 'employee', 6),
('Summit Ridge User', 'user@example.com', 'user123', 'employee', 4),
('Summit Ridge Admin', 'admin@example.com', 'admin123', 'admin', 1);

INSERT INTO categories (category_name) VALUES
('POS System'),
('Hardware'),
('Software'),
('Network'),
('Other');

INSERT INTO tickets (title, description, category_id, priority, status, submitted_by, assigned_to, store_location, device_type, device_id, resolution_note) VALUES
('POS Terminal Down - Register 3','Register 3 at the downtown store is not turning on.',1,'Critical','Closed',6,2,'Downtown Store','POS Terminal','POS-DT-003','Power supply replaced.'),
('Laptop Cannot Connect to VPN','Cannot connect to VPN.',4,'High','Resolved',5,3,'Corporate HQ','Laptop','LT-HQ-021','VPN updated.'),
('Barcode Scanner Not Reading','Scanner not reading.',2,'High','In Progress',7,2,'Uptown Store','Scanner','SCAN-UP-002',NULL),
('Microsoft Office License Expired','Office expired.',3,'Medium','Open',9,NULL,'Corporate HQ','Laptop','LT-HQ-045',NULL),
('Printer Offline','Printer offline.',2,'Medium','Pending',10,3,'Eastside Store','Printer','PRT-ES-001',NULL),
('Password Reset','Locked out.',5,'Low','Closed',8,2,'Downtown Store',NULL,NULL,'Reset done.'),
('Network Outage','No internet.',4,'Critical','In Progress',7,3,'Uptown Store',NULL,NULL,NULL),
('New Hire Laptop Setup','Setup laptop.',3,'Medium','Open',5,NULL,'Corporate HQ','Laptop',NULL,NULL);

INSERT INTO ticket_status (ticket_id, changed_by, old_status, new_status) VALUES
(1,6,NULL,'Open'),
(1,2,'Open','In Progress'),
(1,2,'In Progress','Resolved'),
(1,4,'Resolved','Closed');

INSERT INTO comments (ticket_id, user_id, comment_text, is_internal) VALUES
(1,2,'Power issue confirmed.',TRUE),
(1,6,'Thanks!',FALSE),
(2,3,'VPN fixed.',TRUE);

INSERT INTO assets (asset_name, device_type, make_model, serial_number, purchase_date, warranty_expiry, assigned_to, store_location, status) VALUES
('POS-DT-001','POS Terminal','Epson','SN1','2021-01-01','2024-01-01',6,'Downtown Store','Active'),
('SCAN-UP-002','Scanner','Zebra','SN2','2022-01-01','2025-01-01',7,'Uptown Store','In Repair');

INSERT INTO licenses (software_name, vendor, license_key, total_seats, seats_in_use, expiry_date, purchased_date, notes) VALUES
('Microsoft 365','Microsoft','KEY1',50,47,'2024-08-31','2023-09-01','Renew soon'),
('Adobe CC','Adobe','KEY2',10,6,'2025-01-15','2024-01-15','Marketing use');
