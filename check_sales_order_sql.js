const sql = `
  INSERT INTO sales_orders (
    id, internal_order_no, customer_order_no, customer_name, customer_id,
    salesperson, submitter, quotation_no, order_type,
    order_time, promised_delivery, customer_delivery, estimated_completion_date,
    sales_department, delivery_method, return_order_no,
    order_currency, current_exchange_rate, tax_rate, fees,
    total_amount, total_amount_excluding_tax, total_tax,
    order_attachment, packaging_attachment, order_notes,
    packaging_method, packaging_requirements,
    consignee, delivery_address, bill_recipient, bill_address,
    payment_method, advance_payment_ratio, advance_payment_amount,
    planned_payment_account, total_receivable,
    has_after_sales, after_sales_order_no, after_sales_details,
    status, created_by, updated_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const fieldCount = sql.split('(')[1].split(')')[0].split(',').length;
const valueCount = (sql.match(/\?/g) || []).length;
console.log('Fields:', fieldCount);
console.log('Values:', valueCount);
console.log('Match:', fieldCount === valueCount);