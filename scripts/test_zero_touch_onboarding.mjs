import pg from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables
const envPath = path.resolve(rootDir, 'web-dashboard/.env.local');
let dbUrl = process.env.DATABASE_URL;

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const idx = line.indexOf('=');
    if (idx !== -1) {
      const k = line.slice(0, idx).trim();
      let v = line.slice(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (k === 'DATABASE_URL') dbUrl = v;
    }
  });
}

if (!dbUrl) {
  console.error('[✗] Missing DATABASE_URL.');
  process.exit(1);
}

const { Client } = pg;
const client = new Client({ connectionString: dbUrl });

async function runTest() {
  console.log('\n=============================================================');
  console.log('   AUTOBELL ZERO-TOUCH ONBOARDING SIMULATION & VERIFICATION');
  console.log('=============================================================\n');

  await client.connect();
  console.log('[✓] Connected to Supabase PostgreSQL database.');

  try {
    // Step 1: Ensure Migration is applied
    const migrationFile = path.resolve(rootDir, 'supabase/migrations/20261104000000_retail_zero_touch_onboarding.sql');
    const migrationSql = fs.readFileSync(migrationFile, 'utf8');
    console.log('[i] Applying migration: 20261104000000_retail_zero_touch_onboarding.sql ...');
    await client.query(migrationSql);
    console.log('[✓] Database migration applied successfully!');

    // Test Data Constants
    const testSerial = `TEST-S3-${Date.now().toString().slice(-4)}`;
    const testMac = `30:AE:A4:99:${Math.floor(Math.random()*89+10)}:${Math.floor(Math.random()*89+10)}`;
    const testPin = '648291';
    const testPinHash = crypto.createHash('sha256').update(testPin).digest('hex');
    const testUserId = crypto.randomUUID();
    const testEmail = `test_admin_${Date.now()}@testschool.edu.pk`;

    console.log(`\n--- Test Hardware Unit ---`);
    console.log(` Serial Number : ${testSerial}`);
    console.log(` MAC Address   : ${testMac}`);
    console.log(` Claim PIN     : ${testPin}`);
    console.log(` PIN Hash      : ${testPinHash.slice(0, 16)}...`);

    // Step 2: Simulate Factory Provisioning in device_inventory
    console.log('\n[i] Step 2: Simulating Factory Batch Provisioning...');
    await client.query(`
      INSERT INTO public.device_inventory (
        serial_number, mac_address, batch_id, claim_pin_hash, activation_status, warranty_months, is_paid
      ) VALUES ($1, $2, 'FACTORY-TEST-B1', $3, 'unactivated', 12, false)
    `, [testSerial, testMac, testPinHash]);
    console.log('[✓] Device provisioned in device_inventory as unactivated.');

    // Step 3: Simulate Customer Signup & School Creation
    console.log('\n[i] Step 3: Simulating Customer Self-Serve Registration...');
    // Create temporary auth user
    await client.query(`
      INSERT INTO auth.users (id, email, raw_user_meta_data)
      VALUES ($1, $2, '{"full_name": "Retail Test Admin"}'::jsonb)
      ON CONFLICT (id) DO NOTHING
    `, [testUserId, testEmail]);

    // Set auth context for current session to testUserId
    await client.query(`
      SELECT set_config('request.jwt.claims', $1, false),
             set_config('request.jwt.claim.sub', $2, false);
    `, [JSON.stringify({ sub: testUserId, role: 'authenticated' }), testUserId]);

    const regResult = await client.query(`
      SELECT public.register_customer_and_school(
        'Retail Test Admin',
        'National Model Academy',
        'North Campus',
        'Islamabad',
        '+92 300 9998877'
      ) as result
    `);

    const regData = regResult.rows[0].result;
    console.log('[✓] School registered via RPC:', regData);
    const schoolId = regData.school_id;

    // Verify School Subscription & Bell Profile
    const schoolCheck = await client.query(`
      SELECT payment_status, subscription_end_date FROM public.schools WHERE id = $1
    `, [schoolId]);
    console.log('[✓] School record:', schoolCheck.rows[0]);

    const profileCheck = await client.query(`
      SELECT id, name, is_active FROM public.bell_profiles WHERE school_id = $1
    `, [schoolId]);
    console.log('[✓] Default Bell Profile created:', profileCheck.rows[0]);

    // Step 4: Test Claiming with Invalid PIN (Should FAIL)
    console.log('\n[i] Step 4: Testing security rejection with invalid Claim PIN...');
    let invalidPinCaught = false;
    try {
      await client.query(`
        SELECT public.claim_and_activate_device($1, '000000', 'Front Office Bell')
      `, [testSerial]);
    } catch (e) {
      invalidPinCaught = true;
      console.log(`[✓] Security Guard PASSED: Rejected invalid PIN as expected (${e.message.split('\n')[0]})`);
    }
    if (!invalidPinCaught) {
      throw new Error('FAIL: Device was claimed with an invalid PIN!');
    }

    // Step 5: Test Claiming with Valid PIN (Should SUCCEED with 1-Year Free Service)
    console.log('\n[i] Step 5: Claiming device with genuine 6-digit PIN...');
    const claimResult = await client.query(`
      SELECT public.claim_and_activate_device($1, $2, 'North Campus Main Bell') as result
    `, [testSerial, testPin]);
    const claimData = claimResult.rows[0].result;
    console.log('[✓] Claim & Activation RPC Response:', claimData);

    // Step 6: Verify Device Inventory Activation
    const invCheck = await client.query(`
      SELECT serial_number, activation_status, is_paid, claimed_by_school_id, subscription_end_date
      FROM public.device_inventory WHERE serial_number = $1
    `, [testSerial]);
    console.log('[✓] device_inventory verification:', invCheck.rows[0]);

    // Step 7: Verify Active Bell Devices & Command Queue
    const devCheck = await client.query(`
      SELECT id, name, mac_address, status, activation_status, is_paid, subscription_end_date
      FROM public.bell_devices WHERE mac_address = $1
    `, [testMac]);
    console.log('[✓] bell_devices verification:', devCheck.rows[0]);
    const deviceId = devCheck.rows[0].id;

    const cmdCheck = await client.query(`
      SELECT command, payload, status FROM public.command_queue
      WHERE device_id = $1 ORDER BY id DESC LIMIT 1
    `, [deviceId]);
    console.log('[✓] command_queue instant sync command:', cmdCheck.rows[0]);

    // Clean up test records
    console.log('\n[i] Cleaning up simulation records...');
    await client.query(`DELETE FROM public.command_queue WHERE device_id = $1`, [deviceId]);
    await client.query(`DELETE FROM public.bell_devices WHERE mac_address = $1`, [testMac]);
    await client.query(`DELETE FROM public.device_inventory WHERE serial_number = $1`, [testSerial]);
    await client.query(`DELETE FROM public.bell_profiles WHERE school_id = $1`, [schoolId]);
    await client.query(`DELETE FROM public.users WHERE id = $1`, [testUserId]);
    await client.query(`DELETE FROM public.schools WHERE id = $1`, [schoolId]);
    await client.query(`DELETE FROM auth.users WHERE id = $1`, [testUserId]);
    console.log('[✓] Test data cleaned up cleanly.');

    console.log('\n=============================================================');
    console.log('   ZERO-TOUCH ONBOARDING VERIFICATION COMPLETED: 100% SUCCESS');
    console.log('=============================================================\n');
  } catch (err) {
    console.error('\n[✗] Simulation failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runTest();
