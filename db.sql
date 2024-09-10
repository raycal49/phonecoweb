CREATE TABLE bank_acc (
    customer_id integer NOT NULL,
    account_number character varying(20) NOT NULL,
    balance double precision NOT NULL
);

-- Sample data for bank_acc
INSERT INTO bank_acc (customer_id, account_number, balance)
VALUES
  (1, '1234567890', 1000.00),
  (2, '9876543210', 750.50),
  (3, '5555555555', 1200.00),
  (4, '1111222233', 800.25),
  (5, '2222333344', 500.00),
  (6, '3333444455', 950.75),
  (7, '4444555566', 600.00),
  (8, '6666777788', 450.30),
  (9, '7777888899', 780.00),
  (10, '8888999900', 1100.50);

-- Create the customer table with a foreign key constraint
CREATE TABLE customer (
    customer_id serial PRIMARY KEY,
    customer_name character varying(255) NOT NULL,
    phone_number character varying(15) NOT NULL,
    phone_plan character varying(255) NOT NULL,
    balance double precision,
);

-- Sample data for customer
INSERT INTO customer (customer_name, phone_number, phone_plan, balance)
VALUES
  ('John Doe', '123-456-7890', 'Prepaid Plan', 1000.00),
  ('Jonas Ryan', '747-810-7620', 'Prepaid Plan', 750.50),
  ('Malika Quinn', '986-854-0589', 'Postpaid Plan', 1200.00),
  ('Ishaq Ali', '414-495-0020', 'Postpaid Plan', 800.25),
  ('Lorraine Ramirez', '205-443-5517', 'Prepaid Plan', 0.00),
  ('Alice Smith', '310-567-8910', 'Prepaid Plan', 500.00),
  ('Bob Martin', '320-678-9012', 'Postpaid Plan', 950.75),
  ('Cathy Johnson', '330-789-0123', 'Prepaid Plan', 600.00),
  ('David Lee', '340-890-1234', 'Postpaid Plan', 450.30),
  ('Eva Brown', '350-901-2345', 'Prepaid Plan', 780.00);

-- Create the phone_plans table
CREATE TABLE phone_plans (
    phone_plan character varying(255) NOT NULL,
    data_limit double precision,
    minute_limit double precision,
    base_monthly_charge double precision,
    data_usage_charge double precision,
    overage_fee double precision
);

-- Sample data for phone_plans
INSERT INTO phone_plans (phone_plan, data_limit, minute_limit, base_monthly_charge, data_usage_charge, overage_fee)
VALUES
('Prepaid Plan', 45, 3000, 55, 0, 0),
('Postpaid Plan', 20, 1200, 25, 0.004, 35);

-- Create the total_usage table
CREATE TABLE total_usage(
    customer_name character varying(255) NOT NULL,
    total_data_used double precision,
    total_minutes_used double precision
);

-- Sample data for total_usage
INSERT INTO total_usage(customer_name, total_data_used, total_minutes_used)
VALUES
('John Doe', 34.15, 1570),
('Jonas Ryan', 47.11, 1300),
('Malika Quinn', 21.33, 1331),
('Ishaq Ali', 17.27, 1152),
('Lorraine Ramirez', 39.54, 499),
('Alice Smith', 28.50, 1620),
('Bob Martin', 50.75, 1400),
('Cathy Johnson', 22.80, 1400),
('David Lee', 18.45, 1100),
('Eva Brown', 35.90, 510);

-- Create the call_log table
CREATE TABLE call_log (
    source_phone_number character varying(15) NOT NULL,
    dest_phone_number character varying(15) NOT NULL,
    duration double precision,
    data_usage double precision
);

-- Sample data for call_log
INSERT INTO call_log(source_phone_number, dest_phone_number, duration, data_usage)
VALUES
('747-810-7620', '414-495-0020', 81, 124),
('986-854-0589', '123-456-7890', 122, 189),
('205-443-5517', '747-810-7620', 7, 13),
('747-810-7620', '414-495-0020', 124, 192),
('205-443-5517', '986-854-0589', 4, 7),
('310-567-8910', '320-678-9012', 45, 80),
('330-789-0123', '350-901-2345', 67, 110),
('320-678-9012', '340-890-1234', 30, 60),
('350-901-2345', '330-789-0123', 30, 40),
('310-567-8910', '320-678-9012', 55, 80);

-- Create the bills table
CREATE TABLE bills (
    customer_id integer REFERENCES customer(customer_id),
    total_amount_owed double precision,
    bill_due_date character varying(255) NOT NULL
);

-- Create the transactions table
CREATE TABLE transactions (
    payment_id serial PRIMARY KEY,
    customer_id integer NOT NULL,
    amount double precision NOT NULL,
    date_of_payment timestamp NOT NULL,
    payment_method character varying(255) NOT NULL
);

-- Add a foreign key constraint to link customer_id in transactions to customer_id in customer
ALTER TABLE transactions
ADD CONSTRAINT fk_payments_customer
FOREIGN KEY (customer_id)
REFERENCES customer (customer_id);
