const images = [
    { src: 'static/heart-red.png', revealed: false, index: 0 },
    { src: 'static/heart-red.png', revealed: false, index: 1 },
    { src: 'static/heart-red.png', revealed: false, index: 2 },
    { src: 'static/heart-blue.png', revealed: false, index: 3 },
    { src: 'static/heart-blue.png', revealed: false, index: 4 },
    { src: 'static/diamond-blue.png', revealed: false, index: 5 },
    { src: 'static/diamond-blue.png', revealed: false, index: 6 },
    { src: 'static/diamond-red.png', revealed: false, index: 7 },
    { src: 'static/diamond-red.png', revealed: false, index: 8 }
];

const gridSize = 3;
const cellSize = 140; // Size for each cell
const canvasImage = 'static/silver.jpg';
const targetImage = 'static/heart-red.png'; // Image to check
const pixelThreshold = 0.75; // 98% threshold

function initializeGame() {
    const gridContainer = document.querySelector('.grid');
    gridContainer.innerHTML = ''; // Clear previous canvases

    const shuffledImages = shuffle(images.slice());

    // Create canvases for each image
    shuffledImages.forEach((imageData) => {
        const cellDiv = document.createElement('div');
        cellDiv.classList.add('cell');
        cellDiv.style.position = 'relative'; // Ensure overlay is positioned correctly

        // Create main image canvas
        const imageCanvas = document.createElement('canvas');
        imageCanvas.width = cellSize;
        imageCanvas.height = cellSize;
        const imgCtx = imageCanvas.getContext('2d');
        const img = new Image();
        img.src = imageData.src;
        img.onload = () => {
            const scaledSize = cellSize * 0.9; // Calculate the size (90% of cellSize)
            const offset = (cellSize - scaledSize) / 2; // Calculate the offset to center the image

            // Draw the image centered and scaled
            imgCtx.drawImage(img, offset, offset, scaledSize, scaledSize);
        };
        cellDiv.index = imageData.index; // Store the index in a data attribute
        cellDiv.appendChild(imageCanvas);

        // Create overlay canvas
        const overlayCanvas = document.createElement('canvas');
        overlayCanvas.width = cellSize;
        overlayCanvas.height = cellSize;
        const overlayCtx = overlayCanvas.getContext('2d');
        const overlayImg = new Image();
        overlayImg.src = canvasImage; // Use your canvas image
        overlayImg.onload = () => {
            overlayCtx.drawImage(overlayImg, 0, 0, cellSize, cellSize);
        };

        overlayCanvas.style.position = 'absolute'; // Position overlay on top of image
        overlayCanvas.style.top = 0;
        overlayCanvas.style.left = 0;

        cellDiv.appendChild(overlayCanvas);
        gridContainer.appendChild(cellDiv);

        // Add event listeners for scratching
        addScratchEvents(cellDiv, overlayCanvas, overlayCtx, imageData);
    });
}

function resetGame() {
    images.forEach(imageData => imageData.revealed = false); // Reset revealed status

    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('winner');
        const overlayCanvas = cell.querySelector('canvas:nth-child(2)');
        const overlayCtx = overlayCanvas.getContext('2d');
        overlayCtx.fillStyle = 'rgba(0, 0, 0, 1)';
        overlayCtx.fillRect(0, 0, cellSize, cellSize);
    });
    stopCelebration();
    initializeGame(); // Recreate the grid to reset the game state
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Function to check if the image is revealed
function checkReveal(imageData, overlayCtx, overlayCanvas) {
    // Check if the cleared pixels meet the 98% threshold
    const totalPixels = cellSize * cellSize;
    const clearedPixels = calculateClearedPixels(overlayCtx, overlayCanvas);
    if (clearedPixels / totalPixels >= pixelThreshold && !imageData.revealed) {
        imageData.revealed = true;
    }
    checkWinCondition();
}

// Function to add scratch events
function addScratchEvents(cellDiv, overlayCanvas, overlayCtx, imageData) {
    let isScratching = false; // Track if the user is currently scratching

    const startScratching = (event) => {
        event.preventDefault();
        isScratching = true; // Set to true when starting to scratch
        scratch(event, overlayCtx, overlayCanvas, imageData);
    };

    const stopScratching = () => {
        isScratching = false; // Reset scratching state
        checkWinCondition();
    };

    const scratch = (event, overlayCtx, overlayCanvas, imageData) => {
        const rect = overlayCanvas.getBoundingClientRect();
        const offsetX = event.touches ? event.touches[0].clientX - rect.left : event.clientX - rect.left;
        const offsetY = event.touches ? event.touches[0].clientY - rect.top : event.clientY - rect.top;

        overlayCtx.clearRect(offsetX - 20, offsetY - 20, 40, 40); // Scratch area
        checkReveal(imageData, overlayCtx, overlayCanvas);
    };

    // Start scratching on touch and mouse down
    cellDiv.addEventListener('mousedown', startScratching);
    cellDiv.addEventListener('touchstart', startScratching);

    // Scratching while moving
    cellDiv.addEventListener('mousemove', (event) => {
        if (isScratching) scratch(event, overlayCtx, overlayCanvas, imageData);
    });
    cellDiv.addEventListener('touchmove', (event) => {
        event.preventDefault();
        if (isScratching) scratch(event, overlayCtx, overlayCanvas, imageData);
    });

    // Stop scratching on mouse up and touch end
    cellDiv.addEventListener('mouseup', stopScratching);
    cellDiv.addEventListener('touchend', stopScratching);
}


function calculateClearedPixels(overlayCtx, overlayCanvas) {
    const imageData = overlayCtx.getImageData(0, 0, overlayCanvas.width, overlayCanvas.height);
    const data = imageData.data;
    let clearedPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
        // Check if the pixel is transparent (or close to it)
        if (data[i + 3] < 255) {
            clearedPixels++;
        }
    }

    return clearedPixels;
}

function showCelebration() {
    const celebrationDiv = document.getElementById('celebration');
    celebrationDiv.classList.remove('hidden'); // Show celebration

    // Calculate grid dimensions
    const gridWidth = cellSize * 3; // 3 cells
    celebrationDiv.style.borderWidth = `${Math.min(gridWidth / 20, 10)}px`; // Responsive border size
 
    startFireworks();
}

function stopCelebration() {
    const celebrationDiv = document.getElementById('celebration');
    celebrationDiv.classList.add('hidden'); // stop celebration
}

function startFireworks() {
    const canvas = document.getElementById('fireworksCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Fireworks configuration
    const particles = [];
    const colors = ['#FFABAB', '#FFC3A0', '#FF677D', '#D4A5A5', '#392F5A'];

    function createFirework(x, y) {
        const count = 200; // Number of particles
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                speed: Math.random() * 1 + 1,
                angle: Math.random() * 2 * Math.PI,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                size: Math.random() * 13 + 1
            });
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((particle, index) => {
            particle.x += 4 * particle.speed * Math.cos(particle.angle);
            particle.y += 4 * particle.speed * Math.sin(particle.angle);
            particle.alpha -= 0.02; // Fade out
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = particle.alpha;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 5);
            ctx.fill();

            if (particle.alpha <= 0) {
                particles.splice(index, 1); // Remove particle when faded
            }
        });

        if (particles.length > 0) {
            requestAnimationFrame(animate);
        }
    }


    // Trigger fireworks at the center
    createFirework(0, canvas.height / 1);
    createFirework(canvas.width / 1, canvas.height / 1);

    createFirework(0, canvas.height / 2);
    createFirework(canvas.width / 1, canvas.height / 2);

    createFirework(0, canvas.height / 8);
    createFirework(canvas.width / 1, canvas.height / 8);

    animate();
}

// Check for win condition
function checkWinCondition() {
    const cells = document.querySelectorAll('.cell');

    // Filter to get revealed heart-red images
    const revealedImages = images.filter(imageData => imageData.src === targetImage && imageData.revealed);

    // Check if we have exactly 3 revealed heart-red images
    if (revealedImages.length === 3) {
        const cells = document.querySelectorAll('.cell');
        // Iterate through each cell
        cells.forEach((cell) => {
            const cellIndex = cell.index; // Retrieve the index from the custom property
            const imageData = images[cellIndex]; // Get the corresponding image data

            // Check if this cell's image is heart-red and is revealed
            if (imageData.src === targetImage && imageData.revealed) {
                cell.classList.add('winner'); // Add the winner class for glowing effect
                console.log("Winner class added to cell:", cell); // Log for debugging
            }
        });
        showCelebration(); // Show fireworks and message
    }
}
// Reset game button
document.getElementById('resetButton').addEventListener('click', resetGame);

// Initialize game on load
window.onload = initializeGame;
