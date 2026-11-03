#!/usr/bin/env node

/**
 * AutoBell Factory Batch Provisioning Tool
 * 
 * Usage:
 *   node scripts/factory-batch-generator.mjs --batch 2026-B1 --count 50 --model S3
 *   node scripts/factory-batch-generator.mjs --batch 2026-B1 --count 10 --model Mini --direct-db
 * 
 * Generates:
 *   1. Hardware Serial Numbers: e.g. AB-S3-2026-0001
 *   2. Cryptographically secure 6-digit Claim PINs (e.g. 648291)
 *   3. SHA-256 claim_pin_hash for tamper-proof retail claiming
 *   4. Unique device MAC addresses & dynamic AP SSIDs (e.g. AutoBell-9481)
 *   5. Universal QR setup URL (https://app.autobell.pk/setup?sn=...&pin=...)
 *   6. Formatted CSV for thermal sticker/barcode printers (TSC/Zebra/Brother)
 *   7. SQL migration script for public.device_inventory
 *   8. (Optional) Direct database insertion into Supabase if --direct-db is passed
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Parse CLI arguments
const args = process.argv.slice(2);
function getArg(flag, defaultValue = null) {
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return defaultValue;
}

const hasFlag = (flag) => args.includes(flag);

if (hasFlag('--help') || hasFlag('-h')) {
  console.log(`
AutoBell Factory Batch Provisioning Tool

Options:
  --batch <name>     Batch identifier (default: 2026-B1)
  --count <number>   Number of units to generate (default: 25)
  --model <S3|Mini>  Device hardware model (default: S3)
  --direct-db        Directly insert generated batch into Supabase database
  --output-dir <dir> Custom directory for output files (default: ./factory_batches)
  --help, -h         Show this help screen
`);
  process.exit(0);
}

const batchId = getArg('--batch', '2026-B1');
const count = parseInt(getArg('--count', '25'), 10);
const model = (getArg('--model', 'S3')).toUpperCase();
const directDb = hasFlag('--direct-db');
const outputDir = path.resolve(rootDir, getArg('--output-dir', 'factory_batches'));

if (isNaN(count) || count <= 0) {
  console.error('Error: --count must be a positive integer.');
  process.exit(1);
}

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate random MAC address (Espressif OUI prefix: 30:AE:A4)
function generateMacAddress(index) {
  const bytes = crypto.randomBytes(3);
  const part1 = (bytes[0] % 256).toString(16).padStart(2, '0').toUpperCase();
  const part2 = (bytes[1] % 256).toString(16).padStart(2, '0').toUpperCase();
  const part3 = (bytes[2] % 256).toString(16).padStart(2, '0').toUpperCase();
  return `30:AE:A4:${part1}:${part2}:${part3}`;
}

// Generate secure 6-digit PIN
function generateClaimPin() {
  const pinNum = crypto.randomInt(100000, 999999);
  return pinNum.toString();
}

console.log('\n======================================================');
console.log(`   AUTOBELL FACTORY BATCH PROVISIONING TOOL`);
console.log('======================================================');
console.log(` Batch ID    : ${batchId}`);
console.log(` Model       : AutoBell ${model}`);
console.log(` Unit Count  : ${count}`);
console.log(` Output Dir  : ${outputDir}`);
console.log('------------------------------------------------------\n');

const devices = [];
const year = new Date().getFullYear();

for (let i = 1; i <= count; i++) {
  const pad = String(i).padStart(4, '0');
  const serialNumber = `AB-${model}-${year}-${pad}`;
  const macAddress = generateMacAddress(i);
  const macClean = macAddress.replace(/:/g, '');
  const last4 = macClean.slice(-4).toUpperCase();
  const wifiHotspot = `AutoBell-${last4}`;
  
  const claimPin = generateClaimPin();
  const claimPinHash = crypto.createHash('sha256').update(claimPin).digest('hex');
  const qrPayload = `https://app.autobell.pk/setup?sn=${serialNumber}&pin=${claimPin}`;

  devices.push({
    serialNumber,
    macAddress,
    claimPin,
    claimPinHash,
    wifiHotspot,
    model: `AutoBell ${model}`,
    batchId,
    qrPayload
  });
}

// 1. Generate CSV file for thermal label printer
const csvFilename = path.join(outputDir, `labels_batch_${batchId.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`);
const csvHeaders = 'serial_number,claim_pin,mac_address,model,batch_id,wifi_hotspot,qr_payload\n';
const csvRows = devices.map(d => 
  `"${d.serialNumber}","${d.claimPin}","${d.macAddress}","${d.model}","${d.batchId}","${d.wifiHotspot}","${d.qrPayload}"`
).join('\n');

fs.writeFileSync(csvFilename, csvHeaders + csvRows, 'utf8');
console.log(`[✓] Generated Label Printer CSV : ${csvFilename}`);

// 2. Generate SQL file
const sqlFilename = path.join(outputDir, `inventory_batch_${batchId.replace(/[^a-zA-Z0-9_-]/g, '_')}.sql`);
const sqlStatements = [
  `-- Batch Provisioning: ${batchId} (${count} units - AutoBell ${model})`,
  `-- Generated: ${new Date().toISOString()}`,
  `INSERT INTO public.device_inventory (serial_number, mac_address, batch_id, claim_pin, claim_pin_hash, activation_status, warranty_months, is_paid)`,
  `VALUES`,
  devices.map(d => 
    `  ('${d.serialNumber}', '${d.macAddress}', '${d.batchId}', '${d.claimPin}', '${d.claimPinHash}', 'unactivated', 12, false)`
  ).join(',\n'),
  `ON CONFLICT (serial_number) DO UPDATE SET`,
  `  claim_pin = EXCLUDED.claim_pin,`,
  `  claim_pin_hash = EXCLUDED.claim_pin_hash,`,
  `  batch_id = EXCLUDED.batch_id,`,
  `  mac_address = EXCLUDED.mac_address;\n`
].join('\n');

fs.writeFileSync(sqlFilename, sqlStatements, 'utf8');
console.log(`[✓] Generated Supabase SQL file  : ${sqlFilename}`);

// 3. Optional Direct Database Insertion
if (directDb) {
  console.log('\n[i] Connecting to Supabase for direct database provisioning...');
  
  // Try loading credentials
  const envPath = path.resolve(rootDir, 'web-dashboard/.env.local');
  let supabaseUrl = process.env.VITE_SUPABASE_URL;
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const idx = line.indexOf('=');
      if (idx !== -1) {
        const k = line.slice(0, idx).trim();
        let v = line.slice(idx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        if (k === 'VITE_SUPABASE_URL') supabaseUrl = v;
        if (k === 'SUPABASE_SERVICE_ROLE_KEY') serviceRoleKey = v;
      }
    });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[!] Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL. Direct DB push skipped.');
  } else {
    try {
      const records = devices.map(d => ({
        serial_number: d.serialNumber,
        mac_address: d.macAddress,
        batch_id: d.batchId,
        claim_pin: d.claimPin,
        claim_pin_hash: d.claimPinHash,
        activation_status: 'unactivated',
        warranty_months: 12,
        is_paid: false
      }));

      const res = await fetch(`${supabaseUrl}/rest/v1/device_inventory?on_conflict=serial_number`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(records)
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[✗] Supabase direct insert failed: ${res.status} ${errText}`);
      } else {
        console.log(`[✓] Successfully provisioned ${count} units directly into device_inventory!`);
      }
    } catch (e) {
      console.error(`[✗] Failed to insert directly into Supabase: ${e.message}`);
    }
  }
}

// Display Sample Table
console.log('\nSample Generated Units (First 3):');
console.table(devices.slice(0, 3).map(d => ({
  Serial: d.serialNumber,
  PIN: d.claimPin,
  MAC: d.macAddress,
  Hotspot: d.wifiHotspot,
  Model: d.model
})));
console.log(`Total units generated: ${count}\n`);

