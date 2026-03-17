// backend/controllers/reportController.js
const pool = require('../config/database');
const Report = require('../models/reportModel');

const reportController = {
    // Get all reports - with user-based filtering
    getAllReports: async (req, res) => {
        try {
            const userId = req.user.id;
            const userRole = req.user.role; // Make sure role is available in req.user

            const reports = await Report.getAll(userId, userRole);
            res.json({ reports });
        } catch (error) {
            console.error('Get reports error:', error);
            res.status(500).json({ message: 'Server error while fetching reports' });
        }
    },

    // Get report by ID - with access control
    getReport: async (req, res) => {
        try {
            const userId = req.user.id;
            const userRole = req.user.role;

            const report = await Report.getById(req.params.id, userId, userRole);
            
            if (!report) {
                return res.status(404).json({ message: 'Report not found or access denied' });
            }

            res.json({ report });
        } catch (error) {
            console.error('Get report error:', error);
            res.status(500).json({ message: 'Server error while fetching report' });
        }
    },

    // Create new report
    createReport: async (req, res) => {
        try {
            const { date_generated, description } = req.body;

            // Validation
            if (!date_generated || !description) {
                return res.status(400).json({ message: 'Date and description are required' });
            }

            const reportId = await Report.create({
                date_generated,
                description,
                generated_by: req.user.id // From auth middleware
            });

            res.status(201).json({ 
                message: 'Report created successfully', 
                report_id: reportId 
            });
        } catch (error) {
            console.error('Create report error:', error);
            res.status(500).json({ message: 'Server error while creating report' });
        }
    },

    // Update report - with access control
    updateReport: async (req, res) => {
        try {
            const { date_generated, description } = req.body;
            const reportId = req.params.id;
            const userId = req.user.id;
            const userRole = req.user.role;

            // Validation
            if (!date_generated || !description) {
                return res.status(400).json({ message: 'Date and description are required' });
            }

            const affectedRows = await Report.update(reportId, {
                date_generated,
                description
            }, userId, userRole);

            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Report not found or access denied' });
            }

            res.json({ message: 'Report updated successfully' });
        } catch (error) {
            console.error('Update report error:', error);
            res.status(500).json({ message: 'Server error while updating report' });
        }
    },

    // Delete report - with access control
    deleteReport: async (req, res) => {
        try {
            const reportId = req.params.id;
            const userId = req.user.id;
            const userRole = req.user.role;

            const affectedRows = await Report.delete(reportId, userId, userRole);

            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Report not found or access denied' });
            }

            res.json({ message: 'Report deleted successfully' });
        } catch (error) {
            console.error('Delete report error:', error);
            res.status(500).json({ message: 'Server error while deleting report' });
        }
    },
    //...................................For dashboard...........................
// In reportController.js - Keep ONLY this getRecentReports function
getRecentReports: async (req, res) => {
    try {
        console.log('=== WORKING VERSION - Hardcoded limit ===');
        
        const limit = parseInt(req.query.limit) || 5;
        console.log(`Requested limit: ${limit}, Using: 5 (hardcoded)`);
        
        const pool = require('../config/database');
        
        // HARDCODE the limit to avoid parameter binding issue
        const query = `
            SELECT 
                r.*,
                CONCAT(u.first_name, ' ', u.last_name) as generated_by_name
            FROM reports r
            LEFT JOIN users u ON r.generated_by = u.id
            ORDER BY r.date_generated DESC 
            LIMIT 5
        `;
        
        console.log('Executing query without parameters...');
        const [reports] = await pool.execute(query); // No parameters!
        
        console.log(`Found ${reports.length} reports`);
        
        // DEBUG: Check what fields we have
        if (reports.length > 0) {
            console.log('First report has these fields:', Object.keys(reports[0]));
            console.log('generated_by_name value:', reports[0].generated_by_name);
        }
        
        res.json({ 
            success: true,
            reports: reports,
            count: reports.length
        });
        
    } catch (error) {
        console.error('Error in getRecentReports:', error);
        
        // Try even simpler query
        try {
            const pool = require('../config/database');
            const [reports] = await pool.execute(`
                SELECT 
                    id,
                    date_generated,
                    description,
                    generated_by,
                    created_at,
                    updated_at
                FROM reports 
                ORDER BY date_generated DESC 
                LIMIT 5
            `);
            
            res.json({ 
                success: true,
                reports: reports,
                message: 'Used simplest query'
            });
        } catch (simpleError) {
            console.error('Simple query also failed:', simpleError);
            res.status(500).json({ 
                success: false,
                message: 'Server error',
                error: simpleError.message 
            });
        }
    }
}
};

module.exports = reportController;