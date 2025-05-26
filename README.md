# Flappy Face - Python Web Version

A web-based implementation of the Flappy Bird game using Python (Flask) on the backend and JavaScript with face detection on the frontend.

## Features

- Control the game by opening your mouth (using webcam face detection)
- Alternative control using the spacebar
- Score tracking
- Game over screen with restart option

## Requirements

- Python 3.6+
- Flask
- Web browser with webcam access

## Installation

1. Clone this repository:
```
git clone https://github.com/GurpinderSingh96/Flappy_bird.git
cd Flappy_bird/web_python_version
```

2. Install the required packages:
```
pip install -r requirements.txt
```

3. Run the Flask application:
```
python app.py
```

4. Open your web browser and navigate to:
```
http://localhost:5000
```

## How to Play

1. Allow webcam access when prompted
2. Wait for the face detection models to load
3. Click "Start Game" or press the spacebar
4. Open your mouth to make the character jump
5. Navigate through the pipes without hitting them
6. After game over, click "Play Again" or press spacebar to restart

## Project Structure

- `app.py`: Flask application entry point
- `templates/`: HTML templates
  - `index.html`: Main game page
- `static/`: Static assets
  - `css/style.css`: Game styling
  - `js/game.js`: Game logic and face detection
  - `models/`: Face detection model files

## Technologies Used

- Python with Flask for the backend
- JavaScript for game logic
- face-api.js for face detection
- HTML5 Canvas for game rendering
