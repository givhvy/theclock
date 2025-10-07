const { ipcRenderer } = require('electron');

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;

        // Update nav
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Update page
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`${page}-page`).classList.add('active');
    });
});

// Focus Session Timer
class FocusTimer {
    constructor() {
        this.focusDuration = 25 * 60; // 25 minutes in seconds
        this.breakDuration = 20; // 20 seconds
        this.timeRemaining = this.focusDuration;
        this.totalTime = this.focusDuration;
        this.isRunning = false;
        this.isPaused = false;
        this.interval = null;
        this.sessionType = 'focus'; // 'focus' or 'break'
        this.sessionsCompleted = 0;

        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.timeDisplay = document.getElementById('focus-time');
        this.sessionLabel = document.getElementById('session-label');
        this.startBtn = document.getElementById('focus-start');
        this.pauseBtn = document.getElementById('focus-pause');
        this.resetBtn = document.getElementById('focus-reset');
        this.miniBtn = document.getElementById('focus-mini');
        this.progressCircle = document.querySelector('.timer-progress');

        this.focusDurationSelect = document.getElementById('focus-duration');
        this.breakDurationSelect = document.getElementById('break-duration');
        this.longBreakDurationSelect = document.getElementById('long-break-duration');

        this.sound = document.getElementById('timer-end-sound');
    }

    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.miniBtn.addEventListener('click', () => this.openMiniMode());

        this.focusDurationSelect.addEventListener('change', (e) => {
            if (!this.isRunning) {
                this.focusDuration = parseInt(e.target.value) * 60;
                if (this.sessionType === 'focus') {
                    this.timeRemaining = this.focusDuration;
                    this.totalTime = this.focusDuration;
                    this.updateDisplay();
                }
            }
        });

        this.breakDurationSelect.addEventListener('change', (e) => {
            this.breakDuration = parseInt(e.target.value) * 60;
        });

        this.longBreakDurationSelect.addEventListener('change', (e) => {
            this.longBreakDuration = parseInt(e.target.value) * 60;
        });
    }

    start() {
        if (this.isRunning && !this.isPaused) return;

        this.isRunning = true;
        this.isPaused = false;
        this.startBtn.classList.add('hidden');
        this.pauseBtn.classList.remove('hidden');

        this.interval = setInterval(() => {
            this.timeRemaining--;
            this.updateDisplay();
            this.updateMiniWindow();

            if (this.timeRemaining <= 0) {
                this.sessionComplete();
            }
        }, 1000);
    }

    pause() {
        this.isPaused = true;
        this.isRunning = false;
        clearInterval(this.interval);
        this.startBtn.classList.remove('hidden');
        this.pauseBtn.classList.add('hidden');
    }

    reset() {
        this.pause();
        this.sessionType = 'focus';
        this.timeRemaining = this.focusDuration;
        this.totalTime = this.focusDuration;
        this.sessionsCompleted = 0;
        this.updateDisplay();
        this.updateMiniWindow();
    }

    sessionComplete() {
        this.playSound();
        this.showNotification();

        // Automatically switch between focus and break
        if (this.sessionType === 'focus') {
            this.sessionsCompleted++;
            this.sessionType = 'break';
            this.timeRemaining = this.breakDuration;
            this.totalTime = this.breakDuration;
        } else {
            this.sessionType = 'focus';
            this.timeRemaining = this.focusDuration;
            this.totalTime = this.focusDuration;
        }

        this.updateDisplay();
        this.updateMiniWindow();

        // Auto-start the next session
        setTimeout(() => {
            this.start();
        }, 1000);
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Update label
        if (this.sessionType === 'focus') {
            this.sessionLabel.textContent = 'Focus time';
        } else {
            this.sessionLabel.textContent = 'Break time';
        }

        // Update progress circle
        const progress = this.timeRemaining / this.totalTime;
        this.progressCircle.style.setProperty('--progress', progress);
    }

    playSound() {
        try {
            this.sound.currentTime = 0;
            this.sound.play().catch(err => console.log('Sound play failed:', err));
        } catch (err) {
            console.log('Sound error:', err);
        }
    }

    showNotification() {
        if (this.sessionType === 'focus') {
            new Notification('Break time!', {
                body: 'Time for a break. Stretch and relax!',
                silent: false
            });
        } else {
            new Notification('Focus time!', {
                body: 'Break is over. Time to focus!',
                silent: false
            });
        }
    }

    openMiniMode() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const label = this.sessionLabel.textContent;

        const data = {
            time: this.timeDisplay.textContent,
            label: label,
            progress: this.timeRemaining / this.totalTime,
            isRunning: this.isRunning
        };

        ipcRenderer.send('open-mini-window', data);
        ipcRenderer.send('minimize-main');
    }

    updateMiniWindow() {
        const label = this.isRunning ? this.sessionLabel.textContent : "You'll have no breaks";

        const data = {
            time: this.timeDisplay.textContent,
            label: label,
            progress: this.timeRemaining / this.totalTime,
            isRunning: this.isRunning
        };

        ipcRenderer.send('update-mini-timer', data);
    }
}

// Initialize timer
const focusTimer = new FocusTimer();

// Listen for commands from mini window via main process
ipcRenderer.on('start-timer', () => {
    focusTimer.start();
});

ipcRenderer.on('pause-timer', () => {
    focusTimer.pause();
});

ipcRenderer.on('skip-timer', () => {
    focusTimer.sessionComplete();
});

// Request notification permission
if (Notification.permission === 'default') {
    Notification.requestPermission();
}
