import React from 'react';
import { Folder, Card as CardType } from '../types';
import './FolderCard.css';

interface FolderCardProps {
  folder: Folder;
  onFolderClick: (folder: Folder) => void;
  onDeleteFolder: (folderId: string) => void;
  getDueCards: (folder: Folder) => CardType[];
}

const FolderCard: React.FC<FolderCardProps> = ({ folder, onFolderClick, onDeleteFolder, getDueCards }) => {
  const dueCount = getDueCards(folder).length;
  const totalCards = folder.cards?.length || 0;

  return (
    <div className="folder-card" onClick={() => onFolderClick(folder)}>
      <div className="folder-card-content">
        <h3>{folder.name}</h3>
        <p>{totalCards} cards</p>
        <p className={dueCount > 0 ? 'due-count' : ''}>{dueCount} due</p>
      </div>
      <button
        className="folder-card-delete-button"
        onClick={e => {
          e.stopPropagation();
          onDeleteFolder(folder._id);
        }}
        title="Delete folder"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          <line x1="10" x2="10" y1="11" y2="17" />
          <line x1="14" x2="14" y1="11" y2="17" />
        </svg>
      </button>
    </div>
  );
};

export default FolderCard;
