import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaCamera, FaCheckCircle, FaTimesCircle, FaSync } from 'react-icons/fa';
import { attendanceAPI } from '../../../services/attendanceAPI';
import { employeeAPI } from '../../../services/employeeAPI';

import './Attendance.css';

const AttendanceManagement = () => {
  // ==================== REAL ATTENDANCE DATA ====================
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==================== MODAL STATES ====================
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEnrollFaceModalOpen, setIsEnrollFaceModalOpen] = useState(false);
  const [selectedEmployeeForEnroll, setSelectedEmployeeForEnroll] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);

  const [faceValidation, setFaceValidation] = useState({ isValid: false, message: '' });

  // ==================== INITIALIZE REAL DATA ====================
  useEffect(() => {
    initializeRealData();
  }, []);

  const initializeRealData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Initializing real data...');
      
      // Fetch all employees and today's attendance data in parallel
      const [employeesResponse, attendanceResponse] = await Promise.all([
        employeeAPI.getAll().catch(err => {
          console.error('Employee API error:', err);
          return { data: { employees: [] } }; // Fallback
        }),
        attendanceAPI.getAll({ date: new Date().toISOString().split('T')[0] }).catch(err => {
          console.error('Attendance API error:', err);
          return { data: { attendance: [] } }; // Fallback
        })
      ]);
      
      console.log('Employees response:', employeesResponse);
      console.log('Attendance response:', attendanceResponse);
      
      // Handle employees data - map to expected structure
      if (employeesResponse.data && employeesResponse.data.employees) {
        const formattedEmployees = employeesResponse.data.employees.map(emp => ({
          id: emp.employee_id, // Use employee_id from your API
          name: `${emp.first_name} ${emp.last_name}`,
          department: emp.department_name || 'Unknown Department',
          position: emp.position || 'Unknown Position',
          email: emp.email,
          phone: emp.phone,
          is_active: emp.is_active,
          // Include all original data for reference
          ...emp
        }));
        setEmployees(formattedEmployees);
        console.log('Employees set:', formattedEmployees.length);
      } else {
        console.log('No employees data found in response');
        setEmployees([]);
      }
      
      // Handle attendance data
      if (attendanceResponse.data) {
        // Handle different possible response structures
        const attendance = attendanceResponse.data.attendance || attendanceResponse.data || [];
        setAttendanceData(attendance);
        console.log('Attendance data set:', attendance.length);
      }
      
    } catch (err) {
      console.error('Error initializing data:', err);
      setError(`Failed to load data: ${err.message}`);
      
      // Fallback to empty arrays
      setAttendanceData([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoMarkAbsent = async () => {
    try {
        const response = await attendanceAPI.markAbsent();
        alert(response.data.message);
        initializeRealData(); // Refresh data
    } catch (err) {
        console.error('Error marking absent:', err);
        alert('Failed to mark absent: ' + (err.response?.data?.message || err.message));
    }
};

  // ==================== ATTENDANCE STATISTICS ====================
  const attendanceStats = {
    totalPresent: attendanceData.filter(a => a.status === 'Present').length,
    totalDelayed: attendanceData.filter(a => a.status === 'Delayed').length,
    totalLeaves: attendanceData.filter(a => a.status === 'On Leave'|| a.status === 'Absent').length,
    totalEmployees: employees.length // Use total employees count
  };

  const getEmployeeHistoryStats = (employeeHistory) => {
    return {
      totalPresent: employeeHistory.filter(a => a.status === 'Present').length,
      totalDelayed: employeeHistory.filter(a => a.status === 'Delayed').length,
      totalLeaves: employeeHistory.filter(a => a.status === 'On Leave'|| a.status === 'Absent').length,
      totalRecords: employeeHistory.length
    };
  };

  // ==================== ATTENDANCE FUNCTIONS ====================
  const handleApprove = async (attendanceId) => {
    if (!attendanceId) {
      alert('No attendance record found to approve');
      return;
    }

    try {
      console.log('Approving attendance:', attendanceId);
      await attendanceAPI.approve(attendanceId);
      
      // Update local state
      setAttendanceData(prev => prev.map(item => 
        item.attendance_id === attendanceId ? { ...item, status: 'Present' } : item
      ));
      
      alert('Attendance approved successfully!');
      initializeRealData();
    } catch (err) {
      console.error('Error approving attendance:', err);
      alert('Failed to approve attendance: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (attendanceId) => {
    if (!attendanceId) {
      alert('No attendance record found to reject');
      return;
    }

    try {
      console.log('Rejecting attendance:', attendanceId);
      await attendanceAPI.reject(attendanceId, 'Rejected by manager');
      
      // Update local state
      setAttendanceData(prev => prev.map(item => 
        item.attendance_id === attendanceId ? { ...item, status: 'On Leave' } : item
      ));
      
      alert('Attendance marked as leave!');
      initializeRealData();
    } catch (err) {
      console.error('Error rejecting attendance:', err);
      alert('Failed to reject attendance: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleViewAttendanceHistory = async (employee) => {
    try {
      setLoading(true);
      console.log('Fetching history for employee:', employee.id);
      const response = await attendanceAPI.getEmployeeHistory(employee.id);
      
      console.log('History response:', response);
      
      if (response.data) {
        // Handle different response structures
        const history = response.data.history || response.data || [];
        setAttendanceHistory(history);
        setSelectedEmployee(employee);
        setIsAttendanceModalOpen(true);
      }
    } catch (err) {
      console.error('Error fetching employee history:', err);
      // Show mock history for demo
      const mockHistory = [
        {
          history_id: 1,
          date: new Date().toISOString().split('T')[0],
          description: 'Regular attendance',
          status: 'Present'
        },
        {
          history_id: 2,
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          description: 'Sick Leave',
          status: 'On Leave'
        }
      ];
      setAttendanceHistory(mockHistory);
      setSelectedEmployee(employee);
      setIsAttendanceModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // ==================== FACE ENROLLMENT FUNCTIONS ====================
  const handleEnrollFace = () => {
    setIsEnrollFaceModalOpen(true);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user' 
        } 
      });
      setCameraStream(stream);
      
      const video = document.getElementById('camera-preview');
      if (video) {
        video.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

// In AttendanceManagement.jsx - Update handleCapturePhoto
const handleCapturePhoto = async () => {
  const video = document.getElementById('camera-preview');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  const imageDataUrl = canvas.toDataURL('image/png');
  
  try {
    // Show loading state
    setFaceValidation({ isValid: false, message: 'Validating face...' });
    
    // Convert to file and send to backend for validation
    const imageFile = await compressImageToFile(imageDataUrl);
    
    // Send to backend API for face validation
    const formData = new FormData();
    formData.append('faceImage', imageFile);
    
    // You need to create this API endpoint
    const response = await api.post('/face/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    if (response.data.success) {
      setFaceValidation({ 
        isValid: true, 
        message: '✅ Face detected and validated!' 
      });
      setCapturedImage(imageDataUrl);
      stopCamera();
    } else {
      setFaceValidation({ 
        isValid: false, 
        message: response.data.message || '❌ No face detected. Please try again.' 
      });
    }
  } catch (error) {
    console.error('Face validation error:', error);
    // Fallback: just capture without validation
    setCapturedImage(imageDataUrl);
    stopCamera();
    setFaceValidation({ isValid: true, message: '✅ Photo captured' });
  }
};

  const handleRetakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };
// ==================== WORKING IMAGE COMPRESSION ====================
  const compressImage = (base64Image, quality = 0.5, maxWidth = 400) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with compression
        try {
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          
          console.log(`📊 Image compression: ${(base64Image.length / 1024).toFixed(1)}KB → ${(compressedBase64.length / 1024).toFixed(1)}KB`);
          
          // If compression didn't help much, use original but warn
          if (compressedBase64.length > 500000) { // 500KB
            console.warn('Image still large after compression:', (compressedBase64.length / 1024).toFixed(1) + 'KB');
          }
          
          resolve(compressedBase64);
        } catch (error) {
          console.error('Compression error:', error);
          reject(error);
        }
      };
      
      img.onerror = function() {
        reject(new Error('Failed to load image for compression'));
      };
      
      img.src = base64Image;
    });
  };
// ==================== FACE ENROLLMENT FUNCTIONS ====================

const handleEnrollSubmit = async () => {
  if (!selectedEmployeeForEnroll) {
    alert('Please select an employee');
    return;
  }
  
  if (!capturedImage) {
    alert('Please capture a photo first');
    return;
  }

  try {
    const employee = employees.find(emp => emp.name === selectedEmployeeForEnroll);
    
    if (!employee) {
      alert('Selected employee not found');
      return;
    }

    console.log('🔄 Enrolling face for:', employee.id, employee.name);
    
    // Show loading state
    setFaceValidation({ isValid: false, message: 'Processing image...' });

    // Convert base64 to compressed File
    const imageFile = await compressImageToFile(capturedImage, 0.6, 400);
    
    console.log('📁 Final file object:', {
      type: imageFile.type,
      size: imageFile.size,
      name: imageFile.name
    });

    setFaceValidation({ isValid: false, message: 'Uploading to server...' });

    // ✅ FIX: Use employeeAPI.enrollFace instead of api directly
    console.log('📤 Making API call to enroll face...');
    
    const response = await employeeAPI.enrollFace(employee.id, imageFile);
    
    console.log('✅ API Response:', response.data);
    
    if (response.data.success) {
      alert(`✅ ${response.data.message}`);
      
      // Reset modal
      setIsEnrollFaceModalOpen(false);
      setCapturedImage(null);
      setSelectedEmployeeForEnroll('');
      setFaceValidation({ isValid: false, message: '' });
      stopCamera();
    }
  } catch (err) {
    console.error('❌ Error enrolling face:', err);
    console.error('Error response:', err.response?.data);
    console.error('Error status:', err.response?.status);
    
    if (err.response?.data?.message) {
      alert(`❌ ${err.response.data.message}`);
    } else {
      alert('❌ Failed to enroll face. Check console for details.');
    }
    
    setFaceValidation({ isValid: false, message: '' });
  }
};

// Also add this function to check face status (optional):
const checkFaceStatus = async (employeeId) => {
  try {
    const response = await employeeAPI.getFaceStatus(employeeId);
    return response.data;
  } catch (error) {
    console.error('Error checking face status:', error);
    return { hasFaceEnrolled: false };
  }
};

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        event.target.value = '';
        return;
      }

      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        alert('Image file is too large. Maximum size is 5MB.');
        event.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target.result;
        
        try {
          // Validate face in uploaded image
          setFaceValidation({ isValid: false, message: 'Validating face...' });
          
          const img = await FaceRecognition.base64ToImage(imageDataUrl);
          const validation = await FaceRecognition.validateFaceImage(img);
          
          setFaceValidation(validation);
          
          if (validation.isValid) {
            setCapturedImage(imageDataUrl);
          } else {
            alert(validation.message);
            event.target.value = '';
          }
        } catch (error) {
          console.error('Face validation error:', error);
          alert('Error validating face in uploaded image.');
          event.target.value = '';
        }
      };
      reader.readAsDataURL(file);
    }
  };
// ==================== FILE/FORMDATA UTILITIES ====================
// Convert base64 to Blob
const base64ToBlob = (base64Data) => {
  try {
    // Extract the base64 data and MIME type
    const parts = base64Data.split(';base64,');
    const mimeType = parts[0].split(':')[1];
    const byteString = atob(parts[1]);
    
    // Create array buffer and write bytes
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type: mimeType });
  } catch (error) {
    console.error('Error converting base64 to blob:', error);
    throw new Error('Failed to process image');
  }
};


// Compress image and convert to File
  const compressImageToFile = async (base64Image, quality = 0.7, maxWidth = 400) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with compression
        try {
          canvas.toBlob((blob) => {
            if (blob) {
              // Create a File from the Blob
              const file = new File([blob], 'face-image.jpg', { 
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              
              console.log(`📊 Compressed file size: ${(blob.size / 1024).toFixed(1)}KB`);
              resolve(file);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          }, 'image/jpeg', quality);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = function() {
        reject(new Error('Failed to load image for compression'));
      };
      
      img.src = base64Image;
    });
  };
  // ==================== UI HELPER FUNCTIONS ====================
  const getStatusBadge = (status) => {
    const statusConfig = {
      'Present': 'attendance-status-active',
      'Delayed': 'attendance-status-delayed',
      'On Leave': 'attendance-status-inactive',
      'Absent': 'attendance-status-inactive',
      'Pending': 'attendance-status-inactive',
      'On Track': 'attendance-status-active',
      'Completed': 'attendance-status-active',
      'At Risk': 'attendance-status-inactive',
      'On Hold': 'attendance-status-inactive'
    };

    return (
      <span className={`attendance-status-badge ${statusConfig[status] || 'attendance-status-inactive'}`}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

const formatTime = (timeString) => {
  // Check for null, undefined, empty string, or 'undefined'
  if (!timeString || timeString === 'undefined' || timeString === 'null') {
    return '-';
  }
  
  // If it's already in AM/PM format, return as is
  if (timeString.includes('AM') || timeString.includes('PM')) {
    return timeString;
  }
  
  // If it's in 24-hour format, convert to 12-hour format
  try {
    const [hours, minutes] = timeString.split(':');
    
    // Additional validation for hours and minutes
    if (!hours || !minutes) {
      return '-';
    }
    
    const hour = parseInt(hours);
    const minute = parseInt(minutes);
    
    // Validate if the parsed values are numbers
    if (isNaN(hour) || isNaN(minute)) {
      return '-';
    }
    
    // Validate hour range
    if (hour < 0 || hour > 23) {
      return '-';
    }
    
    // Validate minute range
    if (minute < 0 || minute > 59) {
      return '-';
    }
    
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  } catch (error) {
    console.error('Error formatting time:', error, timeString);
    return '-';
  }
};

  // Get attendance record for employee
  const getEmployeeAttendance = (employeeId) => {
    return attendanceData.find(att => att.employee_id === employeeId) || {
      check_in_time: '-',
      check_out_time: '-',
      status: 'Absent',
      attendance_id: null
    };
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (loading && attendanceData.length === 0 && employees.length === 0) {
    return (
      <div className="attendance-management-section">
        <div className="attendance-loading">
          Loading attendance data...
        </div>
      </div>
    );
  }

  if (error && attendanceData.length === 0 && employees.length === 0) {
    return (
      <div className="attendance-management-section">
        <div className="attendance-error">
          <FaExclamationTriangle style={{ marginRight: '8px' }} />
          {error}
          <button 
            onClick={initializeRealData} 
            className="attendance-retry-btn"
            style={{ marginLeft: '16px' }}
          >
            <FaSync style={{ marginRight: '4px' }} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-management-section" id="attendance-management-main">
      {/* Header */}
      <div className="attendance-management-header">
        <h2 id="attendance-management-title">Attendance Management</h2>
        <div className="attendance-header-actions">
          <div className="attendance-current-date">{getCurrentDate()}</div>
        </div>
      </div>

      {/* ATTENDANCE STATISTICS CARDS */}
      <div className="attendance-dashboard-stats">
        <div className="attendance-stat-card" id="attendance-stat-present">
          <div className="attendance-stat-number">{attendanceStats.totalPresent}</div>
          <div className="attendance-stat-label">Present Today</div>
          <div className="attendance-stat-subtext">out of {attendanceStats.totalEmployees} employees</div>
        </div>
        <div className="attendance-stat-card" id="attendance-stat-delayed">
          <div className="attendance-stat-number">{attendanceStats.totalDelayed}</div>
          <div className="attendance-stat-label">Delayed Today</div>
          <div className="attendance-stat-subtext">late arrivals</div>
        </div>
        <div className="attendance-stat-card" id="attendance-stat-leaves">
          <div className="attendance-stat-number">{attendanceStats.totalLeaves}</div>
          <div className="attendance-stat-label">On Leave/Absent</div>
          <div className="attendance-stat-subtext">not present today</div>
        </div>
        <div className="attendance-stat-card" id="attendance-stat-total">
          <div className="attendance-stat-number">{attendanceStats.totalEmployees}</div>
          <div className="attendance-stat-label">Total Employees</div>
          <div className="attendance-stat-subtext">in system</div>
        </div>
      </div>

      {/* ==================== ATTENDANCE MANAGEMENT SECTION ==================== */}
      <div className="attendance-table-container attendance-glass-form">
        {/* Attendance Table Header */}
        <div className="attendance-table-header">
          <h3 id="attendance-table-title">Today's Attendance</h3>
               <div className="header-actions">
                    <button
        onClick={handleAutoMarkAbsent}
        className="attendance-action-btn"
        style={{ marginRight: '10px' }}
    >
        Auto Mark Absent
    </button>
          <div className="attendance-table-actions">
            {/* <span className="attendance-count" >
              Showing {employees.length} employees
            </span> */}


            <button
              onClick={handleEnrollFace}
              className="attendance-enroll-top-btn"
            >
              <FaCamera style={{ marginRight: '8px' }} />
              Enroll Face
            </button>
               </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="attendance-table-wrapper">
          <table className="attendance-main-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Face Enrolled</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
                {/* <th>Actions</th> */}
              </tr>
            </thead>
            <tbody>
              {employees.map(employee => {
                const attendance = getEmployeeAttendance(employee.id);
                const hasFaceEnrolled = employee.face_encoding; 
                return (
                  <tr key={employee.id}>
                    <td>
                      <div className="attendance-name-cell">
                        <div 
                          className="attendance-name-text attendance-clickable"
                          onClick={() => handleViewAttendanceHistory(employee)}
                        >
                          {employee.name}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="attendance-department-cell">
                        {employee.department || 'Unknown'}
                      </div>
                    </td>
                    <td>
                      <div className="face-status-cell">
                        {employee.face_encoding ? (
                          <span className="face-status-enrolled">✅ Enrolled</span>
                        ) : (
                          <span className="face-status-not-enrolled">❌ Not Enrolled</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="attendance-time-cell">
                        {formatTime(attendance.check_in_time)}
                      </div>
                    </td>
                    <td>
                      <div className="attendance-time-cell">
                        {formatTime(attendance.check_out_time)}
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(attendance.status)}
                    </td>
                    {/* <td>
                      <div className="attendance-actions-container">
                        {attendance.status === 'Present' ? (
                          <span className="attendance-status-badge approved-badge">
                            <FaCheckCircle style={{ marginRight: '4px' }} />
                            Approved
                          </span>
                        ) : attendance.status === 'On Leave' ? (
                          <span className="attendance-status-badge rejected-badge">
                            <FaTimesCircle style={{ marginRight: '4px' }} />
                            Rejected
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleApprove(attendance.attendance_id)}
                              className="attendance-action-btn attendance-approve-btn"
                              disabled={!attendance.attendance_id}
                              title={!attendance.attendance_id ? "No attendance record to approve" : ""}
                            >
                              <FaCheckCircle style={{ marginRight: '4px' }} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(attendance.attendance_id)}
                              className="attendance-action-btn attendance-reject-btn"
                              disabled={!attendance.attendance_id}
                              title={!attendance.attendance_id ? "No attendance record to reject" : ""}
                            >
                              <FaTimesCircle style={{ marginRight: '4px' }} />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td> */}
                  </tr>
                );
              })}
              {employees.length === 0 && (
                <tr>
                  <td colSpan="6" className="attendance-empty-state">
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <FaExclamationTriangle size={32} style={{ marginBottom: '16px', opacity: 0.5 }} />
                      <p>No employees found</p>
                      <button 
                        onClick={initializeRealData}
                        className="attendance-retry-btn"
                      >
                        <FaSync style={{ marginRight: '8px' }} />
                        Retry Loading
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== ATTENDANCE HISTORY MODAL ==================== */}
      {isAttendanceModalOpen && selectedEmployee && (
        <div className="attendance-modal-overlay">
          <div className="attendance-modal-content attendance-large-modal">
            <div className="attendance-modal-header">
              <h2 id="attendance-view-modal-title">
                Attendance History - {selectedEmployee.name}
                <span className="employee-department">({selectedEmployee.department})</span>
              </h2>
              <button 
                className="attendance-close-btn"
                id="attendance-view-close"
                onClick={() => setIsAttendanceModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="attendance-details-content">
              {/* Attendance History Statistics */}
              {selectedEmployee && (
                <div className="attendance-dashboard-stats" style={{marginBottom: '1.5rem'}}>
                  <div className="attendance-stat-card" id="attendance-history-stat-present">
                    <div className="attendance-stat-number">
                      {getEmployeeHistoryStats(attendanceHistory).totalPresent}
                    </div>
                    <div className="attendance-stat-label">Present</div>
                  </div>
                  <div className="attendance-stat-card" id="attendance-history-stat-delayed">
                    <div className="attendance-stat-number">
                      {getEmployeeHistoryStats(attendanceHistory).totalDelayed}
                    </div>
                    <div className="attendance-stat-label">Delayed</div>
                  </div>
                  <div className="attendance-stat-card" id="attendance-history-stat-leaves">
                    <div className="attendance-stat-number">
                      {getEmployeeHistoryStats(attendanceHistory).totalLeaves}
                    </div>
                    <div className="attendance-stat-label">Leaves</div>
                  </div>
                </div>
              )}

              {/* Attendance History Table */}
              <div className="attendance-form-section">
                <h3 className="attendance-section-title">Recent Attendance Records</h3>
                <div className="attendance-table-wrapper">
                  <table className="attendance-main-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceHistory.slice(0, 10).map(record => (
                        <tr key={record.history_id || record.id}>
                          <td>
                            <div className="attendance-date-cell">
                              {formatDate(record.date)}
                            </div>
                          </td>
                          <td>
                            <div className="attendance-description-cell">
                              {record.description || 'Regular attendance'}
                            </div>
                          </td>
                          <td>
                            {getStatusBadge(record.status)}
                          </td>
                        </tr>
                      ))}
                      {attendanceHistory.length === 0 && (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                            No attendance history found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="attendance-form-actions">
                <button
                  type="button"
                  onClick={() => setIsAttendanceModalOpen(false)}
                  className="attendance-cancel-btn"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ENROLL FACE MODAL ==================== */}
      {isEnrollFaceModalOpen && (
        <div className="attendance-modal-overlay">
          <div className="attendance-modal-content">
            <div className="attendance-modal-header">
              <h2>Enroll Face</h2>
              <button 
                className="attendance-close-btn"
                onClick={() => {
                  setIsEnrollFaceModalOpen(false);
                  stopCamera();
                  setFaceValidation({ isValid: false, message: '' });
                }}
              >
                ×
              </button>
            </div>

            <div className="attendance-form">
              {/* Camera Section */}
              <div className="attendance-form-section">
                <h3 className="attendance-section-title">Face Capture</h3>
                
                {/* ADD FACE VALIDATION STATUS HERE */}
                <div className="face-validation-status">
                  {faceValidation.message && (
                    <div className={`validation-message ${faceValidation.isValid ? 'valid' : 'invalid'}`}>
                      {faceValidation.message}
                    </div>
                  )}
                </div>
                
                <div className="camera-section">
                  {!capturedImage ? (
                    <>
                      <div 
                        id="camera-preview-container"
                        className="camera-preview"
                        style={{
                          width: '100%', 
                          height: '300px', 
                          backgroundColor: '#f5f5f5', 
                          border: '2px dashed #ddd',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '1rem',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}
                      >
                        <video
                          id="camera-preview"
                          autoPlay
                          playsInline
                          muted
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </div>
                      
                      {!cameraStream && (
                        <button
                          onClick={startCamera}
                          className="attendance-action-btn"
                          style={{
                            width: '100%',
                            marginBottom: '1rem',
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            color: '#1e40af'
                          }}
                        >
                          <FaCamera style={{ marginRight: '8px' }} />
                          Start Camera
                        </button>
                      )}
                      
                      {cameraStream && (
                        <button
                          onClick={handleCapturePhoto}
                          className="attendance-action-btn"
                          style={{
                            width: '100%',
                            marginBottom: '1rem',
                            backgroundColor: 'rgba(34, 197, 94, 0.2)',
                            color: '#166534'
                          }}
                        >
                          <FaCamera style={{ marginRight: '8px' }} />
                          Capture Photo
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <div 
                        className="captured-photo-preview"
                        style={{
                          width: '100%', 
                          height: '300px', 
                          backgroundColor: '#f5f5f5', 
                          border: '2px solid #48bb78',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '1rem',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}
                      >
                        <img 
                          src={capturedImage} 
                          alt="Captured" 
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </div>
                      
                      <button
                        onClick={handleRetakePhoto}
                        className="attendance-action-btn"
                        style={{
                          width: '100%',
                          marginBottom: '1rem',
                          backgroundColor: 'rgba(59, 130, 246, 0.2)',
                          color: '#1e40af'
                        }}
                      >
                        Retake Photo
                      </button>
                    </>
                  )}
                </div>

                {/* Upload File Alternative */}
                <div className="attendance-form-group">
                  <label>Or Upload Photo</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px'
                    }}
                  />
                </div>
              </div>

              {/* Employee Selection */}
              <div className="attendance-form-group">
                <label>Select Employee</label>
                <select 
                  value={selectedEmployeeForEnroll}
                  onChange={(e) => setSelectedEmployeeForEnroll(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px'
                  }}
                >
                  <option value="">Select Employee</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.name}>
                      {employee.name} - {employee.department}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="attendance-form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setIsEnrollFaceModalOpen(false);
                    stopCamera();
                    setFaceValidation({ isValid: false, message: '' });
                  }}
                  className="attendance-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnrollSubmit}
                  className="attendance-submit-btn"
                  disabled={!selectedEmployeeForEnroll || !capturedImage || !faceValidation.isValid}
                >
                  Enroll Face
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;