import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Folder, Card } from '../types';
import api from '../services/api';
import AppHeader from '../components/AppHeader';
import FolderCard from '../components/FolderCard';
import CustomDialog from '../components/Dialog'; // Renamed to CustomDialog
import ShareDialog from '../components/ShareDialog';
import Heatmap from '../components/Heatmap';
import './HomePage.css';

export default function HomePage() {
  const { user, logout } = useAuth();
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyProgress, setStudyProgress] = useState<number[]>([]); // Track answers for current session
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'folder' | 'card' | ''>('');
  const [dialogData, setDialogData] = useState<{ name?: string; front?: string; back?: string }>({});
  const [heatmapData, setHeatmapData] = useState<{ date: string; count: number }[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [folderToShare, setFolderToShare] = useState<Folder | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Determine current view based on URL
  const isStudyMode = location.pathname.includes('/study');
  const isCardsView = folderId && !isStudyMode;
  const isFoldersView = !folderId;

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

  // Fetch folders on component mount or user change
  useEffect(() => {
    const fetchHeatmapData = async () => {
      if (user) {
        try {
          const res = await api.get<{ date: string; count: number }[]>('/stats/heatmap');
          setHeatmapData(res.data);
        } catch (err) {
          console.error('Error fetching heatmap data:', err);
        }
      }
    };
    fetchFolders();
    fetchHeatmapData();
  }, [user, logout]);

  // Fetch folder and cards when folderId changes
  useEffect(() => {
    const fetchFolderAndCards = async () => {
      if (folderId && folders.length > 0) {
        const folder = folders.find(f => f._id === folderId);
        if (folder) {
          try {
            const res = await api.get<Card[]>(`/cards/${folderId}`);
            const folderWithCards = { ...folder, cards: res.data };
            setCurrentFolder(folderWithCards);
          } catch (err) {
            console.error('Error fetching cards:', err);
            toast.error('Failed to fetch cards');
            navigate('/');
          }
        } else {
          navigate('/');
        }
      } else if (!folderId) {
        setCurrentFolder(null);
      }
    };
    fetchFolderAndCards();
  }, [folderId, folders, navigate]);

  // Initialize study mode when entering study URL
  useEffect(() => {
    if (isStudyMode && currentFolder && !currentCard) {
      const dueCards = getDueCards(currentFolder);
      if (dueCards.length === 0) {
        toast.error('No cards due for review!');
        navigate(`/folder/${currentFolder._id}`);
        return;
      }
      setCurrentCard(dueCards[0]);
      setShowAnswer(false);
      setStudyProgress([]);
    }
  }, [isStudyMode, currentFolder, currentCard, navigate]);

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
      navigate(`/folder/${folder._id}/study`);
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
        navigate('/');
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
          navigate('/');
        }
        toast.success('Folder deleted successfully!');
      } catch (err) {
        console.error('Error deleting folder:', err);
        toast.error('Failed to delete folder');
      }
    }
  };

  const handleShareFolder = (folder: Folder) => {
    setFolderToShare(folder);
    setShowShareDialog(true);
  };

  const handleToggleShare = async (folderId: string): Promise<void> => {
    try {
      const response = await api.patch<Folder>(`/folders/${folderId}/share`);
      const updatedFolder = response.data;

      // Update the folders state
      setFolders(prevFolders => prevFolders.map(f => (f._id === folderId ? updatedFolder : f)));

      // Update folderToShare if it's the one being shared
      if (folderToShare && folderToShare._id === folderId) {
        setFolderToShare(updatedFolder);
      }

      toast.success(updatedFolder.isShared ? 'Folder is now public and shareable!' : 'Folder is now private');
    } catch (error: any) {
      console.error('Error toggling folder share:', error);
      toast.error('Failed to update sharing settings');
    }
  };

  const handleCloseShareDialog = () => {
    setShowShareDialog(false);
    setFolderToShare(null);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Check file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
          toast.error('File size must be less than 5MB. Please choose a smaller file.');
          return;
        }

        // Check file type
        if (file.type !== 'application/pdf') {
          toast.error('Please select a PDF file.');
          return;
        }

        // Create FormData to send the file directly
        const formData = new FormData();
        formData.append('pdf', file);

        const response = await api.post('/ai/generate-from-pdf', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const newFolder = response.data;
        setFolders(prevFolders => [...prevFolders, newFolder]);
        toast.success('Started generating flashcards from your PDF!');

        // Poll for completion with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        const pollInterval = 3000; // Poll every 3 seconds
        const maxPollTime = 300000; // Stop polling after 5 minutes
        const startTime = Date.now();

        const interval = setInterval(async () => {
          try {
            // Stop polling if we've exceeded max time
            if (Date.now() - startTime > maxPollTime) {
              clearInterval(interval);
              toast.error('Flashcard generation timed out. Please try again.');
              return;
            }

            const folderRes = await api.get<Folder>(`/folders/${newFolder._id}`);

            if (folderRes.data.status === 'completed') {
              clearInterval(interval);
              fetchFolders(); // Refetch all folders to get the updated one
              toast.success('Flashcards generated successfully!');
            } else if (folderRes.data.status === 'failed') {
              clearInterval(interval);
              toast.error('Failed to generate flashcards. Please try again.');
              // Remove the failed folder from the list
              setFolders(prevFolders => prevFolders.filter(f => f._id !== newFolder._id));
            }
            // Reset retry count on successful request
            retryCount = 0;
          } catch (err: any) {
            console.error('Error polling for folder status:', err);

            // If we get a 404, it means the folder was deleted due to generation failure
            if (err.response?.status === 404) {
              clearInterval(interval);
              toast.error('Failed to generate flashcards. Please try again.');
              // Remove the failed folder from the list
              setFolders(prevFolders => prevFolders.filter(f => f._id !== newFolder._id));
              return;
            }

            retryCount++;
            if (retryCount >= maxRetries) {
              clearInterval(interval);
              toast.error('Failed to check flashcard generation status. Please refresh the page.');
            }
          }
        }, pollInterval);
      } catch (error) {
        console.error('Error processing PDF:', error);
        toast.error('Failed to process PDF.');
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  if (isStudyMode && currentCard && currentFolder) {
    const totalDueCards = getDueCards(currentFolder).length;
    const progressValue = (studyProgress.length / totalDueCards) * 100;

    return (
      <div className="app">
        <div className="main-container">
          <AppHeader title={currentFolder?.name} isFolderOpen={true} />
          <div className="study-container">
            <div className="study-header">
              <button onClick={() => navigate(`/folder/${currentFolder._id}`)} className="back-btn">
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

  if (isCardsView && currentFolder) {
    const dueCards = getDueCards(currentFolder);

    return (
      <div className="app">
        <div className="main-container">
          <AppHeader title="" isFolderOpen={true} />
          <div className="folder-view">
            <div className="folder-header">
              <h2>{currentFolder.name}</h2>
              <div className="folder-header-buttons">
                <button onClick={() => navigate('/')} className="back-btn">
                  ← Back
                </button>
                <button onClick={addNewCard} className="add-btn">
                  + Add Card
                </button>
              </div>
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
                const isExpanded = expandedCards.has(card._id);

                return (
                  <div
                    key={card._id}
                    className={`card-item ${isDue ? 'due' : ''} ${difficultyLevel} ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => toggleCardExpansion(card._id)}
                  >
                    <div className="card-preview">
                      <div className="card-content-section">
                        <div className="card-question">
                          <strong>{card.front}</strong>
                        </div>
                        {isExpanded && (
                          <div className="card-answer">
                            <div className="answer-text">{card.back}</div>
                          </div>
                        )}
                      </div>
                      <span className={`difficulty ${difficultyLevel}`}>{difficultyLevel.toUpperCase()}</span>
                    </div>
                    <div className="card-footer">
                      <div className="next-review">Next review: {formatTimeUntilReview(card.nextReview)}</div>
                      <div className="click-hint">{isExpanded ? 'Click to hide' : 'Click for answer'}</div>
                    </div>
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
      </div>
    );
  }

  return (
    <div className="app">
      <div className="main-container">
        <AppHeader onAddFolder={addNewFolder} onUpload={handleUploadClick} />
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".pdf" onChange={handleFileChange} />

        <Heatmap data={heatmapData} />

        <div className="folders-grid">
          {folders.map(folder => (
            <FolderCard
              key={folder._id}
              folder={folder}
              onFolderClick={folder => {
                navigate(`/folder/${folder._id}`);
              }}
              onDeleteFolder={handleDeleteFolder}
              onShareFolder={handleShareFolder}
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

      {folderToShare && (
        <ShareDialog
          folder={folderToShare}
          isOpen={showShareDialog}
          onClose={handleCloseShareDialog}
          onToggleShare={handleToggleShare}
        />
      )}
    </div>
  );
}
