# Omok Game (Five in a Row)

A web-based AI vs Player Omok game built with HTML5 Canvas and JavaScript, featuring realistic stone sound effects and 3D visual rendering.

## 🎮 Game Features

- **AI Opponent**: Battle against an intelligent AI with strategic algorithms
- **3D Stone Rendering**: Realistic stones with gradients and shadow effects
- **Authentic Sound Effects**: Realistic stone placement sounds using Web Audio API
- **Scoring System**: Performance-based scoring with move count and time tracking
- **Responsive Design**: Clean and modern UI

## 🚀 Getting Started

1. Clone the repository:
```bash
git clone https://github.com/[your-username]/omok-game.git
cd omok-game
```

2. Open `index.html` in your web browser.

## 🎯 How to Play

1. Player starts first with black stones
2. Click on the board to place your stone
3. AI automatically responds with white stones
4. First to get 5 stones in a row (horizontal, vertical, or diagonal) wins!

## 🤖 AI Strategy

The AI uses a priority-based decision system:

1. **Winning Move**: Complete a five-in-a-row if possible
2. **Defensive Move**: Block player's winning opportunities
3. **Offensive Move**: Create four-in-a-row threats
4. **Defensive Block**: Prevent player's four-in-a-row
5. **Three-in-a-row**: Build consecutive stone patterns
6. **Strategic Position**: Occupy center-focused advantageous positions

## 🏆 Scoring System

Your performance is evaluated based on:

- **Move Efficiency**: Fewer moves = higher score
- **Game Duration**: Faster wins earn time bonuses
- **Victory Bonus**: Additional points for player wins

**Grade Rankings:**
- S-Class Master (900+ points)
- A-Class Advanced (800-899 points)
- B-Class Intermediate (700-799 points)
- C-Class Beginner (600-699 points)
- D-Class Novice (400-599 points)
- Practice Needed (< 400 points)

## 🔊 Sound Effects

Realistic stone placement audio using Web Audio API:

- **Impact Sound**: Initial stone-to-board contact
- **Resonance**: Stone material vibration
- **Wood Vibration**: Board resonance
- **Surface Friction**: Stone-board interaction

## 🛠 Technology Stack

- **HTML5 Canvas**: Game board rendering and graphics
- **JavaScript ES6+**: Game logic and AI algorithms
- **Web Audio API**: Real-time sound generation
- **CSS3**: Styling and visual effects

## 📁 Project Structure

```
omok-game/
├── index.html      # Main HTML file
├── script.js       # Game logic and AI
├── style.css       # Stylesheet
└── README.md       # Project documentation
```

## 🎨 Game Features

- 15x15 game board
- 3D stone rendering with lighting effects
- Real-time win detection
- Game reset functionality
- Current player indicator
- Move counter and statistics
- Performance scoring system

## 🌟 Future Enhancements

- [ ] Difficulty level adjustment
- [ ] Game history and replay
- [ ] Online multiplayer support
- [ ] Multiple board themes
- [ ] Tournament mode
- [ ] Mobile touch optimization

## 🎮 Game Statistics

The game tracks:
- Total moves played
- Individual player move counts
- Game duration
- Performance score and grade

---

Enjoy playing Omok! 🎯