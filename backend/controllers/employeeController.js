const FaceRecognition = require('../utils/faceRecognition');
const Employee = require('../models/employeeModel');
const pool = require('../config/database');

const employeeController = {
    // Get roles for this tenant
    getRoles: async (req, res) => {
        try {
            const [roles] = await pool.execute(
                'SELECT id, name, description FROM roles WHERE tenant_id = ? ORDER BY id',
                [req.tenantId]
            );
            res.json({ roles });
        } catch (error) {
            console.error('Get roles error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Get all employees
   getAllEmployees: async (req, res) => {
    try {
        const filters = {};
        if (req.query.department_id) filters.department_id = req.query.department_id;
        if (req.query.is_active !== undefined) {
            filters.is_active = req.query.is_active === 'true';
        }
        if (req.query.role_id) filters.role_id = req.query.role_id;

        console.log('Backend filters received:', req.query);
        console.log('Processed filters:', filters);

        const employees = await Employee.getAll(req.tenantId, filters);
        console.log(`Found ${employees.length} employees`);
        
        // Log first employee if exists
        if (employees.length > 0) {
            console.log('First employee sample:', {
                id: employees[0].employee_id,
                name: `${employees[0].first_name} ${employees[0].last_name}`,
                role: employees[0].role_name,
                is_active: employees[0].is_active
            });
        }
        
        res.json({ employees });
    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({ message: 'Server error' });
    }
},

    // Get employee by ID
    getEmployee: async (req, res) => {
        try {
            const employee = await Employee.getById(req.tenantId, req.params.id);
            if (!employee) {
                return res.status(404).json({ message: 'Employee not found' });
            }
            res.json({ employee });
        } catch (error) {
            console.error('Get employee error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Create new employee
    createEmployee: async (req, res) => {
        try {
            const {
                first_name, last_name, email, phone, department_id, position,
                joining_date, date_of_birth, address, emergency_contact,
                bank_account_number, ifsc_code, pan_number, aadhar_number,
                employee_id, role_id
            } = req.body;

            if (!first_name || !last_name || !email) {
                return res.status(400).json({ message: 'First name, last name, and email are required' });
            }

            if (employee_id) {
                const exists = await Employee.checkEmployeeIdExists(req.tenantId, employee_id);
                if (exists) {
                    return res.status(400).json({ message: 'Employee ID already exists' });
                }
            }

            const employeeData = {
                first_name, last_name, email,
                phone: phone || null, department_id: department_id || null, position: position || null,
                joining_date: joining_date || null, date_of_birth: date_of_birth || null,
                address: address || null, emergency_contact: emergency_contact || null,
                bank_account_number: bank_account_number || null, ifsc_code: ifsc_code || null,
                pan_number: pan_number || null, aadhar_number: aadhar_number || null,
                employee_id: employee_id || null, role_id: role_id || null
            };

            const result = await Employee.create(req.tenantId, employeeData);

            res.status(201).json({ 
                message: 'Employee created successfully! They can now login with their email and set their password.', 
                user_id: result.user_id,
                employee_id: result.employee_id
            });

        } catch (error) {
            console.error('Create employee error:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Email already exists' });
            }
            if (error.message.includes('Employee ID already exists')) {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Server error: ' + error.message });
        }
    },

    // Update employee
    updateEmployee: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                first_name, last_name, email, phone, is_active, department_id, position,
                joining_date, date_of_birth, address, emergency_contact,
                bank_account_number, ifsc_code, pan_number, aadhar_number, role_id
            } = req.body;

            const existingEmployee = await Employee.getById(req.tenantId, id);
            if (!existingEmployee) {
                return res.status(404).json({ message: 'Employee not found' });
            }

            const employeeData = {
                first_name, last_name, email,
                phone: phone || null, is_active: is_active !== undefined ? is_active : true,
                department_id: department_id || null, position: position || null,
                joining_date: joining_date || null, date_of_birth: date_of_birth || null,
                address: address || null, emergency_contact: emergency_contact || null,
                bank_account_number: bank_account_number || null, ifsc_code: ifsc_code || null,
                pan_number: pan_number || null, aadhar_number: aadhar_number || null,
                role_id: role_id || '3'
            };

            await Employee.update(req.tenantId, id, employeeData);
            res.json({ message: 'Employee updated successfully' });

        } catch (error) {
            console.error('Update employee error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Delete employee
    deleteEmployee: async (req, res) => {
        try {
            const { id } = req.params;
            const existingEmployee = await Employee.getById(req.tenantId, id);
            if (!existingEmployee) {
                return res.status(404).json({ message: 'Employee not found' });
            }

            await Employee.delete(req.tenantId, id);
            res.json({ message: 'Employee deleted successfully' });

        } catch (error) {
            console.error('Delete employee error:', error);
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ 
                    message: 'Cannot delete this employee because they have associated records (attendance, tasks, etc.). Please edit and change their status to INACTIVE instead.' 
                });
            }
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Get departments
    getDepartments: async (req, res) => {
        try {
            const departments = await Employee.getDepartments(req.tenantId);
            res.json({ departments });
        } catch (error) {
            console.error('Get departments error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Get suggested positions
    getSuggestedPositions: async (req, res) => {
        try {
            const positions = await Employee.getSuggestedPositions(req.tenantId);
            res.json({ positions });
        } catch (error) {
            console.error('Get suggested positions error:', error);
            res.status(500).json({ message: 'Server error: ' + error.message });
        }
    },

    // Add new suggested position
    addSuggestedPosition: async (req, res) => {
        try {
            const { name, category, description } = req.body;
            if (!name) {
                return res.status(400).json({ message: 'Position name is required' });
            }

            const positionId = await Employee.addSuggestedPosition(req.tenantId, {
                name, category: category || 'Other', description: description || null
            });

            res.status(201).json({ message: 'Position added successfully', position_id: positionId });
        } catch (error) {
            console.error('Add suggested position error:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Position already exists' });
            }
            res.status(500).json({ message: 'Server error: ' + error.message });
        }
    },

    // Enroll face for employee
    enrollFace: async (req, res) => {
        try {
            const { id } = req.params;
            const file = req.file;

            if (!file) {
                return res.status(400).json({ success: false, message: 'Face image is required' });
            }

            const faceEncoding = await FaceRecognition.extractFaceEncoding(file.buffer);
            if (!faceEncoding) {
                return res.status(400).json({ success: false, message: 'No face detected in the image.' });
            }

            const faceData = {
                enrolled: true, employeeId: id, timestamp: new Date().toISOString(),
                encoding: faceEncoding, encodingVersion: '1.0'
            };

            await Employee.updateFaceEncoding(req.tenantId, id, JSON.stringify(faceData));

            res.json({ success: true, message: 'Face enrolled successfully!', employeeId: id });
        } catch (error) {
            console.error('❌ Enroll face error:', error);
            res.status(500).json({ success: false, message: 'Server error: ' + error.message });
        }
    },

    getFaceStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const employee = await Employee.getById(req.tenantId, id);
            if (!employee) {
                return res.status(404).json({ success: false, message: 'Employee not found' });
            }

            const hasFaceEnrolled = !!employee.face_encoding;
            res.json({
                success: true, hasFaceEnrolled,
                enrolledAt: hasFaceEnrolled ? JSON.parse(employee.face_encoding).timestamp : null
            });
        } catch (error) {
            console.error('Get face status error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    validateFace: async (req, res) => {
        try {
            const file = req.file;
            if (!file) {
                return res.status(400).json({ success: false, message: 'Image is required' });
            }

            const faceEncoding = await FaceRecognition.extractFaceEncoding(file.buffer);
            res.json({
                success: !!faceEncoding, faceDetected: !!faceEncoding,
                message: faceEncoding ? 'Face detected successfully' : 'No face detected'
            });
        } catch (error) {
            console.error('Validate face error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // Verify face for attendance
    verifyFace: async (req, res) => {
        try {
            const { employeeId } = req.body;
            const file = req.file;

            if (!file || !employeeId) {
                return res.status(400).json({ success: false, message: 'Face image and employee ID are required' });
            }

            const employee = await Employee.getById(req.tenantId, employeeId);
            if (!employee) {
                return res.status(404).json({ success: false, message: 'Employee not found' });
            }

            if (!employee.face_encoding) {
                return res.status(400).json({ success: false, message: 'No face enrolled for this employee' });
            }

            const currentFaceEncoding = await FaceRecognition.extractFaceEncoding(file.buffer);
            if (!currentFaceEncoding) {
                return res.json({ success: false, isMatch: false, message: 'No face detected in the image' });
            }

            const storedData = JSON.parse(employee.face_encoding);
            const isMatch = FaceRecognition.compareFaces(storedData.encoding, currentFaceEncoding);

            res.json({
                success: true, isMatch, confidence: isMatch ? 'High' : 'Low',
                message: isMatch ? 'Face verification successful!' : 'Face does not match!',
                employee: { id: employee.employee_id, name: `${employee.first_name} ${employee.last_name}` }
            });
        } catch (error) {
            console.error('❌ Verify face error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
};

module.exports = employeeController;