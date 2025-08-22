// Application state
let gameState = {
    board: Array(9).fill(''),
    currentPlayer: 'X', // X is human, O is computer
    gameActive: true,
    playerScore: 0,
    computerScore: 0
};

let chatState = {
    messages: [],
    currentUsername: '',
    isOpen: false
};

let typewriterState = {
    text: "i bridge simulation, machine learning, and software engineering",
    index: 0,
    isComplete: false
};

// Random usernames
const randomUsernames = [
    "cosmicCoder", "dataNinja", "mlWizard", "codeCrusher", "techTornado", 
    "algoAce", "byteBuster", "scriptSage", "devDynamo", "codeComet", 
    "techTitan", "dataDragon", "algoAdept", "scriptSorcerer", "codeCrafter", "techTrekker"
];

// Sample messages with timestamps
const sampleMessages = [
    // {username: "techTitan", message: "love your portfolio! the ml projects are impressive 🚀", timestamp: Date.now() - 3600000},
    // {username: "dataDragon", message: "hey arnab! your work on physics-informed neural networks caught my eye", timestamp: Date.now() - 1800000},
    // {username: "codeCrafter", message: "the bayesian neural network project is so cool! any tips for getting started?", timestamp: Date.now() - 900000}
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
    initializeChat();
    initializeGame();
    setupEventListeners();
    setupSmoothScrolling();
});

// Animations
function initializeAnimations() {
    // Subtle RGB animation for name
    const heroName = document.getElementById('heroName');
    if (heroName) {
        // Add RGB animation class with a delay
        setTimeout(() => {
            heroName.classList.add('rgb-animation');
        }, 1000);
    }

    // Typewriter effect for tagline
    const taglineElement = document.getElementById('heroTagline');
    if (taglineElement) {
        startTypewriter(taglineElement);
    }
}

function startTypewriter(element) {
    const words = typewriterState.text.split(' ');
    let currentWordIndex = 0;
    let currentText = '';

    function typeNextWord() {
        if (currentWordIndex < words.length) {
            currentText += (currentWordIndex > 0 ? ' ' : '') + words[currentWordIndex];
            element.textContent = currentText;
            element.classList.add('typewriter');
            
            currentWordIndex++;
            setTimeout(typeNextWord, 600 + Math.random() * 400);
        } else {
            // Remove cursor after completion
            setTimeout(() => {
                element.classList.remove('typewriter');
                typewriterState.isComplete = true;
            }, 1000);
        }
    }

    // Start typewriter effect after a short delay
    setTimeout(typeNextWord, 1500);
}

// Chat System
function initializeChat() {
    // Generate random username for the user
    chatState.currentUsername = randomUsernames[Math.floor(Math.random() * randomUsernames.length)];
    document.getElementById('chatUsername').textContent = chatState.currentUsername;
    
    // Load sample messages
    chatState.messages = [...sampleMessages];
    
    // Clean expired messages
    cleanExpiredMessages();
    
    // Render chat messages
    renderChatMessages();
}

function cleanExpiredMessages() {
    const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
    chatState.messages = chatState.messages.filter(msg => msg.timestamp > twelveHoursAgo);
}

function renderChatMessages() {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = '';
    
    chatState.messages.forEach(message => {
        const messageElement = createMessageElement(message);
        messagesContainer.appendChild(messageElement);
    });
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${message.username === chatState.currentUsername ? 'own' : 'other'}`;
    
    const timeStr = formatTime(message.timestamp);
    
    messageDiv.innerHTML = `
        <div class="chat-message-header">${message.username}</div>
        <div>${escapeHtml(message.message)}</div>
        <div class="chat-message-time">${timeStr}</div>
    `;
    
    return messageDiv;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // Less than 1 minute
        return 'just now';
    } else if (diff < 3600000) { // Less than 1 hour
        const minutes = Math.floor(diff / 60000);
        return `${minutes}m ago`;
    } else if (diff < 86400000) { // Less than 24 hours
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
    } else {
        return date.toLocaleDateString();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message) {
        const newMessage = {
            username: chatState.currentUsername,
            message: message,
            timestamp: Date.now()
        };
        
        chatState.messages.push(newMessage);
        input.value = '';
        renderChatMessages();
        
        // Simulate other users responding occasionally
        if (Math.random() < 0.3) {
            setTimeout(simulateResponse, 1000 + Math.random() * 3000);
        }
    }
}

function simulateResponse() {
    const responses = [
        "that's interesting! 🤔",
        "cool stuff! 👍",
        "nice work on your projects!",
        "thanks for sharing!",
        "awesome portfolio! 🚀",
        "great to see more ml enthusiasts here!",
        "your research sounds fascinating!",
        "keep up the great work! 💪",
        "love the clean design!",
        "impressive technical depth!"
    ];
    
    const otherUsernames = randomUsernames.filter(name => name !== chatState.currentUsername);
    const randomUsername = otherUsernames[Math.floor(Math.random() * otherUsernames.length)];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    const newMessage = {
        username: randomUsername,
        message: randomResponse,
        timestamp: Date.now()
    };
    
    chatState.messages.push(newMessage);
    renderChatMessages();
}

// Game System
function initializeGame() {
    resetGame();
    renderGameBoard();
    updateGameStatus('your turn! (you are x)');
}

function resetGame() {
    gameState.board = Array(9).fill('');
    gameState.currentPlayer = 'X';
    gameState.gameActive = true;
    renderGameBoard();
    updateGameStatus('your turn! (you are x)');
}

function renderGameBoard() {
    const cells = document.querySelectorAll('.game-cell');
    cells.forEach((cell, index) => {
        cell.textContent = gameState.board[index];
        cell.className = 'game-cell';
        
        if (gameState.board[index]) {
            cell.classList.add('taken');
            cell.classList.add(gameState.board[index].toLowerCase());
        }
    });
    
    // Update scores
    document.getElementById('playerScore').textContent = gameState.playerScore;
    document.getElementById('computerScore').textContent = gameState.computerScore;
}

function makeMove(cellIndex) {
    if (!gameState.gameActive || gameState.board[cellIndex] !== '' || gameState.currentPlayer !== 'X') {
        return;
    }
    
    // Human move
    gameState.board[cellIndex] = 'X';
    gameState.currentPlayer = 'O';
    renderGameBoard();
    
    const result = checkWinner();
    if (result) {
        handleGameEnd(result);
        return;
    }
    
    updateGameStatus('computer is thinking...');
    
    // Computer move after a short delay
    setTimeout(() => {
        if (gameState.gameActive) {
            makeComputerMove();
        }
    }, 500 + Math.random() * 1000);
}

function makeComputerMove() {
    const bestMove = getBestMove();
    
    if (bestMove !== -1) {
        gameState.board[bestMove] = 'O';
        gameState.currentPlayer = 'X';
        renderGameBoard();
        
        const result = checkWinner();
        if (result) {
            handleGameEnd(result);
        } else {
            updateGameStatus('your turn! (you are x)');
        }
    }
}

function getBestMove() {
    // Simple AI that tries to win, block, or take center/corners
    
    // Try to win
    for (let i = 0; i < 9; i++) {
        if (gameState.board[i] === '') {
            gameState.board[i] = 'O';
            if (checkWinner() === 'O') {
                gameState.board[i] = '';
                return i;
            }
            gameState.board[i] = '';
        }
    }
    
    // Try to block player from winning
    for (let i = 0; i < 9; i++) {
        if (gameState.board[i] === '') {
            gameState.board[i] = 'X';
            if (checkWinner() === 'X') {
                gameState.board[i] = '';
                return i;
            }
            gameState.board[i] = '';
        }
    }
    
    // Take center if available
    if (gameState.board[4] === '') {
        return 4;
    }
    
    // Take corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => gameState.board[i] === '');
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }
    
    // Take any available space
    const availableMoves = [];
    for (let i = 0; i < 9; i++) {
        if (gameState.board[i] === '') {
            availableMoves.push(i);
        }
    }
    
    return availableMoves.length > 0 ? availableMoves[Math.floor(Math.random() * availableMoves.length)] : -1;
}

function checkWinner() {
    const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6] // diagonals
    ];
    
    for (let combo of winningCombinations) {
        const [a, b, c] = combo;
        if (gameState.board[a] && gameState.board[a] === gameState.board[b] && gameState.board[a] === gameState.board[c]) {
            return gameState.board[a];
        }
    }
    
    // Check for draw
    if (!gameState.board.includes('')) {
        return 'draw';
    }
    
    return null;
}

function handleGameEnd(result) {
    gameState.gameActive = false;
    
    if (result === 'X') {
        gameState.playerScore++;
        updateGameStatus('you won! 🎉');
    } else if (result === 'O') {
        gameState.computerScore++;
        updateGameStatus('computer wins! 🤖');
    } else {
        updateGameStatus("it's a draw! 🤝");
    }
    
    renderGameBoard();
    
    // Auto-reset after a delay
    setTimeout(() => {
        if (document.getElementById('gameModal').classList.contains('hidden') === false) {
            resetGame();
        }
    }, 2500);
}

function updateGameStatus(status) {
    document.getElementById('gameStatus').textContent = status;
}

// Modal Management
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    if (modalId === 'chatModal') {
        chatState.isOpen = true;
        document.getElementById('chatInput').focus();
        cleanExpiredMessages();
        renderChatMessages();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    
    if (modalId === 'chatModal') {
        chatState.isOpen = false;
    }
}

// Event Listeners
function setupEventListeners() {
    // SAY HI button
    document.getElementById('sayHiBtn').addEventListener('click', () => {
        openModal('chatModal');
    });
    
    // Game button
    document.getElementById('gameBtn').addEventListener('click', () => {
        openModal('gameModal');
    });
    
    // Chat modal events
    document.getElementById('closeChatBtn').addEventListener('click', () => {
        closeModal('chatModal');
    });
    
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
    
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Game modal events
    document.getElementById('closeGameBtn').addEventListener('click', () => {
        closeModal('gameModal');
    });
    
    document.getElementById('resetGameBtn').addEventListener('click', resetGame);
    
    // Game board clicks
    document.querySelectorAll('.game-cell').forEach((cell, index) => {
        cell.addEventListener('click', () => makeMove(index));
    });
    
    // Modal overlay clicks to close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                if (modal.id === 'chatModal') {
                    closeModal('chatModal');
                } else if (modal.id === 'gameModal') {
                    closeModal('gameModal');
                }
            }
        });
    });
    
    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!document.getElementById('chatModal').classList.contains('hidden')) {
                closeModal('chatModal');
            } else if (!document.getElementById('gameModal').classList.contains('hidden')) {
                closeModal('gameModal');
            }
        }
    });
    
    // Periodic cleanup of expired messages
    setInterval(() => {
        if (chatState.isOpen) {
            const previousLength = chatState.messages.length;
            cleanExpiredMessages();
            if (chatState.messages.length !== previousLength) {
                renderChatMessages();
            }
        }
    }, 60000); // Check every minute
}

// Smooth scrolling for navigation
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.offsetTop;
                const offsetPosition = elementPosition - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Intersection Observer for subtle animations on scroll
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe sections for fade-in animation
    document.querySelectorAll('.section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
}

// Initialize scroll animations after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(setupScrollAnimations, 2000); // Delay to allow other animations to complete
});

// Utility functions
function getRandomArrayElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Easter egg: Konami code
document.addEventListener('keydown', (e) => {
    const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // up up down down left right left right B A
    if (!window.konamiIndex) window.konamiIndex = 0;
    
    if (e.keyCode === konamiCode[window.konamiIndex]) {
        window.konamiIndex++;
        if (window.konamiIndex === konamiCode.length) {
            // Easter egg: Add a special message to chat
            if (!chatState.isOpen) {
                openModal('chatModal');
            }
            
            setTimeout(() => {
                const easterEggMessage = {
                    username: 'systemBot',
                    message: '🎉 konami code activated! you found the secret! welcome to the matrix 🚀',
                    timestamp: Date.now()
                };
                chatState.messages.push(easterEggMessage);
                renderChatMessages();
            }, 500);
            
            window.konamiIndex = 0;
        }
    } else {
        window.konamiIndex = 0;
    }
});

// Add subtle parallax effect to hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero) {
        const speed = scrolled * 0.5;
        hero.style.transform = `translateY(${speed}px)`;
    }
});

// Preload animations and effects
document.addEventListener('DOMContentLoaded', () => {
    // Add loaded class to body for CSS transitions
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});