import sys

with open('backend/src/features/employee/employeeModel.js', 'r', encoding='utf-8') as f:
    content = f.read()

target_create = '''      await connection.execute(
        INSERT INTO employee_details (
           id, tenant_id, employee_id, department_id,
           joining_date, current_salary,
           date_of_birth, gender, address,
           emergency_contact, bank_account_number,
           ifsc_code, pan_number, aadhar_number,
           status, is_on_probation, probation_end_date,
           salary_after_probation, salary_during_probation, default_shift_id
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\,
        [
          employeeId,
          tenantId,
          userId,
          employeeData.department_id || null,
          employeeData.joining_date || null,
          employeeData.current_salary || null,
          employeeData.date_of_birth || null,
          employeeData.gender || null,
          employeeData.address || null,
          employeeData.emergency_contact || null,
          employeeData.bank_account_number || null,
          employeeData.ifsc_code || null,
          employeeData.pan_number || null,
          employeeData.aadhar_number || null,
          employeeData.status || 'active',
          employeeData.is_on_probation ? 1 : 0,
          employeeData.probation_end_date || null,
          employeeData.salary_after_probation || null,
          employeeData.salary_during_probation || null,
          defaultShiftId
        ]
      );

      await connection.commit();'''

replacement_create = '''      await connection.execute(
        INSERT INTO employee_details (
           id, tenant_id, employee_id, department_id,
           joining_date, current_salary,
           date_of_birth, gender, address,
           emergency_contact, bank_account_number,
           ifsc_code, pan_number, aadhar_number,
           status, is_on_probation, probation_end_date,
           salary_after_probation, salary_during_probation, default_shift_id
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\,
        [
          employeeId,
          tenantId,
          userId,
          employeeData.department_id || null,
          employeeData.joining_date || null,
          employeeData.current_salary || null,
          employeeData.date_of_birth || null,
          employeeData.gender || null,
          employeeData.address || null,
          employeeData.emergency_contact || null,
          employeeData.bank_account_number || null,
          employeeData.ifsc_code || null,
          employeeData.pan_number || null,
          employeeData.aadhar_number || null,
          employeeData.status || 'active',
          employeeData.is_on_probation ? 1 : 0,
          employeeData.probation_end_date || null,
          employeeData.salary_after_probation || null,
          employeeData.salary_during_probation || null,
          defaultShiftId
        ]
      );
      
      const [leaveTypes] = await connection.execute(
          'SELECT name, max_days FROM leave_types WHERE tenant_id = ? AND is_active = 1',
          [tenantId]
      );
      
      if (leaveTypes.length > 0) {
          const currentYear = new Date().getFullYear();
          const leaveValues = leaveTypes.map(lt => [tenantId, employeeId, lt.name, currentYear, lt.max_days, 0, 0]);
          await connection.query(
              'INSERT IGNORE INTO leave_balances (tenant_id, employee_id, leave_type, year, allocated, used, pending) VALUES ?',
              [leaveValues]
          );
      }

      await connection.commit();'''

target_create = target_create.replace('\', '')
replacement_create = replacement_create.replace('\', '')

if target_create in content:
    content = content.replace(target_create, replacement_create)
    print("Patched create successfully!")
else:
    print("Create target not found!")

target_bulk = '''        } catch (tableError) {
          if (tableError.code !== 'ER_NO_SUCH_TABLE') {
            throw tableError;
          }
        }

      await connection.commit();'''

replacement_bulk = '''        } catch (tableError) {
          if (tableError.code !== 'ER_NO_SUCH_TABLE') {
            throw tableError;
          }
        }
        
      const [leaveTypes] = await connection.execute(
          'SELECT name, max_days FROM leave_types WHERE tenant_id = ? AND is_active = 1',
          [tenantId]
      );
      
      if (leaveTypes.length > 0 && employeesWithIds.length > 0) {
          const currentYear = new Date().getFullYear();
          const leaveValues = [];
          for (const emp of employeesWithIds) {
              for (const lt of leaveTypes) {
                  leaveValues.push([tenantId, emp.employee_id, lt.name, currentYear, lt.max_days, 0, 0]);
              }
          }
          await connection.query(
              'INSERT IGNORE INTO leave_balances (tenant_id, employee_id, leave_type, year, allocated, used, pending) VALUES ?',
              [leaveValues]
          );
      }

      await connection.commit();'''

if target_bulk in content:
    content = content.replace(target_bulk, replacement_bulk)
    print("Patched bulkCreate successfully!")
else:
    print("Bulk target not found!")

with open('backend/src/features/employee/employeeModel.js', 'w', encoding='utf-8') as f:
    f.write(content)
