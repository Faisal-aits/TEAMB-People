const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { pool } = require('./src/config/db');

async function migrateInactiveEmployees() {
  const connection = await pool.getConnection();
  try {
    // Find all employees that are inactive or have deactivated user account,
    // and whose ID doesn't start with EX- / EX<number>- OR whose email doesn't start with ex. / ex<number>.
    const [inactiveEmployees] = await connection.execute(`
      SELECT 
        ed.id,
        ed.tenant_id,
        ed.status,
        ed.employee_id AS user_id,
        u.email,
        u.is_active
      FROM employee_details ed
      LEFT JOIN users u ON ed.employee_id = u.id
      WHERE (ed.status = 'inactive' OR u.is_active = 0)
        AND (
          ed.id NOT REGEXP '^EX[0-9]*-'
          OR (u.email IS NOT NULL AND u.email NOT REGEXP '^ex[0-9]*\\\\.')
        )
    `);

    if (inactiveEmployees.length === 0) {
      console.log('[Migration] No unmigrated inactive employees found.');
      return { migratedCount: 0 };
    }

    console.log(`[Migration] Found ${inactiveEmployees.length} inactive employee(s) needing EX- prefix update.`);

    let migratedCount = 0;

    for (const emp of inactiveEmployees) {
      const originalId = String(emp.id);
      const originalEmail = emp.email ? String(emp.email).trim() : null;
      const tenantId = emp.tenant_id;
      const userId = emp.user_id;

      let exId = originalId;
      // If ID does not already start with EX- or EX<number>-
      if (!/^EX[0-9]*-/i.test(originalId)) {
        const trimmedBaseId = originalId.length > 17 ? originalId.slice(0, 17) : originalId;
        const base = `EX-${trimmedBaseId}`;
        const [taken] = await connection.execute(
          'SELECT id FROM employee_details WHERE id = ?',
          [base]
        );
        if (taken.length === 0) {
          exId = base;
        } else {
          let counter = 1;
          while (true) {
            const prefix = `EX${counter}-`;
            const maxLen = 20 - prefix.length;
            const sub = originalId.length > maxLen ? originalId.slice(0, maxLen) : originalId;
            const candidate = `${prefix}${sub}`;
            const [check] = await connection.execute(
              'SELECT id FROM employee_details WHERE id = ?',
              [candidate]
            );
            if (check.length === 0) {
              exId = candidate;
              break;
            }
            counter++;
          }
        }
      }

      let exEmail = originalEmail;
      // If email exists and does not already start with ex. or ex<number>.
      if (originalEmail && !/^ex[0-9]*\./i.test(originalEmail)) {
        const baseEmail = `ex.${originalEmail}`;
        const [takenEmail] = await connection.execute(
          'SELECT id FROM users WHERE email = ?',
          [baseEmail]
        );
        if (takenEmail.length === 0) {
          exEmail = baseEmail;
        } else {
          let counter = 1;
          while (true) {
            const candidate = `ex${counter}.${originalEmail}`;
            const [check] = await connection.execute(
              'SELECT id FROM users WHERE email = ?',
              [candidate]
            );
            if (check.length === 0) {
              exEmail = candidate;
              break;
            }
            counter++;
          }
        }
      }

      await connection.beginTransaction();
      try {
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

        // Only update child tables if ID is changing
        if (exId !== originalId) {
          const childTableUpdates = [
            'UPDATE tb_attendance               SET employee_id = ? WHERE employee_id = ?',
            'UPDATE tb_attendance               SET approved_by = ? WHERE approved_by = ?',
            'UPDATE attendance_history          SET employee_id = ? WHERE employee_id = ?',
            'UPDATE attendance_regularization_requests SET employee_id = ? WHERE employee_id = ?',
            'UPDATE leave_balances              SET employee_id = ? WHERE employee_id = ?',
            'UPDATE leave_requests              SET employee_id = ? WHERE employee_id = ?',
            'UPDATE leave_requests              SET approved_by = ? WHERE approved_by = ?',
            'UPDATE resignation_requests        SET employee_id = ? WHERE employee_id = ?',
            'UPDATE experience_letters          SET employee_id = ? WHERE employee_id = ?',
            'UPDATE increment_letters           SET employee_id = ? WHERE employee_id = ?',
            'UPDATE employee_documents          SET employee_id = ? WHERE employee_id = ?',
            'UPDATE employee_departments        SET employee_id = ? WHERE employee_id = ?',
            'UPDATE tb_employee_shifts          SET employee_id = ? WHERE employee_id = ?',
            'UPDATE tb_salary_records           SET employee_id = ? WHERE employee_id = ?',
            'UPDATE tb_breaks                   SET employee_id = ? WHERE employee_id = ?',
            'UPDATE ai_document_generated_documents SET employee_id = ? WHERE employee_id = ?',
          ];

          for (const sql of childTableUpdates) {
            try {
              await connection.execute(sql, [exId, originalId]);
            } catch (err) {
              if (err.code !== 'ER_NO_SUCH_TABLE' && err.code !== 'ER_BAD_FIELD_ERROR') {
                console.warn(`[Migration Warning] Could not update child table: ${err.message}`);
              }
            }
          }

          await connection.execute(
            `UPDATE employee_details SET id = ?, status = 'inactive', updated_at = NOW() WHERE id = ?`,
            [exId, originalId]
          );
        } else {
          await connection.execute(
            `UPDATE employee_details SET status = 'inactive', updated_at = NOW() WHERE id = ?`,
            [originalId]
          );
        }

        if (userId) {
          await connection.execute(
            `UPDATE users SET is_active = 0, email = ?, updated_at = NOW() WHERE id = ?`,
            [exEmail, userId]
          );
          try {
            await connection.execute(
              `DELETE FROM user_module_access WHERE user_id = ?`,
              [userId]
            );
          } catch (e) {
            // Ignore if table missing
          }
        }

        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        await connection.commit();

        migratedCount++;
        console.log(`[Migration] Migrated employee: ID "${originalId}" -> "${exId}", Email "${originalEmail}" -> "${exEmail}"`);
      } catch (err) {
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
        await connection.rollback().catch(() => {});
        console.error(`[Migration Error] Failed to migrate employee ${originalId}:`, err);
      }
    }

    console.log(`[Migration] Finished. Successfully migrated ${migratedCount} employee(s).`);
    return { migratedCount };
  } finally {
    connection.release();
  }
}

// Allow standalone execution via `node migrate_ex_employees.js`
if (require.main === module) {
  migrateInactiveEmployees()
    .then((result) => {
      console.log('Migration process exited cleanly. Result:', result);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateInactiveEmployees };
