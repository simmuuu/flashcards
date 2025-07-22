import React, { ReactNode } from 'react';
import './Dialog.css';

interface CustomDialogProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onSave: () => void;
  onCancel: () => void;
  saveDisabled?: boolean;
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  isOpen,
  title,
  children,
  onSave,
  onCancel,
  saveDisabled = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-box">
        <div className="dialog-header">
          <h3>{title}</h3>
        </div>
        <div className="dialog-content">{children}</div>
        <div className="dialog-actions">
          <button onClick={onCancel} className="dialog-btn cancel">
            Cancel
          </button>
          <button onClick={onSave} disabled={saveDisabled} className="dialog-btn save">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomDialog;
