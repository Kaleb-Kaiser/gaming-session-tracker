// ========================================
// Gaming Session Tracker - JavaScript
// ========================================

// Storage key for Local Storage
const STORAGE_KEY = 'gamingTrackerSessions';

// Mood emoji map
const MOOD_EMOJIS = {
    happy: '😊',
    excited: '🤩',
    neutral: '😐',
    frustrated: '😤',
    tired: '😴'
};

// ========================================
// Initialize on page load
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    loadSessions();
    setupEventListeners();
    setDateToToday();
});

// ========================================
// Event Listeners
// ========================================

function setupEventListeners() {
    // Form submission
    const form = document.getElementById('sessionForm');
    form.addEventListener('submit', handleAddSession);

    // Mood buttons
    const moodBtns = document.querySelectorAll('.mood-btn');
    moodBtns.forEach(btn => {
        btn.addEventListener('click', handleMoodSelection);
    });

    // Clear all button
    const clearAllBtn = document.getElementById('clearAllBtn');
    clearAllBtn.addEventListener('click', handleClearAll);
}

// ========================================
// Add Session Handler
// ========================================

function handleAddSession(e) {
    e.preventDefault();

    // Get form values
    const gameName = document.getElementById('gameName').value.trim();
    const hours = parseFloat(document.getElementById('hours').value);
    const date = document.getElementById('date').value;
    const mood = document.getElementById('mood').value;
    const notes = document.getElementById('notes').value.trim();

    // Validate required fields
    if (!gameName || !hours || !date || !mood) {
        alert('Please fill in all required fields.');
        return;
    }

    // Create session object
    const session = {
        id: Date.now(),
        game: gameName,
        hours: hours,
        date: date,
        mood: mood,
        notes: notes
    };

    // Get existing sessions
    let sessions = getSessions();

    // Add new session
    sessions.push(session);

    // Save to localStorage
    saveSessions(sessions);

    // Clear form
    document.getElementById('sessionForm').reset();
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('mood').value = '';

    // Render updated sessions
    renderSessions();
    updateStats();
}

// ========================================
// Mood Selection Handler
// ========================================

function handleMoodSelection(e) {
    e.preventDefault();

    // Remove active class from all mood buttons
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Add active class to clicked button
    e.target.classList.add('active');

    // Set hidden input value
    document.getElementById('mood').value = e.target.dataset.mood;
}

// ========================================
// Clear All Sessions Handler
// ========================================

function handleClearAll(e) {
    e.preventDefault();

    const confirmed = confirm('Are you sure you want to delete all sessions? This cannot be undone.');
    
    if (confirmed) {
        saveSessions([]);
        renderSessions();
        updateStats();
    }
}

// ========================================
// Delete Session Handler
// ========================================

function handleDeleteSession(sessionId) {
    let sessions = getSessions();
    sessions = sessions.filter(session => session.id !== sessionId);
    saveSessions(sessions);
    renderSessions();
    updateStats();
}

// ========================================
// Storage Functions
// ========================================

/**
 * Get all sessions from localStorage
 * @returns {Array} Array of session objects
 */
function getSessions() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

/**
 * Save sessions to localStorage
 * @param {Array} sessions - Array of session objects to save
 */
function saveSessions(sessions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

/**
 * Load sessions from localStorage and render them
 */
function loadSessions() {
    renderSessions();
    updateStats();
}

// ========================================
// Rendering Functions
// ========================================

/**
 * Render all sessions to the DOM
 */
function renderSessions() {
    const sessions = getSessions();
    const sessionsList = document.getElementById('sessionsList');

    // Clear existing content
    sessionsList.innerHTML = '';

    // Check if sessions exist
    if (sessions.length === 0) {
        sessionsList.innerHTML = '<p class="empty-state">No sessions yet. Add one to get started!</p>';
        return;
    }

    // Sort sessions by date (newest first)
    const sortedSessions = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Create and append session cards
    sortedSessions.forEach(session => {
        const card = createSessionCard(session);
        sessionsList.appendChild(card);
    });
}

/**
 * Create a session card element
 * @param {Object} session - Session object
 * @returns {HTMLElement} Session card element
 */
function createSessionCard(session) {
    const card = document.createElement('div');
    card.className = 'session-card';

    // Format date for display
    const dateObj = new Date(session.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Get mood emoji
    const moodEmoji = MOOD_EMOJIS[session.mood] || '😐';

    // Build HTML
    const notesHTML = session.notes ? `<div class="session-notes">"${session.notes}"</div>` : '';

    card.innerHTML = `
        <div class="session-mood">${moodEmoji}</div>
        <div class="session-info">
            <div class="session-game">${escapeHTML(session.game)}</div>
            <div class="session-meta">
                <div class="session-meta-item">📅 ${formattedDate}</div>
                <div class="session-meta-item">⏱️ ${session.hours} hour${session.hours !== 1 ? 's' : ''}</div>
                <div class="session-meta-item">😊 ${capitalizeFirst(session.mood)}</div>
            </div>
            ${notesHTML}
        </div>
        <div class="session-actions">
            <button class="btn-delete" onclick="handleDeleteSession(${session.id})">Delete</button>
        </div>
    `;

    return card;
}

// ========================================
// Statistics Functions
// ========================================

/**
 * Update and display statistics
 */
function updateStats() {
    const sessions = getSessions();

    // Calculate statistics
    const totalSessions = sessions.length;
    const totalHours = sessions.reduce((sum, session) => sum + session.hours, 0);
    const avgHours = totalSessions > 0 ? (totalHours / totalSessions).toFixed(1) : 0;
    const commonMood = getMostCommonMood(sessions);

    // Update DOM
    document.getElementById('totalSessions').textContent = totalSessions;
    document.getElementById('totalHours').textContent = totalHours.toFixed(1);
    document.getElementById('avgHours').textContent = avgHours;
    document.getElementById('commonMood').textContent = commonMood ? MOOD_EMOJIS[commonMood] : '-';
}

/**
 * Find the most common mood in sessions
 * @param {Array} sessions - Array of session objects
 * @returns {String} Most common mood key or null
 */
function getMostCommonMood(sessions) {
    if (sessions.length === 0) return null;

    const moodCounts = {};
    sessions.forEach(session => {
        moodCounts[session.mood] = (moodCounts[session.mood] || 0) + 1;
    });

    let mostCommon = null;
    let maxCount = 0;

    for (const [mood, count] of Object.entries(moodCounts)) {
        if (count > maxCount) {
            maxCount = count;
            mostCommon = mood;
        }
    }

    return mostCommon;
}

// ========================================
// Utility Functions
// ========================================

/**
 * Set date input to today's date
 */
function setDateToToday() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {String} text - Text to escape
 * @returns {String} Escaped text
 */
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Capitalize first letter of a string
 * @param {String} str - String to capitalize
 * @returns {String} Capitalized string
 */
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
