
//cooldowns for mini games
let cooldowns = {
    speed: false,
    memory: false,
    math: false,
    luck: false
};

// Mini-game timeouts in milliseconds
const miniGameTimeouts = {
    speed: 8 * 60 * 1000,  // 8 minutes
    memory: 10 * 60 * 1000,  // 10 minutes
    math:  6 * 60 * 1000,    // 6 minutes
    luck: 4* 60 * 1000   // 4 minutes
};

// Object to store interval references for each mini-game
const miniGameIntervals = {};

// Function to play a mini-game of a given type
function playMiniGame(gameType) {
    // Check if the mini-game is on cooldown
    if (cooldowns[gameType]) return;

    // Get the button element for the mini-game
    const button = document.getElementById(`${gameType}Game`);
    button.disabled = true; // Disable the button at the start of the game
    button.classList.remove('affordable'); // Remove the 'affordable' class
    button.classList.add('disabled'); // Add the 'disabled' class to change its appearance

    // Convert mini-game timeouts from milliseconds to minutes for the message
    const cooldownMinutes = (miniGamerSkill ? miniGameTimeouts[gameType] * 0.5 : miniGameTimeouts[gameType]) / (60 * 1000);
    const cooldownMessage = (gameType === 'memory' || gameType === 'math') ? 
        `<br>In ${cooldownMinutes} minutes, you get to test your ${gameType} skills again.` : 
        `<br>In ${cooldownMinutes} minutes, you get to test your ${gameType} again.`;

    // Define the soft cap for each mini-game
    const softCaps = {
        speed: Math.abs(effectiveCopiumPerSecond) * 12 * 60 * 60,  // 12 hours of copium per second
        memory: Math.abs(effectiveDelusionPerSecond) * 12 * 60 * 60,  // 12 hours of delusion per second
        math: Math.abs(effectiveYachtMoneyPerSecond) * 12 * 60 * 60,  // 12 hours of yacht money per second
        luck: Math.abs(effectiveTrollPointsPerSecond) * 12 * 60 * 60  // 12 hours of troll points per second
    };

    let softCapReached = false;  // Variable to check if the soft cap is reached

    // Speed mini-game logic
    if (gameType === 'speed') {
        let points = 0;
        let duration = Math.floor(Math.random() * 6) + 3; // Random duration between 3 and 8 seconds

        // Show the modal and start the game when the modal is closed
        showMessageModal('Speed Game', `Tap on the dots as many times as you can in ${duration} seconds!`, false, false).then(() => {
            // Create a game area
            const gameArea = document.createElement('div');
            gameArea.style.position = 'fixed';
            gameArea.style.top = '5%';
            gameArea.style.left = '5%';
            gameArea.style.width = '90%';
            gameArea.style.height = '90%';
            gameArea.style.backgroundColor = '#000000';
            gameArea.style.zIndex = '1000';
            document.body.appendChild(gameArea);

            // Calculate dot size based on screen size (e.g., 15% of the screen width)
            const dotSize = Math.min(window.innerWidth, window.innerHeight) * (speedGameSkill ? 0.17 : 0.13); // 15% of the smaller dimension

            // Function to create a dot at a random position within the game area
            function createDot() {
                const dot = document.createElement('div');
                dot.style.position = 'absolute';
                dot.style.width = `${dotSize}px`;  // Dot size
                dot.style.height = `${dotSize}px`;
                dot.style.borderRadius = '50%';
                dot.style.backgroundColor = '#ff4444';
                dot.style.cursor = 'pointer';

                // Set random position
                const randomX = Math.random() * (gameArea.clientWidth - dotSize);
                const randomY = Math.random() * (gameArea.clientHeight - dotSize);
                dot.style.left = `${randomX}px`;
                dot.style.top = `${randomY}px`;

                // Add click event listener
                dot.addEventListener('click', function() {
                    points++;
                    gameArea.removeChild(dot); // Remove the clicked dot
                    createDot(); // Create a new dot
                });

                gameArea.appendChild(dot);
            }

            // Create two initial dots
            createDot();
            createDot();

            // End the game after the duration
            setTimeout(() => {
                document.body.removeChild(gameArea); // Remove the game area
                let reward;
                let resultMessage;

                let clicksPerSecond = points / duration;
                if (clicksPerSecond > 0.49) {
                    reward = Math.max(Math.floor(Math.abs(copium) * (clicksPerSecond * 0.15)), 25);
                    if (speedGameSkill) { reward *= 3; }
                    resultMessage = `You tapped ${points} dots (${clicksPerSecond.toFixed(2)} taps per second). Your reward is <span style="color: green;">${formatNumber(reward)}</span> copium!`;
                } else {
                    reward = -Math.max(Math.floor(Math.abs(copium) * 0.25), 25);
                    resultMessage = `You were too slow, managing only ${clicksPerSecond.toFixed(2)} taps per second. You lose <span style="color: red;">${formatNumber(reward)}</span> copium. Try again later!`;
                }



                // Apply the soft cap
                if (reward > softCaps.speed) {
                    reward = softCaps.speed;
                    softCapReached = true;
                }

                copium += reward;

                // Add the soft cap message in orange if applicable
                if (softCapReached) {
                    resultMessage += '<br><span style="color: orange;">Soft cap reached: Maximum reward of 12 hours effective Copium applied.</span>';
                }

                resultMessage += cooldownMessage;

                showMessageModal('Speed Game Result', resultMessage, false, false, null, false, true);
                updateDisplay(); // Update the display
                startCooldown(gameType); // Start cooldown for the mini-game
            }, duration * 1000);
        });
    }

    // Memory mini-game logic
    else if (gameType === 'memory') {
        let gridSize = Math.floor(Math.random() * 3) + 4; // Random size of the grid (3x3,4x4,5x5)
        let sequenceLength = Math.floor(Math.random() * 4) + (memoryGameSkill ? 3 : 4); // Random sequence length between 4 and 7  (3-6 with memoryGameSkill)
        let sequence = [];
        let playerSequence = [];
        let points = 0;

        // Show the modal with instructions and start the game when the modal is closed
        showMessageModal(
            'Memory Game', 
            `<strong>Grid Size:</strong> ${gridSize}x${gridSize}<br>
            <strong>Sequence Length:</strong> ${sequenceLength}<br><br>
            Watch the pattern of dots as they light up, and then click them in the same order! Try to remember the sequence!`,
            false, 
            false
        ).then(() => {

            // Create a game area
            const gameArea = document.createElement('div');
            gameArea.style.position = 'fixed';
            gameArea.style.top = '5%';
            gameArea.style.left = '5%';
            gameArea.style.width = '90%';
            gameArea.style.height = '90%';
            gameArea.style.backgroundColor = '#000000';
            gameArea.style.zIndex = '1000';
            document.body.appendChild(gameArea);

            // Calculate dot size based on screen size
            const dotSize = Math.min(window.innerWidth, window.innerHeight) * 0.15;

            // Create a grid of dots
            function createGrid() {
                for (let i = 0; i < gridSize * gridSize; i++) {
                    const dot = document.createElement('div');
                    dot.style.position = 'absolute';
                    dot.style.width = `${dotSize}px`;
                    dot.style.height = `${dotSize}px`;
                    dot.style.borderRadius = '50%';
                    dot.style.backgroundColor = '#888888';
                    dot.style.cursor = 'pointer';
                    dot.style.opacity = '0.5';

                    // Position the dot in the grid
                    const row = Math.floor(i / gridSize);
                    const col = i % gridSize;
                    dot.style.left = `${(col * dotSize) + (gameArea.clientWidth - (gridSize * dotSize)) / 2}px`;
                    dot.style.top = `${(row * dotSize) + (gameArea.clientHeight - (gridSize * dotSize)) / 2}px`;

                    // Add click event listener
                    dot.addEventListener('click', function () {
                        playerSequence.push(i);
                        highlightDot(dot, '#00FF00'); // Highlight the clicked dot in green

                        if (playerSequence.length === sequence.length) {
                            checkSequence(); // Check the player's sequence when they finish
                        }
                    });

                    gameArea.appendChild(dot);
                }
            }

            // Function to highlight a dot
            function highlightDot(dot, color) {
                dot.style.backgroundColor = color;
                dot.style.opacity = '1';

                // Reset the dot after a short delay
                setTimeout(() => {
                    dot.style.backgroundColor = '#888888';
                    dot.style.opacity = '0.5';
                }, 500);
            }

            // Generate a random sequence of dot indexes
            for (let i = 0; i < sequenceLength; i++) {
                sequence.push(Math.floor(Math.random() * (gridSize * gridSize)));
            }

            // Function to play the sequence (dots light up in order)
            function playSequence() {
                sequence.forEach((index, i) => {
                    const dot = gameArea.children[index];
                    setTimeout(() => {
                        highlightDot(dot, '#FFFF00'); // Highlight the dot in yellow for the sequence
                    }, i * 600); // Delay each highlight for visibility
                });

                setTimeout(() => {
                    enableClicks(); // Enable clicks after the sequence plays
                }, sequence.length * 600);
            }

            // Disable clicks on dots until the sequence plays
            function disableClicks() {
                Array.from(gameArea.children).forEach(dot => {
                    dot.style.pointerEvents = 'none';
                });
            }

            // Enable clicks on dots after the sequence plays
            function enableClicks() {
                Array.from(gameArea.children).forEach(dot => {
                    dot.style.pointerEvents = 'auto';
                });
            }

            // Function to check if the player's sequence matches the correct sequence
            function checkSequence() {
                disableClicks(); // Disable further clicks during check
                let correct = true;

                for (let i = 0; i < sequence.length; i++) {
                    if (sequence[i] !== playerSequence[i]) {
                        correct = false;
                        break;
                    }
                }

                let reward = correct ? Math.max(Math.floor(Math.abs(delusion) * 0.3), 30) : -Math.max(Math.floor(Math.random() * Math.abs(delusion) * 0.2), 20);
                if (memoryGameSkill) reward *= 3; // Triple the reward if memoryGameSkill is true

                // Apply the soft cap
                if (reward > softCaps.memory) {
                    reward = softCaps.memory;
                    softCapReached = true;
                }

                delusion += reward;

                let resultMessage = correct
                    ? `You successfully matched the pattern and earned <span style="color: green;">${formatNumber(reward)}</span> delusion!`
                    : `You failed to match the pattern and lost <span style="color: red;">${formatNumber(Math.abs(reward))}</span> delusion!`;

                if (softCapReached) {
                    resultMessage += '<br><span style="color: orange;">Soft cap reached: Maximum reward of 12 hours effective Delusion applied.</span>';
                }

                resultMessage += cooldownMessage;

                showMessageModal('Memory Game Result', resultMessage, false, false, null, false, false);
                updateDisplay(); // Update the display
                startCooldown(gameType); // Start cooldown for the mini-game
                document.body.removeChild(gameArea); // Remove the game area
            }

            // Start the game logic
            disableClicks(); // Disable clicks before the sequence plays
            createGrid(); // Create the grid of dots
            playSequence(); // Play the sequence for the player to remember
        });
    }



// Math mini-game logic
else if (gameType === 'math') {
    let duration = mathGameSkill ? 20 : 12; // 12 or 20 seconds
    let portalValues = []; // Store all portal values
    let selectedPortals = []; // Store selected portals for checking
    let targetSum = Math.floor(Math.random() * 90) + 10; // Random target sum between 10 and 99
    let startTime = Date.now(); // Track the start time

    // Show the modal with instructions and start the game when the modal is closed
    showMessageModal(
        'Math Portal Puzzle',
        `<strong style="font-size: 1.5em;">Target Sum: ${targetSum}</strong><br><br>
        Click on the portals to select numbers that add up to the target sum!`,
        false,
        false
    ).then(() => {
        // Create a game area
        const gameArea = document.createElement('div');
        gameArea.style.position = 'fixed';
        gameArea.style.top = '5%';
        gameArea.style.left = '5%';
        gameArea.style.width = '90%';
        gameArea.style.height = '90%';
        gameArea.style.backgroundColor = '#000000';
        gameArea.style.zIndex = '1000';
        document.body.appendChild(gameArea);

        // Create and display the target sum on the game screen
        const targetDisplay = document.createElement('div');
        targetDisplay.textContent = `Target: ${targetSum}`;
        targetDisplay.style.position = 'absolute';
        targetDisplay.style.top = '10px';
        targetDisplay.style.left = '50%';
        targetDisplay.style.transform = 'translateX(-50%)';
        targetDisplay.style.color = '#ffffff';
        targetDisplay.style.fontSize = '36px'; // Bigger font size
        targetDisplay.style.fontWeight = 'bold';
        targetDisplay.style.zIndex = '1100'; // Set z-index higher than portals
        gameArea.appendChild(targetDisplay);

        // Create and display the countdown timer on the game screen
        const timerDisplay = document.createElement('div');
        timerDisplay.style.position = 'absolute';
        timerDisplay.style.top = '50px'; // Placed below the target display
        timerDisplay.style.left = '50%';
        timerDisplay.style.transform = 'translateX(-50%)';
        timerDisplay.style.color = '#ffffff';
        timerDisplay.style.fontSize = '36px'; // Bigger font size
        timerDisplay.style.fontWeight = 'bold';
        timerDisplay.style.zIndex = '1100'; // Set z-index higher than portals
        gameArea.appendChild(timerDisplay);

        // Function to update the timer display with 2 decimal places
        const updateTimer = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const timeLeft = Math.max(0, duration - elapsed);
            timerDisplay.textContent = `Time Left: ${timeLeft.toFixed(2)}`;
            return timeLeft;
        };

        // Update the timer every 100 milliseconds (smooth update, but not too frequent)
        const timerInterval = setInterval(() => {
            const timeLeft = updateTimer();
            if (timeLeft <= 0) {
                clearInterval(timerInterval); // Stop the timer when it reaches 0
                endGame(false); // Time ran out, player loses
            }
        }, 100);

        // Function to create a portal with better collision detection
        function createPortal(num) {
            const portal = document.createElement('div');
            const dotSize = Math.min(window.innerWidth, window.innerHeight) * 0.13; // 13% of screen dimensions
            const radius = dotSize / 2; // Radius of the portal
            portal.style.position = 'absolute';
            portal.style.width = `${dotSize}px`;  // Adjusted size
            portal.style.height = `${dotSize}px`;
            portal.style.borderRadius = '50%';
            portal.style.backgroundColor = '#00BFFF';
            portal.style.color = '#ffffff';
            portal.style.display = 'flex';
            portal.style.alignItems = 'center';
            portal.style.justifyContent = 'center';
            portal.style.fontSize = '24px';
            portal.style.cursor = 'pointer';
            portal.style.zIndex = '1000'; // Lower z-index than the target and timer displays
            portal.textContent = num;

            let positionIsValid = false;
            let attempts = 0;
            const maxAttempts = 50; // Limit the number of attempts to prevent infinite loops

            while (!positionIsValid && attempts < maxAttempts) {
                attempts++;
                const randomX = Math.random() * (gameArea.clientWidth - dotSize);
                const randomY = Math.random() * (gameArea.clientHeight - dotSize);

                // Calculate the center of the new portal
                const portalCenterX = randomX + radius;
                const portalCenterY = randomY + radius;

                // Check for overlap with existing portals using circle-based collision detection
                positionIsValid = !Array.from(gameArea.children).some(child => {
                    if (child === portal || child === targetDisplay || child === timerDisplay) return false; // Skip the current portal being placed and the target/timer displays
                    const childRect = child.getBoundingClientRect();
                    const childCenterX = childRect.left + childRect.width / 2;
                    const childCenterY = childRect.top + childRect.height / 2;

                    // Calculate the distance between the centers of the two portals
                    const distance = Math.sqrt((portalCenterX - childCenterX) ** 2 + (portalCenterY - childCenterY) ** 2);

                    return distance < radius * 3; // Check if the distance is less than the sum of the radii
                });

                // If the position is valid, set the portal's position
                if (positionIsValid) {
                    portal.style.left = `${randomX}px`;
                    portal.style.top = `${randomY}px`;
                }
            }

            return portal;
        }

        // Function to generate portals with random values
        function generatePortals() {
            let sumExists = false;
            const totalPortals = mathGameSkill ? 12 : 15; // Limit the number of portals

            for (let i = 0; i < totalPortals; i++) {
                const num = Math.floor(Math.random() * (targetSum - 1)) + 1;
                portalValues.push(num);
                const portal = createPortal(num);
                gameArea.appendChild(portal);

                portal.addEventListener('click', function() {
                    handlePortalClick(portal, num);
                });
            }

            // Ensure at least one combination exists
            portalValues.forEach((num1, index1) => {
                for (let index2 = index1 + 1; index2 < portalValues.length; index2++) {
                    const num2 = portalValues[index2];
                    if (num1 + num2 === targetSum) {
                        sumExists = true;
                    }
                }
            });

            // If no combination exists, add a forced combination
            if (!sumExists) {
                const forcedNum = Math.floor(Math.random() * (targetSum - 1)) + 1;
                const remainingNum = targetSum - forcedNum;
                portalValues.push(forcedNum);
                portalValues.push(remainingNum);
                const forcedPortal1 = createPortal(forcedNum);
                const forcedPortal2 = createPortal(remainingNum);
                gameArea.appendChild(forcedPortal1);
                gameArea.appendChild(forcedPortal2);

                forcedPortal1.addEventListener('click', function() {
                    handlePortalClick(forcedPortal1, forcedNum);
                });
                forcedPortal2.addEventListener('click', function() {
                    handlePortalClick(forcedPortal2, remainingNum);
                });
            }
        }

        // Handle the portal click events
        function handlePortalClick(portal, num) {
            if (!portal.classList.contains('selected')) {
                portal.classList.add('selected');
                selectedPortals.push(num);

                const sum = selectedPortals.reduce((acc, curr) => acc + curr, 0);

                if (sum >= targetSum) {
                    endGame(sum === targetSum); // End the game if the sum is reached or exceeded
                }

                // Remove portal after it's clicked
                gameArea.removeChild(portal);
            }
        }

        // Initialize the game by generating portals
        generatePortals();

        // End the game (win or lose)
        function endGame(didWin) {
            clearInterval(timerInterval); // Stop the timer
            document.body.removeChild(gameArea); // Remove the game area
            let reward;
            let resultMessage;

            if (didWin) {
                reward = Math.max(Math.floor(Math.abs(yachtMoney) * 0.45), 50);
                resultMessage = `You found the correct sum and earned <span style="color: green;">${formatNumber(reward)}</span> yachtMoney!`;
            } else {
                reward = -Math.max(Math.floor(Math.abs(yachtMoney) * 0.2), 20);
                resultMessage = `You didn't find the correct sum. You lost <span style="color: red;">${formatNumber(Math.abs(reward))}</span> yachtMoney.`;
            }

            if (mathGameSkill) {
                reward *= 2; // Double the reward if mathGameSkill is active
            }

            // Apply the soft cap
            if (reward > softCaps.math) {
                reward = softCaps.math;
                softCapReached = true;
            }

            yachtMoney += reward;

            // Add the soft cap message in orange if applicable
            if (softCapReached) {
                resultMessage += '<br><span style="color: orange;">Soft cap reached: Maximum reward of 12 hours effective Yacht Money applied.</span>';
            }

            resultMessage += cooldownMessage;

            showMessageModal('Math Portal Puzzle Result', resultMessage, false, false, null, false, false);
            updateDisplay(); // Update the display
            startCooldown(gameType); // Start cooldown for the mini-game
        }
    });
}

    // Luck mini-game logic
    else if (gameType === 'luck') {
        let boxValues = [];
        let totalBoxes = luckGameSkill ? 5 : 6;

        // Adjust the value ranges based on luckGameSkill
        if (luckGameSkill) {
            boxValues = [
                Math.floor(Math.random() * 56) - 60, // -60% to -5%
                Math.floor(Math.random() * 56) - 60, // -60% to -5%
                Math.floor(Math.random() * 101) + 25, // 25% to 125%
                Math.floor(Math.random() * 101) + 25, // 25% to 125%
                Math.floor(Math.random() * 101) + 25  // 25% to 125%
            ];
        } else {
            boxValues = [
                Math.floor(Math.random() * 66) - 75, // -75% to -10%
                Math.floor(Math.random() * 66) - 75, // -75% to -10%
                Math.floor(Math.random() * 66) - 75, // -75% to -10%
                Math.floor(Math.random() * 91) + 10,  // 10% to 100%
                Math.floor(Math.random() * 91) + 10,  // 10% to 100%
                Math.floor(Math.random() * 91) + 10   // 10% to 100%
            ];
        }

        // Shuffle the box values to randomize the order
        boxValues = boxValues.sort(() => Math.random() - 0.5);

        // Show the modal with instructions and start the game when the modal is closed
        showMessageModal(
            'Luck Game',
            `<strong style="font-size: 1.2em;">Choose a box!</strong><br><br>
            Test your luck and see what fate has in store for you.`,
            false,
            false
        ).then(() => {
            // Create a game area
            const gameArea = document.createElement('div');
            gameArea.style.position = 'fixed';
            gameArea.style.top = '5%';
            gameArea.style.left = '5%';
            gameArea.style.width = '90%';
            gameArea.style.height = '90%';
            gameArea.style.backgroundColor = '#000000';
            gameArea.style.zIndex = '1000';
            document.body.appendChild(gameArea);

            // Create the boxes
            for (let i = 0; i < totalBoxes; i++) {
                const box = document.createElement('div');
                const boxSize = Math.min(window.innerWidth, window.innerHeight) * 0.2; // 20% of screen dimensions
                box.style.position = 'absolute';
                box.style.width = `${boxSize}px`;
                box.style.height = `${boxSize}px`;
                box.style.borderRadius = '10px';
                box.style.backgroundColor = '#444444'; // Darker background for a cooler look
                box.style.color = '#ffffff';
                box.style.display = 'flex';
                box.style.alignItems = 'center';
                box.style.justifyContent = 'center';
                box.style.fontSize = '24px';
                box.style.cursor = 'pointer';
                box.style.textAlign = 'center';
                box.style.boxShadow = '0 0 15px rgba(0, 0, 0, 0.7)'; // Stronger shadow for depth
                box.style.transition = 'transform 0.2s, background-color 0.2s'; // Smooth transition for hover effects
                box.style.userSelect = 'none';
                box.textContent = '???'; // Initially hide the value

                // Add hover effect to make the boxes "pop"
                box.addEventListener('mouseover', () => {
                    box.style.transform = 'scale(1.1)'; // Slightly enlarge the box on hover
                });

                box.addEventListener('mouseout', () => {
                    box.style.transform = 'scale(1)'; // Reset the box size on mouse out
                });

                // Arrange the boxes in 2 rows: 3 on top, 2 or 3 on the bottom (centered if only 5 boxes)
                if (totalBoxes === 5) {
                    box.style.top = i < 2 ? '20%' : '60%';
                    box.style.left = `${30 + (i % 3) * 25}%`; // Centered positioning within the row
                } else {
                    box.style.top = i < 3 ? '20%' : '60%';
                    box.style.left = `${20 + (i % 3) * 25}%`; // Positioning within the row
                }

                // Store the value inside the box
                const boxValue = boxValues[i];

                // Add click event listener
                box.addEventListener('click', function () {
                    // Highlight the box based on win or loss and show the value
                    box.textContent = `${boxValue}%`;
                    box.style.backgroundColor = boxValue >= 0 ? '#00FF00' : '#FF0000'; // Green for win, red for loss

                    // Add a slight tint to all other boxes based on their values
                    Array.from(gameArea.children).forEach((child, index) => {
                        if (child !== box) {
                            const childValue = boxValues[index];
                            child.style.backgroundColor = childValue >= 0 ? '#008800' : '#880000'; // Darker green/red tint for others
                            child.textContent = `${childValue}%`; // Reveal the value
                        }
                    });

                    // End the game after showing all boxes
                    setTimeout(() => {
                        document.body.removeChild(gameArea); // Remove the game area

                        let reward;
                        let resultMessage;

                        // Calculate reward based on the chosen box value
                        reward = Math.floor(Math.abs(trollPoints) * (boxValue / 100));
                        resultMessage = boxValue >= 0 ?
                            `You chose a lucky box and gained <span style="color: green;">${formatNumber(reward)}</span> troll points!` :
                            `You chose an unlucky box and lost <span style="color: red;">${formatNumber(Math.abs(reward))}</span> troll points.`;

                        // Apply the soft cap
                        if (reward > softCaps.luck) {
                            reward = softCaps.luck;
                            softCapReached = true;
                        }

                        trollPoints += reward;

                        // Add the soft cap message in orange if applicable
                        if (softCapReached) {
                            resultMessage += '<br><span style="color: orange;">Soft cap reached: Maximum reward of 12 hours effective Troll Points applied.</span>';
                        }

                resultMessage += cooldownMessage;

                        showMessageModal('Luck Game Result', resultMessage, false, false, null, false, false);
                        updateDisplay(); // Update the display
                        startCooldown(gameType); // Start cooldown for the mini-game
                    }, 1250); // 1.25-second delay to show all boxes
                });

                // Append the box to the game area
                gameArea.appendChild(box);
            }
        });
    }




}

            


function startCooldown(gameType) {
    const button = document.getElementById(`${gameType}Game`);
    const startTime = Date.now();
    const cooldownDuration = miniGamerSkill ? miniGameTimeouts[gameType] * 0.75 : miniGameTimeouts[gameType];

    localStorage.setItem(`${gameType}CooldownStart`, startTime);

    cooldowns[gameType] = true;
    if (button) {
        button.classList.remove('affordable');
        button.classList.add('disabled');
        button.disabled = true;

        let progressBar = button.querySelector('.progress');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'progress';
            button.appendChild(progressBar);
        }
        progressBar.style.width = '0%';

        const interval = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const progressPercent = (elapsedTime / cooldownDuration) * 100;
            progressBar.style.width = `${progressPercent}%`;

            if (elapsedTime >= cooldownDuration) {
                clearInterval(interval);
                cooldowns[gameType] = false;
                button.disabled = false;
                button.classList.remove('disabled');
                button.classList.add('affordable');
                progressBar.style.width = '100%';
            }
        }, 200);

        // Set timeout to reset button state after cooldown ends
        setTimeout(() => {
            cooldowns[gameType] = false;
            if (button) {
                button.disabled = false;
                button.classList.remove('disabled');
                button.classList.add('affordable');
            }
        }, cooldownDuration);
    }
}




function unlockMiniGames() {
    const now = Date.now();

    Object.keys(miniGameTimeouts).forEach(gameType => {
        const startTime = localStorage.getItem(`${gameType}CooldownStart`);
        const button = document.getElementById(`${gameType}Game`);
        const progressBar = button.querySelector('.progress');

        button.style.display = 'block';

        if (startTime) {
            const elapsed = now - parseInt(startTime, 10);
            const cooldownDuration = miniGamerSkill ? miniGameTimeouts[gameType] * 0.75 : miniGameTimeouts[gameType];

            if (elapsed >= cooldownDuration) {
                cooldowns[gameType] = false;
                button.disabled = false;
                button.classList.remove('disabled');
                button.classList.add('affordable');
                if (progressBar) {
                    progressBar.style.width = '100%';
                }
            } else {
                const remainingCooldown = cooldownDuration - elapsed;
                const progressPercent = (elapsed / cooldownDuration) * 100;

                button.disabled = true;
                button.classList.add('disabled');
                button.classList.remove('affordable');
                if (progressBar) {
                    progressBar.style.width = `${progressPercent}%`;
                }

                const interval = setInterval(() => {
                    const newElapsed = Date.now() - parseInt(startTime, 10);
                    const newProgressPercent = (newElapsed / cooldownDuration) * 100;

                    if (newElapsed >= cooldownDuration) {
                        clearInterval(interval);
                        button.disabled = false;
                        button.classList.remove('disabled');
                        button.classList.add('affordable');
                        if (progressBar) {
                            progressBar.style.width = '100%';
                        }
                    } else {
                        if (progressBar) {
                            progressBar.style.width = `${newProgressPercent}%`;
                        }
                    }
                }, 100);
            }
        } else {
            startCooldown(gameType);
        }
    });
}