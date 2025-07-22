import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { SharedFolder } from '../types';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './SharedFolderView.css';

const SharedFolderView: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sharedFolder, setSharedFolder] = useState<SharedFolder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCoying, setIsCoying] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  useEffect(() => {
    if (shareId) {
      fetchSharedFolder(shareId);
    }
  }, [shareId]);

  const fetchSharedFolder = async (shareId: string) => {
    try {
      setIsLoading(true);
      const response = await api.get<SharedFolder>(`/folders/shared/${shareId}`);
      setSharedFolder(response.data);
    } catch (error: any) {
      console.error('Error fetching shared folder:', error);
      if (error.response?.status === 404) {
        toast.error('Shared folder not found or no longer available');
      } else {
        toast.error('Failed to load shared folder');
      }
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToMyFolders = async () => {
    if (!user) {
      toast.error('Please log in to save this folder');
      navigate('/auth');
      return;
    }

    if (!shareId) return;

    try {
      setIsCoying(true);
      await api.post(`/folders/shared/${shareId}/copy`);
      toast.success('Folder copied to your collection!');
      navigate('/');
    } catch (error: any) {
      console.error('Error copying folder:', error);
      if (error.response?.status === 400) {
        toast.error('You already have this folder in your collection');
      } else {
        toast.error('Failed to copy folder');
      }
    } finally {
      setIsCoying(false);
    }
  };

  const nextCard = () => {
    if (sharedFolder && currentCardIndex < sharedFolder.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="shared-folder-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!sharedFolder) {
    return (
      <div className="shared-folder-container">
        <div className="error-message">Shared folder not found</div>
      </div>
    );
  }

  const currentCard = sharedFolder.cards[currentCardIndex];

  return (
    <div className="shared-folder-container">
      <div className="shared-folder-header">
        <div className="back-button-container">
          <button onClick={() => navigate('/')} className="back-button">
            ← Back to Home
          </button>
        </div>

        <div className="shared-folder-info">
          <h1>{sharedFolder.folder.name}</h1>
          <p className="shared-by">
            Shared by <strong>{sharedFolder.folder.createdBy.name}</strong>
          </p>
          <p className="card-count">
            {sharedFolder.cards.length} flashcard{sharedFolder.cards.length !== 1 ? 's' : ''}
          </p>
        </div>

        <button onClick={handleCopyToMyFolders} disabled={isCoying || !user} className="copy-folder-button">
          {isCoying ? 'Copying...' : user ? 'Save to My Folders' : 'Log in to Save'}
        </button>
      </div>

      {sharedFolder.cards.length > 0 ? (
        <div className="card-preview-section">
          <div className="card-navigation">
            <button onClick={prevCard} disabled={currentCardIndex === 0} className="nav-button">
              ← Previous
            </button>
            <span className="card-counter">
              {currentCardIndex + 1} / {sharedFolder.cards.length}
            </span>
            <button
              onClick={nextCard}
              disabled={currentCardIndex === sharedFolder.cards.length - 1}
              className="nav-button"
            >
              Next →
            </button>
          </div>

          <div className="card-preview">
            <div className="card-side">
              <h3>Front</h3>
              <div className="card-content">{currentCard.front}</div>
            </div>
            <div className="card-divider"></div>
            <div className="card-side">
              <h3>Back</h3>
              <div className="card-content">{currentCard.back}</div>
            </div>
          </div>

          <div className="preview-notice">
            <p>
              📖 This is a preview of the flashcards. Save to your folders to start studying with spaced repetition!
            </p>
          </div>
        </div>
      ) : (
        <div className="empty-folder">
          <p>This folder doesn't contain any flashcards yet.</p>
        </div>
      )}
    </div>
  );
};

export default SharedFolderView;
