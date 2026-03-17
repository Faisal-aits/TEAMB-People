// backend/controllers/employeeController.js
const FaceRecognition = require('../utils/faceRecognition');
const Employee = require('../models/employeeModel');

const employeeController = {
    // Get all employees
    getAllEmployees: async (req, res) => {
        try {
            console.log('🔄 Getting all employees...');
            const filters = {};
            
            if (req.query.department_id) {
                filters.department_id = req.query.department_id;
            }
            
            if (req.query.is_active !== undefined) {
                filters.is_active = req.query.is_active === 'true';
            }
            if (req.query.role_id) {
            filters.role_id = req.query.role_id;
            }

            const employees = await Employee.getAll(filters);
            res.json({ employees });
        } catch (error) {
            console.error('Get employees error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Get employee by ID
    getEmployee: async (req, res) => {
        try {
            const employee = await Employee.getById(req.params.id);
            
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
                employee_id, role_id = '3' // Default to employee role (3)
            } = req.body;

            // Validation
            if (!first_name || !last_name || !email) {
                return res.status(400).json({ message: 'First name, last name, and email are required' });
            }

            // Check if manual employee ID already exists
            if (employee_id) {
                const exists = await Employee.checkEmployeeIdExists(employee_id);
                if (exists) {
                    return res.status(400).json({ message: 'Employee ID already exists' });
                }
            }

            const employeeData = {
                first_name,
                last_name,
                email,
                phone: phone || null,
                department_id: department_id || null,
                position: position || null,
                joining_date: joining_date || null,
                date_of_birth: date_of_birth || null,
                address: address || null,
                emergency_contact: emergency_contact || null,
                bank_account_number: bank_account_number || null,
                ifsc_code: ifsc_code || null,
                pan_number: pan_number || null,
                aadhar_number: aadhar_number || null,
                employee_id: employee_id || null,
                role_id: role_id || '3' // Ensure role_id is set
            };

            const result = await Employee.create(employeeData);

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
                bank_account_number, ifsc_code, pan_number, aadhar_number,
                role_id = '3' // Include role_id in update
            } = req.body;

            // Check if employee exists
            const existingEmployee = await Employee.getById(id);
            if (!existingEmployee) {
                return res.status(404).json({ message: 'Employee not found' });
            }

            // Prevent deactivating admin user
            if (existingEmployee.email === 'admin@arhamitsolutions.com' && is_active === false) {
                return res.status(400).json({ message: 'Cannot deactivate system administrator' });
            }

            const employeeData = {
                first_name,
                last_name,
                email,
                phone: phone || null,
                is_active: is_active !== undefined ? is_active : true,
                department_id: department_id || null,
                position: position || null,
                joining_date: joining_date || null,
                date_of_birth: date_of_birth || null,
                address: address || null,
                emergency_contact: emergency_contact || null,
                bank_account_number: bank_account_number || null,
                ifsc_code: ifsc_code || null,
                pan_number: pan_number || null,
                aadhar_number: aadhar_number || null,
                role_id: role_id || '3' // Include role_id
            };

            await Employee.update(id, employeeData);

            res.json({ message: 'Employee updated successfully' });

        } catch (error) {
            console.error('Update employee error:', error);
            
            if (error.message.includes('Cannot deactivate system administrator')) {
                return res.status(400).json({ message: error.message });
            }
            
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Delete employee
    deleteEmployee: async (req, res) => {
        try {
            const { id } = req.params;

            // Check if employee exists
            const existingEmployee = await Employee.getById(id);
            if (!existingEmployee) {
                return res.status(404).json({ message: 'Employee not found' });
            }

            // Prevent deleting admin user
            if (existingEmployee.email === 'admin@arhamitsolutions.com') {
                return res.status(400).json({ message: 'Cannot delete system administrator' });
            }

            await Employee.delete(id);

            res.json({ message: 'Employee deleted successfully' });

        } catch (error) {
            console.error('Delete employee error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Get departments
    getDepartments: async (req, res) => {
        try {
            const departments = await Employee.getDepartments();
            res.json({ departments });
        } catch (error) {
            console.error('Get departments error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Get suggested positions
    getSuggestedPositions: async (req, res) => {
        try {
            const positions = await Employee.getSuggestedPositions();
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

            const positionId = await Employee.addSuggestedPosition({
                name,
                category: category || 'Other',
                description: description || null
            });

            res.status(201).json({ 
                message: 'Position added successfully', 
                position_id: positionId 
            });
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

            console.log('🔄 Enrolling face for:', id);

            if (!file) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Face image is required' 
                });
            }

            // Extract REAL face encoding
            const faceEncoding = await FaceRecognition.extractFaceEncoding(file.buffer);
            
            if (!faceEncoding) {
                return res.status(400).json({ 
                    success: false,
                    message: 'No face detected in the image. Please ensure face is clearly visible.' 
                });
            }

            console.log('✅ Face encoding extracted:', faceEncoding.length, 'dimensions');

            // Store the actual face encoding
            const faceData = {
                enrolled: true,
                employeeId: id,
                timestamp: new Date().toISOString(),
                encoding: faceEncoding, // REAL face data
                encodingVersion: '1.0'
            };

            await Employee.updateFaceEncoding(id, JSON.stringify(faceData));

            console.log('✅ Face enrolled successfully for:', id);

            res.json({ 
                success: true,
                message: 'Face enrolled successfully with real face recognition!',
                employeeId: id
            });

        } catch (error) {
            console.error('❌ Enroll face error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Server error: ' + error.message 
            });
        }
    },

        getFaceStatus: async (req, res) => {
        try {
        const { id } = req.params;
        
        const employee = await Employee.getById(id);
        if (!employee) {
            return res.status(404).json({ 
            success: false,
            message: 'Employee not found' 
            });
        }

        const hasFaceEnrolled = !!employee.face_encoding;
        
        res.json({
            success: true,
            hasFaceEnrolled,
            enrolledAt: hasFaceEnrolled ? JSON.parse(employee.face_encoding).timestamp : null
        });

        } catch (error) {
        console.error('Get face status error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while checking face status' 
        });
        }
    },
  validateFace: async (req, res) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ 
          success: false,
          message: 'Image is required' 
        });
      }

      // Use the real face recognition to check if face exists
      const faceEncoding = await FaceRecognition.extractFaceEncoding(file.buffer);
      
      if (faceEncoding) {
        res.json({ 
          success: true,
          message: 'Face detected successfully',
          faceDetected: true
        });
      } else {
        res.json({ 
          success: false,
          message: 'No face detected in the image. Please ensure face is clearly visible.',
          faceDetected: false
        });
      }

    } catch (error) {
      console.error('Validate face error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error during face validation' 
      });
    }
  },
    // Verify face for attendance
    verifyFace: async (req, res) => {
        try {
            const { employeeId } = req.body;
            const file = req.file;

            console.log('🔍 Verifying face for:', employeeId);

            if (!file || !employeeId) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Face image and employee ID are required' 
                });
            }

            // Get employee with stored face encoding
            const employee = await Employee.getById(employeeId);
            if (!employee) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Employee not found' 
                });
            }

            if (!employee.face_encoding) {
                return res.status(400).json({ 
                    success: false,
                    message: 'No face enrolled for this employee' 
                });
            }

            // Extract face encoding from current image
            const currentFaceEncoding = await FaceRecognition.extractFaceEncoding(file.buffer);
            
            if (!currentFaceEncoding) {
                return res.json({ 
                    success: false,
                    isMatch: false,
                    message: 'No face detected in the image' 
                });
            }

            // Get stored face encoding
            const storedData = JSON.parse(employee.face_encoding);
            const storedEncoding = storedData.encoding;

            // REAL face comparison
            const isMatch = FaceRecognition.compareFaces(storedEncoding, currentFaceEncoding);

            console.log(`🎯 Verification result for ${employeeId}: ${isMatch ? 'MATCH ✅' : 'NO MATCH ❌'}`);

            res.json({
                success: true,
                isMatch: isMatch,
                confidence: isMatch ? 'High' : 'Low',
                message: isMatch ? 'Face verification successful!' : 'Face does not match enrolled employee!',
                employee: {
                    id: employee.employee_id,
                    name: employee.name
                }
            });

        } catch (error) {
            console.error('❌ Verify face error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Server error during face verification' 
            });
        }
    }
    
};

// Face processing functions
const processFaceImageForEncoding = async (base64Image) => {
  try {
    // In a real implementation, you would:
    // 1. Decode base64 image
    // 2. Use face-api.js to extract face encoding
    // 3. Return the encoding
    
    // For now, we'll simulate this process
    // In production, you would integrate with face-api.js on the backend
    // or use a cloud service like AWS Rekognition, Azure Face API, etc.
    
    console.log('Processing face image for encoding...');
    
    // Simulate face encoding extraction
    // In reality, this would be the actual face descriptor from face-api.js
    const mockEncoding = Array.from({ length: 128 }, () => Math.random());
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockEncoding;
  } catch (error) {
    console.error('Error processing face image:', error);
    throw new Error('Face detection failed');
  }
};

const compareFaceEncodings = async (encoding1, encoding2) => {
  try {
    // Calculate Euclidean distance between encodings
    if (encoding1.length !== encoding2.length) {
      return false;
    }
    
    let sumSquaredDiff = 0;
    for (let i = 0; i < encoding1.length; i++) {
      sumSquaredDiff += Math.pow(encoding1[i] - encoding2[i], 2);
    }
    
    const distance = Math.sqrt(sumSquaredDiff);
    const threshold = 0.6; // Adjust based on your requirements
    
    return distance <= threshold;
  } catch (error) {
    console.error('Error comparing face encodings:', error);
    return false;
  }
  
    
};

module.exports = employeeController;