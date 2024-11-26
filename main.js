const inputImage = document.getElementById('inputImage');
const cropButton = document.getElementById('cropButton');
const undoButton = document.getElementById('undoButton');
const resetButton = document.getElementById('resetButton');
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const resizeButton = document.getElementById('resizeButton');
const downloadImageButton = document.getElementById('downloadImageButton');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const themeSwitch = document.getElementById('themeSwitch');
const fileNameDisplay = document.getElementById('fileName');
const clearButton = document.getElementById('clearButton');

let cropping = false;
let isDragging = false;
let cropStartX = 0, cropStartY = 0, cropEndX = 0, cropEndY = 0;
let previousCanvasState = null;
let originalImage = null; // Store the original image

// Helper function to translate mouse event coordinates to canvas coordinates
function getMousePos(event) {
    const rect = canvas.getBoundingClientRect(); // Get the canvas position and size
    const scaleX = canvas.width / rect.width; // Horizontal scale
    const scaleY = canvas.height / rect.height; // Vertical scale

    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
    };
}

// Theme Switcher
themeSwitch.textContent = 'Switch to Light Mode';
themeSwitch.addEventListener('click', () => {
    const body = document.body;
    if (body.classList.contains('dark-mode')) {
        body.classList.replace('dark-mode', 'light-mode');
        themeSwitch.textContent = 'Switch to Dark Mode';
    } else {
        body.classList.replace('light-mode', 'dark-mode');
        themeSwitch.textContent = 'Switch to Light Mode';
    }
});

// Load and display the image on the canvas
inputImage.addEventListener('change', () => {
    const fileReader = new FileReader();

    fileReader.onload = (e) => {
        const image = new Image();
        image.src = e.target.result;

        image.onload = () => {
            originalImage = image; // Save the original image for reuse

            // Resize the canvas to match the image dimensions
            canvas.width = image.width;
            canvas.height = image.height;

            // Draw the image on the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0);

            fileNameDisplay.textContent = inputImage.files[0]?.name || 'No file selected';

            // Show the "Download Image" button
            downloadImageButton.style.display = 'block';
        };

        image.onerror = () => {
            alert('Error loading image. Please try again with a valid image file.');
        };
    };

    fileReader.onerror = () => {
        alert('Error reading file. Please try again.');
    };

    fileReader.readAsDataURL(inputImage.files[0]);
});

// Start cropping on mousedown
canvas.addEventListener('mousedown', (e) => {
    if (cropping) {
        const pos = getMousePos(e);
        cropStartX = pos.x;
        cropStartY = pos.y;
        isDragging = true;
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (cropping && isDragging) {
        const pos = getMousePos(e);
        const currentX = pos.x;
        const currentY = pos.y;

        // Redraw the image and draw the selection rectangle
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6]); // Optional: dashed line
        ctx.rect(cropStartX, cropStartY, currentX - cropStartX, currentY - cropStartY);
        ctx.stroke();
        ctx.setLineDash([]);
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (cropping && isDragging) {
        const pos = getMousePos(e);
        cropEndX = pos.x;
        cropEndY = pos.y;
        isDragging = false;
        cropImage();
    }
});

// Toggle cropping mode
cropButton.addEventListener('click', () => {
    cropping = !cropping;
});

// Undo changes
undoButton.addEventListener('click', () => {
    if (previousCanvasState) {
        canvas.width = previousCanvasState.width;
        canvas.height = previousCanvasState.height;
        ctx.putImageData(previousCanvasState.data, 0, 0);
    }
});

// Reset to the original image
resetButton.addEventListener('click', () => {
    if (!originalImage) {
        alert('No image to reset. Please upload an image first.');
        return;
    }

    // Reset canvas dimensions and redraw the original image
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0);

    // Preserve the file name
    fileNameDisplay.textContent = inputImage.files[0]?.name || 'No file selected';

    // Clear any cropping or resizing states
    cropping = false;
    isDragging = false;
    cropStartX = 0;
    cropStartY = 0;
    cropEndX = 0;
    cropEndY = 0;
    previousCanvasState = null;

    // Show the reset confirmation AFTER the reset logic is complete
    setTimeout(() => {
        alert('The image has been reset to its original state.');
    }, 100);
});

// Clear the canvas
clearButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Reset canvas dimensions to default (800x600)
    canvas.width = 800;
    canvas.height = 600;

    // Reset the input fields and file input
    widthInput.value = 800;
    heightInput.value = 600;
    inputImage.value = ''; // Clear the file input so it can re-trigger the change event

    // Hide the "Download Image" button
    downloadImageButton.style.display = 'none';

    // Clear related states
    originalImage = null;
    fileNameDisplay.textContent = 'No file selected';
    cropping = false;
    isDragging = false;
    cropStartX = 0;
    cropStartY = 0;
    cropEndX = 0;
    cropEndY = 0;
    previousCanvasState = null;

    setTimeout(() => {
        alert('The image has been cleared.');
    }, 100);});

// Resize the image
resizeButton.addEventListener('click', () => {
    saveCanvasState();

    const width = parseInt(widthInput.value);
    const height = parseInt(heightInput.value);
    const image = new Image();
    image.src = canvas.toDataURL();

    image.onload = () => {
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(image, 0, 0, width, height);

        // Show the "Download Image" button
        downloadImageButton.style.display = 'block';

    setTimeout(() => {
        alert('The image has been reset resized.');
    }, 100);    };
});

// Crop the image
function cropImage() {
    saveCanvasState();

    // Calculate crop dimensions
    const width = Math.abs(cropEndX - cropStartX);
    const height = Math.abs(cropEndY - cropStartY);
    const startX = Math.min(cropStartX, cropEndX);
    const startY = Math.min(cropStartY, cropEndY);

    if (width <= 0 || height <= 0) {
        alert('Invalid crop area. Please select a valid region.');
        return;
    }

    // Extract the cropped image data
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');
    croppedCanvas.width = width;
    croppedCanvas.height = height;

    croppedCtx.drawImage(
        originalImage,
        startX, startY, width, height, // Source image coordinates
        0, 0, width, height           // Destination canvas coordinates
    );

    const croppedImage = new Image();
    croppedImage.src = croppedCanvas.toDataURL();
    croppedImage.onload = () => {
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(croppedImage, 0, 0);

        // Show the "Download Image" button
        downloadImageButton.style.display = 'block';
    };
}

// Save the current canvas state for undo functionality
function saveCanvasState() {
    previousCanvasState = {
        data: ctx.getImageData(0, 0, canvas.width, canvas.height),
        width: canvas.width,
        height: canvas.height,
    };
}

// Download the current canvas state
downloadImageButton.addEventListener('click', () => {
    const imageData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imageData;
    link.download = 'image.png';
    link.click();
});
