/**
 * generateApiKey.js
 * ─────────────────
 * CLI tool to create an API key for a tenant directly in the database.
 * Useful for development/staging setup and onboarding new external applications.
 *
 * Usage:
 *   node backend/src/scripts/generateApiKey.js --tenant=1 --name="HRMS Integration"
 *
 * Environment: Requires a valid .env file in the backend directory.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const crypto = require('crypto');
const { query, pool } = require('../config/db');
const { ensureIntegrationSchema } = require('../features/integrations/integrationSchema');

const parseArgs = () => {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    if (key && value !== undefined) {
      args[key] = value;
    }
  });
  return args;
};

const main = async () => {
  const { tenant, name } = parseArgs();

  if (!tenant || !name) {
    console.error('Usage: node generateApiKey.js --tenant=<tenant_id> --name="<key name>"');
    process.exit(1);
  }

  const tenantId = Number(tenant);
  if (!tenantId || isNaN(tenantId)) {
    console.error('Error: --tenant must be a valid numeric tenant ID.');
    process.exit(1);
  }

  try {
    // Verify tenant exists
    const tenants = await query('SELECT id, company_name FROM tenants WHERE id = ? LIMIT 1', [tenantId]);
    if (!tenants[0]) {
      console.error(`Error: Tenant with ID ${tenantId} not found.`);
      process.exit(1);
    }

    await ensureIntegrationSchema();

    const apiKey = `wdk_${crypto.randomBytes(32).toString('hex')}`;
    const result = await query(
      'INSERT INTO api_keys (tenant_id, name, api_key, status) VALUES (?, ?, ?, ?)',
      [tenantId, name, apiKey, 'active']
    );

    console.log('\n✅ API Key generated successfully!\n');
    console.log('┌─────────────────────────────────────────────────────────────────┐');
    console.log(`│  Tenant:      ${tenants[0].company_name || tenantId}`);
    console.log(`│  Key Name:    ${name}`);
    console.log(`│  Key ID:      ${result.insertId}`);
    console.log(`│  API Key:     ${apiKey}`);
    console.log('└─────────────────────────────────────────────────────────────────┘');
    console.log('\n⚠️  Store this key securely. It will NOT be shown again.\n');
    console.log('Usage in HTTP requests:');
    console.log(`  Header: X-API-KEY: ${apiKey}\n`);
  } catch (err) {
    console.error('Error generating API key:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

main();
