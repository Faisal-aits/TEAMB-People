require('dotenv').config();
const multer = require('multer');
const express = require('express');
const cors = require('cors');
const path = require('path');
const userRoutes = require('./src/features/users/user.routes');
const superAdminRoutes = require('./src/features/super-admin/superAdminRoutes');
const errorHandler = require('./src/core/errorHandler');
const sendResponse = require('./src/utils/response');
const logger = require('./src/core/logger');
const { pool } = require('./src/config/db');
const authRoutes = require('./src/features/login/authRoutes');
const employeeRoutes = require('./src/features/employee/employeeRoutes');
const offerLetterRoutes = require('./src/features/employee/offerLetterRoutes');
const brandingRoutes = require('./src/features/branding/brandingRoutes');
const brandingModel = require('./src/features/branding/brandingModel');
const salaryRoutes = require('./src/features/salary/salaryRoutes');
const quotationRoutes = require('./src/features/quotation/quotationRoutes');
const billingRoutes = require('./src/features/billing/billingRoutes');
const deliveryRoutes = require('./src/features/deliverychallan/deliveryRoutes');
const shiftRoutes = require('./src/features/shift/shiftRoutes');
const incrementLetterRoutes = require('./src/features/employee/incrementLetterRoutes');
const experienceLetterRoutes = require('./src/features/employee/experienceLetterRoutes');
const declarationFormRoutes = require('./src/features/employee/declarationFormRoutes');
const resignationRoutes = require('./src/features/employee/resignationRoutes');
const expenseRoutes = require('./src/features/expense/expenseRoutes');
const attendanceRoutes = require('./src/features/attendance/attendanceRoutes');
const leaveRoutes = require('./src/features/leave/leaveRoutes');
const clientRoutes = require('./src/features/clients/clientRoutes');
const serviceRoutes = require('./src/features/services/serviceRoutes');
const moduleAccessRoutes = require('./src/features/moduleAccess/moduleAccessRoutes');
const pttmRoutes = require('./src/features/pttm/pttmRoutes');
const serviceSettingRoutes = require('./src/features/servicesetting/serviceSettingRoutes');
const dashboardRoutes = require('./src/features/dashboard/dashboardRoutes');
const aiDocumentGeneratorRoutes = require('./src/features/aiDocumentGenerator/aiDocumentGeneratorRoutes');
const reportRoutes = require('./src/features/reports/reportRoutes');
const { ensureServiceSettingSchema } = require('./src/features/servicesetting/serviceSettingSchema');
const { ensureEmployeeSchema } = require('./src/features/employee/employeeSchema');
const { ensureSalarySchema } = require('./src/features/salary/salarySchema');
const { ensureLeaveSchema } = require('./src/features/leave/leaveSchema');
const { ensureAttendanceSchema } = require('./src/features/attendance/attendanceSchema');
const { ensurePasswordResetSchema } = require('./src/features/login/passwordResetSchema');
const { startAutoCheckoutScheduler } = require('./src/features/attendance/autoCheckoutService');
const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  return sendResponse(res, 200, true, 'Server is healthy', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});
app.use('/uploads', express.static(path.join(__dirname, 'src','features','uploads'), {
  setHeaders: (res) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

app.use('/api/employees', employeeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/offer-letters', offerLetterRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/clients', require('./src/features/clients/clientRoutes'));
app.use('/api/projects', require('./src/features/projects/projectRoutes'));
app.use('/api/services', require('./src/features/services/serviceRoutes'));
// app.use('/api/salary', require('./src/features/salary/salaryRoutes'));
// app.use('/api/billing', require('./src/features/billing/billingRoutes'));
// app.use('/api/delivery', require('./src/features/delivery/deliveryRoutes'));
// app.use('/api/quotation', require('./src/features/quotation/quotationRoutes'));
// app.use('/api/attendance', require('./src/features/attendance/attendanceRoutes'));
// app.use('/api/leave', require('./src/features/leave/leaveRoutes'));
// app.use('/api/shift', require('./src/features/shift/shiftRoutes'));


app.use('/api/increment-letters', incrementLetterRoutes);
app.use('/api/experience-letters', experienceLetterRoutes);
app.use('/api/declaration-form', declarationFormRoutes);
app.use('/api/resignation-requests', resignationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/module-access', moduleAccessRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/pttm', pttmRoutes);
app.use('/api/service-settings', serviceSettingRoutes);
app.use('/api/ai-document-generator', aiDocumentGeneratorRoutes);
app.use('/api/reports', reportRoutes);
// app.use('/api/services', serviceRoutes);
app.use((req, res) => {
  return sendResponse(res, 404, false, 'Route not found', null);
});


app.use(errorHandler);

const startServer = async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();

    if (moduleAccessRoutes.ensureSchema) {
      await moduleAccessRoutes.ensureSchema();
    }

    if (pttmRoutes.ensureSchema) {
      await pttmRoutes.ensureSchema();
    }

    await ensureEmployeeSchema();
    await ensureAttendanceSchema();
    await ensurePasswordResetSchema();
    await ensureSalarySchema();
    await ensureServiceSettingSchema();
    await ensureLeaveSchema();
    await brandingModel.ensureSchema();
    if (aiDocumentGeneratorRoutes.ensureSchema) {
      await aiDocumentGeneratorRoutes.ensureSchema();
    }
    if (reportRoutes.ensureSchema) {
      await reportRoutes.ensureSchema();
    }

    app.listen(PORT, () => {
      logger.info(`Server started on port ${PORT}`);
      startAutoCheckoutScheduler(logger);
    });
  } catch (error) {
    console.error('Database connection error:', error);
    logger.error('Failed to connect to database during startup', { error });
    process.exit(1);
  }
};

startServer();

module.exports = app;
