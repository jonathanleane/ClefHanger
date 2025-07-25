class PianoFlashCards {
    constructor() {
        this.score = 0;
        this.streak = 0;
        this.currentNote = null;
        this.currentNoteWithOctave = null;
        this.currentClef = null;
        this.mode = 'staffToPiano'; // or 'pianoToStaff' or 'duration' or 'placeDuration'
        this.waitingForStaffClick = false;
        this.currentDuration = null;
        this.targetDurationType = null;
        this.targetNoteName = null;
        this.selectedDurationType = null;
        this.midiAccess = null;
        this.selectedMidiInput = null;
        
        // Note durations
        this.durations = {
            'whole': { beats: 4, name: 'Whole Note', britishName: 'Semibreve', stem: false, filled: false, flags: 0 },
            'half': { beats: 2, name: 'Half Note', britishName: 'Minim', stem: true, filled: false, flags: 0 },
            'quarter': { beats: 1, name: 'Quarter Note', britishName: 'Crotchet', stem: true, filled: true, flags: 0 },
            'eighth': { beats: 0.5, name: 'Eighth Note', britishName: 'Quaver', stem: true, filled: true, flags: 1 },
            'sixteenth': { beats: 0.25, name: 'Sixteenth Note', britishName: 'Semiquaver', stem: true, filled: true, flags: 2 }
        };
        
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
        this.initializeMIDI();
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
        document.getElementById('includeSharpsFlats').addEventListener('change', (e) => {
            // Show/hide sharp buttons
            const sharpButtons = document.getElementById('sharpButtons');
            if (e.target.checked) {
                sharpButtons.classList.add('visible');
            } else {
                sharpButtons.classList.remove('visible');
            }
            this.generateNewNote();
        });
        
        // Mode toggle buttons
        document.getElementById('modeStaffToPiano').addEventListener('click', () => {
            this.setMode('staffToPiano');
        });
        
        document.getElementById('modePianoToStaff').addEventListener('click', () => {
            this.setMode('pianoToStaff');
        });
        
        document.getElementById('modeDuration').addEventListener('click', () => {
            this.setMode('duration');
        });
        
        document.getElementById('modePlaceDuration').addEventListener('click', () => {
            this.setMode('placeDuration');
        });
        
        // Staff click handler for reverse mode and place duration mode
        document.getElementById('staff').addEventListener('click', (e) => {
            if (this.mode === 'pianoToStaff' && this.waitingForStaffClick) {
                this.handleStaffClick(e);
            } else if (this.mode === 'placeDuration' && this.waitingForStaffClick) {
                this.handlePlaceDurationClick(e);
            }
        });
        
        // Staff hover handler for reverse mode
        document.getElementById('staff').addEventListener('mousemove', (e) => {
            if ((this.mode === 'pianoToStaff' || this.mode === 'placeDuration') && this.waitingForStaffClick) {
                this.handleStaffHover(e);
            }
        });
        
        document.getElementById('staff').addEventListener('mouseleave', () => {
            if (this.mode === 'pianoToStaff' || this.mode === 'placeDuration') {
                this.clearHoverNote();
            }
        });
        
        // Show/hide key labels checkbox
        document.getElementById('showKeyLabels').addEventListener('change', (e) => {
            const labels = document.querySelectorAll('.piano-key-label');
            labels.forEach(label => {
                label.style.display = e.target.checked ? 'block' : 'none';
            });
        });
        
        // Show/hide duration labels checkbox
        document.getElementById('showDurationLabels').addEventListener('change', (e) => {
            const labels = document.querySelectorAll('.duration-label');
            labels.forEach(label => {
                label.style.display = e.target.checked ? 'block' : 'none';
            });
        });
        
        // Duration button clicks
        document.querySelectorAll('.duration-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.mode === 'duration') {
                    this.checkDurationAnswer(parseFloat(btn.dataset.beats));
                } else if (this.mode === 'placeDuration' && this.waitingForStaffClick) {
                    // Store selected duration type based on beats
                    const beats = parseFloat(btn.dataset.beats);
                    for (const [type, duration] of Object.entries(this.durations)) {
                        if (duration.beats === beats) {
                            this.selectedDurationType = type;
                            break;
                        }
                    }
                    // Update feedback
                    const feedback = document.getElementById('feedback');
                    feedback.textContent = `Selected ${this.durations[this.selectedDurationType].britishName}. Now click on the staff to place it.`;
                    feedback.className = 'feedback';
                }
            });
        });
    }
    
    setMode(mode) {
        this.mode = mode;
        this.waitingForStaffClick = false;
        
        // Update button states
        document.getElementById('modeStaffToPiano').classList.toggle('active', mode === 'staffToPiano');
        document.getElementById('modePianoToStaff').classList.toggle('active', mode === 'pianoToStaff');
        document.getElementById('modeDuration').classList.toggle('active', mode === 'duration');
        document.getElementById('modePlaceDuration').classList.toggle('active', mode === 'placeDuration');
        
        // Update UI visibility
        const noteButtons = document.querySelectorAll('.note-buttons');
        const durationButtons = document.getElementById('durationButtons');
        const piano = document.getElementById('piano');
        const instruction = document.getElementById('placeDurationInstruction');
        
        noteButtons.forEach(btn => btn.style.display = mode === 'staffToPiano' ? 'grid' : 'none');
        durationButtons.classList.toggle('visible', mode === 'duration' || mode === 'placeDuration');
        piano.style.display = (mode === 'duration' || mode === 'placeDuration') ? 'none' : 'inline-block';
        instruction.classList.toggle('visible', mode === 'placeDuration');
        
        // Update staff cursor
        document.getElementById('staff').style.cursor = (mode === 'pianoToStaff' || mode === 'placeDuration') ? 'crosshair' : 'default';
        
        // Hide certain settings in duration modes
        const settingsToHide = ['trebleClef', 'bassClef', 'includeSharpsFlats', 'showMiddleC', 'showMnemonics', 'showKeyLabels'];
        settingsToHide.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.parentElement.style.display = (mode === 'duration' || mode === 'placeDuration') ? 'none' : 'inline-block';
            }
        });
        
        // Show duration labels checkbox only in duration modes
        const durationLabelsCheckbox = document.getElementById('showDurationLabels');
        if (durationLabelsCheckbox) {
            durationLabelsCheckbox.parentElement.style.display = (mode === 'duration' || mode === 'placeDuration') ? 'inline-block' : 'none';
        }
        
        // Start new round
        this.generateNewNote();
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
        
        // Clear previous highlights
        document.querySelectorAll('.piano-key').forEach(key => {
            key.classList.remove('highlight', 'target-key');
        });
        
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
        
        if (this.mode === 'staffToPiano') {
            // Draw the note on staff
            this.drawStaff(noteWithOctave);
        } else if (this.mode === 'pianoToStaff') {
            // Piano to Staff mode - highlight the piano key
            this.drawEmptyStaff();
            this.highlightTargetPianoKey(this.currentNote);
            this.waitingForStaffClick = true;
            
            // Update feedback
            feedback.textContent = 'Click on the staff where this note belongs';
            feedback.className = 'feedback';
        } else if (this.mode === 'duration') {
            // Duration mode - pick a random duration and draw it
            const durationTypes = Object.keys(this.durations);
            const randomDuration = durationTypes[Math.floor(Math.random() * durationTypes.length)];
            this.currentDuration = this.durations[randomDuration];
            this.currentDurationType = randomDuration;
            
            // Draw the duration note
            this.drawDurationNote(randomDuration);
            
            // Update feedback
            feedback.textContent = 'How many beats does this note get?';
            feedback.className = 'feedback';
        } else if (this.mode === 'placeDuration') {
            // Place Duration mode - pick a random duration and note
            const durationTypes = Object.keys(this.durations);
            const randomDuration = durationTypes[Math.floor(Math.random() * durationTypes.length)];
            this.targetDurationType = randomDuration;
            this.currentDuration = this.durations[randomDuration];
            
            // Pick a simple note (C, D, E, F, G, A, B)
            const simpleNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
            this.targetNoteName = simpleNotes[Math.floor(Math.random() * simpleNotes.length)];
            
            // Display instruction
            const instruction = document.getElementById('placeDurationInstruction');
            instruction.textContent = `Place a ${this.currentDuration.britishName} on ${this.targetNoteName}`;
            
            // Draw empty staff
            this.drawEmptyStaff();
            this.waitingForStaffClick = true;
            
            // Update feedback
            feedback.textContent = 'Click on the staff to place the note';
            feedback.className = 'feedback';
        }
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
    
    drawEmptyStaff() {
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
        
        // Draw clef
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
    }
    
    highlightTargetPianoKey(note) {
        const pianoKey = document.querySelector(`.piano-key[data-note="${note}"]`);
        if (pianoKey) {
            pianoKey.classList.add('target-key');
        }
    }
    
    handleStaffClick(e) {
        const svg = document.getElementById('staff');
        const rect = svg.getBoundingClientRect();
        const y = e.clientY - rect.top;
        
        // Convert click position to note position
        const staffY = (y / rect.height) * 200; // Convert to SVG coordinates
        const clickedPosition = 130 - staffY;
        
        // Find closest note position
        const notePositions = this.currentClef === 'treble' ? this.trebleNotes : this.bassNotes;
        let closestNote = null;
        let closestDistance = Infinity;
        
        for (const [note, pos] of Object.entries(notePositions)) {
            const distance = Math.abs(pos - clickedPosition);
            if (distance < closestDistance && distance < 10) { // 10px tolerance
                closestDistance = distance;
                closestNote = note;
            }
        }
        
        if (closestNote) {
            // Get the position value for the clicked location
            const clickedPosition = notePositions[closestNote];
            
            // For sharp notes, we need to check if any note at this position matches
            let isCorrect = false;
            
            // Check all notes at this position
            for (const [note, pos] of Object.entries(notePositions)) {
                if (pos === clickedPosition) {
                    const noteName = note.match(/^([A-G]#?)/)[1];
                    if (noteName === this.currentNote) {
                        isCorrect = true;
                        break;
                    }
                }
            }
            
            // Draw the note where clicked
            const noteY = 130 - notePositions[closestNote];
            this.drawNoteAt(noteY, isCorrect, this.currentNote.includes('#'));
            
            // Handle scoring
            const feedback = document.getElementById('feedback');
            if (isCorrect) {
                feedback.textContent = `Correct! That was ${this.currentNote} 🎉`;
                feedback.className = 'feedback correct';
                this.score++;
                this.streak++;
                this.playNote(this.currentNote);
                
                // Next note after delay
                this.waitingForStaffClick = false;
                setTimeout(() => this.generateNewNote(), 1500);
            } else {
                feedback.textContent = `Incorrect. The note ${this.currentNote} goes elsewhere`;
                feedback.className = 'feedback incorrect';
                this.streak = 0;
                
                // Show correct position briefly
                setTimeout(() => {
                    this.drawStaff(this.currentNoteWithOctave);
                    this.waitingForStaffClick = false;
                    setTimeout(() => this.generateNewNote(), 2000);
                }, 1000);
            }
            
            // Update score display
            document.getElementById('score').textContent = this.score;
            document.getElementById('streak').textContent = this.streak;
        }
    }
    
    handlePlaceDurationClick(e) {
        if (!this.selectedDurationType) {
            const feedback = document.getElementById('feedback');
            feedback.textContent = 'Please select a duration first!';
            feedback.className = 'feedback incorrect';
            return;
        }
        
        const svg = document.getElementById('staff');
        const rect = svg.getBoundingClientRect();
        const y = e.clientY - rect.top;
        
        // Convert click position to note position
        const staffY = (y / rect.height) * 200; // Convert to SVG coordinates
        const clickedPosition = 130 - staffY;
        
        // Find closest note position using the current clef
        const notePositions = this.currentClef === 'treble' ? this.trebleNotes : this.bassNotes;
        let closestNote = null;
        let closestDistance = Infinity;
        
        for (const [note, pos] of Object.entries(notePositions)) {
            const distance = Math.abs(pos - clickedPosition);
            if (distance < closestDistance && distance < 10) { // 10px tolerance
                closestDistance = distance;
                closestNote = note;
            }
        }
        
        if (closestNote) {
            // Extract the note name without octave
            const clickedNoteName = closestNote.match(/^([A-G])/)[1];
            const isCorrectNote = clickedNoteName === this.targetNoteName;
            const isCorrectDuration = this.selectedDurationType === this.targetDurationType;
            const isCorrect = isCorrectNote && isCorrectDuration;
            
            // Draw the selected duration at the clicked position
            const noteY = 130 - notePositions[closestNote];
            this.drawPlacedDurationNote(noteY, this.selectedDurationType, isCorrect);
            
            // Handle scoring
            const feedback = document.getElementById('feedback');
            if (isCorrect) {
                feedback.textContent = `Perfect! You placed a ${this.currentDuration.britishName} on ${this.targetNoteName} 🎉`;
                feedback.className = 'feedback correct';
                this.score++;
                this.streak++;
                this.playNote(this.targetNoteName);
                
                // Next note after delay
                this.waitingForStaffClick = false;
                setTimeout(() => this.generateNewNote(), 1500);
            } else {
                let errorMsg = '';
                if (!isCorrectNote && !isCorrectDuration) {
                    errorMsg = `Wrong note and duration! You placed a ${this.durations[this.selectedDurationType].britishName} on ${clickedNoteName}`;
                } else if (!isCorrectNote) {
                    errorMsg = `Wrong note! You placed it on ${clickedNoteName} instead of ${this.targetNoteName}`;
                } else {
                    errorMsg = `Wrong duration! You placed a ${this.durations[this.selectedDurationType].britishName} instead of ${this.currentDuration.britishName}`;
                }
                feedback.textContent = errorMsg;
                feedback.className = 'feedback incorrect';
                this.streak = 0;
                
                // Show correct answer
                setTimeout(() => {
                    this.drawCorrectPlaceDuration();
                    this.waitingForStaffClick = false;
                    setTimeout(() => this.generateNewNote(), 2500);
                }, 1500);
            }
            
            // Update score display
            document.getElementById('score').textContent = this.score;
            document.getElementById('streak').textContent = this.streak;
            
            // Reset selected duration
            this.selectedDurationType = null;
        }
    }
    
    handleStaffHover(e) {
        const svg = document.getElementById('staff');
        const rect = svg.getBoundingClientRect();
        const y = e.clientY - rect.top;
        
        // Convert to SVG coordinates and snap to nearest line/space
        const staffY = (y / rect.height) * 200;
        const snapY = Math.round((staffY - 50) / 10) * 10 + 50; // Snap to 10px grid
        
        // Clear previous hover
        this.clearHoverNote();
        
        // Draw hover note and ledger lines if needed
        this.drawHoverNote(snapY);
    }
    
    clearHoverNote() {
        const svg = document.getElementById('staff');
        // Remove all hover elements
        svg.querySelectorAll('.hover-element').forEach(el => el.remove());
    }
    
    drawHoverNote(yPosition) {
        const svg = document.getElementById('staff');
        
        // Draw ledger lines if needed
        if (yPosition < 50) {
            // Above staff
            for (let y = 30; y <= yPosition; y += 20) {
                if (y < 50) {
                    const ledger = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    ledger.setAttribute('x1', '185');
                    ledger.setAttribute('y1', y);
                    ledger.setAttribute('x2', '215');
                    ledger.setAttribute('y2', y);
                    ledger.setAttribute('stroke', '#999');
                    ledger.setAttribute('stroke-width', '2');
                    ledger.setAttribute('opacity', '0.5');
                    ledger.classList.add('hover-element');
                    svg.appendChild(ledger);
                }
            }
        } else if (yPosition > 130) {
            // Below staff
            for (let y = 150; y >= yPosition; y -= 20) {
                if (y > 130) {
                    const ledger = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    ledger.setAttribute('x1', '185');
                    ledger.setAttribute('y1', y);
                    ledger.setAttribute('x2', '215');
                    ledger.setAttribute('y2', y);
                    ledger.setAttribute('stroke', '#999');
                    ledger.setAttribute('stroke-width', '2');
                    ledger.setAttribute('opacity', '0.5');
                    ledger.classList.add('hover-element');
                    svg.appendChild(ledger);
                }
            }
        }
        
        // Draw hover note
        const note = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        note.setAttribute('cx', '200');
        note.setAttribute('cy', yPosition);
        note.setAttribute('rx', '12');
        note.setAttribute('ry', '9');
        note.setAttribute('fill', '#999');
        note.setAttribute('opacity', '0.5');
        note.setAttribute('transform', `rotate(-20 200 ${yPosition})`);
        note.classList.add('hover-element');
        svg.appendChild(note);
    }
    
    drawDurationNote(durationType) {
        const svg = document.getElementById('staff');
        svg.innerHTML = '';
        
        // Draw staff lines
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
        
        // Draw treble clef (duration practice uses treble clef)
        const isMobile = window.innerWidth <= 480;
        const clefText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        clefText.setAttribute('x', isMobile ? '55' : '40');
        clefText.setAttribute('y', isMobile ? '115' : '145');
        clefText.setAttribute('font-size', isMobile ? '90' : '150');
        clefText.setAttribute('font-family', 'serif');
        clefText.textContent = '𝄞';
        svg.appendChild(clefText);
        
        // Draw time signature (4/4)
        const time4 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        time4.setAttribute('x', '120');
        time4.setAttribute('y', '80');
        time4.setAttribute('font-size', '28');
        time4.setAttribute('font-weight', 'bold');
        time4.textContent = '4';
        svg.appendChild(time4);
        
        const time4b = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        time4b.setAttribute('x', '120');
        time4b.setAttribute('y', '120');
        time4b.setAttribute('font-size', '28');
        time4b.setAttribute('font-weight', 'bold');
        time4b.textContent = '4';
        svg.appendChild(time4b);
        
        // Draw the note at middle position
        const noteX = 200;
        const noteY = 90; // Middle line
        const duration = this.durations[durationType];
        
        // Draw note head
        const note = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        note.setAttribute('cx', noteX);
        note.setAttribute('cy', noteY);
        note.setAttribute('rx', durationType === 'whole' ? '14' : '12');
        note.setAttribute('ry', '9');
        note.setAttribute('fill', duration.filled ? '#333' : 'none');
        note.setAttribute('stroke', '#333');
        note.setAttribute('stroke-width', duration.filled ? '0' : '3');
        note.setAttribute('transform', `rotate(-20 ${noteX} ${noteY})`);
        svg.appendChild(note);
        
        // Draw stem if needed
        if (duration.stem) {
            const stem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            stem.setAttribute('x1', noteX + 12);
            stem.setAttribute('y1', noteY);
            stem.setAttribute('x2', noteX + 12);
            stem.setAttribute('y2', noteY - 60);
            stem.setAttribute('stroke', '#333');
            stem.setAttribute('stroke-width', '3');
            svg.appendChild(stem);
            
            // Draw flags for eighth and sixteenth notes
            if (duration.flags > 0) {
                for (let i = 0; i < duration.flags; i++) {
                    const flag = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    const flagY = noteY - 60 + (i * 15);
                    flag.setAttribute('d', `M ${noteX + 12} ${flagY} C ${noteX + 12} ${flagY + 20}, ${noteX + 25} ${flagY + 25}, ${noteX + 25} ${flagY + 35}`);
                    flag.setAttribute('stroke', '#333');
                    flag.setAttribute('stroke-width', '3');
                    flag.setAttribute('fill', 'none');
                    svg.appendChild(flag);
                }
            }
        }
    }
    
    checkDurationAnswer(beats) {
        const feedback = document.getElementById('feedback');
        const isCorrect = beats === this.currentDuration.beats;
        
        if (isCorrect) {
            feedback.textContent = `Correct! ${this.currentDuration.britishName} (${this.currentDuration.name}) = ${beats} beat${beats !== 1 ? 's' : ''} 🎉`;
            feedback.className = 'feedback correct';
            this.score++;
            this.streak++;
            
            // Next note after delay
            setTimeout(() => this.generateNewNote(), 1500);
        } else {
            feedback.textContent = `Incorrect. ${this.currentDuration.britishName} (${this.currentDuration.name}) = ${this.currentDuration.beats} beat${this.currentDuration.beats !== 1 ? 's' : ''}`;
            feedback.className = 'feedback incorrect';
            this.streak = 0;
            
            // Next note after delay
            setTimeout(() => this.generateNewNote(), 2500);
        }
        
        // Update score display
        document.getElementById('score').textContent = this.score;
        document.getElementById('streak').textContent = this.streak;
    }
    
    drawNoteAt(yPosition, isCorrect, isSharp = false) {
        const svg = document.getElementById('staff');
        
        // Draw sharp symbol if needed
        if (isSharp) {
            const sharp = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            sharp.setAttribute('x', '175');
            sharp.setAttribute('y', yPosition + 5);
            sharp.setAttribute('font-size', '24');
            sharp.setAttribute('font-family', 'serif');
            sharp.setAttribute('fill', isCorrect ? '#27ae60' : '#e74c3c');
            sharp.textContent = '♯';
            svg.appendChild(sharp);
        }
        
        // Draw note
        const note = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        note.setAttribute('cx', '200');
        note.setAttribute('cy', yPosition);
        note.setAttribute('rx', '12');
        note.setAttribute('ry', '9');
        note.setAttribute('fill', isCorrect ? '#27ae60' : '#e74c3c');
        note.setAttribute('transform', `rotate(-20 200 ${yPosition})`);
        svg.appendChild(note);
        
        // Draw stem
        const stem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        const stemUp = yPosition > 90;
        stem.setAttribute('x1', stemUp ? '212' : '188');
        stem.setAttribute('y1', yPosition);
        stem.setAttribute('x2', stemUp ? '212' : '188');
        stem.setAttribute('y2', stemUp ? yPosition - 60 : yPosition + 60);
        stem.setAttribute('stroke', isCorrect ? '#27ae60' : '#e74c3c');
        stem.setAttribute('stroke-width', '3');
        svg.appendChild(stem);
    }
    
    drawPlacedDurationNote(yPosition, durationType, isCorrect) {
        const svg = document.getElementById('staff');
        const noteX = 200;
        const duration = this.durations[durationType];
        const color = isCorrect ? '#27ae60' : '#e74c3c';
        
        // Draw note head
        const note = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        note.setAttribute('cx', noteX);
        note.setAttribute('cy', yPosition);
        note.setAttribute('rx', durationType === 'whole' ? '14' : '12');
        note.setAttribute('ry', '9');
        note.setAttribute('fill', duration.filled ? color : 'none');
        note.setAttribute('stroke', color);
        note.setAttribute('stroke-width', duration.filled ? '0' : '3');
        note.setAttribute('transform', `rotate(-20 ${noteX} ${yPosition})`);
        svg.appendChild(note);
        
        // Draw stem if needed
        if (duration.stem) {
            const stemUp = yPosition > 90;
            const stem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            stem.setAttribute('x1', stemUp ? noteX + 12 : noteX - 12);
            stem.setAttribute('y1', yPosition);
            stem.setAttribute('x2', stemUp ? noteX + 12 : noteX - 12);
            stem.setAttribute('y2', stemUp ? yPosition - 60 : yPosition + 60);
            stem.setAttribute('stroke', color);
            stem.setAttribute('stroke-width', '3');
            svg.appendChild(stem);
            
            // Draw flags for eighth and sixteenth notes
            if (duration.flags > 0) {
                for (let i = 0; i < duration.flags; i++) {
                    const flag = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    const flagX = stemUp ? noteX + 12 : noteX - 12;
                    const flagY = stemUp ? yPosition - 60 + (i * 15) : yPosition + 60 - (i * 15);
                    const flagDir = stemUp ? 1 : -1;
                    flag.setAttribute('d', `M ${flagX} ${flagY} C ${flagX} ${flagY + 20*flagDir}, ${flagX + 13*flagDir} ${flagY + 25*flagDir}, ${flagX + 13*flagDir} ${flagY + 35*flagDir}`);
                    flag.setAttribute('stroke', color);
                    flag.setAttribute('stroke-width', '3');
                    flag.setAttribute('fill', 'none');
                    svg.appendChild(flag);
                }
            }
        }
    }
    
    drawCorrectPlaceDuration() {
        // Find the position for the target note
        // Use appropriate octave for each clef
        const octave = this.currentClef === 'treble' ? '4' : '3';
        const targetNoteWithOctave = this.targetNoteName + octave;
        const notePositions = this.currentClef === 'treble' ? this.trebleNotes : this.bassNotes;
        const notePosition = notePositions[targetNoteWithOctave];
        const noteY = 130 - notePosition;
        
        // Clear and redraw staff
        this.drawEmptyStaff();
        
        // Draw the correct answer in green
        this.drawPlacedDurationNote(noteY, this.targetDurationType, true);
        
        // Add label
        const svg = document.getElementById('staff');
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', '200');
        label.setAttribute('y', '180');
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '16');
        label.setAttribute('fill', '#27ae60');
        label.textContent = `Correct answer: ${this.currentDuration.britishName} on ${this.targetNoteName}`;
        svg.appendChild(label);
    }
    
    // MIDI Support Methods
    async initializeMIDI() {
        try {
            // Check if Web MIDI API is available
            if (!navigator.requestMIDIAccess) {
                console.log('Web MIDI API not supported in this browser');
                return;
            }
            
            // Request MIDI access
            this.midiAccess = await navigator.requestMIDIAccess();
            console.log('MIDI Access granted');
            
            // Set up MIDI input handlers
            this.midiAccess.inputs.forEach(input => {
                console.log(`MIDI Input detected: ${input.name}`);
            });
            
            // Auto-select first MIDI input if available
            if (this.midiAccess.inputs.size > 0) {
                const firstInput = this.midiAccess.inputs.values().next().value;
                this.selectMIDIInput(firstInput);
            }
            
            // Listen for new MIDI devices
            this.midiAccess.onstatechange = (e) => {
                console.log(`MIDI device ${e.port.name} ${e.port.state}`);
                this.updateMIDIDeviceUI();
            };
            
            // Create MIDI device UI
            this.createMIDIDeviceUI();
            
        } catch (error) {
            console.error('Failed to get MIDI access:', error);
        }
    }
    
    selectMIDIInput(input) {
        // Remove handler from previous input
        if (this.selectedMidiInput) {
            this.selectedMidiInput.onmidimessage = null;
        }
        
        // Set new input
        this.selectedMidiInput = input;
        this.selectedMidiInput.onmidimessage = (message) => this.handleMIDIMessage(message);
        console.log(`Selected MIDI input: ${input.name}`);
        
        // Update UI
        this.updateMIDIDeviceUI();
        
        // Update indicator
        const indicator = document.getElementById('midiIndicator');
        if (indicator) {
            indicator.textContent = `MIDI: ${input.name}`;
            indicator.classList.add('active');
            indicator.style.display = 'flex';
        }
    }
    
    handleMIDIMessage(message) {
        const [status, note, velocity] = message.data;
        
        // Note on message (144 = note on, channel 1)
        if (status >= 144 && status <= 159 && velocity > 0) {
            this.handleMIDINoteOn(note, velocity);
        }
        // Note off message (128 = note off, channel 1) or note on with velocity 0
        else if ((status >= 128 && status <= 143) || (status >= 144 && status <= 159 && velocity === 0)) {
            this.handleMIDINoteOff(note);
        }
    }
    
    handleMIDINoteOn(midiNote, velocity) {
        // Convert MIDI note number to note name
        const noteName = this.midiNoteToNoteName(midiNote);
        console.log(`MIDI Note On: ${midiNote} (${noteName}) velocity: ${velocity}`);
        
        // Visual feedback on piano
        const pianoKey = document.querySelector(`.piano-key[data-note="${noteName}"]`);
        if (pianoKey) {
            pianoKey.classList.add('active');
        }
        
        // Check answer in Staff → Piano mode
        if (this.mode === 'staffToPiano') {
            this.checkAnswer(noteName);
        }
    }
    
    handleMIDINoteOff(midiNote) {
        const noteName = this.midiNoteToNoteName(midiNote);
        console.log(`MIDI Note Off: ${midiNote} (${noteName})`);
        
        // Remove visual feedback
        const pianoKey = document.querySelector(`.piano-key[data-note="${noteName}"]`);
        if (pianoKey) {
            pianoKey.classList.remove('active');
        }
    }
    
    midiNoteToNoteName(midiNote) {
        // MIDI note 60 = Middle C (C4)
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiNote / 12) - 1;
        const noteIndex = midiNote % 12;
        const noteName = noteNames[noteIndex];
        
        // For this app, we only need the note name without octave for checking answers
        return noteName;
    }
    
    createMIDIDeviceUI() {
        // Add MIDI connection indicator
        const container = document.querySelector('.container');
        const indicator = document.createElement('div');
        indicator.className = 'midi-indicator';
        indicator.id = 'midiIndicator';
        indicator.textContent = 'MIDI Disconnected';
        indicator.style.display = 'none';
        container.appendChild(indicator);
        
        // Add MIDI device selector to settings
        const settings = document.querySelector('.settings');
        
        const midiContainer = document.createElement('div');
        midiContainer.className = 'midi-settings';
        midiContainer.innerHTML = `
            <label for="midiDevice">MIDI Device:</label>
            <select id="midiDevice">
                <option value="">No MIDI Device</option>
            </select>
        `;
        
        // Insert before the New Note button
        const newNoteBtn = document.getElementById('newNote');
        settings.insertBefore(midiContainer, newNoteBtn);
        
        // Add change handler
        document.getElementById('midiDevice').addEventListener('change', (e) => {
            if (e.target.value) {
                const input = this.midiAccess.inputs.get(e.target.value);
                if (input) {
                    this.selectMIDIInput(input);
                }
            } else {
                if (this.selectedMidiInput) {
                    this.selectedMidiInput.onmidimessage = null;
                    this.selectedMidiInput = null;
                }
                // Update indicator
                const indicator = document.getElementById('midiIndicator');
                if (indicator) {
                    indicator.textContent = 'MIDI Disconnected';
                    indicator.classList.remove('active');
                    indicator.style.display = 'none';
                }
            }
        });
        
        this.updateMIDIDeviceUI();
    }
    
    updateMIDIDeviceUI() {
        const select = document.getElementById('midiDevice');
        if (!select || !this.midiAccess) return;
        
        // Clear current options
        select.innerHTML = '<option value="">No MIDI Device</option>';
        
        // Add all available MIDI inputs
        this.midiAccess.inputs.forEach((input, id) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = input.name || `MIDI Device ${id}`;
            if (this.selectedMidiInput && this.selectedMidiInput.id === id) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PianoFlashCards();
});