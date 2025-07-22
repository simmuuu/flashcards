import React, { useState } from 'react';
import { Folder } from '../types';
import './ShareDialog.css';

interface ShareDialogProps {
  folder: Folder;
  isOpen: boolean;
  onClose: () => void;
  onToggleShare: (folderId: string) => Promise<void>;
}

const ShareDialog: React.FC<ShareDialogProps> = ({ folder, isOpen, onClose, onToggleShare }) => {
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleToggleShare = async () => {
    setIsSharing(true);
    try {
      await onToggleShare(folder._id);
    } finally {
      setIsSharing(false);
    }
  };

  const shareUrl = folder.shareId ? `${window.location.origin}/shared/${folder.shareId}` : '';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="share-dialog-overlay" onClick={onClose}>
      <div className="share-dialog" onClick={e => e.stopPropagation()}>
        <div className="share-dialog-header">
          <h3>Share Folder: {folder.name}</h3>
          <button className="share-dialog-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="share-dialog-content">
          {!folder.isShared ? (
            <div className="share-status-private">
              <div className="share-icon">🔒</div>
              <p>This folder is currently private</p>
              <p className="share-description">
                Make it public to generate a shareable link. Others can view and copy your flashcards.
              </p>
              <button className="share-button share-button-enable" onClick={handleToggleShare} disabled={isSharing}>
                {isSharing ? 'Making Public...' : 'Make Public'}
              </button>
            </div>
          ) : (
            <div className="share-status-public">
              <div className="share-icon">🌐</div>
              <p>This folder is public</p>
              <div className="share-link-container">
                <label>Share this link:</label>
                <div className="share-link-input-group">
                  <input type="text" value={shareUrl} readOnly className="share-link-input" />
                  <button className="copy-button" onClick={copyToClipboard}>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <p className="share-warning">⚠️ Anyone with this link can view and copy your flashcards</p>
              <button className="share-button share-button-disable" onClick={handleToggleShare} disabled={isSharing}>
                {isSharing ? 'Making Private...' : 'Make Private'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;
