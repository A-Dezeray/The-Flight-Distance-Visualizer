// Canvas setup
const canvas = document.getElementById('flightCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Flight data
let flightData = {
    wingspan: 10,
    distance: 0,
    maxHeight: 0,
    flightTime: 0,
    trajectory: []
};

let isAnimating = false;
let animationProgress = 0;
let animationSpeed = 0.01;

// Get DOM elements
const wingspanInput = document.getElementById('wingspan');
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');
const resultsDiv = document.getElementById('results');

// Calculate flight parameters based on wingspan
function calculateFlight(wingspan) {
    // Physics-inspired calculations
    // Larger wingspan = more lift, better glide ratio, longer distance

    // Base calculations
    const liftCoefficient = wingspan * 0.15; // Lift increases with wingspan
    const dragCoefficient = 1 / (wingspan * 0.08); // Drag decreases with larger wingspan
    const glideRatio = liftCoefficient / dragCoefficient;

    // Flight parameters
    const initialHeight = 50; // Starting height in meters
    const initialVelocity = 25; // Starting velocity in m/s

    // Calculate maximum distance (simplified aerodynamic model)
    const distance = initialHeight * glideRatio + wingspan * 5;

    // Calculate maximum height (slight climb before descent)
    const maxHeight = initialHeight + (wingspan * 0.8);

    // Calculate flight time
    const flightTime = distance / initialVelocity;

    // Generate trajectory points
    const trajectory = [];
    const points = 100;

    for (let i = 0; i <= points; i++) {
        const progress = i / points;
        const x = progress * distance;

        // Parabolic trajectory with initial climb
        const climbPhase = 0.15; // First 15% is climb
        let y;

        if (progress < climbPhase) {
            // Climbing phase
            y = initialHeight + (maxHeight - initialHeight) * (progress / climbPhase);
        } else {
            // Descending phase (parabolic)
            const descentProgress = (progress - climbPhase) / (1 - climbPhase);
            y = maxHeight * (1 - Math.pow(descentProgress, 1.5));
        }

        trajectory.push({ x, y });
    }

    return {
        wingspan,
        distance: Math.round(distance * 10) / 10,
        maxHeight: Math.round(maxHeight * 10) / 10,
        flightTime: Math.round(flightTime * 10) / 10,
        trajectory
    };
}

// Draw the chart grid and axes
function drawChart() {
    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;

    // Draw grid lines
    for (let i = 0; i <= 10; i++) {
        const x = padding + (chartWidth / 10) * i;
        const y = padding + (chartHeight / 10) * i;

        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, canvas.height - padding);
        ctx.stroke();

        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';

    // X-axis label
    ctx.fillText('Distance (m)', canvas.width / 2, canvas.height - 20);

    // Y-axis label
    ctx.save();
    ctx.translate(20, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Height (m)', 0, 0);
    ctx.restore();

    // Draw scale markers
    ctx.font = '12px Arial';
    const maxDistance = flightData.distance;
    const maxHeight = flightData.maxHeight;

    // X-axis markers
    for (let i = 0; i <= 5; i++) {
        const x = padding + (chartWidth / 5) * i;
        const value = Math.round((maxDistance / 5) * i);
        ctx.fillText(value, x, canvas.height - padding + 20);
    }

    // Y-axis markers
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const y = canvas.height - padding - (chartHeight / 5) * i;
        const value = Math.round((maxHeight * 1.2 / 5) * i);
        ctx.fillText(value, padding - 10, y + 5);
    }
}

// Draw the flight trajectory
function drawTrajectory(progress = 1) {
    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    const maxDistance = flightData.distance;
    const maxHeight = flightData.maxHeight * 1.2; // Add some padding

    ctx.strokeStyle = '#28a745';
    ctx.lineWidth = 3;
    ctx.beginPath();

    const pointsToDraw = Math.floor(flightData.trajectory.length * progress);

    for (let i = 0; i < pointsToDraw; i++) {
        const point = flightData.trajectory[i];
        const x = padding + (point.x / maxDistance) * chartWidth;
        const y = canvas.height - padding - (point.y / maxHeight) * chartHeight;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.stroke();

    // Draw starting point
    if (pointsToDraw > 0) {
        const startPoint = flightData.trajectory[0];
        const startX = padding + (startPoint.x / maxDistance) * chartWidth;
        const startY = canvas.height - padding - (startPoint.y / maxHeight) * chartHeight;

        ctx.fillStyle = '#28a745';
        ctx.beginPath();
        ctx.arc(startX, startY, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw ending point if animation is complete
    if (progress >= 1) {
        const endPoint = flightData.trajectory[flightData.trajectory.length - 1];
        const endX = padding + (endPoint.x / maxDistance) * chartWidth;
        const endY = canvas.height - padding - (endPoint.y / maxHeight) * chartHeight;

        ctx.fillStyle = '#dc3545';
        ctx.beginPath();
        ctx.arc(endX, endY, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw the airplane
function drawPlane(progress) {
    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    const maxDistance = flightData.distance;
    const maxHeight = flightData.maxHeight * 1.2;

    const index = Math.min(
        Math.floor(progress * flightData.trajectory.length),
        flightData.trajectory.length - 1
    );
    const point = flightData.trajectory[index];

    const x = padding + (point.x / maxDistance) * chartWidth;
    const y = canvas.height - padding - (point.y / maxHeight) * chartHeight;

    // Calculate rotation based on trajectory slope
    let angle = 0;
    if (index < flightData.trajectory.length - 1) {
        const nextPoint = flightData.trajectory[index + 1];
        const dx = nextPoint.x - point.x;
        const dy = nextPoint.y - point.y;
        angle = Math.atan2(-dy, dx);
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Draw airplane body
    const scale = 0.8;

    // Fuselage
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20 * scale, 5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    ctx.fillStyle = '#34495e';
    ctx.beginPath();
    ctx.moveTo(-15 * scale, 0);
    ctx.lineTo(-5 * scale, -15 * scale);
    ctx.lineTo(10 * scale, -15 * scale);
    ctx.lineTo(15 * scale, 0);
    ctx.lineTo(10 * scale, 15 * scale);
    ctx.lineTo(-5 * scale, 15 * scale);
    ctx.closePath();
    ctx.fill();

    // Nose
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(20 * scale, 0, 4 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Tail
    ctx.fillStyle = '#34495e';
    ctx.beginPath();
    ctx.moveTo(-20 * scale, 0);
    ctx.lineTo(-25 * scale, -8 * scale);
    ctx.lineTo(-20 * scale, -5 * scale);
    ctx.closePath();
    ctx.fill();

    // Windows
    ctx.fillStyle = '#3498db';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc((5 - i * 6) * scale, 0, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

// Animation loop
function animate() {
    if (!isAnimating) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw chart
    drawChart();

    // Draw trajectory up to current progress
    drawTrajectory(animationProgress);

    // Draw airplane
    drawPlane(animationProgress);

    // Update progress
    animationProgress += animationSpeed;

    if (animationProgress >= 1) {
        animationProgress = 1;
        isAnimating = false;
    }

    if (isAnimating || animationProgress >= 1) {
        requestAnimationFrame(animate);
    }
}

// Update results display
function updateResults() {
    document.getElementById('wingspanDisplay').textContent = flightData.wingspan;
    document.getElementById('distanceDisplay').textContent = flightData.distance;
    document.getElementById('heightDisplay').textContent = flightData.maxHeight;
    document.getElementById('timeDisplay').textContent = flightData.flightTime;
    resultsDiv.style.display = 'block';
}

// Calculate button handler
calculateBtn.addEventListener('click', () => {
    const wingspan = parseFloat(wingspanInput.value);

    if (wingspan < 1 || wingspan > 100) {
        alert('Please enter a wingspan between 1 and 100 meters');
        return;
    }

    // Calculate flight data
    flightData = calculateFlight(wingspan);

    // Update results
    updateResults();

    // Start animation
    animationProgress = 0;
    isAnimating = true;
    animate();
});

// Reset button handler
resetBtn.addEventListener('click', () => {
    wingspanInput.value = 10;
    resultsDiv.style.display = 'none';
    isAnimating = false;
    animationProgress = 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Initial draw
ctx.fillStyle = '#333';
ctx.font = '20px Arial';
ctx.textAlign = 'center';
ctx.fillText('Enter a wingspan and click "Calculate Flight" to begin', canvas.width / 2, canvas.height / 2);
