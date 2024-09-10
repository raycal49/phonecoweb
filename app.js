//Download nodejs(https://nodejs.org/en/download)
//Run following command to install libraries: npm install express pg
//Alter ./creds.json with your local psql credentials
//Start server using command: node hw2.js
//Open browser and go to http://localhost:3000/;

const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3001;

const creds = require('./creds.json');
const pool = new Pool(creds);

const fs = require('fs');

function append(logName, sqlStatement) {
    fs.appendFile(logName, sqlStatement, (err, fd) => {
        if (err) throw err;
    })
}

app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {

    try {
            let start_time = new Date().getTime();
            
            append('transaction.sql', 'BEGIN\n');

            await pool.query('BEGIN');

            const tablesExistQuery = `
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name IN ('bank_acc', 'customer', 'phone_plans', 'total_usage', 'call_log', 'bills', 'transactions')
                ) AS tables_exist;
            `;

            append('transaction.sql', `${tablesExistQuery}\n`);

            const { rows } = await pool.query(tablesExistQuery);
            const tablesExist = rows[0].tables_exist;

             // Drop tables if they exist
        if (tablesExist) {
            const dropTablesQuery =`
                DROP TABLE bank_acc, customer, phone_plans, total_usage, call_log, bills, transactions;
            `;

            await pool.query(dropTablesQuery);

            // Log the drop tables query
            append('transaction.sql', `${dropTablesQuery}\n`);
        }

            await pool.query('COMMIT')
            
            append('transaction.sql', 'COMMIT\n');
            
            let end_time = new Date().getTime();
            let duration = (end_time - start_time) / 10000
        }
        catch (error){
        await pool.query('ROLLBACK');
        append('transaction.sql', 'ROLLBACK\n');
        res.status(500).send('Error: ' + error.message);
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Homepage</title>
        </head>
        <body>
            <h1> Welcome to the Faux Mobile website </h1>
            <a href="/log"> Click here to view your call history. </a>
            <br>
            <a href="/datamin"> Click here to request your monthly data and minute usage. </a>
            <br>
            <a href="/plan"> Click here to view your current phone plan. </a>
            <br>
            <a href="/billing"> Click here to see your monthly bill. </a>
            <br>
            <a href="/sendpayment"> Click here to make a payment. </a>
            <br>
            <a href="/init-tables"> Click here to initialize tables. </a>
            <br>
            <a href="/view-tables"> Click here to view table contents. </a>
            <br>
            <a href="/view-query"> Click here to view SQL queries </a>
            <br>
            <a href="/view-transaction"> Click here to view SQL transactions </a>
        </body>
    `);
});

app.get('/log', async (req, res) => {
    const phone_number = req.query.phone_number;
    let logHtml = "";
    let queryStatement = "";

    try {
        if (phone_number) {
            queryStatement = `
                SELECT l.source_phone_number, l.dest_phone_number, SUM(l.duration) AS total_duration, SUM(l.data_usage) AS total_data_usage
                FROM call_log l
                WHERE l.source_phone_number = $1
                GROUP BY l.source_phone_number, l.dest_phone_number
            `;

            const result = await pool.query(queryStatement, [phone_number]);

            if (result.rows.length > 0) {
                logHtml = result.rows.map((row) => {
                    return `<p>Source Phone Number: ${row.source_phone_number}, 
                                Destination Phone Number: ${row.dest_phone_number}, 
                                Total Duration: ${row.total_duration} minutes,
                                Total Data Usage: ${row.total_data_usage} MB</p>`;
                }).join('');
            } else {
                logHtml = `<p>No call logs found for the provided phone number.</p>`;
            }

            append('query.sql', queryStatement);
        }
    } catch (error) {
        return res.status(500).send("Error: " + error.message);
    }

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title> Call Log</title>
        </head>
        <body>
            <h1>Call Log</h1>
            ${logHtml}
            <div>
                <form action="/log" method="GET">
                    <label for="phone_number">Enter your phone number:</label>
                    <input type="text" name="phone_number" id="phone_number" required>
                    <button type="submit">Submit</button>
                    <button type="button" onclick="window.history.back();">Cancel</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

app.get('/datamin', async (req, res) => {
    const customerName = req.query.customerName;
    let dataMinUsageHtml = "";

    try {
        let queryStatement = '';
        
        if (customerName) {
            queryStatement = `
                SELECT t.customer_name, SUM(t.total_data_used) AS total_data_used, SUM(t.total_minutes_used) AS total_minutes_used
                FROM total_usage t
                JOIN customer c 
                ON t.customer_name = c.customer_name
                WHERE t.customer_name = $1
                GROUP BY t.customer_name
            `;

            const result = await pool.query(queryStatement, [customerName]);

            if (result.rows.length > 0) {
                const row = result.rows[0];
                dataMinUsageHtml = `<p>Name: ${row.customer_name}, Total Data Used: ${row.total_data_used}, Total Minutes Used: ${row.total_minutes_used}</p>`;
            }

            append('query.sql', queryStatement);
        }

    } catch (error) {
        return res.status(500).send("Error: " + error.message);
    }

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Total Monthly Usage</title>
        </head>
        <body>
            <h1>Total Monthly Usage</h1>
            ${dataMinUsageHtml}
            <div>
                <form action="/datamin" method="GET">
                    <label for="customerName">Enter your name:</label>
                    <input type="text" name="customerName" id="customerName" required>
                    <input type="submit" value="Get Total Monthly Usage"/>
                    <button type="button" onclick="window.history.back();">Cancel</button>
                </form>
            </div>
        </body>
        </html>
    `);
});


app.get('/plan', async (req, res) => {
    const customerName = req.query.customerName;
    let planHtml = "";

    try {
        let queryStatement = '';

        if (customerName) {
            queryStatement = `
                SELECT c.customer_name, p.phone_plan, p.data_limit, p.minute_limit, p.base_monthly_charge, p.data_usage_charge, p.overage_fee
                FROM customer c
                JOIN phone_plans p 
                ON p.phone_plan = c.phone_plan
                WHERE c.customer_name = $1
            `;

            const result = await pool.query(queryStatement, [customerName]);

            if (result.rows.length > 0) {
                const row = result.rows[0];

                planHtml = `<p>Name: ${row.customer_name}, Phone Plan: ${row.phone_plan}, Data Limit: ${row.data_limit}, Min Limit: ${row.minute_limit},
                            Base Monthly Charge: ${row.base_monthly_charge}, Data Usage Charge Rate: ${row.data_usage_charge}, Overage Fee Amount: ${row.overage_fee}</p>`;
            }

            append('query.sql', queryStatement);
        }

    } catch (error) {
        return res.status(500).send("Error: " + error.message);
    }

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Phone Plan</title>
        </head>
        <body>
            <h1>Phone Plan</h1>
            ${planHtml}
            <div>
                <form action="/plan" method="GET">
                    <label for="customerName">Enter your name:</label>
                    <input type="text" name="customerName" id="customerName" required>
                    <button type="submit">Submit</button>
                    <button type="button" onclick="window.history.back();">Cancel</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

app.get('/billing', async (req, res) => {
    const customerID = req.query.customerID;
    let billHtml = "";

    try {
        let queryStatement = '';

        if (customerID) {
            queryStatement = `
                SELECT c.customer_name, b.bill_due_date, p.base_monthly_charge, p.data_usage_charge, p.overage_fee, b.total_amount_owed
                FROM bills b
                JOIN customer c 
                ON b.customer_id = c.customer_id
                JOIN phone_plans p
                ON c.phone_plan = p.phone_plan
                WHERE c.customer_ID = $1
            `;

            const result = await pool.query(queryStatement, [customerID]);

            if (result.rows.length > 0) {
                const row = result.rows[0];
                billHtml = `<p>Name: ${row.customer_name}, Date Due: ${row.bill_due_date}, Base Monthly Fee: ${row.base_monthly_charge}
                            Data Usage Fee: ${row.data_usage_charge}, Overage Fee: ${row.overage_fee}, Total Amount: ${row.total_amount_owed}</p>`;
            }

            append('query.sql', queryStatement);
        }

    } catch (error) {
        return res.status(500).send("Error: " + error.message);
    }

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Monthly Bill</title>
        </head>
        <body>
            <h1>Monthly Bill</h1>
            ${billHtml}
            <div>
                <form action="/billing" method="GET">
                    <label for="customerID">Enter your customer id number:</label>
                    <input type="text" name="customerID" id="customerID" required>
                    <button type="submit">Submit</button>
                    <button type="button" onclick="window.history.back();">Cancel</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// Handle payment submission and update database
app.post('/make-payment', async (req, res) => {
    const customerName = req.body.customerName;
    const amount = parseFloat(req.body.amount);
    const paymentType = req.body.paymentType;
    let start_time = new Date().getTime();

    try {

        append('transaction.sql', 'BEGIN\n');

        await pool.query('BEGIN');

        // Update the customer's balance in the customer relation based on payment type
        const customerQuery = paymentType === 'credit'
            ? `UPDATE customer SET balance = balance + $1 WHERE customer_name = $2`
            : `UPDATE customer SET balance = balance - $1 WHERE customer_name = $2`;

        append('transaction.sql', `${customerQuery}\n`);

        await pool.query(customerQuery, [amount, customerName]);

        // Retrieve the customer's account information from the bank_acc table
        const accountQuery = `
            SELECT account_id, balance
            FROM bank_acc
            WHERE customer_id = (SELECT customer_id FROM customer WHERE customer_name = $1);
        `;

        append('transaction.sql', `${accountQuery}\n`);

        const accountResult = await pool.query(accountQuery, [customerName]);
        
        if (accountResult.rows.length === 1) {
            const account = accountResult.rows[0];
            const updatedBalance = paymentType === 'credit'
                ? account.balance + amount
                : account.balance - amount;

            // Update the bank account relation's balance to match the customer relation's balance
            const updateAccountQuery = 'UPDATE bank_acc SET balance = $1 WHERE account_id = $2';

            append('transaction.sql', `${updateAccountQuery}\n`);

            await pool.query(updateAccountQuery, [updatedBalance, account.account_id]);
        } else {
            throw new Error('Bank account not found for this customer.');
        }

        // Insert the payment transaction into the transactions table
        const insertPaymentQuery = `
            INSERT INTO transactions (customer_id, amount, date_of_payment, payment_method)
             SELECT customer_id, $1, NOW(), 'Card' FROM customer
             WHERE customer_name = $2;
        `;

        await pool.query(insertPaymentQuery, [amount, customerName]);

        const updateBillsQuery =`
            UPDATE bills
             SET total_amount_owed = total_amount_owed - $1
             WHERE customer_id = (SELECT customer_id FROM customer WHERE customer_name = $2)
        `;

        const deleteBillsQuery =`
            DELETE FROM bills
             WHERE total_amount_owed <= 0
             AND customer_id = (SELECT customer_id FROM customer WHERE customer_name = $1)
        `;
        
        append('transaction.sql', `${updateBillsQuery}\n${deleteBillsQuery}\n`);

        await pool.query(updateBillsQuery, [amount, customerName]);
        await pool.query(deleteBillsQuery, [customerName]);

        await pool.query('COMMIT');

        append('transaction.sql', 'COMMIT\n');
        
        let end_time = new Date().getTime();

        let duration = (end_time - start_time) / 10000;

        res.redirect(`/payment-success?duration=${duration}`);

    } catch (error) {
        await pool.query('ROLLBACK');

        append('transaction.sql', 'ROLLBACK\n');

        res.status(500).send('Error: ' + error.message);
    }
});

app.get('/payment-success', (req, res) => {

    let duration = req.query.duration

    res.send(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Payment Successful</title>
            </head>
            <body>
                <h1>Payment Successful</h1>
                <p>Execution time: ${duration} ms</p>
            </body>
        </html>`);
});


app.get('/init-tables', async (req, res) => {

    try {

        if (req.query.confirmation === 'true') {

            await pool.query('BEGIN');

            append('transaction.sql', 'BEGIN');

            const tablesExistQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name IN ('bank_acc', 'customer', 'phone_plans', 'total_usage', 'call_log', 'bills', 'transactions')
            ) AS tables_exist;
        `;

        await pool.query(tablesExistQuery)

        append('transaction.sql', `${tablesExistQuery}\n`);

        const { rows } = await pool.query(tablesExistQuery);
        const tablesExist = rows[0].tables_exist;

        // Drop tables if they exist
        if (tablesExist) {
            const dropTablesQuery =`
                DROP TABLE bank_acc, customer, phone_plans, total_usage, call_log, bills, transactions;
            `;

            await pool.query(dropTablesQuery);

            append('transaction.sql', `${dropTablesQuery}\n`);
        }

        // Create the bank_acc table
        const createBankAcc = `
            CREATE TABLE IF NOT EXISTS bank_acc (
                account_id serial PRIMARY KEY,
                customer_id integer NOT NULL,
                account_number character varying(20) NOT NULL,
                balance double precision NOT NULL
            );
        `;

        await pool.query(createBankAcc);

        append('transaction.sql', `${createBankAcc}\n`);

        // Insert sample data for bank_acc
        const insertBankInfo = `
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
        `;

        await pool.query(insertBankInfo)

        append('transaction.sql', `${insertBankInfo}\n`);

        // Create the customer table with a foreign key constraint
        const createCustomerTable = `
            CREATE TABLE IF NOT EXISTS customer (
                customer_id serial PRIMARY KEY,
                customer_name character varying(255) NOT NULL,
                phone_number character varying(15) NOT NULL,
                phone_plan character varying(255) NOT NULL,
                balance double precision,
                bank_acc_id integer REFERENCES bank_acc(account_id)
            );
        `;

        await pool.query(createCustomerTable);

        append('transaction.sql', `${createCustomerTable}\n`);

        // Insert sample data for customer
        const insertCustomerData = `
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
        `;

        await pool.query(insertCustomerData);

        append('transaction.sql', `${insertCustomerData}\n`);

        // Create the phone_plans table
        const createPhonePlans = `
            CREATE TABLE IF NOT EXISTS phone_plans (
                phone_plan character varying(255) NOT NULL,
                data_limit double precision,
                minute_limit double precision,
                base_monthly_charge double precision,
                data_usage_charge double precision,
                overage_fee double precision
            );
        `;

        await pool.query(createPhonePlans);
        append('transaction.sql', `${createPhonePlans}\n`);

        // Insert sample data for phone_plans
        const insertPhonePlans = `
            INSERT INTO phone_plans (phone_plan, data_limit, minute_limit, base_monthly_charge, data_usage_charge, overage_fee)
            VALUES
            ('Prepaid Plan', 45, 3000, 55, 0, 0),
            ('Postpaid Plan', 20, 1200, 0, 0.004, 35);
        `;

        await pool.query(insertPhonePlans);
        append('transaction.sql', `${insertPhonePlans}\n`);

        // Create the total_usage table
        const createTotalUsage = `
            CREATE TABLE IF NOT EXISTS total_usage(
                customer_name character varying(255) NOT NULL,
                total_data_used double precision,
                total_minutes_used double precision
            );
        `;

        await pool.query(createTotalUsage);
        append('transaction.sql', `${createTotalUsage}\n`);

        // Insert sample data for total_usage
        const insertTotalUsage = `
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
        `;

        await pool.query(insertTotalUsage);
        append('transaction.sql', `${insertTotalUsage}\n`);

        // Create the call_log table
                const createCallLog = `
            CREATE TABLE IF NOT EXISTS call_log (
                source_phone_number character varying(15) NOT NULL,
                dest_phone_number character varying(15) NOT NULL,
                duration double precision,
                data_usage double precision
            );
        `;

        await pool.query(createCallLog);
        append('transaction.sql', `${createCallLog}\n`);

        // Insert sample data for call_log
        const insertCallLog = `
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
        `;

        await pool.query(insertCallLog);
        append('transaction.sql', `${insertCallLog}\n`);

        // Create the transactions table
        const createTransactions = `
            CREATE TABLE IF NOT EXISTS transactions (
                payment_id serial PRIMARY KEY,
                customer_id integer NOT NULL,
                amount double precision NOT NULL,
                date_of_payment timestamp NOT NULL,
                payment_method character varying(255) NOT NULL
            );
        `;

        await pool.query(createTransactions);
        append('transaction.sql', `${createTransactions}\n`);

        // Add a foreign key constraint to link customer_id in transactions to customer_id in customer
        const alterPaymentsMade = `
            ALTER TABLE transactions
            ADD CONSTRAINT fk_payments_customer
            FOREIGN KEY (customer_id)
            REFERENCES customer (customer_id);
        `;

        await pool.query(alterPaymentsMade);
        append('transaction.sql', `${alterPaymentsMade}\n`);

        // Create the bills table
        const createBills = `
            CREATE TABLE IF NOT EXISTS bills (
                customer_id integer,
                total_amount_owed double precision,
                bill_due_date character varying(255) NOT NULL
            );
        `;

        await pool.query(createBills);
        append('transaction.sql', `${createBills}\n`);

        let start_time = new Date().getTime();

        // Initialize the bills table.

        // Get all customers
        const customers = await pool.query('SELECT * FROM customer');
        append('transaction.sql', 'SELECT * FROM customer;\n');

    for (let i = 0; i < customers.rows.length; i++) {
    const customer = customers.rows[i];

    // Log and Get the details of the customer's phone plan
    const planQuery = 'SELECT * FROM phone_plans WHERE phone_plan = $1';
    append('transaction.sql', `${planQuery} -- Params: ${customer.phone_plan}\n`);
    const plan = await pool.query(planQuery, [customer.phone_plan]);

    // Assuming there's only one plan per user, we just grab that plan/row
    if (plan.rows.length > 0) {
        const phonePlan = plan.rows[0];

        // Log and Grab the total usage for this customer
        const usageQuery = 'SELECT * FROM total_usage WHERE customer_name = $1';
        append('transaction.sql', `${usageQuery} -- Params: ${customer.customer_name}\n`);
        const usage = await pool.query(usageQuery, [customer.customer_name]);

        // Since we only have one row per user in total_usage, grab that row
        if (usage.rows.length > 0) {
            const totalUsage = usage.rows[0];

            // Calculate bill
            const baseCharge = phonePlan.base_monthly_charge;
            const dataOverage = Math.max(0, totalUsage.total_data_used - phonePlan.data_limit);
            const minuteOverage = Math.max(0, totalUsage.total_minutes_used - phonePlan.minute_limit);
            const overageCharge = (dataOverage > 0 ? phonePlan.overage_fee : 0) + (minuteOverage > 0 ? phonePlan.overage_fee : 0);
            const totalBill = baseCharge + overageCharge;

            // Log and Insert bill into bills table
            const insertBillQuery = 'INSERT INTO bills (customer_id, total_amount_owed, bill_due_date) VALUES ($1, $2, $3)';
            append('transaction.sql', `${insertBillQuery} -- Params: ${customer.customer_id}, ${totalBill}, '12/22/2023'\n`);
            await pool.query(insertBillQuery, [customer.customer_id, totalBill, '12/22/2023']); // Replace 'Due_Date' with actual logic
        }
    }
}

        await pool.query('COMMIT'); // Commit transaction

        let end_time = new Date().getTime();
        let duration = (end_time - start_time) / 10000

        return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Initialize Tables</title>
                </head>
                <body>
                    <h1>Tables Initialized</h1>
                    <p>Tables initialized successfully.</p>
                    <p>Initialization time: ${duration} ms</p>
                </body>
                </html>
            `);
        } else {
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Initialize Tables</title>
                    <script>
                        function confirmInitTables() {
                            return confirm("Are you sure you want to initialize tables? This will delete existing data.");
                        }
                    </script>
                </head>
                <body>
                    <h1>Initialize Tables</h1>
                    <form action="/init-tables" method="get" onsubmit="return confirmInitTables()">
                        <input type="hidden" name="confirmation" value="true">
                        <button type="submit">Initialize Tables</button>
                        <button type="button" onclick="window.history.back();">Cancel</button>
                    </form>
                </body>
                </html>
            `);
        }
    } catch (error) {
        await pool.query('ROLLBACK'); // Rollback transaction on error
        res.status(500).send('Error initializing tables: ' + error.message);
    }
});
        

app.get('/view-tables', async (req, res) => {
    try {

        append('transaction.sql', 'SELECT * FROM customer;\n');
        const customerResult = await pool.query('SELECT * FROM customer');
        const customerTable = customerResult.rows;

        // View contents of the bank_acc table
        append('transaction.sql', 'SELECT * FROM bank_acc;\n');
        const bankAccResult = await pool.query('SELECT * FROM bank_acc');
        const bankAccTable = bankAccResult.rows;

        // View contents of the phone_plans table
        append('transaction.sql', 'SELECT * FROM phone_plans;\n');
        const phonePlansResult = await pool.query('SELECT * FROM phone_plans');
        const phonePlansTable = phonePlansResult.rows;

        // View contents of the total_usage table
        append('transaction.sql', 'SELECT * FROM total_usage;\n');
        const totalUsageResult = await pool.query('SELECT * FROM total_usage');
        const totalUsageTable = totalUsageResult.rows;

        // View contents of the call_log table
        append('transaction.sql', 'SELECT * FROM call_log;\n');
        const callLogResult = await pool.query('SELECT * FROM call_log\n');
        const callLogTable = callLogResult.rows;

        // View contents of the bills table
        append('transaction.sql', 'SELECT * FROM bills;\n');
        const billsResult = await pool.query('SELECT * FROM bills');
        const billsTable = billsResult.rows;

        // View contents of the transactions table
        append('transaction.sql', 'SELECT * FROM transactions;\n');
        const transactionsResult = await pool.query('SELECT * FROM transactions');
        const transactionsTable = transactionsResult.rows;

        res.send(`
            <h2>Customer Table</h2>
            <pre>${JSON.stringify(customerTable, null, 2)}</pre>

            <h2>Bank Account Table</h2>
            <pre>${JSON.stringify(bankAccTable, null, 2)}</pre>

            <h2>Phone Plans Table</h2>
            <pre>${JSON.stringify(phonePlansTable, null, 2)}</pre>

            <h2>Total Usage Table</h2>
            <pre>${JSON.stringify(totalUsageTable, null, 2)}</pre>

            <h2>Call Log Table</h2>
            <pre>${JSON.stringify(callLogTable, null, 2)}</pre>

            <h2>Bills Table</h2>
            <pre>${JSON.stringify(billsTable, null, 2)}</pre>

            <h2>transactions Made Table</h2>
            <pre>${JSON.stringify(transactionsTable, null, 2)}</pre>
        `);
    } catch (error) {
        res.status(500).send('Error viewing tables: ' + error.message);
    }
});

// Display the payment form
app.get('/sendpayment', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Make Payment</title>
            <script>
                function confirmPayment() {
                    return confirm("Are you sure you want to proceed with the payment?");
                }
            </script>
        </head>
        <body>
            <h1>Make a Payment</h1>
            <form action="/make-payment" method="post" onsubmit="return confirmPayment()">
                <label for="customerName">Customer Name:</label>
                <input type="text" name="customerName" id="customerName" required>
                <br>
                <label for="amount">Payment Amount:</label>
                <input type="number" min="1" name="amount" id="amount" required>
                <br>
                <label for="paymentType">Payment Type:</label>
                <select name="paymentType" required>
                    <option value="credit">Credit</option>
                    <option value="debit">Debit</option>
                </select>
                <br>
                <button type="submit">Make Payment</button>
                <button type="button" onclick="window.history.back();">Cancel</button>
            </form>
        </body>
        </html>
    `);
});

app.get('/view-query', (req, res) => {

    if (!fs.existsSync('query.sql')) {
        fs.writeFileSync('query.sql', '', 'utf8');
    }

    fs.readFile('query.sql', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading query.sql: ', err);
            return res.status(500).send('Error reading query.sql');
        }
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>View File: query.sql</title>
            </head>
            <body>
                <h1>Contents of query.sql</h1>
                <pre>${data}</pre>
            </body>
            </html>
        `);
    });
});

// Function to send file contents of transaction.sql
app.get('/view-transaction', (req, res) => {

    if (!fs.existsSync('transaction.sql')) {
        fs.writeFileSync('transaction.sql', '', 'utf8');
    }

    fs.readFile('transaction.sql', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading transaction.sql: ', err);
            return res.status(500).send('Error reading transaction.sql');
        }
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>View File: transaction.sql</title>
            </head>
            <body>
                <h1>Contents of transaction.sql</h1>
                <pre>${data}</pre>
            </body>
            </html>
        `);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
