import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './AppHeader.css';

interface AppHeaderProps {
  onAddFolder?: () => void;
  onUpload?: () => void;
  title?: string;
  isFolderOpen?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onAddFolder, onUpload, title = 'Flashcards', isFolderOpen = false }) => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className={`app-header ${isFolderOpen ? 'app-header-folder-open' : ''}`}>
      <div className="app-header-left">
        <h1 className="app-title">
          <svg className="app-icon" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(48, 48) scale(6)">
              <path d="M11.19,2.25C10.93,2.25 10.67,2.31 10.42,2.4L3.06,5.45C2.04,5.87 1.55,7.04 1.97,8.05L6.93,20C7.24,20.77 7.97,21.23 8.74,21.25C9,21.25 9.27,21.22 9.53,21.1L16.9,18.05C17.65,17.74 18.11,17 18.13,16.25C18.14,16 18.09,15.71 18,15.45L13,3.5C12.71,2.73 11.97,2.26 11.19,2.25M14.67,2.25L18.12,10.6V4.25A2,2 0 0,0 16.12,2.25M20.13,3.79V12.82L22.56,6.96C22.97,5.94 22.5,4.78 21.47,4.36M11.19,4.22L16.17,16.24L8.78,19.3L3.8,7.29" />
            </g>
          </svg>
          <span className="app-title-text">{title}</span>
        </h1>
      </div>

      {/* Desktop view */}
      <div className="app-header-right desktop-menu">
        <span className="user-info">{user?.name || user?.email}</span>
        {onAddFolder && (
          <button onClick={onAddFolder} className="add-btn">
            + New Folder
          </button>
        )}
        {onUpload && (
          <button onClick={onUpload} className="add-btn">
            Upload PDF
          </button>
        )}
        <button onClick={logout} className="logout-button">
          Logout
        </button>
      </div>

      {/* Mobile view with dropdown */}
      <div className="app-header-right mobile-menu" ref={dropdownRef}>
        <button className="mobile-menu-button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} aria-label="Menu">
          <svg className="mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="mobile-dropdown">
            <div className="mobile-dropdown-content">
              <div className="user-info-mobile">{user?.name || user?.email}</div>
              {onAddFolder && (
                <button
                  onClick={() => {
                    onAddFolder();
                    setIsDropdownOpen(false);
                  }}
                  className="mobile-dropdown-item"
                >
                  + New Folder
                </button>
              )}
              <button
                onClick={() => {
                  logout();
                  setIsDropdownOpen(false);
                }}
                className="mobile-dropdown-item"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
