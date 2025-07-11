class PianoFlashCards {
    constructor() {
        this.score = 0;
        this.streak = 0;
        this.currentNote = null;
        this.currentClef = null;
        
        // Note positions for treble and bass clef
        this.trebleNotes = {
            'C4': 0,   // Middle C (ledger line below staff)
            'D4': 7,
            'E4': 14,
            'F4': 21,
            'G4': 28,
            'A4': 35,
            'B4': 42,
            'C5': 49,
            'D5': 56,
            'E5': 63,
            'F5': 70,
            'G5': 77,
            'A5': 84,
            'B5': 91,
            'C6': 98   // High C (ledger line above staff)
        };
        
        this.bassNotes = {
            'A2': 98,  // Low A (ledger line below staff)
            'B2': 91,
            'C3': 84,
            'D3': 77,
            'E3': 70,
            'F3': 63,
            'G3': 56,
            'A3': 49,
            'B3': 42,
            'C4': 35,  // Middle C (ledger line above staff)
            'D4': 28,
            'E4': 21,
            'F4': 14,
            'G4': 7,
            'A4': 0
        };
        
        this.setupEventListeners();
        this.generateNewNote();
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
            this.drawStaff(this.currentNote + (this.currentClef === 'treble' ? 
                Object.keys(this.trebleNotes).find(k => k.startsWith(this.currentNote)) :
                Object.keys(this.bassNotes).find(k => k.startsWith(this.currentNote))).slice(1));
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
        const notes = this.currentClef === 'treble' ? 
            Object.keys(this.trebleNotes) : 
            Object.keys(this.bassNotes);
        
        const randomIndex = Math.floor(Math.random() * notes.length);
        const noteWithOctave = notes[randomIndex];
        this.currentNote = noteWithOctave.charAt(0); // Extract just the note letter
        
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
        
        // Draw clef
        const clefText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        clefText.setAttribute('x', this.currentClef === 'treble' ? '40' : '60');
        clefText.setAttribute('y', this.currentClef === 'treble' ? '145' : '110');
        clefText.setAttribute('font-size', this.currentClef === 'treble' ? '150' : '100');
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
            'D': 293.66,
            'E': 329.63,
            'F': 349.23,
            'G': 392.00,
            'A': 440.00,
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
            
            // Play the correct note
            this.playNote(this.currentNote);
            
            // Auto-generate new note after 1 second
            setTimeout(() => this.generateNewNote(), 1000);
        } else {
            feedback.textContent = `Incorrect. The note was ${this.currentNote}`;
            feedback.className = 'feedback incorrect';
            this.streak = 0;
            
            // Generate new note after 2 seconds
            setTimeout(() => this.generateNewNote(), 2000);
        }
        
        // Update score display
        document.getElementById('score').textContent = this.score;
        document.getElementById('streak').textContent = this.streak;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PianoFlashCards();
});