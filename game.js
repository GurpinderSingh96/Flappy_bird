// DOM Elements
const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');
const webcamElement = document.getElementById('webcam');
const overlayCanvas = document.getElementById('overlay');
const overlayCtx = overlayCanvas.getContext('2d');
const instructionsElement = document.getElementById('instructions');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const loadingElement = document.getElementById('loading');

// Set canvas dimensions
function resizeCanvas() {
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
    
    // Also resize the overlay canvas for webcam
    overlayCanvas.width = 240;
    overlayCanvas.height = 180;
}

// Call resize on load and whenever window is resized
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// Initial canvas setup
resizeCanvas();
overlayCanvas.width = 160;
overlayCanvas.height = 120;

// Game variables
let gameActive = false;
let score = 0;
let gravity = 0.5;
let faceMovement = 0;
let faceX = window.innerWidth / 8; // Position face at 1/8 of screen width
let faceY = window.innerHeight / 2;
let faceRadius = Math.min(window.innerWidth, window.innerHeight) / 20; // Responsive size
let pipes = [];
let pipeWidth = Math.min(window.innerWidth, window.innerHeight) / 12;
let pipeGap = Math.min(window.innerWidth, window.innerHeight) / 3.5;
let pipeFrequency = 1500; // milliseconds
let lastPipeTime = 0;

// Face detection variables
let mouthOpen = false;
let mouthOpenThreshold = 0.5;
let lastJumpTime = 0;
let jumpCooldown = 300; // milliseconds
let detectionReady = false;

// Colors
const BLUE = '#70c5ce';
const GREEN = '#0da20d';
const YELLOW = '#ffff00';
const BLACK = '#000000';
const RED = '#ff0000';
const WHITE = '#ffffff';

// Load face-api.js models
async function loadModels() {
    try {
        // Use local model files instead of CDN
        await faceapi.nets.tinyFaceDetector.loadFromUri('/weights');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/weights');
        console.log('Models loaded successfully');
        
        // Hide loading indicator
        loadingElement.style.display = 'none';
        
        startWebcam();
    } catch (error) {
        console.error('Error loading models:', error);
        alert('Failed to load face detection models. Please check the console for details.');
    }
}

// Start webcam
async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 640,
                height: 480,
                facingMode: 'user'
            } 
        });
        webcamElement.srcObject = stream;
        webcamElement.addEventListener('loadeddata', () => {
            detectionReady = true;
            console.log('Webcam ready, starting face detection');
            detectFaces();
        });
    } catch (error) {
        console.error('Error accessing webcam:', error);
        alert('Unable to access webcam. Please make sure you have a webcam connected and have granted permission to use it.');
    }
}

// Detect faces and mouth state
async function detectFaces() {
    if (!detectionReady) return;
    
    try {
        const detections = await faceapi.detectAllFaces(
            webcamElement, 
            new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks();
        
        // Clear overlay canvas
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        
        if (detections && detections.length > 0) {
            const detection = detections[0];
            const landmarks = detection.landmarks;
            const mouth = landmarks.getMouth();
            
            // Draw mouth landmarks
            overlayCtx.fillStyle = '#00FF00';
            mouth.forEach(point => {
                overlayCtx.beginPath();
                overlayCtx.arc(
                    point.x * (overlayCanvas.width / webcamElement.videoWidth),
                    point.y * (overlayCanvas.height / webcamElement.videoHeight),
                    2, 0, 2 * Math.PI
                );
                overlayCtx.fill();
            });
            
            // Calculate mouth aspect ratio
            const upperLipBottom = mouth[14]; // Bottom of upper lip
            const lowerLipTop = mouth[18];    // Top of lower lip
            const leftCorner = mouth[0];      // Left corner of mouth
            const rightCorner = mouth[6];     // Right corner of mouth
            
            const mouthHeight = Math.abs(upperLipBottom.y - lowerLipTop.y);
            const mouthWidth = Math.abs(leftCorner.x - rightCorner.x);
            
            const mar = mouthHeight / mouthWidth;
            
            // Determine if mouth is open
            mouthOpen = mar > mouthOpenThreshold;
            
            // Display mouth state
            overlayCtx.fillStyle = '#FFFFFF';
            overlayCtx.font = '12px Arial';
            overlayCtx.fillText(mouthOpen ? 'Mouth: OPEN' : 'Mouth: CLOSED', 5, 15);
            overlayCtx.fillText(`MAR: ${mar.toFixed(2)}`, 5, 30);
        }
    } catch (error) {
        console.error('Error in face detection:', error);
    }
    
    // Continue detection
    requestAnimationFrame(detectFaces);
}

// Draw player face
function drawPlayerFace() {
    // Draw face circle
    ctx.beginPath();
    ctx.arc(faceX, faceY, faceRadius, 0, Math.PI * 2);
    ctx.fillStyle = YELLOW;
    ctx.fill();
    ctx.closePath();
    
    // Draw eyes
    ctx.beginPath();
    ctx.arc(faceX - 10, faceY - 8, 7, 0, Math.PI * 2);
    ctx.fillStyle = BLACK;
    ctx.fill();
    ctx.closePath();
    
    ctx.beginPath();
    ctx.arc(faceX + 10, faceY - 8, 7, 0, Math.PI * 2);
    ctx.fillStyle = BLACK;
    ctx.fill();
    ctx.closePath();
    
    // Draw mouth based on webcam
    if (mouthOpen) {
        // Open mouth (oval)
        ctx.beginPath();
        ctx.ellipse(faceX, faceY + 10, 15, 10, 0, 0, Math.PI * 2);
        ctx.fillStyle = BLACK;
        ctx.fill();
        ctx.closePath();
        
        ctx.beginPath();
        ctx.ellipse(faceX, faceY + 10, 10, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = RED;
        ctx.fill();
        ctx.closePath();
    } else {
        // Closed mouth (line)
        ctx.beginPath();
        ctx.moveTo(faceX - 10, faceY + 10);
        ctx.lineTo(faceX + 10, faceY + 10);
        ctx.lineWidth = 3;
        ctx.strokeStyle = BLACK;
        ctx.stroke();
        ctx.closePath();
    }
}

// Draw pipes
function drawPipes() {
    pipes.forEach(pipe => {
        // Top pipe
        ctx.fillStyle = GREEN;
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.topHeight + pipeGap, pipeWidth, gameCanvas.height - pipe.topHeight - pipeGap);
    });
}

// Check for collisions
function checkCollision() {
    // Check if face hits the top or bottom of the screen
    if (faceY <= faceRadius || faceY >= gameCanvas.height - faceRadius) {
        return true;
    }
    
    // Check collision with pipes
    for (const pipe of pipes) {
        if (faceX + faceRadius > pipe.x && faceX - faceRadius < pipe.x + pipeWidth) {
            // Top pipe collision
            if (faceY - faceRadius < pipe.topHeight) {
                return true;
            }
            
            // Bottom pipe collision
            if (faceY + faceRadius > pipe.topHeight + pipeGap) {
                return true;
            }
        }
    }
    
    return false;
}

// Update score
function updateScore() {
    pipes.forEach(pipe => {
        if (pipe.x + pipeWidth < faceX && !pipe.scored) {
            score++;
            pipe.scored = true;
        }
    });
}

// Reset game
function resetGame() {
    faceY = window.innerHeight / 2;
    faceX = window.innerWidth / 8;
    faceMovement = 0;
    pipes = [];
    score = 0;
    gameActive = true;
    lastPipeTime = performance.now();
    
    // Update game dimensions in case window was resized
    faceRadius = Math.min(window.innerWidth, window.innerHeight) / 20;
    pipeWidth = Math.min(window.innerWidth, window.innerHeight) / 12;
    pipeGap = Math.min(window.innerWidth, window.innerHeight) / 3.5;
    
    // Hide game over screen
    gameOverElement.classList.add('hidden');
}

// Game over
function gameOver() {
    gameActive = false;
    finalScoreElement.textContent = score;
    gameOverElement.classList.remove('hidden');
}

// Game loop
function gameLoop(timestamp) {
    // Clear canvas
    ctx.fillStyle = BLUE;
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    if (gameActive) {
        // Check for mouth open to make the face jump
        const currentTime = performance.now();
        if (mouthOpen && currentTime - lastJumpTime > jumpCooldown) {
            faceMovement = -10; // Jump
            lastJumpTime = currentTime;
        }
        
        // Apply gravity and update face position
        faceMovement += gravity;
        faceY += faceMovement;
        
        // Generate pipes
        if (timestamp - lastPipeTime > pipeFrequency) {
            const minHeight = Math.min(100, gameCanvas.height * 0.1);
            const maxHeight = gameCanvas.height - pipeGap - minHeight;
            const topHeight = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;
            pipes.push({
                x: gameCanvas.width,
                topHeight: topHeight,
                scored: false
            });
            lastPipeTime = timestamp;
        }
        
        // Move pipes
        pipes.forEach(pipe => {
            // Scale pipe speed based on screen width
            const pipeSpeed = Math.max(5, window.innerWidth / 160);
            pipe.x -= pipeSpeed;
        });
        
        // Remove pipes that are off screen
        pipes = pipes.filter(pipe => pipe.x > -pipeWidth);
        
        // Draw elements
        drawPlayerFace();
        drawPipes();
        
        // Check for collisions
        if (checkCollision()) {
            gameOver();
        }
        
        // Update score
        updateScore();
        
        // Display score
        ctx.fillStyle = WHITE;
        ctx.font = `${Math.max(20, window.innerWidth / 30)}px Arial`;
        ctx.fillText(`Score: ${score}`, 20, 40);
    }
    
    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Event listeners
startButton.addEventListener('click', () => {
    instructionsElement.classList.add('hidden');
    resetGame();
});

restartButton.addEventListener('click', resetGame);

document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        if (!gameActive && !instructionsElement.classList.contains('hidden')) {
            instructionsElement.classList.add('hidden');
            resetGame();
        } else if (!gameActive) {
            resetGame();
        }
    }
});

// Start the game
loadModels();
gameLoop(0);
