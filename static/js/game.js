// Game canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Webcam setup
const video = document.getElementById('webcam');
const overlay = document.getElementById('overlay');
const overlayCtx = overlay.getContext('2d');
overlay.width = 160;
overlay.height = 120;

// UI elements
const instructionsDiv = document.getElementById('instructions');
const gameOverDiv = document.getElementById('gameOver');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const loadingDiv = document.getElementById('loading');
const finalScoreSpan = document.getElementById('finalScore');

// Game variables
let gameActive = false;
let score = 0;
let gravity = 0.5;
let faceY = canvas.height / 2;
let faceVelocity = 0;
let pipes = [];
let lastPipeTime = 0;
let pipeFrequency = 1500; // milliseconds
let faceRadius = 30;
let mouthOpen = false;
let lastJumpTime = 0;
let jumpCooldown = 300; // milliseconds

// Colors
const BLUE = '#87CEEB';
const GREEN = '#00CC00';
const YELLOW = '#FFFF00';
const BLACK = '#000000';
const RED = '#FF0000';
const WHITE = '#FFFFFF';

// Face detection variables
let faceDetectionReady = false;
let faceApiModelsLoaded = false;

// Load face-api.js models
async function loadFaceDetectionModels() {
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/static/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/static/models');
        faceApiModelsLoaded = true;
        loadingDiv.style.display = 'none';
        startButton.disabled = false;
        console.log('Face detection models loaded');
    } catch (error) {
        console.error('Error loading face detection models:', error);
        loadingDiv.innerHTML = 'Error loading face detection models. Please refresh the page.';
    }
}

// Start webcam
async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 160, 
                height: 120,
                facingMode: 'user'
            } 
        });
        video.srcObject = stream;
        video.play();
        faceDetectionReady = true;
        startFaceDetection();
    } catch (error) {
        console.error('Error accessing webcam:', error);
        loadingDiv.innerHTML = 'Error accessing webcam. Please ensure you have a webcam connected and have granted permission.';
    }
}

// Face detection loop
async function startFaceDetection() {
    if (!faceApiModelsLoaded) return;
    
    setInterval(async () => {
        if (!faceDetectionReady || !video.readyState === 4) return;
        
        // Detect faces with landmarks
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks();
            
        // Clear overlay canvas
        overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
        
        if (detections.length > 0) {
            const detection = detections[0];
            const landmarks = detection.landmarks;
            const mouth = landmarks.getMouth();
            
            // Draw landmarks on overlay
            overlayCtx.fillStyle = 'green';
            mouth.forEach(point => {
                overlayCtx.fillRect(point.x, point.y, 2, 2);
            });
            
            // Calculate mouth aspect ratio
            const top = mouth[13]; // Top of mouth
            const bottom = mouth[19]; // Bottom of mouth
            const left = mouth[0]; // Left corner
            const right = mouth[6]; // Right corner
            
            const mouthHeight = Math.abs(top.y - bottom.y);
            const mouthWidth = Math.abs(right.x - left.x);
            const mouthAspectRatio = mouthHeight / mouthWidth;
            
            // Determine if mouth is open
            mouthOpen = mouthAspectRatio > 0.3; // Adjust threshold as needed
            
            // Display mouth status
            overlayCtx.fillStyle = 'white';
            overlayCtx.font = '10px Arial';
            overlayCtx.fillText(`Mouth: ${mouthOpen ? 'Open' : 'Closed'}`, 5, 15);
            overlayCtx.fillText(`MAR: ${mouthAspectRatio.toFixed(2)}`, 5, 30);
        }
    }, 100);
}

// Game functions
function drawFace(x, y) {
    // Draw face circle
    ctx.fillStyle = YELLOW;
    ctx.beginPath();
    ctx.arc(x, y, faceRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw eyes
    ctx.fillStyle = BLACK;
    ctx.beginPath();
    ctx.arc(x - 10, y - 8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 10, y - 8, 7, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw mouth based on webcam
    if (mouthOpen) {
        // Open mouth
        ctx.fillStyle = BLACK;
        ctx.beginPath();
        ctx.ellipse(x, y + 10, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner mouth
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.ellipse(x, y + 10, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Closed mouth
        ctx.strokeStyle = BLACK;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 10, y + 10);
        ctx.lineTo(x + 10, y + 10);
        ctx.stroke();
    }
}

function drawPipes() {
    ctx.fillStyle = GREEN;
    
    for (const pipe of pipes) {
        // Top pipe
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.height);
        
        // Bottom pipe
        ctx.fillRect(
            pipe.x, 
            pipe.height + pipe.gap, 
            pipe.width, 
            canvas.height - pipe.height - pipe.gap
        );
    }
}

function createPipe() {
    const minHeight = 50;
    const maxHeight = canvas.height - 200;
    const height = Math.floor(Math.random() * (maxHeight - minHeight) + minHeight);
    
    pipes.push({
        x: canvas.width,
        height: height,
        width: 50,
        gap: 180,
        passed: false
    });
}

function checkCollision() {
    // Check if face hits the top or bottom of the screen
    if (faceY <= faceRadius || faceY >= canvas.height - faceRadius) {
        return true;
    }
    
    // Check collision with pipes
    const faceX = 100; // Fixed x position of the face
    
    for (const pipe of pipes) {
        // Check if face is within pipe's x-range
        if (faceX + faceRadius > pipe.x && faceX - faceRadius < pipe.x + pipe.width) {
            // Check if face hits top pipe
            if (faceY - faceRadius < pipe.height) {
                return true;
            }
            
            // Check if face hits bottom pipe
            if (faceY + faceRadius > pipe.height + pipe.gap) {
                return true;
            }
        }
    }
    
    return false;
}

function updateScore() {
    for (const pipe of pipes) {
        if (pipe.x + pipe.width < 100 && !pipe.passed) { // 100 is the face's x position
            pipe.passed = true;
            score++;
        }
    }
}

function drawScore() {
    ctx.fillStyle = WHITE;
    ctx.font = '30px Arial';
    ctx.fillText(`Score: ${score}`, 10, 40);
}

function resetGame() {
    faceY = canvas.height / 2;
    faceVelocity = 0;
    pipes = [];
    score = 0;
    lastPipeTime = Date.now();
    gameActive = true;
    gameOverDiv.classList.add('hidden');
}

function gameLoop() {
    // Clear canvas
    ctx.fillStyle = BLUE;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (gameActive) {
        // Check for mouth open to make the face jump
        const currentTime = Date.now();
        if (mouthOpen && currentTime - lastJumpTime > jumpCooldown) {
            faceVelocity = -10;
            lastJumpTime = currentTime;
        }
        
        // Apply gravity
        faceVelocity += gravity;
        faceY += faceVelocity;
        
        // Generate pipes
        if (currentTime - lastPipeTime > pipeFrequency) {
            createPipe();
            lastPipeTime = currentTime;
        }
        
        // Move pipes
        for (const pipe of pipes) {
            pipe.x -= 5;
        }
        
        // Remove pipes that are off screen
        pipes = pipes.filter(pipe => pipe.x > -pipe.width);
        
        // Draw game elements
        drawFace(100, faceY);
        drawPipes();
        
        // Check for collisions
        if (checkCollision()) {
            gameActive = false;
            finalScoreSpan.textContent = score;
            gameOverDiv.classList.remove('hidden');
        }
        
        // Update and draw score
        updateScore();
        drawScore();
    }
    
    requestAnimationFrame(gameLoop);
}

// Event listeners
startButton.addEventListener('click', () => {
    instructionsDiv.classList.add('hidden');
    resetGame();
});

restartButton.addEventListener('click', () => {
    resetGame();
});

document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        if (!gameActive && instructionsDiv.classList.contains('hidden')) {
            resetGame();
        } else if (gameActive) {
            faceVelocity = -10; // Manual jump with spacebar
        } else if (!instructionsDiv.classList.contains('hidden')) {
            instructionsDiv.classList.add('hidden');
            resetGame();
        }
    }
});

// Initialize
startButton.disabled = true;
loadFaceDetectionModels();
startWebcam();
gameLoop();
