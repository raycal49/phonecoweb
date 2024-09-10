BEGIN

                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name IN ('bank_acc', 'customer', 'phone_plans', 'total_usage', 'call_log', 'bills', 'transactions')
                ) AS tables_exist;
            
COMMIT
BEGIN
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name IN ('bank_acc', 'customer', 'phone_plans', 'total_usage', 'call_log', 'bills', 'transactions')
            ) AS tables_exist;
        

            CREATE TABLE IF NOT EXISTS bank_acc (
                account_id serial PRIMARY KEY,
                customer_id integer NOT NULL,
                account_number character varying(20) NOT NULL,
                balance double precision NOT NULL
            );
        

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
        

            CREATE TABLE IF NOT EXISTS customer (
                customer_id serial PRIMARY KEY,
                customer_name character varying(255) NOT NULL,
                phone_number character varying(15) NOT NULL,
                phone_plan character varying(255) NOT NULL,
                balance double precision,
                bank_acc_id integer REFERENCES bank_acc(account_id)
            );
        

            INSERT INTO customer (customer_name, phone_number, phone_plan, balance, bank_acc_id)
            VALUES
            ('John Doe', '123-456-7890', 'Prepaid Plan', 1000.00, 1),
                ('Jonas Ryan', '747-810-7620', 'Prepaid Plan', 750.50, 2),
                ('Malika Quinn', '986-854-0589', 'Postpaid Plan', 1200.00, 3),
                ('Ishaq Ali', '414-495-0020', 'Postpaid Plan', 800.25, 4),
                ('Lorraine Ramirez', '205-443-5517', 'Prepaid Plan', 0.00, 5),
                ('Alice Smith', '310-567-8910', 'Prepaid Plan', 500.00, 6),
                ('Bob Martin', '320-678-9012', 'Postpaid Plan', 950.75, 7),
                ('Cathy Johnson', '330-789-0123', 'Prepaid Plan', 600.00, 8),
                ('David Lee', '340-890-1234', 'Postpaid Plan', 450.30, 9),
                ('Eva Brown', '350-901-2345', 'Prepaid Plan', 780.00, 10);
        

            CREATE TABLE IF NOT EXISTS phone_plans (
                phone_plan character varying(255) NOT NULL,
                data_limit double precision,
                minute_limit double precision,
                base_monthly_charge double precision,
                data_usage_charge double precision,
                overage_fee double precision
            );
        

            INSERT INTO phone_plans (phone_plan, data_limit, minute_limit, base_monthly_charge, data_usage_charge, overage_fee)
            VALUES
            ('Prepaid Plan', 45, 3000, 55, 0, 0),
            ('Postpaid Plan', 20, 1200, 0, 0.004, 35);
        

            CREATE TABLE IF NOT EXISTS total_usage(
                customer_name character varying(255) NOT NULL,
                total_data_used double precision,
                total_minutes_used double precision
            );
        

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
        

            CREATE TABLE IF NOT EXISTS call_log (
                source_phone_number character varying(15) NOT NULL,
                dest_phone_number character varying(15) NOT NULL,
                duration double precision,
                data_usage double precision
            );
        

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
        

            CREATE TABLE IF NOT EXISTS transactions (
                payment_id serial PRIMARY KEY,
                customer_id integer NOT NULL,
                amount double precision NOT NULL,
                date_of_payment timestamp NOT NULL,
                payment_method character varying(255) NOT NULL
            );
        

            ALTER TABLE transactions
            ADD CONSTRAINT fk_payments_customer
            FOREIGN KEY (customer_id)
            REFERENCES customer (customer_id);
        

            CREATE TABLE IF NOT EXISTS bills (
                customer_id integer,
                total_amount_owed double precision,
                bill_due_date character varying(255) NOT NULL
            );
        
SELECT * FROM customer;
SELECT * FROM phone_plans WHERE phone_plan = $1 -- Params: Prepaid Plan
SELECT * FROM total_usage WHERE customer_name = $1 -- Params: John Doe
INSERT INTO bills (customer_id, total_amount_owed, bill_due_date) VALUES ($1, $2, $3) -- Params: 1, 55, '12/22/2023'
SELECT * FROM phone_plans WHERE phone_plan = $1 -- Params: Prepaid Plan
SELECT * FROM total_usage WHERE customer_name = $1 -- Params: Jonas Ryan
INSERT INTO bills (customer_id, total_amount_owed, bill_due_date) VALUES ($1, $2, $3) -- Params: 2, 55, '12/22/2023'
SELECT * FROM phone_plans WHERE phone_plan = $1 -- Params: Postpaid Plan
SELECT * FROM total_usage WHERE customer_name = $1 -- Params: Malika Quinn
INSERT INTO bills (customer_id, total_amount_owed, bill_due_date) VALUES ($1, $2, $3) -- Params: 3, 70, '12/22/2023'
SELECT * FROM phone_plans WHERE phone_plan = $1 -- Params: Postpaid Plan
SELECT * FROM total_usage WHERE customer_name = $1 -- Params: Ishaq Ali
INSERT INTO bills (customer_id, total_amount_owed, bill_due_date) VALUES ($1, $2, $3) -- Params: 4, 0, '12/22/2023'
SELECT * FROM phone_plans WHERE phone_plan = $1 -- Params: Prepaid Plan
SELECT * FROM total_usage WHERE customer_name = $1 -- Params: Lorraine Ramirez
INSERT INTO bills (customer_id, total_amount_owed, bill_due_date) VALUES ($1, $2, $3) -- Params: 5, 55, '12/22/2023'
SELECT * FROM phone_plans WHERE phone_plan = $1 -- Params: Prepaid Plan
SELECT * FROM total_usage WHERE customer_name = $1 -- Params: Alice Smith
INSERT INTO bills (customer_id, total_amount_owed, bill_due_date) VALUES ($1, $2, $3) -- Params: 6, 55, '12/22/2023'
SELECT * FROM phone_plans WHERE phone_plan = $1 -- Params: Postpaid Plan
SELECT * FROM total_usage WHERE customer_name = $1 -- Params: Bob Martin
INSERT INTO bills (customer_id, total_amount_owed, bill_due_date) VALUES ($1, $2, $3) -- Params: 7, 70, '12/22/2023'
SELECT * FROM phone_plans WHERE phone_plan = $1 -- Params: Prepaid Plan
SELECT * FROM total_usage WHERE customer_name = $1 -- Params: Cathy Johnson
INSERT INTO bills (customer_id, total_amount_owed, bill_due_date) VALUES ($1, $2, $3) -- Params: 8, 55, '12/22/2023'
SELECT * FROM phone_plans WHERE phone_plan = $1 -- Params: Postpaid Plan
SELECT * FROM total_usage WHERE customer_name = $1 -- Params: David Lee
INSERT INTO bills (customer_id, total_amount_owed, bill_due_date) VALUES ($1, $2, $3) -- Params: 9, 0, '12/22/2023'
SELECT * FROM phone_plans WHERE phone_plan = $1 -- Params: Prepaid Plan
SELECT * FROM total_usage WHERE customer_name = $1 -- Params: Eva Brown
INSERT INTO bills (customer_id, total_amount_owed, bill_due_date) VALUES ($1, $2, $3) -- Params: 10, 55, '12/22/2023'
SELECT * FROM customer;
SELECT * FROM bank_acc;
SELECT * FROM phone_plans;
SELECT * FROM total_usage;
SELECT * FROM call_log;
SELECT * FROM bills;
SELECT * FROM transactions;
BEGIN
BEGIN

                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name IN ('bank_acc', 'customer', 'phone_plans', 'total_usage', 'call_log', 'bills', 'transactions')
                ) AS tables_exist;
            

                DROP TABLE bank_acc, customer, phone_plans, total_usage, call_log, bills, transactions;
            
COMMIT
BEGIN

                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name IN ('bank_acc', 'customer', 'phone_plans', 'total_usage', 'call_log', 'bills', 'transactions')
                ) AS tables_exist;
            
COMMIT
BEGIN

                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name IN ('bank_acc', 'customer', 'phone_plans', 'total_usage', 'call_log', 'bills', 'transactions')
                ) AS tables_exist;
            
COMMIT
BEGIN

                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name IN ('bank_acc', 'customer', 'phone_plans', 'total_usage', 'call_log', 'bills', 'transactions')
                ) AS tables_exist;
            
COMMIT
BEGIN

                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name IN ('bank_acc', 'customer', 'phone_plans', 'total_usage', 'call_log', 'bills', 'transactions')
                ) AS tables_exist;
            
COMMIT
