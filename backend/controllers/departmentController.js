// backend/controllers/departmentController.js
const Department = require('../models/departmentModel');

const departmentController = {
    // Get all departments
    getAllDepartments: async (req, res) => {
        try {
            const departments = await Department.getAll();
            res.json({ departments });
        } catch (error) {
            console.error('Get departments error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Get department by ID
    getDepartment: async (req, res) => {
        try {
            const department = await Department.getById(req.params.id);
            
            if (!department) {
                return res.status(404).json({ message: 'Department not found' });
            }

            res.json({ department });
        } catch (error) {
            console.error('Get department error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Create new department
    createDepartment: async (req, res) => {
        try {
            const { name, description, manager } = req.body;

            // Validation
            if (!name || !manager) {
                return res.status(400).json({ message: 'Department name and manager are required' });
            }

            // Check if department name already exists
            const nameExists = await Department.checkNameExists(name);
            if (nameExists) {
                return res.status(400).json({ message: 'Department name already exists' });
            }

            const departmentId = await Department.create({
                name,
                description: description || '',
                manager
            });

            res.status(201).json({ 
                message: 'Department created successfully', 
                department_id: departmentId 
            });
        } catch (error) {
            console.error('Create department error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Update department
    updateDepartment: async (req, res) => {
        try {
            const { name, description, manager } = req.body;
            const departmentId = req.params.id;

            // Validation
            if (!name || !manager) {
                return res.status(400).json({ message: 'Department name and manager are required' });
            }

            // Check if department exists
            const existingDepartment = await Department.getById(departmentId);
            if (!existingDepartment) {
                return res.status(404).json({ message: 'Department not found' });
            }

            // Check if department name already exists (excluding current department)
            const nameExists = await Department.checkNameExists(name, departmentId);
            if (nameExists) {
                return res.status(400).json({ message: 'Department name already exists' });
            }

            const affectedRows = await Department.update(departmentId, {
                name,
                description: description || '',
                manager
            });

            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Department not found' });
            }

            res.json({ message: 'Department updated successfully' });
        } catch (error) {
            console.error('Update department error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Delete department
    deleteDepartment: async (req, res) => {
        try {
            const departmentId = req.params.id;

            // Check if department exists
            const existingDepartment = await Department.getById(departmentId);
            if (!existingDepartment) {
                return res.status(404).json({ message: 'Department not found' });
            }

            // Check if department has employees
            if (existingDepartment.employee_count > 0) {
                return res.status(400).json({ 
                    message: 'Cannot delete department with assigned employees. Please reassign employees first.' 
                });
            }

            const affectedRows = await Department.delete(departmentId);

            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Department not found' });
            }

            res.json({ message: 'Department deleted successfully' });
        } catch (error) {
            console.error('Delete department error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Get department employees
    getDepartmentEmployees: async (req, res) => {
        try {
            const departmentId = req.params.id;
            
            // Check if department exists
            const department = await Department.getById(departmentId);
            if (!department) {
                return res.status(404).json({ message: 'Department not found' });
            }

            const employees = await Department.getEmployees(departmentId);
            res.json({ employees });
        } catch (error) {
            console.error('Get department employees error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Get managers list
    getManagers: async (req, res) => {
        try {
            const managers = await Department.getManagers();
            res.json({ managers });
        } catch (error) {
            console.error('Get managers error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};

module.exports = departmentController;