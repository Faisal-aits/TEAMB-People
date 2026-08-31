const { addColumnIfMissing } = require('../../utils/schemaHelpers');

let schemaReady;

const ensureAttendanceSchema = () => {
  if (!schemaReady) {
    schemaReady = (async () => {
      await addColumnIfMissing('tb_attendance', 'check_in_latitude', 'check_in_latitude DECIMAL(10, 8) NULL AFTER deduction_reason');
      await addColumnIfMissing('tb_attendance', 'check_in_longitude', 'check_in_longitude DECIMAL(11, 8) NULL AFTER check_in_latitude');
      await addColumnIfMissing('tb_attendance', 'check_out_latitude', 'check_out_latitude DECIMAL(10, 8) NULL AFTER check_in_longitude');
      await addColumnIfMissing('tb_attendance', 'check_out_longitude', 'check_out_longitude DECIMAL(11, 8) NULL AFTER check_out_latitude');
      await addColumnIfMissing('tb_attendance', 'regularization_status', "regularization_status VARCHAR(20) NULL DEFAULT NULL AFTER check_out_longitude");
    })();
  }

  return schemaReady;
};

module.exports = { ensureAttendanceSchema };
