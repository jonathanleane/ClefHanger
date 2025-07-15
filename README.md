# 🎼 ClefHanger

A fun, interactive web app for learning to read musical notes on treble and bass clefs. Perfect for piano students, music theory beginners, or anyone wanting to improve their sight-reading skills!

**[Try it live here →](https://jonathanleane.github.io/ClefHanger/)**

## ✨ Features

- **Four Practice Modes**:
  - **Staff → Piano**: See a note on staff, identify it on piano or buttons
  - **Piano → Staff**: See a highlighted piano key, place the note on staff
  - **Duration Practice**: Learn note values (Semibreve, Minim, Crotchet, Quaver, Semiquaver)
  - **Place Duration**: Combine duration and pitch - place specific note types at specific positions
- **Interactive Learning**: Click buttons, piano keys, or staff positions
- **Dual Clef Support**: Practice treble clef, bass clef, or both
- **Visual Piano Keyboard**: See the connection between staff notation and piano keys
- **Sharps and Flats**: Optional practice with accidentals
- **Learning Aids**:
  - Show Middle C reference guide
  - Display helpful mnemonics (Every Good Boy Does Fine, etc.)
  - Toggle piano key labels on/off
  - Hover preview when placing notes on staff
- **Progress Tracking**: Score counter and streak tracking
- **Audio Feedback**: Hear the correct note when you get it right
- **Responsive Design**: Works great on desktop and mobile devices
- **Keyboard Support**: Use your computer keyboard (A-G keys) for quick practice

## 🚀 Getting Started

### Play Online
Visit [https://jonathanleane.github.io/ClefHanger/](https://jonathanleane.github.io/ClefHanger/) to start practicing immediately!

### Run Locally
1. Clone this repository:
   ```bash
   git clone https://github.com/jonathanleane/ClefHanger.git
   cd ClefHanger
   ```

2. Open `index.html` in your web browser
   ```bash
   open index.html  # macOS
   # or
   start index.html  # Windows
   # or just drag the file into your browser
   ```

That's it! No build process or dependencies required.

## 🎮 How to Play

### Staff → Piano Mode (Default)
1. A note appears on the musical staff
2. Identify the note by either:
   - Clicking the letter button (C, D, E, F, G, A, B)
   - Clicking the corresponding piano key
   - Pressing the letter on your keyboard
3. Get instant feedback and hear the note when correct

### Piano → Staff Mode
1. A piano key is highlighted
2. Click on the staff where that note should be placed
3. See a preview as you hover over the staff
4. Get feedback on your placement accuracy

### Duration Practice Mode
1. A note with a specific duration appears on the staff
2. Identify how many beats it gets (4, 2, 1, ½, or ¼)
3. Learn both American names (Whole, Half, etc.) and British names (Semibreve, Minim, etc.)

### Place Duration Mode
1. You're given an instruction like "Place a Semibreve on C"
2. First, select the correct duration from the buttons
3. Then, click on the staff at the correct pitch
4. Get specific feedback on what was wrong (if anything)

### Tips for Beginners

- **Start with one clef**: Uncheck one of the clef options to focus on just treble or bass
- **Use the helpers**: Turn on "Show Middle C" and "Show Mnemonics" for visual guides
- **Remember the mnemonics**:
  - Treble lines: Every Good Boy Does Fine (E-G-B-D-F)
  - Treble spaces: FACE (F-A-C-E)
  - Bass lines: Good Boys Do Fine Always (G-B-D-F-A)
  - Bass spaces: All Cows Eat Grass (A-C-E-G)

## 🛠️ Technical Details

Built with vanilla JavaScript, HTML5, and CSS3. No frameworks or build tools required!

- **Pure JavaScript**: No dependencies, lightweight and fast
- **SVG Graphics**: Clean, scalable musical notation
- **Web Audio API**: For playing note sounds
- **Responsive CSS**: Adapts to any screen size
- **Local Storage**: (Coming soon) Save your progress and settings

## 📱 Browser Support

Works on all modern browsers:
- Chrome / Edge
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome for Android)

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

### Ideas for Future Features

- [ ] Difficulty levels (limited note ranges for beginners)
- [ ] Timed practice mode
- [ ] Progress statistics and charts
- [ ] More instrument sounds
- [ ] Ledger line practice mode
- [ ] Interval training
- [ ] Chord recognition

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by the need for a simple, free tool to practice note reading
- Thanks to all music teachers who use mnemonics to help students learn

---

Made with ❤️ for music learners everywhere. Happy practicing!