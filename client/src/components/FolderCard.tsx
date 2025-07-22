import React from 'react';
import { Folder, Card as CardType } from '../types';
import './FolderCard.css';

interface FolderCardProps {
  folder: Folder;
  onFolderClick: (folder: Folder) => void;
  onDeleteFolder: (folderId: string) => void;
  onShareFolder: (folder: Folder) => void;
  getDueCards: (folder: Folder) => CardType[];
}

const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  onFolderClick,
  onDeleteFolder,
  onShareFolder,
  getDueCards,
}) => {
  const dueCount = getDueCards(folder).length;
  const totalCards = folder.cards?.length || 0;

  return (
    <div className="folder-card" onClick={() => onFolderClick(folder)}>
      <div className="folder-card-content">
        <h3>{folder.name}</h3>
        <p>{totalCards} cards</p>
        <p className={dueCount > 0 ? 'due-count' : ''}>{dueCount} due</p>
        {folder.sharedBy && <p className="shared-by-indicator">Shared by {folder.sharedBy.name}</p>}
      </div>

      <div className="folder-card-actions">
        <button
          className={`folder-card-share-button ${folder.isShared ? 'shared' : 'private'}`}
          onClick={e => {
            e.stopPropagation();
            onShareFolder(folder);
          }}
          title={folder.isShared ? 'Folder is public' : 'Folder is private'}
        >
          {folder.isShared ? (
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
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
              <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
            </svg>
          ) : (
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
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <circle cx="12" cy="16" r="1" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
        </button>

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
    </div>
  );
};

export default FolderCard;
