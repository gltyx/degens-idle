const enemyStats = {
    "Training Dummy": {
        health: 100,
        power: 1,
        attackSpeed: 1,
        defense: 0,
        critChance: 0,
        critDamage: 1
    },
    "Agent Smith": {
        health: 300,
        power: 10,
        attackSpeed: 3,
        defense: 4,
        critChance: 0,
        critDamage: 1
    },
    "Shao Kahn": {
        health: 600,
        power: 13,
        attackSpeed: 3,
        defense: 10,
        critChance: 0.2,
        critDamage: 2
    },
    "Darth Vader": {
        health: 2800,
        power: 28,
        attackSpeed: 4,
        defense: 25,
        critChance: 0,
        critDamage: 1
    },
    "Isshin": {
        health: 4000,
        power: 8,
        attackSpeed: 45,
        defense: 300,
        critChance: 0.08,
        critDamage: 15
    },
    "Sauron": {
        health: 350000,
        power: 40,
        attackSpeed: 7,
        defense: 15000,
        critChance: 0.03,
        critDamage: 100,
    },
    "Kratos": {
        health: 5e8,
        power: 1,
        attackSpeed: 30,
        defense: 3e6,
        critChance: 0,
        critDamage: 1,
    }
};

let playerAttackSpeed = 2;

// Variables to store player and enemy stats
let playerHealth, playerDefense, playerPower, playerCritChance, playerCritDamage;
let enemyHealth, enemyPower, enemyDefense, enemyCritChance, enemyCritDamage, enemyAttackSpeed;
let playerMaxHealth, enemyMaxHealth, currEnemyName;
let playerInterval, enemyInterval;

// Function to initialize and start the mini-game
function startFightGame(enemyName, enemyImg) {
    return new Promise((resolve) => {
        // Clear the fight log at the start of the fight
        const fightLog = document.getElementById('fightLog');
        fightLog.innerHTML = ''; // Clear previous fight logs

        // Add player and enemy images dynamically
        const playerImageContainer = document.getElementById('playerImageContainer');
        const enemyImageContainer = document.getElementById('enemyImageContainer');

        // Clear any previous images
        playerImageContainer.innerHTML = '';
        enemyImageContainer.innerHTML = '';

        // Create player image element
        const playerImage = document.createElement('img');
        playerImage.src = 'imgs/textures/character.png'; // Dynamic player image source
        playerImage.alt = "Player Image";
        playerImageContainer.appendChild(playerImage);

        // Create enemy image element
        const enemyImage = document.createElement('img');
        enemyImage.src = enemyImg; // Dynamic enemy image source
        enemyImage.alt = "Enemy Image";
        enemyImageContainer.appendChild(enemyImage);

        // Get player stats from resources with rounding up
        playerHealth = Math.ceil((copium ** (1/20)));
        playerMaxHealth = playerHealth;
        playerDefense = Math.ceil((delusion ** (1/12)) / 500);
        playerPower = Math.ceil(power);
        playerCritChance = Math.min(Math.ceil(trollPoints ** (1/50)) / 100, 0.9);
        playerCritDamage = 1 + Math.min(Math.ceil(trollPoints ** (1/25)) / 100, 99);

        currEnemyName = enemyName;

        const enemy = enemyStats[enemyName];

        // Set enemy stats using values from the enemyStats object
        enemyHealth = enemy.health;
        enemyMaxHealth = enemyHealth;
        enemyPower = enemy.power;
        enemyDefense = enemy.defense;
        enemyCritChance = enemy.critChance;
        enemyCritDamage = enemy.critDamage;
        enemyAttackSpeed = enemy.attackSpeed;

        // Populate player and enemy stats in the UI
        document.getElementById('playerHealthStat').innerText = formatNumber(playerHealth);
        document.getElementById('playerPowerStat').innerText = formatNumber(playerPower);
        document.getElementById('playerAttackSpeedStat').innerText = formatNumber(playerAttackSpeed);
        document.getElementById('playerDefenseStat').innerText = formatNumber(playerDefense);
        document.getElementById('playerCritChanceStat').innerText = formatNumber(playerCritChance * 100) + '%';
        document.getElementById('playerCritDamageStat').innerText = formatNumber(playerCritDamage * 100) + '%';

        document.getElementById('enemyHealthStat').innerText = formatNumber(enemyHealth);
        document.getElementById('enemyPowerStat').innerText = formatNumber(enemyPower);
        document.getElementById('enemyAttackSpeedStat').innerText = formatNumber(enemyAttackSpeed);
        document.getElementById('enemyDefenseStat').innerText = formatNumber(enemyDefense);
        document.getElementById('enemyCritChanceStat').innerText = formatNumber(enemyCritChance * 100) + '%';
        document.getElementById('enemyCritDamageStat').innerText = formatNumber(enemyCritDamage * 100) + '%';

        // Update health bars
        updateHealthBars();

        fightEnded = false; // Reset the flag when the fight starts

        // Show the fighting overlay
        document.getElementById('fightingOverlay').style.display = 'flex';

        // Add event listener for the forfeit button
        const forfeitButton = document.getElementById('forfeitButton');
        if (forfeitButton) {
            forfeitButton.disabled = false;
        }
        forfeitButton.onclick = (event) => {
            event.stopPropagation(); // Prevent the click from propagating to the document
            logFight("<span style='color: red;'>You forfeited the fight!</span>");
            fightEnded = true; // Set the flag to true when forfeiting
            clearIntervals(); // Stop the game intervals
            forfeitButton.disabled = true; // Disable the forfeit button to prevent multiple clicks
            resolve(false); // Resolve the promise with a loss
            endFight(true); // Pass true to indicate the player forfeited
        };

        // Start the fight loop
        fightLoop(resolve);
    });
}

function fightLoop(resolve) {
    const playerAttackInterval = 5000 / playerAttackSpeed ; // Player attacks every 2 seconds (fixed)
    const enemyAttackInterval = 5000 / enemyAttackSpeed; // Calculate interval from attack speed

    // Player attack loop
    playerInterval = setInterval(() => {
        if (fightEnded) return; // Stop if the fight has ended

        attackEnemy();

        // Check if the enemy is defeated
        if (enemyHealth <= 0) {
            fightEnded = true; // Set flag to true to indicate the fight has ended
            clearIntervals(); // Stop both intervals
            resolve(true); // Resolve the promise with a win
            endFight(); // End the fight visuals
        }
    }, playerAttackInterval);

    // Enemy attack loop
    enemyInterval = setInterval(() => {
        if (fightEnded) return; // Stop if the fight has ended

        attackPlayer();

        // Check if the player is defeated
        if (playerHealth <= 0) {
            fightEnded = true; // Set flag to true to indicate the fight has ended
            clearIntervals(); // Stop both intervals
            resolve(false); // Resolve the promise with a loss
            endFight(); // End the fight visuals
        }
    }, enemyAttackInterval);
}

// Function to clear both game intervals
function clearIntervals() {
    clearInterval(playerInterval);
    clearInterval(enemyInterval);
}

// Function to update the health bars
function updateHealthBars() {
    // Calculate the percentage of health remaining
    const playerHealthPercent = Math.max((playerHealth / playerMaxHealth) * 100, 0);
    const enemyHealthPercent = Math.max((enemyHealth / enemyMaxHealth) * 100, 0);

    // Update the player's health bar
    const playerHealthBar = document.getElementById('playerHealthBar');
    playerHealthBar.style.width = playerHealthPercent + '%';

    // Update the enemy's health bar
    const enemyHealthBar = document.getElementById('enemyHealthBar');
    enemyHealthBar.style.width = enemyHealthPercent + '%';

    // Display the current health number (one decimal place) on the health bar
    document.querySelector('#playerHealthBar').innerHTML = `<div class="health-number">${playerHealth.toFixed(2)}</div>`;
    document.querySelector('#enemyHealthBar').innerHTML = `<div class="health-number">${enemyHealth.toFixed(2)}</div>`;
}

// Function to handle player attacking the enemy
function attackEnemy() {
    const isCritical = Math.random() < playerCritChance;
    let damage = 0;
    if (currEnemyName == "Sauron"){
        damage = (playerPower - enemyDefense)/5;
        logFight(`You attack ${currEnemyName} for ${formatNumber(Math.max(damage, 0))} damage. (Sauron absorbs 80% of damage and is immune to critical hits)`);
    } else {
        if (!isCritical) {
            damage = playerPower - enemyDefense;
            logFight(`You attack ${currEnemyName} for ${formatNumber(Math.max(damage, 0))} damage!`);
        } else {
            damage = playerPower * (playerCritDamage) - enemyDefense;
            logFight(`<span style='color: #ADD8E6;'>You land a critical hit on ${currEnemyName} for ${formatNumber(Math.max(damage, 0))} damage!</span>`);
        }
    }

    enemyHealth -= Math.max(damage, 0);

    updateHealthBars();
}

// Function to handle enemy attacking the player
function attackPlayer() {
    const isCritical = Math.random() < enemyCritChance;
    let damage = 0;
    if (currEnemyName == "Kratos"){
        damage = enemyPower - playerDefense;
        enemyPower = enemyPower * 1.1;
        logFight(`${currEnemyName} attacks you for ${formatNumber(Math.max(damage, 0))} damage. Kratos continues his combo and his damage grows to ${formatNumber(enemyPower)}!`);
    } else {
        if (!isCritical) {
            damage = enemyPower - playerDefense;
            logFight(`${currEnemyName} attacks you for ${formatNumber(Math.max(damage, 0))} damage!`);
        } else {
            damage = enemyPower * (enemyCritDamage) - playerDefense;
            logFight(`<span style='color: orange;'>${currEnemyName} lands a critical hit for ${formatNumber(Math.max(damage, 0))} damage!</span>`);
        }
    }

    playerHealth -= Math.max(damage, 0);

    updateHealthBars();
}

// Function to log fight actions
function logFight(message) {
    if (fightEnded) return; // Do not log any more messages if the fight has ended

    const fightLog = document.getElementById('fightLog');
    fightLog.innerHTML += `<p>${message}</p>`;
    fightLog.scrollTop = fightLog.scrollHeight; // Scroll to bottom
}

// Function to handle the end of the fight
function endFight(isForfeit = false) {
    fightEnded = true; // Set the flag to true when the fight ends
    clearIntervals(); // Ensure the intervals are stopped

    // Disable the forfeit button
    const forfeitButton = document.getElementById('forfeitButton');
    if (forfeitButton) {
        forfeitButton.disabled = true;
    }

    // Check if the Exit button already exists to prevent duplicates
    if (!document.querySelector('.exit-button')) {
        // Create an Exit button
        const exitButton = document.createElement('button');
        exitButton.innerText = 'Exit';
        exitButton.classList.add('exit-button');
        const fightingOverlay = document.getElementById('fightingOverlay');
        fightingOverlay.appendChild(exitButton);

        // Add event listener to the Exit button to close the fighting overlay
        exitButton.addEventListener('click', () => {
            fightingOverlay.style.display = 'none';
            fightingOverlay.removeChild(exitButton); // Remove the Exit button
            document.removeEventListener('click', handleClickAnywhereOutsideFightLog); // Remove the listener
        });
    }

    // Define the function to handle clicks outside the fight log
    function handleClickAnywhereOutsideFightLog(event) {
        const fightLog = document.getElementById('fightLog');
        if (!fightLog.contains(event.target)) {
            const fightingOverlay = document.getElementById('fightingOverlay');
            fightingOverlay.style.display = 'none';
            const exitButton = document.querySelector('.exit-button');
            if (exitButton) {
                fightingOverlay.removeChild(exitButton); // Remove the Exit button
            }
            document.removeEventListener('click', handleClickAnywhereOutsideFightLog); // Remove the listener
        }
    }

    // Add event listener for any click outside the fight log to close the overlay
    document.addEventListener('click', handleClickAnywhereOutsideFightLog);

    if (isForfeit) {
        // Player forfeited, so they lose and the enemy is taunting
        overlayWinnerLoserText("Loser", "Taunting");
    } else if (playerHealth > 0) {
        logFight("<span style='color: green;'>You are the Winner!</span>");
        overlayWinnerLoserText("Winner", "Dead");
    } else {
        logFight(`<span style='color: red;'>${currEnemyName} is the Winner!</span>`);
        overlayWinnerLoserText("Loser", "Taunting");
    }
}


// Function to overlay Winner/Loser or Taunting/Dead text on the respective images
function overlayWinnerLoserText(playerResult, enemyResult) {
    const playerImageContainer = document.getElementById('playerImageContainer');
    const enemyImageContainer = document.getElementById('enemyImageContainer');

    // Create and style the Player result text elements
    const playerResultText = document.createElement('div');
    playerResultText.innerText = playerResult;
    playerResultText.classList.add('result-text', playerResult === 'Winner' ? 'winner-text' : 'loser-text');
    playerImageContainer.appendChild(playerResultText);

    // Create and style the Enemy result text elements
    const enemyResultText = document.createElement('div');
    if (enemyResult === 'Taunting') {
        enemyResultText.innerText = 'Taunting';
        enemyResultText.classList.add('result-text', 'taunting-text');
    } else {
        enemyResultText.innerText = 'Dead';
        enemyResultText.classList.add('result-text', 'dead-text');
    }
    enemyImageContainer.appendChild(enemyResultText);
}
