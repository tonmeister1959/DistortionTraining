{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww15580\viewh14680\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const audioContext = new (window.AudioContext || window.webkitAudioContext)();\
const frequency = 200; // Hz\
const sampleRate = audioContext.sampleRate;\
const analyser = audioContext.createAnalyser();\
const canvas = document.getElementById('waveform-canvas');\
const canvasCtx = canvas.getContext('2d');\
\
let oscillatorUndistorted;\
let oscillatorDistorted;\
let distortionCurve;\
\
// Function to generate a distortion curve based on a given amount\
// Borrowed and adapted from MDN Web Docs\
function makeDistortionCurve(amount) \{\
    let k = typeof amount === 'number' ? amount : 50; // Amount controls distortion level\
    let n_samples = 44100; // Number of samples for the curve\
    let curve = new Float32Array(n_samples);\
    let deg = Math.PI / 180;\
    let i = 0;\
    let x;\
\
    for (; i < n_samples; ++i) \{\
        x = i * 2 / n_samples - 1;\
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x)); //  Curve calculation\
    \}\
    return curve;\
\}\
\
// Function to update the distortion curve based on the slider value\
function updateDistortion(thdPercentage) \{\
    let amount = thdPercentage;\
    distortionCurve = makeDistortionCurve(amount);\
    if (distortionCurve) \{\
        waveShaper.curve = distortionCurve;\
    \} else \{\
        waveShaper.curve = null; // No distortion\
    \}\
\}\
\
// GUI elements and event listeners\
const thdSlider = document.getElementById('thd-slider');\
const thdValueSpan = document.getElementById('thd-value');\
const startButton = document.getElementById('start-button');\
const stopButton = document.getElementById('stop-button');\
\
thdSlider.addEventListener('input', function() \{\
    let thdPercentage = parseInt(this.value);\
    thdValueSpan.textContent = thdPercentage + '%';\
    updateDistortion(thdPercentage); // Update distortion when slider moves\
\});\
\
// Create oscillator, gain, waveshaper nodes\
oscillatorUndistorted = audioContext.createOscillator(); // Create a new oscillator node\
oscillatorUndistorted.type = 'sine'; // Set oscillator type to sine wave\
oscillatorUndistorted.frequency.setValueAtTime(frequency, audioContext.currentTime);\
\
oscillatorDistorted = audioContext.createOscillator(); // Create another oscillator node\
oscillatorDistorted.type = 'sine'; // Set oscillator type to sine wave\
oscillatorDistorted.frequency.setValueAtTime(frequency, audioContext.currentTime);\
\
const gainNodeUndistorted = audioContext.createGain(); // Create a gain node\
gainNodeUndistorted.gain.setValueAtTime(0.5, audioContext.currentTime);\
\
const gainNodeDistorted = audioContext.createGain(); // Create another gain node\
gainNodeDistorted.gain.setValueAtTime(0.5, audioContext.currentTime);\
\
const waveShaper = audioContext.createWaveShaper(); // Create a waveshaper node\
updateDistortion(thdSlider.value); // Set initial distortion\
\
// Connect the audio graph for undistorted signal\
oscillatorUndistorted.connect(gainNodeUndistorted);\
gainNodeUndistorted.connect(audioContext.destination); // Connect to output\
\
// Connect the audio graph for distorted signal\
oscillatorDistorted.connect(waveShaper); // Apply waveshaping distortion\
waveShaper.connect(gainNodeDistorted);\
gainNodeDistorted.connect(audioContext.destination); // Connect to output\
\
\
// Function to draw waveforms on the canvas\
function draw() \{\
    requestAnimationFrame(draw);\
\
    let bufferLength = analyser.frequencyBinCount; // Number of data points for analysis\
    let dataArray = new Float32Array(bufferLength);\
    analyser.getFloatTimeDomainData(dataArray); // Get time domain data\
\
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas\
\
    canvasCtx.lineWidth = 2; // Set line width\
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)'; // Set stroke color\
    canvasCtx.beginPath();\
\
    let sliceWidth = canvas.width * 1.0 / bufferLength;\
    let x = 0;\
\
    for(let i = 0; i < bufferLength; i++) \{\
        let v = dataArray[i] * 200; // Scale waveform for display\
        let y = canvas.height / 2 + v; // Center the waveform\
\
        if(i === 0) \{\
            canvasCtx.moveTo(x, y);\
        \} else \{\
            canvasCtx.lineTo(x, y);\
        \}\
        x += sliceWidth;\
    \}\
    canvasCtx.stroke(); // Draw the waveform\
\
    // Draw undistorted waveform (optional: could create separate analyser for this)\
    // For simplicity, this example draws only the output of the waveShaper\
\}\
\
// Start playback\
startButton.addEventListener('click', function() \{\
    if (audioContext.state === 'suspended') \{ // Check if context is suspended\
        audioContext.resume(); // Resume if suspended\
    \}\
    oscillatorUndistorted.start(); // Start the undistorted oscillator\
    oscillatorDistorted.start(); // Start the distorted oscillator\
    draw(); // Start visualization\
\});\
\
// Stop playback\
stopButton.addEventListener('click', function() \{\
    oscillatorUndistorted.stop(); // Stop undistorted oscillator\
    oscillatorDistorted.stop(); // Stop distorted oscillator\
    // Recreate oscillators to restart playback if needed\
    oscillatorUndistorted = audioContext.createOscillator();\
    oscillatorUndistorted.type = 'sine';\
    oscillatorUndistorted.frequency.setValueAtTime(frequency, audioContext.currentTime);\
\
    oscillatorDistorted = audioContext.createOscillator();\
    oscillatorDistorted.type = 'sine';\
    oscillatorDistorted.frequency.setValueAtTime(frequency, audioContext.currentTime);\
\
    oscillatorDistorted.connect(waveShaper); // Apply waveshaping distortion\
    waveShaper.connect(gainNodeDistorted);\
\
    gainNodeUndistorted.connect(audioContext.destination); // Connect to output\
    gainNodeDistorted.connect(audioContext.destination); // Connect to output\
\
\});\
}