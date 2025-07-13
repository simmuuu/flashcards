import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [folders, setFolders] = useState([])
  const [currentFolder, setCurrentFolder] = useState(null)
  const [currentCard, setCurrentCard] = useState(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [viewMode, setViewMode] = useState('folders') // 'folders', 'cards', 'study'
  const [studyProgress, setStudyProgress] = useState([]) // Track answers for current session
  const [dailyStats, setDailyStats] = useState({ today: 0, yesterday: 0 })
  const [showDialog, setShowDialog] = useState(false)
  const [dialogType, setDialogType] = useState('') // 'folder' or 'card'
  const [dialogData, setDialogData] = useState({ title: '', content: '' })

  // Initialize demo data and load from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('flashcards')
    if (savedData) {
      setFolders(JSON.parse(savedData))
    } else {
      // Demo data with spaced repetition info
      const demoFolders = [
        {
          id: 1,
          name: 'Compiler Design',
          cards: [
            { id: 1, front: 'What is a lexical analyzer?', back: 'The lexical analyzer is the first phase of a compiler. It scans the source code and converts it into tokens, which are meaningful sequences of characters.', difficulty: 'medium', nextReview: Date.now(), reviewCount: 0 },
            { id: 2, front: 'What is a parse tree?', back: 'A parse tree is a tree representation of the syntactic structure of a source program according to a context-free grammar.', difficulty: 'medium', nextReview: Date.now(), reviewCount: 0 },
            { id: 3, front: 'Difference between compiler and interpreter?', back: 'A compiler translates the entire source code into machine code before execution. An interpreter executes code line by line, translating each statement as it runs.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 },
            { id: 4, front: 'What is left recursion in grammar?', back: 'Left recursion occurs when a non-terminal in a grammar has a production that starts with itself, e.g., A → Aα.', difficulty: 'hard', nextReview: Date.now(), reviewCount: 0 },
            { id: 5, front: 'What is a FIRST set?', back: 'The FIRST set of a non-terminal is the set of terminals that begin the strings derivable from that non-terminal.', difficulty: 'hard', nextReview: Date.now(), reviewCount: 0 },
            { id: 6, front: 'What is a FOLLOW set?', back: 'The FOLLOW set of a non-terminal is the set of terminals that can appear immediately to the right of that non-terminal in some sentential form.', difficulty: 'hard', nextReview: Date.now(), reviewCount: 0 },
            { id: 7, front: 'What is an abstract syntax tree (AST)?', back: 'An AST is a simplified parse tree that represents the hierarchical syntactic structure of source code, omitting unnecessary grammar details.', difficulty: 'medium', nextReview: Date.now(), reviewCount: 0 },
            { id: 8, front: 'What is a symbol table?', back: 'A symbol table is a data structure used by a compiler to keep track of identifiers (variables, functions, etc.) and their attributes.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 },
            { id: 9, front: 'What is semantic analysis?', back: 'Semantic analysis checks for semantic errors and ensures that the program meaning is correct, such as type checking and scope resolution.', difficulty: 'medium', nextReview: Date.now(), reviewCount: 0 },
            { id: 10, front: 'What is intermediate code generation?', back: 'Intermediate code generation produces a code that is between source and machine code, making optimization and portability easier.', difficulty: 'medium', nextReview: Date.now(), reviewCount: 0 },
            // Added basic compiler flashcards
            { id: 101, front: 'Compiler', back: 'A compiler is a system software used to translate a program written in one programming language (source language) into machine understandable language (target language) to be executed by a computer. It aims to make the target code efficient and optimized in terms of time and space.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 },
            { id: 102, front: 'Phases of a Compiler', back: 'A compiler operates as a sequence of phases, each transforming one representation of the source program to another. Typical phases include: Lexical Analysis, Syntax Analysis, Semantic Analysis, Intermediate Code Generation, Code Optimization, and Code Generation, along with Symbol Table Management and Error Handling.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 },
            { id: 103, front: 'Lexical Analysis (Scanning)', back: 'The first phase of a compiler, where the lexical analyzer (scanner) reads the stream of characters from the source program and groups them into meaningful sequences called lexemes. For each lexeme, it produces a token. It also strips out comments and whitespace.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 },
            { id: 104, front: 'Token', back: 'A token is a sequence of characters that represents a unit of information in the source code. Examples include keywords, operators, identifiers, and special symbols. For each lexeme, the lexical analyzer produces a token of the form <token-name, attribute-value>.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 },
            { id: 105, front: 'Syntax Analysis (Parsing)', back: 'The second phase of the compiler, where the parser uses the tokens produced by the lexical analyzer to create a tree-like intermediate representation (e.g., a syntax tree) that depicts the grammatical structure of the token stream. It verifies if the token string can be generated by the source language\'s grammar.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 },
            { id: 106, front: 'Semantic Analysis', back: 'The third phase of the compiler. The semantic analyzer uses the syntax tree and symbol table information to check the source program for semantic consistency with the language definition. This includes type checking and performing type conversions.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 },
            { id: 107, front: 'Intermediate Code Generation', back: 'The fourth phase of the compiler. In this process, a compiler may construct one or more intermediate representations of the source program after semantic analysis. These representations are closer to machine code but still abstract enough for further optimization. Three-address code is one common representation.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 },
            { id: 108, front: 'Code Optimization', back: 'The fifth phase of the compiler. It takes the intermediate code as input and produces optimized intermediate code as output. The goal is to improve the intermediate code to generate better target code (e.g., faster, shorter, or consuming less power). This phase is optional.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 },
            { id: 109, front: 'Code Generation', back: 'The sixth and final phase of the compiler. The code generator takes intermediate representation (or optimized machine-independent representation) as input and maps it into the target language. This involves selecting registers or memory locations for variables and translating instructions into machine instructions.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 },
            { id: 110, front: 'Symbol Table', back: 'A major data structure created and maintained by compilers to store information about identifiers used in the program. It contains a record for each identifier with fields for its attributes (e.g., type, scope, storage allocation). It is used by all phases of the compiler.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 },
            { id: 111, front: 'Front End of a Compiler (Analysis Part)', back: 'The front end of a compiler is the analysis part of the translation process. It includes the Lexical Analysis, Syntax Analysis, and Semantic Analysis phases. Its role is to translate the source program into an intermediate representation.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 },
            { id: 112, front: 'Back End of a Compiler (Synthesis Part)', back: 'The back end of a compiler is the synthesis part of the translation process. It typically includes the Intermediate Code Generator, Code Optimizer, and Target Code Generator (Code Generation) phases. This part is generally machine-dependent.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 },
            { id: 113, front: 'Bootstrapping', back: 'Bootstrapping is the process of developing a compiler for a new language by using an existing compiler. It is also used to create compilers and to move them from one machine to another by modifying the back end. It allows writing a compiler in a high-level language even when a compiler for that language doesn\'t yet exist on the target machine.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 },
            { id: 114, front: 'Left Recursion', back: 'A grammar is left recursive if it has a non-terminal A such that there is a derivation A => Aα for some string α. Top-down parsing methods cannot handle left-recursive grammars and can cause them to go into an infinite loop, hence it must be eliminated.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 },
            { id: 115, front: 'Syntax-Directed Definition (SDD)', back: 'An SDD is a context-free grammar together with attributes and rules. Attributes are associated with grammar symbols, and rules (semantic rules) are associated with productions. Rules describe how attributes are computed at parse-tree nodes. SDDs are used for specifications and can be S-attributed or L-attributed.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 }
          ]
        },
        {
          id: 2,
          name: 'Computer Networks',
          cards: [
            { id: 11, front: 'What is the OSI model?', back: 'The OSI model is a seven-layer framework for network architecture: Physical, Data Link, Network, Transport, Session, Presentation, Application.', difficulty: 'medium', nextReview: Date.now(), reviewCount: 0 },
            { id: 12, front: 'Difference between TCP and UDP?', back: 'TCP is reliable and connection-oriented, ensuring data delivery. UDP is faster, connectionless, and does not guarantee delivery.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 },
            { id: 13, front: 'What is a subnet mask?', back: 'A subnet mask divides an IP address into network and host portions, helping route traffic within subnets.', difficulty: 'medium', nextReview: Date.now(), reviewCount: 0 },
            { id: 14, front: 'What is DNS?', back: 'DNS (Domain Name System) translates human-readable domain names into IP addresses.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 },
            { id: 15, front: 'What is DHCP?', back: 'DHCP (Dynamic Host Configuration Protocol) automatically assigns IP addresses and network configuration to devices.', difficulty: 'medium', nextReview: Date.now(), reviewCount: 0 },
            { id: 16, front: 'What is NAT?', back: 'NAT (Network Address Translation) maps private IP addresses to public IP addresses, allowing multiple devices to share one public IP.', difficulty: 'medium', nextReview: Date.now(), reviewCount: 0 },
            { id: 17, front: 'What is a sliding window protocol?', back: 'Sliding window protocol is a flow control method that allows multiple frames to be sent before receiving an acknowledgment.', difficulty: 'hard', nextReview: Date.now(), reviewCount: 0 },
            { id: 18, front: 'What is congestion control?', back: 'Congestion control prevents network overload by controlling the rate of data transmission.', difficulty: 'hard', nextReview: Date.now(), reviewCount: 0 },
            { id: 19, front: 'What is ARP?', back: 'ARP (Address Resolution Protocol) maps IP addresses to MAC addresses in a local network.', difficulty: 'medium', nextReview: Date.now(), reviewCount: 0 },
            { id: 20, front: 'What is HTTP?', back: 'HTTP (Hypertext Transfer Protocol) is the protocol used for transferring web pages on the internet.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 }
          ]
        },
        {
          id: 3,
          name: 'JavaScript Concepts',
          cards: [
            { id: 21, front: 'What is a closure?', back: 'A closure is a function that retains access to its lexical scope, even when executed outside that scope.', difficulty: 'hard', nextReview: Date.now(), reviewCount: 0 },
            { id: 22, front: 'What is hoisting?', back: 'Hoisting is JavaScript’s behavior of moving declarations to the top of their scope before code execution.', difficulty: 'medium', nextReview: Date.now(), reviewCount: 0 },
            { id: 23, front: 'What is the DOM?', back: 'The Document Object Model (DOM) is a programming interface for HTML and XML documents, representing the page structure as nodes.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 },
            { id: 24, front: 'What is event bubbling?', back: 'Event bubbling is the process where an event starts at the most specific element and then flows upward to less specific elements.', difficulty: 'medium', nextReview: Date.now(), reviewCount: 0 },
            { id: 25, front: 'What is async/await?', back: 'Async/await is syntax for writing asynchronous code that looks synchronous, making it easier to work with Promises.', difficulty: 'medium', nextReview: Date.now(), reviewCount: 0 },
            { id: 26, front: 'What is the prototype chain?', back: 'The prototype chain is the mechanism by which JavaScript objects inherit features from one another.', difficulty: 'hard', nextReview: Date.now(), reviewCount: 0 },
            { id: 27, front: 'What is a promise?', back: 'A promise is an object representing the eventual completion or failure of an asynchronous operation.', difficulty: 'medium', nextReview: Date.now(), reviewCount: 0 },
            { id: 28, front: 'What is strict mode?', back: 'Strict mode is a way to opt in to a restricted variant of JavaScript, catching common coding errors and unsafe actions.', difficulty: 'easy', nextReview: Date.now(), reviewCount: 0 }
          ]
        }
      ]
      setFolders(demoFolders)
      localStorage.setItem('flashcards', JSON.stringify(demoFolders))
    }
  }, [])

  // Save to localStorage whenever folders change
  useEffect(() => {
    if (folders.length > 0) {
      localStorage.setItem('flashcards', JSON.stringify(folders))
      
      // Calculate daily stats
      const today = new Date().toDateString()
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()
      
      let todayCount = 0
      let yesterdayCount = 0
      
      folders.forEach(folder => {
        folder.cards.forEach(card => {
          if (card.lastReviewed) {
            const reviewDate = new Date(card.lastReviewed).toDateString()
            if (reviewDate === today) todayCount++
            if (reviewDate === yesterday) yesterdayCount++
          }
        })
      })
      
      setDailyStats({ today: todayCount, yesterday: yesterdayCount })
    }
  }, [folders])

  // Improved spaced repetition algorithm (similar to Anki)
  const getNextReviewInterval = (difficulty, reviewCount) => {
    // Base intervals in milliseconds
    const baseIntervals = {
      easy: [1000 * 60 * 10, 1000 * 60 * 60 * 4, 1000 * 60 * 60 * 24 * 3, 1000 * 60 * 60 * 24 * 8, 1000 * 60 * 60 * 24 * 20], // 10min, 4h, 3d, 8d, 20d
      medium: [1000 * 60 * 5, 1000 * 60 * 60 * 1, 1000 * 60 * 60 * 12, 1000 * 60 * 60 * 24 * 2, 1000 * 60 * 60 * 24 * 7], // 5min, 1h, 12h, 2d, 7d
      hard: [1000 * 60 * 1, 1000 * 60 * 10, 1000 * 60 * 60 * 2, 1000 * 60 * 60 * 8, 1000 * 60 * 60 * 24 * 2] // 1min, 10min, 2h, 8h, 2d
    }
    
    const intervals = baseIntervals[difficulty] || baseIntervals.medium
    
    // For hard cards, reset review count occasionally to show them more often
    if (difficulty === 'hard' && reviewCount > 2 && Math.random() < 0.3) {
      return intervals[Math.max(0, reviewCount - 2)]
    }
    
    // For medium cards, occasionally show them again sooner
    if (difficulty === 'medium' && reviewCount > 1 && Math.random() < 0.2) {
      return intervals[Math.max(0, reviewCount - 1)]
    }
    
    return intervals[Math.min(reviewCount, intervals.length - 1)] || intervals[intervals.length - 1]
  }

  // Format time until next review
  const formatTimeUntilReview = (nextReview) => {
    const now = Date.now()
    const diff = nextReview - now
    
    if (diff <= 0) return 'Due now'
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days > 0) return `in ${days} day${days === 1 ? '' : 's'}`
    if (hours > 0) return `in ${hours} hour${hours === 1 ? '' : 's'}`
    if (minutes > 0) return `in ${minutes} min${minutes === 1 ? '' : 's'}`
    return 'in < 1 min'
  }

  // Get estimated time for difficulty level
  const getDifficultyEstimate = (difficulty, reviewCount = 0) => {
    const interval = getNextReviewInterval(difficulty, reviewCount)
    const minutes = Math.floor(interval / (1000 * 60))
    const hours = Math.floor(interval / (1000 * 60 * 60))
    const days = Math.floor(interval / (1000 * 60 * 60 * 24))
    
    if (days > 0) return `${days}d`
    if (hours > 0) return `${hours}h`
    if (minutes > 0) return `${minutes}m`
    return '<1m'
  }

  const getDueCards = (folder) => {
    const now = Date.now()
    const dueCards = folder.cards.filter(card => card.nextReview <= now)
    
    // Sort cards by priority: hard cards first, then by next review time
    return dueCards.sort((a, b) => {
      // Hard cards get priority
      if (a.difficulty === 'hard' && b.difficulty !== 'hard') return -1
      if (b.difficulty === 'hard' && a.difficulty !== 'hard') return 1
      
      // Then sort by next review time (earlier first)
      return a.nextReview - b.nextReview
    })
  }

  const startStudying = (folder) => {
    const dueCards = getDueCards(folder)
    if (dueCards.length === 0) {
      alert('No cards due for review!')
      return
    }
    setCurrentFolder(folder)
    setCurrentCard(dueCards[0])
    setShowAnswer(false)
    setStudyProgress([]) // Reset progress for new session
    setViewMode('study')
  }

  const markDifficulty = (difficulty) => {
    if (!currentCard || !currentFolder) return

    const updatedCard = {
      ...currentCard,
      difficulty,
      reviewCount: currentCard.reviewCount + 1,
      nextReview: Date.now() + getNextReviewInterval(difficulty, currentCard.reviewCount),
      lastReviewed: Date.now()
    }

    // Add to progress tracking
    setStudyProgress(prev => [...prev, difficulty])

    const updatedFolders = folders.map(folder => {
      if (folder.id === currentFolder.id) {
        return {
          ...folder,
          cards: folder.cards.map(card => 
            card.id === currentCard.id ? updatedCard : card
          )
        }
      }
      return folder
    })

    setFolders(updatedFolders)

    // Get next due card
    const updatedFolder = updatedFolders.find(f => f.id === currentFolder.id)
    const remainingDueCards = getDueCards(updatedFolder)
    
    if (remainingDueCards.length > 0) {
      setCurrentCard(remainingDueCards[0])
      setShowAnswer(false)
    } else {
      alert('All cards reviewed! Great job!')
      setViewMode('folders')
      setCurrentFolder(null)
      setCurrentCard(null)
      setStudyProgress([])
    }
  }

  const addNewFolder = () => {
    setDialogType('folder')
    setDialogData({ title: '', content: '' })
    setShowDialog(true)
  }

  const addNewCard = () => {
    setDialogType('card')
    setDialogData({ title: '', content: '' })
    setShowDialog(true)
  }

  const handleDialogSave = () => {
    if (dialogType === 'folder') {
      if (dialogData.title.trim()) {
        const newFolder = {
          id: Date.now(),
          name: dialogData.title.trim(),
          cards: []
        }
        setFolders([...folders, newFolder])
      }
    } else if (dialogType === 'card') {
      if (dialogData.title.trim() && dialogData.content.trim()) {
        const newCard = {
          id: Date.now(),
          front: dialogData.title.trim(),
          back: dialogData.content.trim(),
          difficulty: 'medium',
          nextReview: Date.now(),
          reviewCount: 0
        }

        const updatedFolders = folders.map(folder => {
          if (folder.id === currentFolder.id) {
            return {
              ...folder,
              cards: [...folder.cards, newCard]
            }
          }
          return folder
        })

        setFolders(updatedFolders)
        
        // Update current folder state to reflect the new card
        const updatedCurrentFolder = updatedFolders.find(f => f.id === currentFolder.id)
        setCurrentFolder(updatedCurrentFolder)
      }
    }
    
    setShowDialog(false)
    setDialogData({ title: '', content: '' })
  }

  const handleDialogCancel = () => {
    setShowDialog(false)
    setDialogData({ title: '', content: '' })
  }

  if (viewMode === 'study' && currentCard) {
    return (
      <>
        <div className="app">
          <div className="study-container">
            <div className="study-header">
              <button onClick={() => setViewMode('folders')} className="back-btn">← Back</button>
              <h2>{currentFolder.name}</h2>
            </div>

            <div className="progress-indicators">
              {studyProgress.map((answer, index) => (
                <div key={index} className={`progress-dot ${answer}`}></div>
              ))}
              <div className="progress-dot current"></div>
              {Array.from({ length: Math.max(0, getDueCards(currentFolder).length - studyProgress.length - 1) }, (_, i) => (
                <div key={`remaining-${i}`} className="progress-dot"></div>
              ))}
            </div>
            
            <div className="flashcard">
              <div className="card-content">
                <h3>{showAnswer ? 'Answer' : 'Question'}</h3>
                <p>{showAnswer ? currentCard.back : currentCard.front}</p>
                {showAnswer && (
                  <div className="review-timing">
                    Next review: {formatTimeUntilReview(currentCard.nextReview + getNextReviewInterval(currentCard.difficulty, currentCard.reviewCount))}
                  </div>
                )}
              </div>
            </div>

            {!showAnswer ? (
              <button onClick={() => setShowAnswer(true)} className="show-answer-btn">
                Show Answer
              </button>
            ) : (
              <div className="difficulty-buttons">
                <h4>How difficult was this?</h4>
                <div className="difficulty-buttons-row">
                  <button onClick={() => markDifficulty('easy')} className="diff-btn easy">
                    <span className="diff-label">Easy</span>
                    <span className="diff-time">{getDifficultyEstimate('easy', currentCard.reviewCount)}</span>
                  </button>
                  <button onClick={() => markDifficulty('medium')} className="diff-btn medium">
                    <span className="diff-label">Medium</span>
                    <span className="diff-time">{getDifficultyEstimate('medium', currentCard.reviewCount)}</span>
                  </button>
                  <button onClick={() => markDifficulty('hard')} className="diff-btn hard">
                    <span className="diff-label">Hard</span>
                    <span className="diff-time">{getDifficultyEstimate('hard', currentCard.reviewCount)}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {showDialog && (
          <div className="dialog-overlay" onClick={handleDialogCancel}>
            <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-header">
                <h3>{dialogType === 'folder' ? 'New Folder' : 'New Flashcard'}</h3>
              </div>
              
              <div className="dialog-content">
                <div className="input-group">
                  <label>{dialogType === 'folder' ? 'Folder Name' : 'Question (Front)'}</label>
                  <input
                    type="text"
                    value={dialogData.title}
                    onChange={(e) => setDialogData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={dialogType === 'folder' ? 'Enter folder name...' : 'Enter question...'}
                    autoFocus
                  />
                </div>
                
                {dialogType === 'card' && (
                  <div className="input-group">
                    <label>Answer (Back)</label>
                    <textarea
                      value={dialogData.content}
                      onChange={(e) => setDialogData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter answer..."
                      rows={4}
                    />
                  </div>
                )}
              </div>
              
              <div className="dialog-actions">
                <button onClick={handleDialogCancel} className="dialog-btn cancel">
                  Cancel
                </button>
                <button 
                  onClick={handleDialogSave} 
                  className="dialog-btn save"
                  disabled={!dialogData.title.trim() || (dialogType === 'card' && !dialogData.content.trim())}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  if (viewMode === 'cards' && currentFolder) {
    return (
      <>
        <div className="app">
          <div className="folder-view">
            <div className="folder-header">
              <button onClick={() => setViewMode('folders')} className="back-btn">← Back</button>
              <h2>{currentFolder.name}</h2>
              <button onClick={addNewCard} className="add-btn">+ Add Card</button>
            </div>

            <div className="cards-stats">
              <p>Total cards: {currentFolder.cards.length}</p>
              <p>Due for review: {getDueCards(currentFolder).length}</p>
            </div>

            <button 
              onClick={() => startStudying(currentFolder)} 
              className="study-btn"
              disabled={getDueCards(currentFolder).length === 0}
            >
              Start Studying
            </button>

            <div className="cards-list">
              {currentFolder.cards.map(card => (
                <div key={card.id} className={`card-item ${card.nextReview <= Date.now() ? 'due' : ''}`}>
                  <div className="card-preview">
                    <strong>{card.front}</strong>
                    <span className={`difficulty ${card.difficulty}`}>{card.difficulty}</span>
                  </div>
                  <div className="next-review">
                    Next review: {formatTimeUntilReview(card.nextReview)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {showDialog && (
          <div className="dialog-overlay" onClick={handleDialogCancel}>
            <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-header">
                <h3>{dialogType === 'folder' ? 'New Folder' : 'New Flashcard'}</h3>
              </div>
              
              <div className="dialog-content">
                <div className="input-group">
                  <label>{dialogType === 'folder' ? 'Folder Name' : 'Question (Front)'}</label>
                  <input
                    type="text"
                    value={dialogData.title}
                    onChange={(e) => setDialogData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={dialogType === 'folder' ? 'Enter folder name...' : 'Enter question...'}
                    autoFocus
                  />
                </div>
                
                {dialogType === 'card' && (
                  <div className="input-group">
                    <label>Answer (Back)</label>
                    <textarea
                      value={dialogData.content}
                      onChange={(e) => setDialogData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter answer..."
                      rows={4}
                    />
                  </div>
                )}
              </div>
              
              <div className="dialog-actions">
                <button onClick={handleDialogCancel} className="dialog-btn cancel">
                  Cancel
                </button>
                <button 
                  onClick={handleDialogSave} 
                  className="dialog-btn save"
                  disabled={!dialogData.title.trim() || (dialogType === 'card' && !dialogData.content.trim())}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div className="app">
        <div className="main-container">
          <header className="app-header">
            <h1>
              <svg className="app-icon" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M11.19,2.25C10.93,2.25 10.67,2.31 10.42,2.4L3.06,5.45C2.04,5.87 1.55,7.04 1.97,8.05L6.93,20C7.24,20.77 7.97,21.23 8.74,21.25C9,21.25 9.27,21.22 9.53,21.1L16.9,18.05C17.65,17.74 18.11,17 18.13,16.25C18.14,16 18.09,15.71 18,15.45L13,3.5C12.71,2.73 11.97,2.26 11.19,2.25M14.67,2.25L18.12,10.6V4.25A2,2 0 0,0 16.12,2.25M20.13,3.79V12.82L22.56,6.96C22.97,5.94 22.5,4.78 21.47,4.36M11.19,4.22L16.17,16.24L8.78,19.3L3.8,7.29" />
              </svg>
              Flashcards
            </h1>
            <button onClick={addNewFolder} className="add-btn">+ New Folder</button>
          </header>

          <div className="daily-stats">
            <div className="stat-card">
              <div className="stat-number">{dailyStats.today}</div>
              <div className="stat-label">Today</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{dailyStats.yesterday}</div>
              <div className="stat-label">Yesterday</div>
            </div>
          </div>

          <div className="folders-grid">
            {folders.map(folder => (
              <div 
                key={folder.id} 
                className="folder-card"
                onClick={() => {
                  setCurrentFolder(folder)
                  setViewMode('cards')
                }}
              >
                <h3>{folder.name}</h3>
                <p>{folder.cards.length} cards</p>
                <p className="due-count">{getDueCards(folder).length} due</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showDialog && (
        <div className="dialog-overlay" onClick={handleDialogCancel}>
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>{dialogType === 'folder' ? 'New Folder' : 'New Flashcard'}</h3>
            </div>
            
            <div className="dialog-content">
              <div className="input-group">
                <label>{dialogType === 'folder' ? 'Folder Name' : 'Question (Front)'}</label>
                <input
                  type="text"
                  value={dialogData.title}
                  onChange={(e) => setDialogData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={dialogType === 'folder' ? 'Enter folder name...' : 'Enter question...'}
                  autoFocus
                />
              </div>
              
              {dialogType === 'card' && (
                <div className="input-group">
                  <label>Answer (Back)</label>
                  <textarea
                    value={dialogData.content}
                    onChange={(e) => setDialogData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter answer..."
                    rows={4}
                  />
                </div>
              )}
            </div>
            
            <div className="dialog-actions">
              <button onClick={handleDialogCancel} className="dialog-btn cancel">
                Cancel
              </button>
              <button 
                onClick={handleDialogSave} 
                className="dialog-btn save"
                disabled={!dialogData.title.trim() || (dialogType === 'card' && !dialogData.content.trim())}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App
