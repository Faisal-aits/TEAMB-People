process.env.TZ = 'Asia/Kolkata';
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
const moduleAccessRoutes = require('./src/features/moduleAccess/moduleAccessRoutes');
const dashboardRoutes = require('./src/features/dashboard/dashboardRoutes');
const serviceSettingRoutes = require('./src/features/servicesetting/serviceSettingRoutes');
const aiDocumentGeneratorRoutes = require('./src/features/aiDocumentGenerator/aiDocumentGeneratorRoutes');
const reportRoutes = require('./src/features/reports/reportRoutes');
const ticketRoutes = require('./src/features/tickets/ticketRoutes');
const integrationRoutes = require('./src/features/integrations/integrationRoutes');
const integrationAdminRoutes = require('./src/features/integrations/integrationAdminRoutes');
const { ensureIntegrationSchema } = require('./src/features/integrations/integrationSchema');
const { ensureServiceSettingSchema } = require('./src/features/servicesetting/serviceSettingSchema');
const { ensureEmployeeSchema } = require('./src/features/employee/employeeSchema');
const { ensureSalarySchema } = require('./src/features/salary/salarySchema');
const { ensureLeaveSchema } = require('./src/features/leave/leaveSchema');
const { ensureAttendanceSchema } = require('./src/features/attendance/attendanceSchema');
const { ensureRegularizationSchema } = require('./src/features/attendance/regularizationSchema');
const { ensureBreakSchema } = require('./src/features/break/breakSchema');
const { ensurePasswordResetSchema } = require('./src/features/login/passwordResetSchema');
const { ensureTicketSchema } = require('./src/features/tickets/ticketSchema');
const { ensureSettingsSchema } = require('./src/features/settings/settingsSchema');
const { startAutoCheckoutScheduler } = require('./src/features/attendance/autoCheckoutService');
const { startProbationChecker } = require('./src/jobs/probationChecker');
const { startIncrementChecker } = require('./src/jobs/incrementChecker');
const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get(['/health', '/api/health'], (req, res) => {
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
const uploadsPath = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
  }
}));
app.use('/uploads', express.static(path.join(__dirname, 'src', 'features', 'uploads'), {
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
app.use('/api/company-documents', require('./src/features/company_documents/companyDocumentRoutes'));
// app.use('/api/billing', require('./src/features/billing/billingRoutes'));
// app.use('/api/delivery', require('./src/features/delivery/deliveryRoutes'));
// app.use('/api/quotation', require('./src/features/quotation/quotationRoutes'));
// app.use('/api/attendance', require('./src/features/attendance/attendanceRoutes'));
// app.use('/api/leave', require('./src/features/leave/leaveRoutes'));
// app.use('/api/shift', require('./src/features/shift/shiftRoutes'));
app.use('/api/break', require('./src/features/break/breakRoutes'));

// Setup routes with module access checks
const apiRouter = express.Router();
app.use('/api/increment-letters', incrementLetterRoutes);
app.use('/api/experience-letters', experienceLetterRoutes);
app.use('/api/declaration-form', declarationFormRoutes);
app.use('/api/resignation-requests', resignationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/module-access', moduleAccessRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/service-settings', serviceSettingRoutes);
app.use('/api/ai-document-generator', aiDocumentGeneratorRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/settings', require('./src/features/settings/settingsRoutes'));
app.use('/api/notifications', require('./src/features/notifications/notificationRoutes'));
app.use('/api/documents', require('./src/features/documents/documentRoutes'));
// Integration API — external application ticket creation (API Key auth)
app.use('/api/integration', integrationRoutes);
// Integration admin — API key management and audit logs (JWT admin auth)
app.use('/api/admin/integration', integrationAdminRoutes);
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

    await ensureEmployeeSchema();
    await ensureAttendanceSchema();
    await ensureBreakSchema();
    await ensureRegularizationSchema();
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
    await ensureTicketSchema();
    await ensureIntegrationSchema();
    await ensureSettingsSchema();

    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`)
      logger.info(`Server started on port ${PORT}`);
      startAutoCheckoutScheduler(logger);
      startProbationChecker();
      startIncrementChecker();
    });
  } catch (error) {
    console.error('Database connection error:', error);
    logger.error('Failed to connect to database during startup', { error });
    process.exit(1);
  }
};

startServer();

module.exports = app;
