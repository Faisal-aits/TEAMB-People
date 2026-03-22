const express = require('express');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

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
const superAdminRoutes = require('./routes/superAdminRoutes');
const { scheduleAutoAbsentCron } = require('./cron/attendanceCron');
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

// Middleware - IN THIS ORDER:
app.use(cors()); // 1. CORS first

app.use(express.json({ limit: '10mb' })); // 2. JSON parsing with limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // 3. URL encoded

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
// ============================================================
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
app.use('/api/attendance/my', attendanceEmployeeRoutes);
app.use('/api/face', require('./routes/faceRoutes'));
app.use('/api/shifts', shiftRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/service-settings', serviceSettingRoutes);
app.use('/api/student-attendance', studentAttendanceRoutes);
app.use('/api/offer-letters', offerLetterRoutes);



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

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🌐 Access via: http://localhost:${PORT} or http://YOUR_IP:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔒 Super Admin API: http://localhost:${PORT}/api/super-admin`);
});