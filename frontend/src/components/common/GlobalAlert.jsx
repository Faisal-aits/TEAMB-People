import React, { useState, useEffect } from 'react';
import { HiOutlineExclamationCircle, HiCheckCircle, HiInformationCircle } from 'react-icons/hi';
import './GlobalAlert.css';

const GlobalAlert = () => {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: '',
    type: 'info' // 'info', 'error', 'success'
  });

  useEffect(() => {
    // Save original alert just in case
    const originalAlert = window.alert;

    // Overwrite window.alert globally
    window.alert = (message) => {
      let type = 'info';
      
      // Basic heuristic to determine alert type based on message text
      const lowerMsg = String(message).toLowerCase();
      if (lowerMsg.includes('error') || lowerMsg.includes('failed') || lowerMsg.includes('could not') || lowerMsg.includes('invalid')) {
        type = 'error';
      } else if (lowerMsg.includes('success') || lowerMsg.includes('completed')) {
        type = 'success';
      }

      setAlertState({
        isOpen: true,
        message: String(message),
        type: type
      });
    };

    return () => {
      // Cleanup if component unmounts
      window.alert = originalAlert;
    };
  }, []);

  if (!alertState.isOpen) return null;

  const closeAlert = () => {
    setAlertState({ ...alertState, isOpen: false });
  };

  const getIcon = () => {
    switch (alertState.type) {
      case 'error': return <HiOutlineExclamationCircle className="global-alert-icon error" />;
      case 'success': return <HiCheckCircle className="global-alert-icon success" />;
      default: return <HiInformationCircle className="global-alert-icon info" />;
    }
  };

  const getTitle = () => {
    switch (alertState.type) {
      case 'error': return 'Error';
      case 'success': return 'Success';
      default: return 'Information';
    }
  };

  return (
    <div className="global-alert-overlay" onClick={closeAlert}>
      <div className="global-alert-modal" onClick={e => e.stopPropagation()}>
        <div className="global-alert-header">
          {getIcon()}
          <h3>{getTitle()}</h3>
        </div>
        <div className="global-alert-body">
          <p>{alertState.message}</p>
        </div>
        <div className="global-alert-footer">
          <button className="global-alert-btn" onClick={closeAlert}>OK</button>
        </div>
      </div>
    </div>
  );
};

export default GlobalAlert;
