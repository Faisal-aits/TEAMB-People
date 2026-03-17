// backend/models/serviceSettingModel.js
const pool = require('../config/database');

const ServiceSetting = {
    // Get bank details
    getBankDetails: async () => {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM service_settings WHERE setting_type = ? ORDER BY updated_at DESC LIMIT 1',
                ['bank']
            );
            
            if (!rows[0]) return null;
            
            const row = rows[0];
            return {
                id: row.id,
                account_holder: row.account_holder || '',
                account_number: row.account_number || '',
                bank_name: row.bank_name || '',
                ifsc_code: row.ifsc_code || '',
                branch: row.branch || '',
                account_type: row.account_type || 'Current',
                created_at: row.created_at,
                updated_at: row.updated_at
            };
        } catch (error) {
            console.error('Error in ServiceSetting.getBankDetails:', error);
            throw error;
        }
    },

    // Get GST details
    getGstDetails: async () => {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM service_settings WHERE setting_type = ? ORDER BY updated_at DESC LIMIT 1',
                ['gst']
            );
            
            if (!rows[0]) return null;
            
            const row = rows[0];
            return {
                id: row.id,
                gstin: row.gstin || '',
                pan_number: row.pan_number || '',
                hsn_code: row.hsn_code || '',
                tax_rate: parseFloat(row.tax_rate) || 18,
                is_gst_applicable: row.is_gst_applicable === 1 || row.is_gst_applicable === true || row.is_gst_applicable === '1',
                sgst_rate: parseFloat(row.sgst_rate) || 9,
                cgst_rate: parseFloat(row.cgst_rate) || 9,
                igst_rate: parseFloat(row.igst_rate) || 18,
                created_at: row.created_at,
                updated_at: row.updated_at
            };
        } catch (error) {
            console.error('Error in ServiceSetting.getGstDetails:', error);
            throw error;
        }
    },

    // Get quotation settings
    getQuotationSettings: async () => {
        try {
            // Get both bank and GST details
            const bankDetails = await ServiceSetting.getBankDetails();
            const gstDetails = await ServiceSetting.getGstDetails();
            
            return {
                bankDetails: bankDetails || {
                    id: null,
                    account_holder: '',
                    account_number: '',
                    bank_name: '',
                    ifsc_code: '',
                    branch: '',
                    account_type: 'Current',
                    created_at: null,
                    updated_at: null
                },
                gstDetails: gstDetails || {
                    id: null,
                    gstin: '',
                    pan_number: '',
                    hsn_code: '',
                    tax_rate: 18,
                    is_gst_applicable: true,
                    sgst_rate: 9,
                    cgst_rate: 9,
                    igst_rate: 18,
                    created_at: null,
                    updated_at: null
                }
            };
        } catch (error) {
            console.error('Error in ServiceSetting.getQuotationSettings:', error);
            // Return default settings on error
            return {
                bankDetails: {
                    id: null,
                    account_holder: '',
                    account_number: '',
                    bank_name: '',
                    ifsc_code: '',
                    branch: '',
                    account_type: 'Current',
                    created_at: null,
                    updated_at: null
                },
                gstDetails: {
                    id: null,
                    gstin: '',
                    pan_number: '',
                    hsn_code: '',
                    tax_rate: 18,
                    is_gst_applicable: true,
                    sgst_rate: 9,
                    cgst_rate: 9,
                    igst_rate: 18,
                    created_at: null,
                    updated_at: null
                }
            };
        }
    },

    // Update bank details
    updateBankDetails: async (bankData) => {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Check if bank settings exist
            const [existing] = await connection.execute(
                'SELECT id FROM service_settings WHERE setting_type = ?',
                ['bank']
            );

            if (existing.length > 0) {
                // Update existing
                await connection.execute(
                    `UPDATE service_settings SET 
                     account_holder = ?, account_number = ?, bank_name = ?, ifsc_code = ?, 
                     branch = ?, account_type = ?, updated_at = CURRENT_TIMESTAMP
                     WHERE setting_type = ?`,
                    [
                        bankData.account_holder,
                        bankData.account_number,
                        bankData.bank_name,
                        bankData.ifsc_code,
                        bankData.branch,
                        bankData.account_type,
                        'bank'
                    ]
                );
            } else {
                // Insert new
                await connection.execute(
                    `INSERT INTO service_settings 
                     (setting_type, account_holder, account_number, bank_name, ifsc_code, branch, account_type)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        'bank',
                        bankData.account_holder,
                        bankData.account_number,
                        bankData.bank_name,
                        bankData.ifsc_code,
                        bankData.branch,
                        bankData.account_type
                    ]
                );
            }

            await connection.commit();
            return true;

        } catch (error) {
            await connection.rollback();
            console.error('Error in ServiceSetting.updateBankDetails:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Update GST details
    updateGstDetails: async (gstData) => {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Check if GST settings exist
            const [existing] = await connection.execute(
                'SELECT id FROM service_settings WHERE setting_type = ?',
                ['gst']
            );

            if (existing.length > 0) {
                // Update existing
                await connection.execute(
                    `UPDATE service_settings SET 
                     gstin = ?, pan_number = ?, hsn_code = ?, tax_rate = ?, 
                     is_gst_applicable = ?, sgst_rate = ?, cgst_rate = ?, igst_rate = ?, 
                     updated_at = CURRENT_TIMESTAMP
                     WHERE setting_type = ?`,
                    [
                        gstData.gstin,
                        gstData.pan_number,
                        gstData.hsn_code,
                        gstData.tax_rate,
                        gstData.is_gst_applicable,
                        gstData.sgst_rate,
                        gstData.cgst_rate,
                        gstData.igst_rate,
                        'gst'
                    ]
                );
            } else {
                // Insert new
                await connection.execute(
                    `INSERT INTO service_settings 
                     (setting_type, gstin, pan_number, hsn_code, tax_rate, is_gst_applicable, sgst_rate, cgst_rate, igst_rate)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        'gst',
                        gstData.gstin,
                        gstData.pan_number,
                        gstData.hsn_code,
                        gstData.tax_rate,
                        gstData.is_gst_applicable,
                        gstData.sgst_rate,
                        gstData.cgst_rate,
                        gstData.igst_rate
                    ]
                );
            }

            await connection.commit();
            return true;

        } catch (error) {
            await connection.rollback();
            console.error('Error in ServiceSetting.updateGstDetails:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = ServiceSetting;