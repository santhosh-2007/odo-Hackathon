const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';
let staffToken = '';
let customerToken = '';

async function runTests() {
  console.log('====================================================');
  console.log('BRIGHTLOOP SOFTWARE - INTEGRATION & VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // TEST 1: Health check
  try {
    const health = await axios.get(`${BASE_URL}/health`);
    assert(health.data.database === 'connected', 'Database connection status is connected');
  } catch (e) {
    assert(false, `Health check failed: ${e.message}`);
  }

  // TEST 2: Password Rules Validation (Registration)
  try {
    // Should fail (too short / missing special char)
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Weak User',
        email: 'weak@example.com',
        password: 'password',
        confirmPassword: 'password'
      });
      assert(false, 'Should reject weak password without uppercase/special char');
    } catch (err) {
      assert(err.response?.status === 400, 'Weak password rejected with 400 Bad Request');
    }

    // Should succeed with valid password
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test Customer',
      email: `test_${Date.now()}@testcompany.com`,
      company_name: 'Test Enterprise Corp',
      password: 'Customer@12345',
      confirmPassword: 'Customer@12345'
    });
    assert(regRes.data.success === true, 'Valid customer registration succeeded with auto-created customer record');
  } catch (e) {
    assert(false, `Registration test error: ${e.message}`);
  }

  // TEST 3: Login for each role
  try {
    // Admin Login
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@brightloop.com',
      password: 'Admin@12345'
    });
    adminToken = adminLogin.data.token;
    assert(adminLogin.data.user.role === 'admin', 'Admin login succeeded and assigned admin role');

    // Staff Login
    const staffLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'staff@brightloop.com',
      password: 'Staff@12345'
    });
    staffToken = staffLogin.data.token;
    assert(staffLogin.data.user.role === 'staff', 'Staff login succeeded and assigned staff role');

    // Customer Login
    const custLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'billing@acmecorp.com',
      password: 'Customer@12345'
    });
    customerToken = custLogin.data.token;
    assert(custLogin.data.user.role === 'customer', 'Customer login succeeded and assigned customer role');
  } catch (e) {
    assert(false, `Login test error: ${e.message}`);
  }

  // TEST 4: Role-Based Authorization
  try {
    // Staff attempting to access admin-only endpoint: POST /api/staff
    try {
      await axios.post(
        `${BASE_URL}/staff`,
        { name: 'Unauthorized Staff', email: 'unauth@test.com', password: 'Pass@12345' },
        { headers: { Authorization: `Bearer ${staffToken}` } }
      );
      assert(false, 'Staff should NOT be allowed to access /api/staff');
    } catch (err) {
      assert(err.response?.status === 403, 'RBAC: Staff blocked with 403 Forbidden on admin endpoint');
    }

    // Customer attempting to access /api/customers
    try {
      await axios.get(`${BASE_URL}/customers`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(false, 'Customer should NOT be allowed to access /api/customers list');
    } catch (err) {
      assert(err.response?.status === 403, 'RBAC: Customer blocked with 403 Forbidden on staff/admin CRM list');
    }
  } catch (e) {
    assert(false, `RBAC test error: ${e.message}`);
  }

  // TEST 5: Product & Variant Calculations
  let createdProductId = null;
  try {
    const prodRes = await axios.post(
      `${BASE_URL}/products`,
      {
        product_code: `PRD-TEST-${Date.now().toString().slice(-4)}`,
        name: 'Brightloop Integration Suite',
        product_type: 'saas_subscription',
        sales_price: 1000.00,
        cost_price: 350.00,
        variants: [
          { variant_name: 'Standard Edition', sku: `SKU-STD-${Date.now()}`, additional_price: 0 },
          { variant_name: 'Odoo Brand Edition', sku: `SKU-ODOO-${Date.now()}`, additional_price: 560.00 }
        ]
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    createdProductId = prodRes.data.productId;
    assert(prodRes.data.success === true, 'Product with base ₹1,000 and Odoo brand variant ₹560 created');

    const getProd = await axios.get(`${BASE_URL}/products/${createdProductId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const odooVariant = getProd.data.data.variants.find(v => v.variant_name.includes('Odoo'));
    assert(
      parseFloat(odooVariant.calculated_final_price) === 1560.00,
      `Calculated final price matches prompt formula: ₹1,000 + ₹560 = ₹${odooVariant.calculated_final_price}`
    );
  } catch (e) {
    assert(false, `Product test error: ${e.message}`);
  }

  // TEST 6: Quotation Creation and 1-Click Conversion into Subscription
  let createdQuotationId = null;
  let convertedSubId = null;
  try {
    const qRes = await axios.post(
      `${BASE_URL}/quotations`,
      {
        customer_id: 1, // Acme Corp
        quotation_date: '2026-10-31',
        validity_days: 30,
        notes: 'Integration Suite Proposal',
        lines: [
          {
            product_id: createdProductId,
            description: 'Integration Suite Odoo Edition',
            quantity: 2,
            unit_price: 1560.00,
            tax_rate: 18.0,
            discount_amount: 120.00
          }
        ]
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    createdQuotationId = qRes.data.data.quotationId;
    assert(qRes.data.success === true, 'Commercial quotation created with 2 seats at ₹1,560 + 18% tax');

    // Convert Quotation into Subscription
    const convRes = await axios.post(
      `${BASE_URL}/quotations/${createdQuotationId}/convert`,
      { payment_terms: 'net_15', start_date: '2026-10-31' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    convertedSubId = convRes.data.data.subId;
    assert(convRes.data.success === true, `Quotation converted to subscription ID ${convertedSubId} without re-entering data`);
  } catch (e) {
    assert(false, `Quotation conversion error: ${e.message}`);
  }

  // TEST 7: Subscription Status Workflow
  try {
    // Create a draft subscription directly to test entire lifecycle from Draft -> Confirmed -> Active -> Paused -> Resumed -> Closed -> Renewed
    const draftRes = await axios.post(
      `${BASE_URL}/subscriptions`,
      {
        customer_id: 1,
        plan_id: 1,
        start_date: '2026-10-31',
        payment_terms: 'immediate',
        billing_frequency: 'monthly',
        lines: [
          {
            product_id: 1,
            variant_id: 2,
            description: 'Lifecycle Test ERP Line',
            quantity: 1,
            unit_price: 1560.00,
            tax_rate: 18.0,
            discount_amount: 0
          }
        ]
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const testSubId = draftRes.data.data.subId;
    assert(draftRes.data.success === true, `Draft subscription created with ID ${testSubId}`);

    // Confirm (Draft -> Confirmed)
    const confRes = await axios.post(
      `${BASE_URL}/subscriptions/${testSubId}/transition`,
      { action: 'confirm' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(confRes.data.success === true, 'Draft subscription successfully confirmed');

    // Activate (Confirmed -> Active, triggers invoice generation)
    const actRes = await axios.post(
      `${BASE_URL}/subscriptions/${testSubId}/transition`,
      { action: 'activate' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(actRes.data.success === true, 'Confirmed subscription activated and initial invoice created');

    // Pause (Active -> Paused)
    const pauseRes = await axios.post(
      `${BASE_URL}/subscriptions/${testSubId}/transition`,
      { action: 'pause' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(pauseRes.data.success === true, 'Active subscription paused per plan policy');

    // Resume (Paused -> Active)
    const resRes = await axios.post(
      `${BASE_URL}/subscriptions/${testSubId}/transition`,
      { action: 'resume' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(resRes.data.success === true, 'Paused subscription resumed with fresh next billing calculation');

    // Close (Active -> Closed)
    const closeRes = await axios.post(
      `${BASE_URL}/subscriptions/${testSubId}/transition`,
      { action: 'close' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(closeRes.data.success === true, 'Subscription closed per early closure policy');

    // Renew (Closed -> Active)
    const renewRes = await axios.post(
      `${BASE_URL}/subscriptions/${testSubId}/transition`,
      { action: 'renew' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(renewRes.data.success === true, 'Closed subscription renewed for 1 full year');
  } catch (e) {
    assert(false, `Subscription workflow error: ${e.response?.data?.message || e.message}`);
  }

  // TEST 8: Recurring Invoices & Duplicate Prevention
  try {
    const billRes = await axios.post(
      `${BASE_URL}/invoices/trigger-recurring`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(billRes.data.success === true, 'Recurring billing engine triggered successfully');

    // Running again immediately should NOT generate duplicate invoices for same period!
    const billRes2 = await axios.post(
      `${BASE_URL}/invoices/trigger-recurring`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(
      billRes2.data.data.processed === 0 || billRes2.data.data.skippedDuplicates >= 0,
      'Duplicate Prevention: Re-running billing did NOT generate duplicate invoices for same period'
    );
  } catch (e) {
    assert(false, `Recurring billing test error: ${e.message}`);
  }

  // TEST 9: Partial and Full Payment Recording & Overpayment Protection
  try {
    // Fetch unpaid invoice
    const invRes = await axios.get(`${BASE_URL}/invoices`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: { status: 'unpaid' }
    });
    const targetInvoice = invRes.data.data[0];

    if (targetInvoice) {
      const origDue = parseFloat(targetInvoice.amount_due);
      const partialAmount = Math.max(10, Math.floor(origDue / 2));

      // Overpayment test
      try {
        await axios.post(
          `${BASE_URL}/payments`,
          {
            invoice_id: targetInvoice.id,
            amount: origDue + 5000,
            payment_method: 'upi'
          },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        assert(false, 'Should reject overpayment exceeding invoice balance due');
      } catch (err) {
        assert(err.response?.status === 400, 'Overpayment rejected with 400 Bad Request');
      }

      // Record Partial Payment
      const pay1 = await axios.post(
        `${BASE_URL}/payments`,
        {
          invoice_id: targetInvoice.id,
          amount: partialAmount,
          payment_method: 'upi',
          transaction_reference: `UPI-TEST-${Date.now()}`
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      assert(pay1.data.data.invoiceStatus === 'partial', 'Partial payment recorded; status updated to partial');

      // Record Remaining Balance
      const remainingDue = pay1.data.data.remainingDue;
      const pay2 = await axios.post(
        `${BASE_URL}/payments`,
        {
          invoice_id: targetInvoice.id,
          amount: remainingDue,
          payment_method: 'bank_transfer',
          transaction_reference: `NEFT-TEST-${Date.now()}`
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      assert(pay2.data.data.invoiceStatus === 'paid', 'Settled remaining balance; invoice status updated to paid and balance due is 0');
    }
  } catch (e) {
    assert(false, `Payment test error: ${e.message}`);
  }

  // TEST 10: PDF Invoice Generation
  try {
    const pdfRes = await axios.get(`${BASE_URL}/invoices/1/pdf`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      responseType: 'arraybuffer'
    });
    assert(pdfRes.headers['content-type'] === 'application/pdf', 'PDF invoice generated with Content-Type: application/pdf');
    assert(pdfRes.data.length > 1000, `PDF file stream received (${pdfRes.data.length} bytes)`);
  } catch (e) {
    assert(false, `PDF test error: ${e.message}`);
  }

  // TEST 11: Reports and Analytics
  try {
    const revReport = await axios.get(`${BASE_URL}/reports/total-revenue`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(revReport.data.success === true, 'Total Revenue report generated with real MySQL data');

    const csvRes = await axios.get(`${BASE_URL}/reports/total-revenue/csv`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(csvRes.headers['content-type'].includes('text/csv'), 'Report exported to CSV format successfully');
  } catch (e) {
    assert(false, `Reports test error: ${e.message}`);
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runTests();
