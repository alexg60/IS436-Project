CREATE TABLE Products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    item_number VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0
);

CREATE TABLE Customers (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    shipping_address TEXT NOT NULL
);

CREATE TABLE Carts (
    cart_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
);

CREATE TABLE Cart_Items (
    cart_item_id INT PRIMARY KEY AUTO_INCREMENT,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    FOREIGN KEY (cart_id) REFERENCES Carts(cart_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

CREATE TABLE Orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2),
    order_status ENUM('Pending', 'Paid', 'Shipped', 'Cancelled') DEFAULT 'Pending',
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
);

CREATE TABLE Order_Items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL, -- Price frozen at checkout
    FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

CREATE TABLE Payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100) UNIQUE,
    amount_paid DECIMAL(10, 2),
    payment_status VARCHAR(50),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id)
);

INSERT INTO Products (item_number, product_name, price, stock_quantity) VALUES 
('PG-BallKit', 'Deluxe Ball Kit (10 Pack)', 34.00, 45),
('TORN-01', 'Tornado Official Ball', 4.50, 120),
('BONZ-02', 'Bonzini Yellow Cork Ball', 3.75, 80),
('WRAP-05', 'Master Grip Tape - Black', 2.95, 200),
('LUBE-01', 'Foosball Rod Silicone', 8.50, 30);

-- Customers 
INSERT INTO Customers (first_name, last_name, email, phone, shipping_address) VALUES 
('Alex', 'Rivers', 'arivers@email.com', '410-555-0199', '123 Goal St, Baltimore, MD 21250'),
('Jordan', 'Lee', 'jlee88@provider.net', '512-555-2234', '456 Table Rd, Austin, TX 78701'),
('Casey', 'Morgan', 'cmorgan@web.com', '303-555-8812', '789 Spin Blvd, Denver, CO 80202'),
('Taylor', 'Swift', 'tswift@example.com', '615-555-1313', '13 Nashville Way, TN 37201'),
('Riley', 'Parker', 'rparker@foos.org', '206-555-4455', '99 Rod Ln, Seattle, WA 98101');

-- Active Carts
INSERT INTO Carts (customer_id) VALUES (1), (2), (5);

-- Cart Items
INSERT INTO Cart_Items (cart_id, product_id, quantity) VALUES 
(1, 1, 1), -- Alex has a Deluxe Ball Kit
(2, 2, 4), -- Jordan has 4 Tornado balls
(3, 1, 1), -- Riley has a Deluxe Ball Kit
(3, 3, 2); -- Riley also has 2 Bonzini balls

-- Completed Orders
INSERT INTO Orders (customer_id, total_amount, order_status) VALUES 
(1, 34.00, 'Paid'),
(2, 18.00, 'Shipped'),
(4, 42.50, 'Paid'),
(5, 41.50, 'Pending');

-- Order Items (The history of the sales)
INSERT INTO Order_Items (order_id, product_id, quantity, unit_price) VALUES 
(1, 1, 1, 34.00), -- Order 1: Deluxe Ball Kit
(2, 2, 4, 4.50),  -- Order 2: 4 Tornado balls
(3, 1, 1, 34.00), -- Order 3: Deluxe Ball Kit...
(3, 5, 1, 8.50),  -- ...and Silicone
(4, 1, 1, 34.00), -- Order 4: Deluxe Ball Kit...
(4, 3, 2, 3.75);  -- ...and 2 Cork balls

-- Payment Transactions
INSERT INTO Payments (order_id, payment_method, transaction_id, amount_paid, payment_status) VALUES 
(1, 'PayPal', 'PAY-928374', 34.00, 'Completed'),
(2, 'Credit Card', 'CC-102938', 18.00, 'Completed'),
(3, 'Apple Pay', 'AP-556677', 42.50, 'Completed');