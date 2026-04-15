const express = require('express');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const apiProtection = require('./middleware/apiProtection');

const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const projectRoutes = require('./routes/projectRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const clientRoutes = require('./routes/clientRoutes');
const serviceRoutes = require('./routes/serviceRoute');
const studentRoutes = require('./routes/studentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const attendanceEmployeeRoutes = require('./routes/attendanceEmployeeRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const reportRoutes = require('./routes/reportRoutes');
const billingRoutes = require('./routes/billingRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const serviceSettingRoutes = require('./routes/serviceSettingRoutes');
const studentAttendanceRoutes = require('./routes/studentAttendanceRoutes');
const offerLetterRoutes = require('./routes/offerLetterRoutes');

const brandingRoutes = require('./routes/brandingRoutes');
const resignationRoutes = require('./routes/resignationRoutes');
const experienceLetterRoutes = require('./routes/experienceLetterRoutes');
const incrementLetterRoutes = require('./routes/incrementLetterRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const { scheduleAutoAbsentCron } = require('./cron/attendanceCron');
const teamRoutes = require('./routes/teamRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dailyReportRoutes = require('./routes/dailyReportRoutes');
const declarationFormRoutes = require('./routes/declarationFormRoutes');

scheduleAutoAbsentCron();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
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

// =======================================================
// SECURITY MIDDLEWARE - IN THIS ORDER:
// =======================================================

// 0. Helmet - Set security-related HTTP headers
app.use(helmet({
    contentSecurityPolicy: false, // CSP handled separately if needed
    crossOriginEmbedderPolicy: false,
}));

// 1. Rate limiting - Prevent brute force and scraping
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,                   // max 200 requests per 15 min per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15,                    // max 15 login attempts per 15 min
    message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/super-admin/login', authLimiter);

// 2. CORS - STRICT: Do NOT allow requests with no origin
const allowedOrigins = [
  'https://work-desk.tech',
  'https://www.work-desk.tech',
  'https://admin.work-desk.tech',
  'http://localhost:5173',
  'http://localhost:5174',
];
app.use(cors({
  origin: function (origin, callback) {
    // In production, REJECT requests with no origin (Postman, curl, scripts)
    if (!origin) {
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true); // Allow in dev only
      }
      return callback(new Error('Direct API access is not allowed'));
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id'],
}));

// 3. Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
const path = require('path');
const fs = require('fs');
const errorLog = fs.createWriteStream(path.join(__dirname, 'error.log'), { flags: 'a' });
const originalConsoleError = console.error;
console.error = (...args) => {
    errorLog.write(new Date().toISOString() + ' - ' + args.join(' ') + '\n');
    originalConsoleError.apply(console, args);
};
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================================
// SUPER ADMIN ROUTES (completely separate, no tenant context)
// ============================================================
app.use('/api/super-admin', superAdminRoutes);

// ============================================================
// TENANT ROUTES (all tenant-scoped)
// Server-side origin validation: blocks Postman/curl/scripts
// even if they send a valid JWT (stolen from browser)
// ============================================================
app.use('/api/', apiProtection.validateOrigin);

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/attendance/employee', attendanceEmployeeRoutes);
app.use('/api/face', require('./routes/faceRoutes'));
app.use('/api/shifts', shiftRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/service-settings', serviceSettingRoutes);
app.use('/api/student-attendance', studentAttendanceRoutes);
app.use('/api/offer-letters', offerLetterRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/resignation-requests', resignationRoutes);
app.use('/api/experience-letters', experienceLetterRoutes);
app.use('/api/increment-letters', incrementLetterRoutes);
app.use('/api/teams', teamRoutes);           // Add this
app.use('/api/tasks', taskRoutes);           // Add this
app.use('/api/daily-reports', dailyReportRoutes); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static('uploads'));
app.use('/api/declaration-form', declarationFormRoutes);

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Work Desk Multi-Tenant API is running!' });
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Work Desk Multi-Tenant API',
        version: '2.0.0'
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack || err);
    res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error', 
        error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🌐 Access via: http://localhost:${PORT} or http://YOUR_IP:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔒 Super Admin API: http://localhost:${PORT}/api/super-admin`);
});