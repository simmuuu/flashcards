import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Folder, Card } from '../types';
import api from '../services/api';
import AppHeader from '../components/AppHeader';
import FolderCard from '../components/FolderCard';
import CustomDialog from '../components/Dialog'; // Renamed to CustomDialog
import './HomePage.css';

export default function HomePage() {
  const { user, logout } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [viewMode, setViewMode] = useState<'folders' | 'cards' | 'study'>('folders');
  const [studyProgress, setStudyProgress] = useState<number[]>([]); // Track answers for current session
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'folder' | 'card' | ''>('');
  const [dialogData, setDialogData] = useState<{ name?: string; front?: string; back?: string }>({});

  // Fetch folders on component mount or user change
  useEffect(() => {
    const fetchFolders = async () => {
      if (user) {
        try {
          const res = await api.get<Folder[]>('/folders');
          setFolders(res.data);
        } catch (err: any) {
          console.error('Error fetching folders:', err);
          // Handle error, e.g., redirect to login if token is invalid
          if (err.response && err.response.status === 401) {
            logout();
          }
        }
      }
    };
    fetchFolders();
  }, [user, logout]);

  // Fetch cards when entering cards view mode
  useEffect(() => {
    const fetchCards = async () => {
      if (viewMode === 'cards' && currentFolder && (!currentFolder.cards || currentFolder.cards.length === 0)) {
        try {
          const res = await api.get<Card[]>(`/cards/${currentFolder._id}`);
          setCurrentFolder(prev => (prev ? { ...prev, cards: res.data } : null));
        } catch (err) {
          console.error('Error fetching cards:', err);
        }
      }
    };
    fetchCards();
  }, [viewMode, currentFolder?._id]);

  // Format time until next review
  const formatTimeUntilReview = (nextReview: string) => {
    const now = Date.now();
    const diff = new Date(nextReview).getTime() - now;

    if (diff <= 0) return 'Due now';

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `in ${days} day${days === 1 ? '' : 's'}`;
    if (hours > 0) return `in ${hours} hour${hours === 1 ? '' : 's'}`;
    return `in ${minutes} min${minutes === 1 ? '' : 's'}`;
  };

  const getDueCards = (folder: Folder): Card[] => {
    const now = Date.now();
    // Filter cards that are due and sort them by nextReview (earliest first)
    return folder.cards
      ? folder.cards
          .filter(card => new Date(card.nextReview).getTime() <= now)
          .sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime())
      : [];
  };

  const startStudying = async (folder: Folder) => {
    try {
      const res = await api.get<Card[]>(`/cards/${folder._id}`);
      const folderWithCards = { ...folder, cards: res.data };
      setCurrentFolder(folderWithCards);

      const dueCards = getDueCards(folderWithCards);
      if (dueCards.length === 0) {
        toast.error('No cards due for review!');
        return;
      }
      setCurrentCard(dueCards[0]);
      setShowAnswer(false);
      setStudyProgress([]); // Reset progress for new session
      setViewMode('study');
    } catch (err) {
      console.error('Error fetching cards for study:', err);
    }
  };

  const markDifficulty = async (quality: number) => {
    if (!currentCard || !currentFolder) return;

    try {
      const res = await api.put<Card>(`/cards/review/${currentCard._id}`, { quality });
      const updatedCard = res.data;

      // Update the card in the current folder's state
      const updatedFolders = folders.map(f => {
        if (f._id === currentFolder._id) {
          const updatedCards = f.cards?.map(card => (card._id === updatedCard._id ? updatedCard : card)) || [];
          return { ...f, cards: updatedCards };
        }
        return f;
      });
      setFolders(updatedFolders);

      // Update current folder state to reflect the updated card
      const updatedCurrentFolder = updatedFolders.find(f => f._id === currentFolder._id);
      if (updatedCurrentFolder) {
        setCurrentFolder(updatedCurrentFolder);
      }

      // Add to progress tracking
      setStudyProgress(prev => [...prev, quality]);

      // Get next due card
      const remainingDueCards = updatedCurrentFolder ? getDueCards(updatedCurrentFolder) : [];

      if (remainingDueCards.length > 0) {
        setCurrentCard(remainingDueCards[0]);
        setShowAnswer(false);
      } else {
        toast.success('All cards reviewed! Great job!');
        setViewMode('folders');
        setCurrentFolder(null);
        setCurrentCard(null);
        setStudyProgress([]);
      }
    } catch (err) {
      console.error('Error marking difficulty:', err);
    }
  };

  const addNewFolder = () => {
    setDialogType('folder');
    setDialogData({ name: '' });
    setShowDialog(true);
  };

  const addNewCard = () => {
    setDialogType('card');
    setDialogData({ front: '', back: '' });
    setShowDialog(true);
  };

  const handleDialogSave = async () => {
    if (dialogType === 'folder' && dialogData.name?.trim()) {
      try {
        const res = await api.post<Folder>('/folders', { name: dialogData.name.trim() });
        setFolders([...folders, res.data]);
        toast.success('Folder created successfully!');
      } catch (err) {
        console.error('Error creating folder:', err);
        toast.error('Failed to create folder');
      }
    } else if (dialogType === 'card' && dialogData.front?.trim() && dialogData.back?.trim() && currentFolder) {
      try {
        const res = await api.post<Card>(`/cards/${currentFolder._id}`, {
          front: dialogData.front.trim(),
          back: dialogData.back.trim(),
        });
        const newCard = res.data;
        const updatedFolders = folders.map(f => {
          if (f._id === currentFolder._id) {
            return { ...f, cards: [...(f.cards || []), newCard] };
          }
          return f;
        });
        setFolders(updatedFolders);
        setCurrentFolder(prev => (prev ? { ...prev, cards: [...(prev.cards || []), newCard] } : null));
        toast.success('Card created successfully!');
      } catch (err) {
        console.error('Error creating card:', err);
        toast.error('Failed to create card');
      }
    }
    setShowDialog(false);
    setDialogData({});
  };

  const handleDialogCancel = () => {
    setShowDialog(false);
    setDialogData({});
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (window.confirm('Are you sure you want to delete this folder and all its cards?')) {
      try {
        await api.delete(`/folders/${folderId}`);
        setFolders(folders.filter(f => f._id !== folderId));
        if (currentFolder && currentFolder._id === folderId) {
          setCurrentFolder(null);
          setViewMode('folders');
        }
        toast.success('Folder deleted successfully!');
      } catch (err) {
        console.error('Error deleting folder:', err);
        toast.error('Failed to delete folder');
      }
    }
  };

  if (viewMode === 'study' && currentCard && currentFolder) {
    const totalDueCards = getDueCards(currentFolder).length;
    const progressValue = (studyProgress.length / totalDueCards) * 100;

    return (
      <div className="app">
        <div className="main-container">
          <AppHeader title={currentFolder?.name} isFolderOpen={true} />
          <div className="study-container">
            <div className="study-header">
              <button onClick={() => setViewMode('cards')} className="back-btn">
                ← Back
              </button>
            </div>

            <div className="progress-indicators">
              {studyProgress.map((quality, index) => (
                <div key={index} className={`progress-dot ${quality >= 3 ? 'easy' : 'hard'}`}></div>
              ))}
              <div className="progress-dot current"></div>
              {Array.from({ length: Math.max(0, totalDueCards - studyProgress.length - 1) }, (_, i) => (
                <div key={`remaining-${i}`} className="progress-dot"></div>
              ))}
            </div>

            <div className="flashcard">
              <div className="card-content">
                <h3>{showAnswer ? 'ANSWER' : 'QUESTION'}</h3>
                <p>{showAnswer ? currentCard.back : currentCard.front}</p>
              </div>
              {showAnswer && (
                <div className="review-timing">Next review: {formatTimeUntilReview(currentCard.nextReview)}</div>
              )}
            </div>

            {!showAnswer ? (
              <button onClick={() => setShowAnswer(true)} className="show-answer-btn">
                Show Answer
              </button>
            ) : (
              <div className="difficulty-buttons">
                <h4>How well did you remember?</h4>
                <div className="difficulty-buttons-row">
                  <button onClick={() => markDifficulty(1)} className="diff-btn hard">
                    <span className="diff-label">Again</span>
                    <span className="diff-time">&lt;10m</span>
                  </button>
                  <button onClick={() => markDifficulty(3)} className="diff-btn medium">
                    <span className="diff-label">Good</span>
                    <span className="diff-time">1d</span>
                  </button>
                  <button onClick={() => markDifficulty(5)} className="diff-btn easy">
                    <span className="diff-label">Easy</span>
                    <span className="diff-time">4d</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <CustomDialog
            isOpen={showDialog}
            title={dialogType === 'folder' ? 'New Folder' : 'New Flashcard'}
            onSave={handleDialogSave}
            onCancel={handleDialogCancel}
            saveDisabled={
              !(
                (dialogType === 'folder' && dialogData.name?.trim()) ||
                (dialogType === 'card' && dialogData.front?.trim() && dialogData.back?.trim())
              )
            }
          >
            <div className="input-group">
              <label htmlFor={dialogType === 'folder' ? 'folderName' : 'cardFront'}>
                {dialogType === 'folder' ? 'Folder Name' : 'Question (Front)'}
              </label>
              <input
                id={dialogType === 'folder' ? 'folderName' : 'cardFront'}
                type="text"
                value={dialogData.name || dialogData.front || ''}
                onChange={e =>
                  setDialogData(prev => ({ ...prev, [dialogType === 'folder' ? 'name' : 'front']: e.target.value }))
                }
                placeholder={dialogType === 'folder' ? 'Enter folder name...' : 'Enter question...'}
                autoFocus
              />
            </div>

            {dialogType === 'card' && (
              <div className="input-group">
                <label htmlFor="cardBack">Answer (Back)</label>
                <textarea
                  id="cardBack"
                  value={dialogData.back || ''}
                  onChange={e => setDialogData(prev => ({ ...prev, back: e.target.value }))}
                  placeholder="Enter answer..."
                  rows={4}
                ></textarea>
              </div>
            )}
          </CustomDialog>
        </div>
      </div>
    );
  }

  if (viewMode === 'cards' && currentFolder) {
    const dueCards = getDueCards(currentFolder);

    return (
      <div className="app">
        <div className="main-container">
          <AppHeader title={currentFolder.name} isFolderOpen={true} />
          <div className="folder-view">
            <div className="folder-header">
              <button onClick={() => setViewMode('folders')} className="back-btn">
                ← Back
              </button>
              <button onClick={addNewCard} className="add-btn">
                + Add Card
              </button>
            </div>

            <div className="cards-stats">
              <p>Total cards: {currentFolder.cards?.length || 0}</p>
              <p>
                Due for review: <span className="due-count">{dueCards.length}</span>
              </p>
            </div>

            <button onClick={() => startStudying(currentFolder)} className="study-btn" disabled={dueCards.length === 0}>
              Start Studying
            </button>

            <div className="cards-list">
              {currentFolder.cards?.map((card: Card) => {
                const isDue = new Date(card.nextReview).getTime() <= Date.now();
                const difficultyLevel =
                  card.easinessFactor > 2.5 ? 'easy' : card.easinessFactor < 2.0 ? 'hard' : 'medium';

                return (
                  <div key={card._id} className={`card-item ${isDue ? 'due' : ''}`}>
                    <div className="card-preview">
                      <strong>{card.front}</strong>
                      <span className={`difficulty ${difficultyLevel}`}>{difficultyLevel.toUpperCase()}</span>
                    </div>
                    <div className="next-review">Next review: {formatTimeUntilReview(card.nextReview)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <CustomDialog
            isOpen={showDialog}
            title={dialogType === 'folder' ? 'New Folder' : 'New Flashcard'}
            onSave={handleDialogSave}
            onCancel={handleDialogCancel}
            saveDisabled={
              !(
                (dialogType === 'folder' && dialogData.name?.trim()) ||
                (dialogType === 'card' && dialogData.front?.trim() && dialogData.back?.trim())
              )
            }
          >
            <div className="input-group">
              <label htmlFor={dialogType === 'folder' ? 'folderName' : 'cardFront'}>
                {dialogType === 'folder' ? 'Folder Name' : 'Question (Front)'}
              </label>
              <input
                id={dialogType === 'folder' ? 'folderName' : 'cardFront'}
                type="text"
                value={dialogData.name || dialogData.front || ''}
                onChange={e =>
                  setDialogData(prev => ({ ...prev, [dialogType === 'folder' ? 'name' : 'front']: e.target.value }))
                }
                placeholder={dialogType === 'folder' ? 'Enter folder name...' : 'Enter question...'}
                autoFocus
              />
            </div>

            {dialogType === 'card' && (
              <div className="input-group">
                <label htmlFor="cardBack">Answer (Back)</label>
                <textarea
                  id="cardBack"
                  value={dialogData.back || ''}
                  onChange={e => setDialogData(prev => ({ ...prev, back: e.target.value }))}
                  placeholder="Enter answer..."
                  rows={4}
                ></textarea>
              </div>
            )}
          </CustomDialog>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="main-container">
        <AppHeader onAddFolder={addNewFolder} />

        {/* Daily Stats */}
        <div className="daily-stats">
          <div className="stat-card">
            <div className="stat-number">0</div>
            <div className="stat-label">Today</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">0</div>
            <div className="stat-label">Yesterday</div>
          </div>
        </div>

        <div className="folders-grid">
          {folders.map(folder => (
            <FolderCard
              key={folder._id}
              folder={folder}
              onFolderClick={async folder => {
                try {
                  const res = await api.get<Card[]>(`/cards/${folder._id}`);
                  const folderWithCards = { ...folder, cards: res.data };
                  setCurrentFolder(folderWithCards);
                  setViewMode('cards');
                } catch (err) {
                  console.error('Error fetching cards:', err);
                  toast.error('Failed to fetch cards');
                }
              }}
              onDeleteFolder={handleDeleteFolder}
              getDueCards={getDueCards}
            />
          ))}
        </div>
      </div>

      <CustomDialog
        isOpen={showDialog}
        title={dialogType === 'folder' ? 'New Folder' : 'New Flashcard'}
        onSave={handleDialogSave}
        onCancel={handleDialogCancel}
        saveDisabled={
          !(
            (dialogType === 'folder' && dialogData.name?.trim()) ||
            (dialogType === 'card' && dialogData.front?.trim() && dialogData.back?.trim())
          )
        }
      >
        <div className="input-group">
          <label htmlFor={dialogType === 'folder' ? 'folderName' : 'cardFront'}>
            {dialogType === 'folder' ? 'Folder Name' : 'Question (Front)'}
          </label>
          <input
            id={dialogType === 'folder' ? 'folderName' : 'cardFront'}
            type="text"
            value={dialogData.name || dialogData.front || ''}
            onChange={e =>
              setDialogData(prev => ({
                ...prev,
                [dialogType === 'folder' ? 'name' : 'front']: e.target.value,
              }))
            }
            placeholder={dialogType === 'folder' ? 'Enter folder name...' : 'Enter question...'}
            autoFocus
          />
        </div>

        {dialogType === 'card' && (
          <div className="input-group">
            <label htmlFor="cardBack">Answer (Back)</label>
            <textarea
              id="cardBack"
              value={dialogData.back || ''}
              onChange={e => setDialogData(prev => ({ ...prev, back: e.target.value }))}
              placeholder="Enter answer..."
              rows={4}
            ></textarea>
          </div>
        )}
      </CustomDialog>
    </div>
  );
}
