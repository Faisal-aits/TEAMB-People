# Work Desk - Arham IT Solutions
A full-stack web application combining React frontend with Express.js backend for workforce management and face recognition capabilities.

## Project Overview
Work Desk is a comprehensive application designed for managing workspace operations with integrated face recognition technology. The platform leverages modern technologies to provide a seamless user experience with advanced features including biometric authentication, document generation, and data analytics.

## Tech Stack

### Frontend
- **React 18.2** - UI library
- **Vite** - Fast build tool and dev server
- **Axios** - HTTP client
- **React Router** - Client-side routing
- **Face-API.js** - Face detection and recognition
- **html2canvas** - Screenshot capability
- **jsPDF** - PDF generation
- **XLSX** - Excel file handling
- **React Icons** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL2** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **TensorFlow.js** - Machine learning
- **Face-API.js** - Face recognition
- **Multer** - File uploads
- **PDFKit** - PDF generation
- **Node Cron** - Scheduled tasks

## Prerequisites
Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **MySQL** (v8 or higher)
- **Git**

## Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/aniruddha-aits/work-desk.git
cd work-desk
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```
PORT=5000
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DB=aits
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

Start the backend server:
```bash
npm run dev
```

The backend will run on http://localhost:5000

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Start the development server:
```bash
npm run dev
```

The frontend will run on http://localhost:5173

## Project Structure
```
work-desk/
├── frontend/
│   ├── src/              # React components and pages
│   ├── public/           # Static assets
│   ├── package.json      # Frontend dependencies
│   ├── vite.config.js    # Vite configuration
│   └── index.html        # Main HTML file
├── backend/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   ├── cron/             # Scheduled tasks
│   ├── server.js         # Entry point
│   └── package.json      # Backend dependencies
└── README.md             # This file
```

## Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend
- `npm run dev` - Start with nodemon (auto-reload)
- `npm start` - Start production server
- `npm run build` - Build for production

## Running the Application

1. Start MySQL database

2. **Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

3. **Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

4. Access the application: Open your browser and navigate to http://localhost:5173

## Admin Credentials (Development)
- **Email:** admin@arhamitsolutions.com
- **Password:** Admin123!

> ⚠️ **Important:** Change these credentials in production!

## Features
- ✅ User authentication with JWT
- ✅ Face recognition and detection
- ✅ Document export (PDF, Excel)
- ✅ Dashboard analytics
- ✅ Scheduled cron jobs
- ✅ Responsive UI with React
- ✅ RESTful API architecture

## Database Setup
Before running the application, ensure your MySQL database is configured. Create the database:
```sql
CREATE DATABASE work_desk;
```

## Contributing
1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Troubleshooting

### Port Already in Use
If port 5000 or 5173 is already in use:
- **Backend:** Change `PORT` in `.env`
- **Frontend:** Run with custom port: `npm run dev -- --port 3000`

### MySQL Connection Error
- Verify MySQL is running
- Check `.env` database credentials
- Ensure database exists

### Module Not Found
Clear `node_modules` and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```