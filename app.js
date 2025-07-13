class PianoFlashCards {
    constructor() {
        this.score = 0;
        this.streak = 0;
        this.currentNote = null;
        this.currentNoteWithOctave = null;
        this.currentClef = null;
        
        // Note positions for treble and bass clef
        this.trebleNotes = {
            'C4': -20, 'C#4': -20, 'Db4': -20,  // Middle C (ledger line below staff)
            'D4': -10, 'D#4': -10, 'Eb4': -10,
            'E4': 0,    // Bottom line
            'F4': 10, 'F#4': 10, 'Gb4': 10,
            'G4': 20, 'G#4': 20, 'Ab4': 20,   // Second line
            'A4': 30, 'A#4': 30, 'Bb4': 30,
            'B4': 40,   // Middle line
            'C5': 50, 'C#5': 50, 'Db5': 50,
            'D5': 60, 'D#5': 60, 'Eb5': 60,   // Fourth line
            'E5': 70,
            'F5': 80, 'F#5': 80, 'Gb5': 80,   // Top line
            'G5': 90, 'G#5': 90, 'Ab5': 90,
            'A5': 100, 'A#5': 100, 'Bb5': 100,
            'B5': 110,
            'C6': 120   // High C (ledger line above staff)
        };
        
        this.bassNotes = {
            'E2': -20,  // Low E (ledger line below staff)
            'F2': -10, 'F#2': -10, 'Gb2': -10,
            'G2': 0, 'G#2': 0, 'Ab2': 0,    // Bottom line (G)
            'A2': 10, 'A#2': 10, 'Bb2': 10,   // Space
            'B2': 20,   // Second line (B)
            'C3': 30, 'C#3': 30, 'Db3': 30,   // Space
            'D3': 40, 'D#3': 40, 'Eb3': 40,   // Middle line (D)
            'E3': 50,   // Space
            'F3': 60, 'F#3': 60, 'Gb3': 60,   // Fourth line (F)
            'G3': 70, 'G#3': 70, 'Ab3': 70,   // Space
            'A3': 80, 'A#3': 80, 'Bb3': 80,   // Top line (A)
            'B3': 90,   // Space
            'C4': 100, 'C#4': 100, 'Db4': 100,  // Middle C (ledger line above staff)
            'D4': 110, 'D#4': 110, 'Eb4': 110,
            'E4': 120
        };
        
        this.setupEventListeners();
        this.createPianoKeyboard();
        this.generateNewNote();
        
        // Redraw keyboard on window resize
        window.addEventListener('resize', () => {
            document.getElementById('piano').innerHTML = '';
            this.createPianoKeyboard();
        });
    }
    
    setupEventListeners() {
        // Note button clicks
        document.querySelectorAll('.note-btn').forEach(btn => {
            btn.addEventListener('click', () => this.checkAnswer(btn.dataset.note));
        });
        
        // Keyboard support
        document.addEventListener('keypress', (e) => {
            const note = e.key.toUpperCase();
            if (['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(note)) {
                this.checkAnswer(note);
            }
        });
        
        // New note button
        document.getElementById('newNote').addEventListener('click', () => {
            this.generateNewNote();
        });
        
        // Show middle C checkbox
        document.getElementById('showMiddleC').addEventListener('change', () => {
            if (this.currentNoteWithOctave) {
                this.drawStaff(this.currentNoteWithOctave);
            }
        });
        
        // Show mnemonics checkbox
        document.getElementById('showMnemonics').addEventListener('change', () => {
            if (this.currentNoteWithOctave) {
                this.drawStaff(this.currentNoteWithOctave);
            }
        });
        
        // Include sharps/flats checkbox
        document.getElementById('includeSharpsFlats').addEventListener('change', () => {
            this.generateNewNote();
        });
    }
    
    createPianoKeyboard() {
        const piano = document.getElementById('piano');
        const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const blackKeys = { 'C': true, 'D': true, 'F': true, 'G': true, 'A': true };
        
        // Create white keys first
        notes.forEach((note, index) => {
            const whiteKey = document.createElement('div');
            whiteKey.className = 'piano-key white';
            whiteKey.dataset.note = note;
            
            const label = document.createElement('div');
            label.className = 'piano-key-label';
            label.textContent = note;
            whiteKey.appendChild(label);
            
            whiteKey.addEventListener('click', () => this.checkAnswer(note));
            piano.appendChild(whiteKey);
        });
        
        // Create black keys after all white keys
        const keyWidth = window.innerWidth <= 480 ? 30 : 40;
        notes.forEach((note, index) => {
            if (blackKeys[note] && index < notes.length - 1) {
                const blackKey = document.createElement('div');
                blackKey.className = 'piano-key black';
                blackKey.dataset.note = note + '#';
                blackKey.style.left = `${(index + 1) * keyWidth - keyWidth/2}px`;
                
                const blackLabel = document.createElement('div');
                blackLabel.className = 'piano-key-label';
                blackLabel.textContent = note + '#';
                blackKey.appendChild(blackLabel);
                
                // Make black keys clickable when sharps/flats are enabled
                blackKey.addEventListener('click', () => {
                    if (document.getElementById('includeSharpsFlats').checked) {
                        this.checkAnswer(note + '#');
                    }
                });
                
                piano.appendChild(blackKey);
            }
        });
    }
    
    generateNewNote() {
        const trebleEnabled = document.getElementById('trebleClef').checked;
        const bassEnabled = document.getElementById('bassClef').checked;
        
        if (!trebleEnabled && !bassEnabled) {
            alert('Please select at least one clef!');
            return;
        }
        
        // Clear feedback
        const feedback = document.getElementById('feedback');
        feedback.textContent = '';
        feedback.className = 'feedback';
        
        // Decide which clef to use
        if (trebleEnabled && bassEnabled) {
            this.currentClef = Math.random() < 0.5 ? 'treble' : 'bass';
        } else {
            this.currentClef = trebleEnabled ? 'treble' : 'bass';
        }
        
        // Pick a random note
        let notes = this.currentClef === 'treble' ? 
            Object.keys(this.trebleNotes) : 
            Object.keys(this.bassNotes);
        
        // Filter notes based on sharps/flats checkbox
        const includeSharpsFlats = document.getElementById('includeSharpsFlats').checked;
        if (!includeSharpsFlats) {
            // Only include natural notes (no # or b)
            notes = notes.filter(note => !note.includes('#') && !note.includes('b'));
        } else {
            // Remove duplicate enharmonic notes (keep only sharps)
            notes = notes.filter(note => !note.includes('b'));
        }
        
        const randomIndex = Math.floor(Math.random() * notes.length);
        const noteWithOctave = notes[randomIndex];
        
        // Extract note name (could be C, C#, etc.)
        const match = noteWithOctave.match(/^([A-G]#?)/);
        this.currentNote = match ? match[1] : noteWithOctave.charAt(0);
        this.currentNoteWithOctave = noteWithOctave; // Store the full note with octave
        
        // Draw the staff and note
        this.drawStaff(noteWithOctave);
    }
    
    drawStaff(noteWithOctave) {
        const svg = document.getElementById('staff');
        svg.innerHTML = '';
        
        // Staff lines
        for (let i = 0; i < 5; i++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            const y = 50 + (i * 20);
            line.setAttribute('x1', '50');
            line.setAttribute('y1', y);
            line.setAttribute('x2', '350');
            line.setAttribute('y2', y);
            line.setAttribute('stroke', '#333');
            line.setAttribute('stroke-width', '2');
            svg.appendChild(line);
        }
        
        // Show middle C reference if enabled
        if (document.getElementById('showMiddleC').checked) {
            const middleCY = this.currentClef === 'treble' ? 150 : 30;
            
            // Draw middle C note (grayed out)
            const refNote = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            refNote.setAttribute('cx', '300');
            refNote.setAttribute('cy', middleCY);
            refNote.setAttribute('rx', '12');
            refNote.setAttribute('ry', '9');
            refNote.setAttribute('fill', '#ccc');
            refNote.setAttribute('opacity', '0.5');
            refNote.setAttribute('transform', `rotate(-20 300 ${middleCY})`);
            svg.appendChild(refNote);
            
            // Draw ledger line for middle C
            const ledger = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            ledger.setAttribute('x1', '285');
            ledger.setAttribute('y1', middleCY);
            ledger.setAttribute('x2', '315');
            ledger.setAttribute('y2', middleCY);
            ledger.setAttribute('stroke', '#ccc');
            ledger.setAttribute('stroke-width', '2');
            ledger.setAttribute('opacity', '0.5');
            svg.appendChild(ledger);
            
            // Label
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', '300');
            label.setAttribute('y', middleCY - 20);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('font-size', '14');
            label.setAttribute('fill', '#999');
            label.textContent = 'C';
            svg.appendChild(label);
        }
        
        // Show mnemonics if enabled
        if (document.getElementById('showMnemonics').checked) {
            const mnemonicLines = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            const mnemonicSpaces = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            
            if (this.currentClef === 'treble') {
                // Treble clef mnemonics
                mnemonicLines.textContent = 'Lines: Every Good Boy Does Fine';
                mnemonicSpaces.textContent = 'Spaces: FACE';
            } else {
                // Bass clef mnemonics
                mnemonicLines.textContent = 'Lines: Good Boys Do Fine Always';
                mnemonicSpaces.textContent = 'Spaces: All Cows Eat Grass';
            }
            
            // Position above the staff
            mnemonicLines.setAttribute('x', '200');
            mnemonicLines.setAttribute('y', '25');
            mnemonicLines.setAttribute('text-anchor', 'middle');
            mnemonicLines.setAttribute('font-size', '12');
            mnemonicLines.setAttribute('fill', '#666');
            mnemonicLines.setAttribute('font-family', 'sans-serif');
            
            mnemonicSpaces.setAttribute('x', '200');
            mnemonicSpaces.setAttribute('y', '10');
            mnemonicSpaces.setAttribute('text-anchor', 'middle');
            mnemonicSpaces.setAttribute('font-size', '12');
            mnemonicSpaces.setAttribute('fill', '#666');
            mnemonicSpaces.setAttribute('font-family', 'sans-serif');
            
            svg.appendChild(mnemonicLines);
            svg.appendChild(mnemonicSpaces);
        }
        
        // Draw clef - responsive sizing
        const isMobile = window.innerWidth <= 480;
        const clefText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        
        if (this.currentClef === 'treble') {
            clefText.setAttribute('x', isMobile ? '55' : '40');
            clefText.setAttribute('y', isMobile ? '115' : '145');
            clefText.setAttribute('font-size', isMobile ? '90' : '150');
        } else {
            clefText.setAttribute('x', isMobile ? '70' : '60');
            clefText.setAttribute('y', isMobile ? '100' : '110');
            clefText.setAttribute('font-size', isMobile ? '70' : '100');
        }
        
        clefText.setAttribute('font-family', 'serif');
        clefText.textContent = this.currentClef === 'treble' ? '𝄞' : '𝄢';
        svg.appendChild(clefText);
        
        // Get note position
        const notePositions = this.currentClef === 'treble' ? this.trebleNotes : this.bassNotes;
        const yPosition = 130 - notePositions[noteWithOctave];
        
        // Draw ledger lines if needed
        if (yPosition < 50) {
            for (let y = 30; y < 50; y += 20) {
                const ledger = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                ledger.setAttribute('x1', '185');
                ledger.setAttribute('y1', y);
                ledger.setAttribute('x2', '215');
                ledger.setAttribute('y2', y);
                ledger.setAttribute('stroke', '#333');
                ledger.setAttribute('stroke-width', '2');
                svg.appendChild(ledger);
            }
        } else if (yPosition > 130) {
            for (let y = 150; y <= yPosition + 10; y += 20) {
                const ledger = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                ledger.setAttribute('x1', '185');
                ledger.setAttribute('y1', y);
                ledger.setAttribute('x2', '215');
                ledger.setAttribute('y2', y);
                ledger.setAttribute('stroke', '#333');
                ledger.setAttribute('stroke-width', '2');
                svg.appendChild(ledger);
            }
        }
        
        // Draw sharp symbol if needed
        if (noteWithOctave.includes('#')) {
            const sharp = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            sharp.setAttribute('x', '175');
            sharp.setAttribute('y', yPosition + 5);
            sharp.setAttribute('font-size', '24');
            sharp.setAttribute('font-family', 'serif');
            sharp.setAttribute('fill', '#333');
            sharp.textContent = '♯';
            svg.appendChild(sharp);
        }
        
        // Draw note
        const note = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        note.setAttribute('cx', '200');
        note.setAttribute('cy', yPosition);
        note.setAttribute('rx', '12');
        note.setAttribute('ry', '9');
        note.setAttribute('fill', '#333');
        note.setAttribute('transform', `rotate(-20 200 ${yPosition})`);
        svg.appendChild(note);
        
        // Draw stem
        const stem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        const stemUp = yPosition > 90;
        stem.setAttribute('x1', stemUp ? '212' : '188');
        stem.setAttribute('y1', yPosition);
        stem.setAttribute('x2', stemUp ? '212' : '188');
        stem.setAttribute('y2', stemUp ? yPosition - 60 : yPosition + 60);
        stem.setAttribute('stroke', '#333');
        stem.setAttribute('stroke-width', '3');
        svg.appendChild(stem);
    }
    
    playNote(note) {
        // Create a simple audio context to play the note
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Note frequencies (A4 = 440Hz)
        const frequencies = {
            'C': 261.63,
            'C#': 277.18,
            'D': 293.66,
            'D#': 311.13,
            'E': 329.63,
            'F': 349.23,
            'F#': 369.99,
            'G': 392.00,
            'G#': 415.30,
            'A': 440.00,
            'A#': 466.16,
            'B': 493.88
        };
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequencies[note];
        oscillator.type = 'sine';
        
        gainNode.gain.value = 0.3;
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
    
    checkAnswer(note) {
        const feedback = document.getElementById('feedback');
        
        if (note === this.currentNote) {
            feedback.textContent = `Correct! That was ${this.currentNote} 🎉`;
            feedback.className = 'feedback correct';
            this.score++;
            this.streak++;
            
            // Highlight the correct key
            this.highlightPianoKey(this.currentNote);
            
            // Play the correct note
            this.playNote(this.currentNote);
            
            // Auto-generate new note after 1 second
            setTimeout(() => this.generateNewNote(), 1000);
        } else {
            feedback.textContent = `Incorrect. The note was ${this.currentNote}`;
            feedback.className = 'feedback incorrect';
            this.streak = 0;
            
            // Highlight the correct key
            this.highlightPianoKey(this.currentNote);
            
            // Generate new note after 2 seconds
            setTimeout(() => this.generateNewNote(), 2000);
        }
        
        // Update score display
        document.getElementById('score').textContent = this.score;
        document.getElementById('streak').textContent = this.streak;
    }
    
    highlightPianoKey(note) {
        // Remove any existing highlights
        document.querySelectorAll('.piano-key').forEach(key => {
            key.classList.remove('highlight');
        });
        
        // Find and highlight the correct key
        const pianoKey = document.querySelector(`.piano-key[data-note="${note}"]`);
        if (pianoKey) {
            pianoKey.classList.add('highlight');
            // Remove highlight after animation
            setTimeout(() => {
                pianoKey.classList.remove('highlight');
            }, 500);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PianoFlashCards();
});