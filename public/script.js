// Function to get query parameters
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params);
}

// Function to set input values
function setInputValues(data) {
    Object.keys(data).forEach(key => {
        const input = document.getElementById(key);
        if (input) {
            input.value = data[key];
            
            // Special handling for archetype to update the visual selection
            if (key === 'archetype' && data[key]) {
                const selectedOption = document.querySelector(`.archetype-option[data-value="${data[key]}"]`);
                if (selectedOption) {
                    // Remove selected class from all options
                    document.querySelectorAll('.archetype-option').forEach(opt => 
                        opt.classList.remove('selected')
                    );
                    // Add selected class to the matching option
                    selectedOption.classList.add('selected');
                }
            }
        }
    });
}

// Function to load initial data
function loadInitialData() {
    const queryParams = getQueryParams();
    
    if (Object.keys(queryParams).length > 0) {
        // Load data from query parameters
        setInputValues(queryParams);
    } else {
        // Pre-populate with user ID 'mona'
        setInputValues({
            firstname: 'Mona',
            lastname: 'Lisa',
            askmeabout: 'lucky the cat',
            jobtitle: 'octocat herder',
            archetype: '', // Default archetype is now blank
            githubhandle: 'mona'
        });
    }
    
    // Update full string after setting initial values
    updateFullString();
    drawBadge(); // Add this line
}

// Call loadInitialData when the page loads
window.addEventListener('load', loadInitialData);

// Handle archetype selection
document.addEventListener('DOMContentLoaded', function() {
    // Get all archetype options
    const archetypeOptions = document.querySelectorAll('.archetype-option');
    const archetypeInput = document.getElementById('archetype');
    
    // No default archetype is selected now (blank by default)
    const defaultOption = null;
    // Clear any previous selection
    archetypeOptions.forEach(opt => opt.classList.remove('selected'));
    // Clear the input value
    archetypeInput.value = '';
    
    // Preload all archetype images for faster rendering
    const preloadArchetypeImages = () => {
        archetypeOptions.forEach(option => {
            const value = option.getAttribute('data-value');
            const img = new Image();
            img.src = `./archetypes/archetype-${value}.png`;
        });
    };
    
    preloadArchetypeImages();
    
    // Add click event listener to each archetype option
    archetypeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            archetypeOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Update hidden input value with the selected archetype
            const value = this.getAttribute('data-value');
            archetypeInput.value = value;
            
            // Update the full string with the new archetype value and redraw the badge
            updateFullString();
            drawBadge(); // Ensure the badge is redrawn immediately
        });
    });
});

const inputs = document.querySelectorAll('input:not(#fullstring)');
const fullStringInput = document.getElementById('fullstring');
const qrcodeContainer = document.getElementById('qrcode');
const canvas = document.getElementById('badgeCanvas');
const ctx = canvas.getContext('2d');
const backgroundImage = new Image();
backgroundImage.src = './back.png';

function updateFullString() {
    const id = '01234567890'; // Static ID for this example
    
    // Create an object to store field values by name
    const fieldValues = {};
    inputs.forEach(input => {
        if (input.name === 'githubhandle') {
            fieldValues[input.name] = input.value ? `@${input.value}`.trim() : '';
        } else {
            fieldValues[input.name] = input.value.trim();
        }
    });

    // Define the order of fields
    const fieldOrder = ['firstname', 'lastname', 'askmeabout', 'jobtitle', 'archetype', 'githubhandle'];

    // Map the ordered fields to their values
    const orderedValues = fieldOrder.map(fieldName => fieldValues[fieldName] || '');

    // Join the values and create the full string
    fullStringInput.value = `${id}iD^${orderedValues.join('^')}^`;
    generateQRCode();
    drawBadge();
}

function generateQRCode() {
    qrcodeContainer.innerHTML = '';
    const qr = qrcode(0, 'L');
    qr.addData(fullStringInput.value);
    qr.make();
    qrcodeContainer.innerHTML = qr.createImgTag(2);
}

// Debounce function to reduce API calls
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Function to fetch GitHub user data
async function fetchGitHubUser(username) {
    try {
        if (username.startsWith('@')) {
            username = username.slice(1);
        }
        if (username) 
        {
            const response = await fetch(`https://api.github.com/users/${username}`);
            if (!response.ok) throw new Error('User not found');
            return await response.json();
        }

    } catch (error) {
        console.error('Error fetching GitHub user:', error);
    }
    return null;
}

// Add this helper function before updateFormWithGitHubData
function cleanJobTitle(title) {
    return title.replace(/\s*@\w+$/, '').trim();
}

// Function to update form fields with GitHub data
function updateFormWithGitHubData(data) {
    if (data) {
        document.getElementById('firstname').value = data.name ? data.name.split(' ')[0] : '';
        document.getElementById('lastname').value = data.name ? data.name.split(' ').slice(1).join(' ') : '';
        document.getElementById('askmeabout').value = data.askmeabout ? data.askmeabout.replace(/^@/, '') : '';
        document.getElementById('jobtitle').value = data.bio ? cleanJobTitle(data.bio.split('.')[0].trim()) : '';
        updateFullString(); // Update the full string with new data
    }
}

// Event handler for GitHub handle input
const handleGitHubInput = debounce(async (event) => {
    const username = event.target.value.trim();
    if (username) {
        const userData = await fetchGitHubUser(username);
        updateFormWithGitHubData(userData);
    }
}, 250); // 250ms delay in key presses before fetching data

// Add event listeners to GitHub handle input
const githubHandleInput = document.getElementById('githubhandle');
githubHandleInput.addEventListener('input', handleGitHubInput);
githubHandleInput.addEventListener('blur', handleGitHubInput);

// Modify the input event listeners to clean job titles
inputs.forEach(input => {
    input.addEventListener('input', (e) => {
        updateFullString();
    });
});

updateFullString(); // Initial generation

const otherInputs = document.querySelectorAll('input:not(#fullstring)');

function parseFullString(fullString) {
    const parts = fullString.split('^');
    const id = parts[0].replace('iD', '');
    const fields = ['firstname', 'lastname', 'askmeabout', 'jobtitle', 'archetype', 'githubhandle'];
    const values = parts.slice(1, -1); // Exclude the last empty element

    const result = { id };
    fields.forEach((field, index) => {
        result[field] = values[index] || '';
    });

    if (result.githubhandle && !result.githubhandle.startsWith('@')) {
        result.githubhandle = '@' + result.githubhandle;
    }

    return result;
}

function updateFieldsFromFullString() {
    const parsed = parseFullString(fullStringInput.value);
    
    otherInputs.forEach(input => {
        if (parsed.hasOwnProperty(input.name)) {
            input.value = parsed[input.name];
        }
    });
}

const debounceUpdateFields = debounce(updateFieldsFromFullString, 250);

fullStringInput.addEventListener('input', debounceUpdateFields);
fullStringInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        updateFieldsFromFullString();
    }
});

// Draw the badge to a canvas element
function drawBadge() {
    // Enable crisp font rendering
    ctx.textRendering = 'optimizeLegibility';
    ctx.imageSmoothingEnabled = false;
    ctx.antialias = 'none';
    
    const margins = {
        left: 8,
        top: 8,
        bottom: 5, // Reduced bottom margin to allow text to go lower
        right: 10
    };
    
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000000';
    
    // Draw first name in bold
    const firstname = document.getElementById('firstname').value;
    let firstnameFontSize = 24;
    ctx.font = `bold ${firstnameFontSize}px "Mona Sans"`;
    
    const availableTextWidth = canvas.width - margins.left - margins.right;
    
    while (ctx.measureText(firstname).width > availableTextWidth && firstnameFontSize > 24) {
        firstnameFontSize--;
        ctx.font = `bold ${firstnameFontSize}px "Mona Sans"`;
    }
    ctx.fillText(firstname, margins.left, margins.top);
    
    // Draw last name in bold
    const lastname = document.getElementById('lastname').value;
    let lastnameFontSize = 18;
    ctx.font = `bold ${lastnameFontSize}px "Mona Sans"`;
    while (ctx.measureText(lastname).width > availableTextWidth && lastnameFontSize > 18) {
        lastnameFontSize--;
        ctx.font = `bold ${lastnameFontSize}px "Mona Sans"`;
    }
    const lastnameY = margins.top + firstnameFontSize + 2;
    ctx.fillText(lastname, margins.left, lastnameY);
    
    // Get GitHub handle and display it immediately below the last name
    let githubhandle = document.getElementById('githubhandle').value;
    if (githubhandle && !githubhandle.startsWith('@')) {
        githubhandle = '@' + githubhandle;
    }
    
    // Place github handle right below the last name
    const githubHandleFontSize = 14;
    ctx.font = `${githubHandleFontSize}px "Mona Sans"`;
    const topGithubHandleY = lastnameY + lastnameFontSize + 3;
    ctx.fillText(githubhandle, margins.left, topGithubHandleY);

    // Check if an archetype is selected and draw the archetype image on the right
    const archetypeValue = document.getElementById('archetype').value;
    if (archetypeValue) {
        const archetypeImage = new Image();
        archetypeImage.src = `./archetypes/archetype-${archetypeValue}.png`;
        
        // Define the archetype image size and position
        const archetypeImageSize = 100;
        
        // Position the archetype image on the right side
        const archetypeX = canvas.width - archetypeImageSize - margins.right - 25; // 25px from right edge
        const archetypeY = margins.top - 15; // Aligned with top margin
        
        if (archetypeImage.complete) {
            ctx.drawImage(archetypeImage, archetypeX, archetypeY, archetypeImageSize, archetypeImageSize);
        } else {
            archetypeImage.onload = function() {
                ctx.drawImage(archetypeImage, archetypeX, archetypeY, archetypeImageSize, archetypeImageSize);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const bwCanvas = convertTo2BitBW(imageData);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(bwCanvas, 0, 0);
            };
        }
    }
    
    // Calculate available space for remaining elements
    const availableHeight = canvas.height - margins.bottom - (topGithubHandleY + githubHandleFontSize + 3);
    const maxElementHeight = Math.floor(availableHeight / 2);

    // Start from bottom for consistent spacing
    let currentY = canvas.height - margins.bottom + 5; // Move down by 5 pixels
    
    // Ask me about (at bottom)
    const askmeabout = document.getElementById('askmeabout').value;
    let askmeaboutY = 0;
    if (askmeabout) {
        askmeaboutY = currentY - Math.floor(maxElementHeight * 0.7); // Reduce the spacing to move text lower
        let askMeAboutFontSize = 14;
        ctx.font = `${askMeAboutFontSize}px "Mona Sans"`;
        const askMeText = `ask me about: ${askmeabout}`;
        while (ctx.measureText(askMeText).width > availableTextWidth && askMeAboutFontSize > 11) {
            askMeAboutFontSize--;
            ctx.font = `${askMeAboutFontSize}px "Mona Sans"`;
        }
        ctx.fillText(askMeText, margins.left, askmeaboutY);
        currentY = askmeaboutY - (maxElementHeight * 0.8); // Increased spacing factor from 0.6 to 0.8
    } else {
        currentY -= maxElementHeight;
    }
    
    // Job title (above ask me about or at bottom if no askmeabout)
    let jobtitleFontSize = 14;
    const jobtitle = document.getElementById('jobtitle').value;
    ctx.font = `${jobtitleFontSize}px "Mona Sans"`;
    while (ctx.measureText(jobtitle).width > availableTextWidth && jobtitleFontSize > 12) {
        jobtitleFontSize--;
        ctx.font = `${jobtitleFontSize}px "Mona Sans"`;
    }
    const jobTitleY = currentY;
    
    // Draw job title
    ctx.font = `${jobtitleFontSize}px "Mona Sans"`;
    ctx.fillText(jobtitle, margins.left, jobTitleY);

    // Convert to 2-bit black and white
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const bwCanvas = convertTo2BitBW(imageData);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bwCanvas, 0, 0);
}

// Replace the font loading with combined font and image loading
Promise.all([
    document.fonts.ready,
    new Promise(resolve => backgroundImage.onload = resolve)
]).then(() => {
    drawBadge();
    
    // Add a function to refresh the badge when archetype is selected from URL params
    const archetypeFromUrl = document.getElementById('archetype').value;
    if (archetypeFromUrl) {
        // Find and mark the selected archetype option
        const selectedOption = document.querySelector(`.archetype-option[data-value="${archetypeFromUrl}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
            // Ensure the badge redraws with the archetype
            setTimeout(drawBadge, 100);
        }
    }
});

// Update the event listener to handle resize
window.addEventListener('resize', drawBadge);

// Convert image data to 2-bit black and white for e-Ink display
function convertTo2BitBW(imageData) {
    const threshold = 200;  // Adjustable threshold for b/w conversion
    const newCanvas = document.createElement('canvas');
    newCanvas.width = imageData.width;
    newCanvas.height = imageData.height;
    const ctx = newCanvas.getContext('2d');
    
    // Create new imageData
    const newImageData = ctx.createImageData(imageData.width, imageData.height);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
        // Convert to grayscale first using standard BT.2100 / HDR factors
        const gray = (imageData.data[i] * 0.2627 + 
                     imageData.data[i + 1] * 0.678 + 
                     imageData.data[i + 2] * 0.0593);
        
        // Convert to black or white (2-bit)
        const bw = gray < threshold ? 0 : 255;
        
        newImageData.data[i] = bw;     // R
        newImageData.data[i + 1] = bw; // G
        newImageData.data[i + 2] = bw; // B
        newImageData.data[i + 3] = 255;// A
    }
    
    ctx.putImageData(newImageData, 0, 0);
    return newCanvas;
}

// DownloadBadge function to get a PNG file from the canvas
function downloadBadge() {
    const canvas = document.getElementById('badgeCanvas');
    const link = document.createElement('a');
    link.download = 'badge.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Add the copyToBadge function to handle the file transfer over serial using the Web Serial API
async function copyToBadge() {
    if ('serial' in navigator) {
        try {
            // Request a serial port
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 115200 });

            const encoder = new TextEncoderStream();
            const writableStreamClosed = encoder.readable.pipeTo(port.writable);
            const writer = encoder.writable.getWriter();

            const decoder = new TextDecoderStream();
            const readableStreamClosed = port.readable.pipeTo(decoder.writable);
            const reader = decoder.readable.getReader();

            // Helper function to send data
            async function sendCommand(command) {
                await writer.write(command + '\r\n');
            }

            // Enter raw REPL mode in Micropython
            await sendCommand('\x03'); // Ctrl-C
            await sendCommand('\x01'); // Ctrl-A
            await sendCommand('');     // Clear the input buffer

            // Prepare files to send
            const pythonCode = `import badger2040
import pngdec

display = badger2040.Badger2040()
png = pngdec.PNG(display.display)

display.led(128)
display.clear()

try:
    png.open_file("badge.png")
    png.decode()
except (OSError, RuntimeError):
    print("Badge background error")

display.update()`;

            // Get canvas image data as binary
            const canvas = document.getElementById('badgeCanvas');
            const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const imageArrayBuffer = await imageBlob.arrayBuffer();
            const imageUint8Array = new Uint8Array(imageArrayBuffer);

            // Send main.py
            await sendCommand(`f = open('main.py', 'w')`);
            const pythonLines = pythonCode.split('\n');
            for (const line of pythonLines) {
                await sendCommand(`f.write('${line}\\n')`);
            }
            await sendCommand(`f.close()`);

            // Send badge.png
            await sendCommand(`f = open('badge.png', 'wb')`);
            const chunkSize = 256;
            for (let i = 0; i < imageUint8Array.length; i += chunkSize) {
                const chunk = imageUint8Array.slice(i, i + chunkSize);
                const hexString = Array.from(chunk).map(b => b.toString(16).padStart(2, '0')).join('');
                await sendCommand(`f.write(bytes.fromhex('${hexString}'))`);
            }
            await sendCommand(`f.close()`);

            // Reset device
            await sendCommand('import machine; machine.reset()'); // Reboot badge

            // Exit raw REPL mode
            await sendCommand('\x04'); // Ctrl-D

            // Close streams and port
            writer.close();
            await writableStreamClosed;
            reader.cancel();
            await readableStreamClosed;
            await port.close();

            alert('Files transferred successfully!');
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while transferring files: ' + error.message);
        }
    } else {
        alert('Web Serial API not supported in this browser.');
    }
}
