const { ipcRenderer } = require('electron');

const miniTime = document.getElementById('mini-time');
const miniLabel = document.getElementById('mini-label');
const playBtn = document.getElementById('mini-play');
const pauseBtn = document.getElementById('mini-pause');
const skipBtn = document.getElementById('mini-skip');
const closeBtn = document.getElementById('close-btn');

let isRunning = false;

// Receive updates from main window
ipcRenderer.on('update-timer', (event, data) => {
    // Format time display
    if (data.isRunning || data.time.includes(':')) {
        // Show countdown format (25:00)
        miniTime.textContent = data.time;
    } else {
        // Show initial format (25 mins)
        const minutes = parseInt(data.time.split(':')[0]);
        miniTime.textContent = `${minutes} mins`;
    }

    miniLabel.textContent = data.label;

    if (data.isRunning) {
        playBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
        playBtn.textContent = 'Start session';
        isRunning = true;
    } else {
        playBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
        isRunning = false;
    }
});

// Control buttons
playBtn.addEventListener('click', () => {
    // Immediate UI feedback
    playBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    isRunning = true;

    ipcRenderer.send('start-timer-from-mini');
});

pauseBtn.addEventListener('click', () => {
    // Immediate UI feedback
    pauseBtn.classList.add('hidden');
    playBtn.classList.remove('hidden');
    isRunning = false;

    ipcRenderer.send('pause-timer-from-mini');
});

skipBtn.addEventListener('click', () => {
    // Add visual feedback
    skipBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        skipBtn.style.transform = '';
    }, 150);

    ipcRenderer.send('skip-timer-from-mini');
});

closeBtn.addEventListener('click', () => {
    ipcRenderer.send('close-mini-window');
});
