// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const authController = {
    // User Login with first-time password setup
    login: async (req, res) => {
        try {
            console.log('Login request received:', req.body);
            
            const { email, password } = req.body;

            // Basic validation
            if (!email || !password) {
                return res.status(400).json({ 
                    message: 'Email and password are required' 
                });
            }

            // Find user
            const user = await User.findByEmail(email);
            console.log('User found:', user ? 'Yes' : 'No');
            
            if (!user) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // Check if this is first-time login (no password set)
            if (!user.password_hash) {
                console.log('First time login - setting password');
                
                // Hash and set the password
                const saltRounds = 10;
                const password_hash = await bcrypt.hash(password, saltRounds);
                
                // Update user with the new password
                await User.updatePassword(user.id, password_hash);
                
                console.log('Password set successfully for first-time login');
                
                // Generate JWT token
                const token = jwt.sign(
                    { 
                        id: user.id, 
                        email: user.email, 
                        role_name: user.role_name,
                        first_name: user.first_name,
                        last_name: user.last_name
                    },
                    process.env.JWT_SECRET || 'arham_simple_secret_2023',
                    { expiresIn: '24h' }
                );

                return res.json({
                    message: 'Password set successfully! Welcome to the system.',
                    token,
                    user: {
                        id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        role: user.role_name
                    },
                    firstLogin: true
                });
            }

            // REGULAR LOGIN - Verify existing password
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            console.log('Password valid:', isPasswordValid);
            
            if (!isPasswordValid) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = jwt.sign(
                { 
                    id: user.id, 
                    email: user.email, 
                    role_name: user.role_name,
                    first_name: user.first_name,
                    last_name: user.last_name
                },
                process.env.JWT_SECRET || 'arham_simple_secret_2023',
                { expiresIn: '24h' }
            );

            console.log('Login successful, token generated');
            
            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role_name
                },
                firstLogin: false
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Server error: ' + error.message });
        }
    },

    // User Registration (for creating new users with hashed passwords)
    register: async (req, res) => {
        try {
            const { role_id, first_name, last_name, email, password, phone } = req.body;

            // Check if user already exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists with this email' });
            }

            // Hash password
            const saltRounds = 10;
            const password_hash = await bcrypt.hash(password, saltRounds);

            // Create user
            const userId = await User.create({
                role_id,
                first_name,
                last_name,
                email,
                password_hash,
                phone
            });

            res.status(201).json({
                message: 'User created successfully',
                user_id: userId
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ message: 'Server error: ' + error.message });
        }
    },

    // Get Current User Profile
    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role_name,
                    created_at: user.created_at
                }
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Change Password
    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ message: 'Current password and new password are required' });
            }

            // Get user current password
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Verify current password
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
            
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }

            // Hash new password
            const saltRounds = 10;
            const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

            // Update password
            await User.updatePassword(userId, newPasswordHash);

            res.json({ message: 'Password changed successfully' });

        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};

module.exports = authController;