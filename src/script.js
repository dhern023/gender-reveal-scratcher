const images = [
    { src: '../static/heart-red.png', revealed: false, index: 0 },
    { src: '../static/heart-red.png', revealed: false, index: 1 },
    { src: '../static/heart-red.png', revealed: false, index: 2 },
    { src: '../static/heart-blue.png', revealed: false, index: 3 },
    { src: '../static/heart-blue.png', revealed: false, index: 4 },
    { src: '../static/diamond-blue.png', revealed: false, index: 5 },
    { src: '../static/diamond-blue.png', revealed: false, index: 6 },
    { src: '../static/diamond-red.png', revealed: false, index: 7 },
    { src: '../static/diamond-red.png', revealed: false, index: 8 }
];

const gridSize = 3;
const cellSize = 150; // Size for each cell
const canvasImage = '../static/silver.jpg';
const targetImage = '../static/heart-red.png'; // Image to check
const pixelThreshold = 0.75; // 98% threshold
let activeOverlay = null; // Track which overlay is currently active
let isScratching = false; // Track whether the user is currently scratching

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

        overlayCanvas.addEventListener('mousedown', startScratch.bind(null, overlayCtx, overlayCanvas, imageData));
        overlayCanvas.addEventListener('touchstart', startScratch.bind(null, overlayCtx, overlayCanvas, imageData));

        cellDiv.appendChild(overlayCanvas);
        gridContainer.appendChild(cellDiv);
    });

    // Reset game state
    images.forEach(imageData => imageData.revealed = false); // Reset revealed status
    activeOverlay = null; // Reset active overlay
    isScratching = false; // Reset scratching flag
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Scratch functionality
function startScratch(overlayCtx, overlayCanvas, imageData, e) {
    e.preventDefault();

    // If there's an active overlay, stop scratching it
    if (activeOverlay && activeOverlay !== overlayCanvas) {
        stopScratch(activeOverlay);
    }

    activeOverlay = overlayCanvas; // Set the current active overlay
    isScratching = true; // Set the scratching flag to true

    overlayCanvas.addEventListener('mousemove', scratch.bind(null, overlayCtx, overlayCanvas, imageData));
    overlayCanvas.addEventListener('mouseup', stopScratch.bind(null, overlayCanvas));
    overlayCanvas.addEventListener('mouseleave', stopScratch.bind(null, overlayCanvas)); // Stop on leaving the canvas
    overlayCanvas.addEventListener('touchmove', scratch.bind(null, overlayCtx, overlayCanvas, imageData));
    overlayCanvas.addEventListener('touchend', stopScratch.bind(null, overlayCanvas));
    
    scratch(overlayCtx, overlayCanvas, imageData, e); // Initial scratch
}

function scratch(overlayCtx, overlayCanvas, imageData, e) {
    if (!isScratching) return; // Only scratch if the user is actively scratching

    const rect = overlayCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    overlayCtx.clearRect(x - 20, y - 20, 40, 40); // Scratch area

    // Check if the cleared pixels meet the 98% threshold
    const totalPixels = cellSize * cellSize;
    const clearedPixels = calculateClearedPixels(overlayCtx, overlayCanvas);
    if (clearedPixels / totalPixels >= pixelThreshold && !imageData.revealed) {
        imageData.revealed = true; // Mark this image as revealed
    }
    checkWinCondition();
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

function stopScratch(overlayCanvas) {
    overlayCanvas.removeEventListener('mousemove', scratch);
    overlayCanvas.removeEventListener('mouseup', stopScratch);
    overlayCanvas.removeEventListener('mouseleave', stopScratch);
    overlayCanvas.removeEventListener('touchmove', scratch);
    overlayCanvas.removeEventListener('touchend', stopScratch);
    isScratching = false; // Reset scratching flag
    activeOverlay = null; // Reset active overlay
    checkWinCondition();
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
    }
}
// Reset game button
document.getElementById('resetButton').addEventListener('click', initializeGame);

// Initialize game on load
window.onload = initializeGame;
