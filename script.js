document.querySelectorAll('img').forEach(img => {
    img.setAttribute('draggable', 'false');
});
const customCursor = document.getElementById('customCursor');
let mouseX = 0;
let mouseY = 0;
let cursorX = 0;
let cursorY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.1;
    cursorY += (mouseY - cursorY) * 0.1;
    customCursor.style.left = cursorX + 'px';
    customCursor.style.top = cursorY + 'px';
    requestAnimationFrame(animateCursor);
}
animateCursor();

let clickCount = 0;
let mittenCount = 0;
let snowmanCount = 0;
let hotChocolateCount = 0;
let gingerbreadCount = 0;
let gingerbreadHouseCount = 0;
let snowBankPurchased = false;
let autoClickInterval = null;
let gingerbreadCookies = 0;
let goldenMittenPurchased = false;
let goldenSnowmanPurchased = false;
let rightClickPressed = false;
let mittenHistory = [];
let activeSnowflakes = 0;
let unlockedAchievements = new Set();
let activeBuffs = {};
let buffTimers = {};
let rebirthMultiplier = 1;

let stockPrice = 1.00;
let ownedStocks = 0;
let successfulTradesCount = 0;
let tradingSessionActive = false;
let tradingSessionTime = 0;
let stockPriceInterval = null;
let tradingSessionInterval = null;
let sessionStartTime = 0;
let priceEverOver105 = false;
let previousPrice = 1.00;
const snowmanNames = [
    "Jack Frost", "Elsa", "Olaf", "Kristoff", "Sven", "Anna",
    "Winter", "Chilly", "Frosty", "Snowy", "Ice", "Crystal",
    "Blizzard", "North", "Polar", "Arctic"
];
const gingerbreadNames = [ 
    "Ginger", "Cookie", "Sprinkle", "Candy", "Holly", "Noel",
    "Jingle", "Merry", "Twinkle", "Sparkle", "Berry", "Crispy",
    "Chewy", "Sweetie", "Crumb", "Butters"
];
const achievementData = {
    'getting_mittens': { title: 'Mitten Collector', description: 'Acquire your first mitten' },
    'out_of_hand': { title: 'Out of Hand', description: 'Build up 3 mittens' },
    'jolly_happy_soul': { title: 'Frosty Friend', description: 'Create your first snowman' },
    'snowmen': { title: 'Snowman Army', description: 'Build 2 snowmen' },
    'disappearing': { title: 'Winter Wonderland', description: 'Create 6 snowmen' },
    'house_please': { title: 'Sweet Treats', description: 'Bake your first gingerbread man' },
    'thanks_gingerbread_man': { title: 'Gingerbread Architect', description: 'Build your first gingerbread house' },
    'rebirths_unlocked': { title: 'Winter Rebirth', description: 'Gather 1000 snowballs to unlock rebirths' }
};

const buffData = {
    'double_earnings': {
        name: 'Earnings Blizzard',
        description: 'Double all earnings for 5 minutes of snowball frenzy!',
        duration: 300000,
        probability: 20,
        type: 'earnings_multiplier',
        value: 2
    },
    'triple_earnings': {
        name: 'Triple Earnings Storm',
        description: 'Triple all earnings for 3 minutes of winter madness!',
        duration: 180000,
        probability: 16,
        type: 'earnings_multiplier',
        value: 3
    },
    'half_off': {
        name: 'Winter Sale',
        description: 'All upgrades cost half price for 1 minute!',
        duration: 60000,
        probability: 4,
        type: 'cost_reduction',
        value: 0.5
    },
    'mitten_overload': {
        name: 'Mitten Mania',
        description: 'All mittens cost only 1 snowball each!',
        duration: -1,
        probability: 8,
        type: 'mitten_cost_override',
        value: 1,
    },
    'double_rebirth': {
        name: 'Lucky Rebirth',
        description: 'Your next rebirth will give double gingerbread cookies!',
        duration: -1,
        probability: 8,
        type: 'rebirth_multiplier',
        value: 2,
    },
    'triple_rebirth': {
        name: 'Mega Rebirth',
        description: 'Your next rebirth will give triple gingerbread cookies!',
        duration: -1,
        probability: 4,
        type: 'rebirth_multiplier',
        value: 3,
    },
    'tap_frenzy': {
        name: 'Tap Frenzy',
        description: 'Each tap gives 50 snowballs for 3 minutes!',
        duration: 180000,
        probability: 20,
        type: 'tap_bonus',
        value: 50,
    },
    'ultra_tap_frenzy': {
        name: 'Ultra Tap Frenzy',
        description: 'Each tap gives 100 snowballs for 5 minutes!',
        duration: 300000,
        probability: 12,
        type: 'tap_bonus',
        value: 100,
    },
    'snowman_bonus': {
        name: 'Frosty Boost',
        description: 'Snowmen produce double earnings for 2 minutes!',
        duration: 120000,
        probability: 4,
        type: 'snowman_multiplier',
        value: 2,
    },
    'ultra_snowman_bonus': {
        name: 'Arctic Power',
        description: 'Snowmen produce triple earnings for 3 minutes!',
        duration: 180000,
        probability: 4,
        type: 'snowman_multiplier',
        value: 3
    }
};

function selectRandomBuff() {
    const rand = Math.random() * 100;
    let cumulativeProbability = 0;

    for (const [buffId, buff] of Object.entries(buffData)) {
        cumulativeProbability += buff.probability;
        if (rand <= cumulativeProbability) {
            return buffId;
        }
    }

    return 'double_earnings';
}

function activateBuff(buffId) {
    const buff = buffData[buffId];
    if (!buff) return;

    for (const [existingBuffId, existingBuff] of Object.entries(activeBuffs)) {
        if (existingBuff.type === buff.type) {
            deactivateBuff(existingBuffId);
        }
    }

    activeBuffs[buffId] = buff;

    showAchievement(buff.name, buff.description);

    if (buff.duration > 0) {
        buffTimers[buffId] = setTimeout(() => {
            deactivateBuff(buffId);
        }, buff.duration);
    } else if (buff.type === 'rebirth_multiplier') {
        rebirthMultiplier *= buff.value;
    }

    updateAutoClick();
    updateUpgradeDisplay();
}

function deactivateBuff(buffId) {
    if (activeBuffs[buffId]) {
        delete activeBuffs[buffId];
    }

    if (buffTimers[buffId]) {
        clearTimeout(buffTimers[buffId]);
        delete buffTimers[buffId];
    }

    updateAutoClick();
    updateUpgradeDisplay();
}

function getCurrentEarningsMultiplier() {
    let multiplier = 1;

    for (const buff of Object.values(activeBuffs)) {
        if (buff.type === 'earnings_multiplier') {
            multiplier *= buff.value;
        }
    }

    return multiplier;
}

function getCurrentSnowmanMultiplier() {
    let multiplier = 1;

    for (const buff of Object.values(activeBuffs)) {
        if (buff.type === 'snowman_multiplier') {
            multiplier *= buff.value;
        }
    }

    return multiplier;
}

function getCurrentTapBonus() {
    let bonus = 0;

    for (const buff of Object.values(activeBuffs)) {
        if (buff.type === 'tap_bonus') {
            bonus = Math.max(bonus, buff.value);
        }
    }

    return bonus;
}

function getCurrentCostMultiplier() {
    let multiplier = 1;

    for (const buff of Object.values(activeBuffs)) {
        if (buff.type === 'cost_reduction') {
            multiplier *= buff.value;
        }
    }

    return multiplier;
}

function getMittenCostOverride() {
    for (const buff of Object.values(activeBuffs)) {
        if (buff.type === 'mitten_cost_override') {
            return buff.value;
        }
    }

    return null;
}
const baseMittenCost = 10;
const baseSnowmanCost = 50;
const baseGingerbreadCost = 250;
const baseGingerbreadHouseCost = 1000;
const baseHotChocolateCost = 2500;
const snowBankCost = 10000;
const maxMittens = 32;
const counterElement = document.getElementById('counter');
const mittenUpgrade = document.getElementById('mitten-upgrade');
const mittenCostElement = document.getElementById('mitten-cost');
const snowmanUpgrade = document.getElementById('snowman-upgrade');
const snowmanCostElement = document.getElementById('snowman-cost');
const hotChocolateUpgrade = document.getElementById('hotchocolate-upgrade');
const hotChocolateCostElement = document.getElementById('hotchocolate-cost');
const snowBankUpgrade = document.getElementById('snowbank-upgrade');
const snowBankCostElement = document.getElementById('snowbank-cost');
const gingerbreadUpgrade = document.getElementById('gingerbread-upgrade');
const gingerbreadCostElement = document.getElementById('gingerbread-cost');
const gingerbreadHouseUpgrade = document.getElementById('gingerbreadhouse-upgrade');
const gingerbreadHouseCostElement = document.getElementById('gingerbreadhouse-cost');
const snowballContainer = document.getElementById('snowball-container');
const snowball = document.querySelector('.snowball');

const stockPriceElement = document.getElementById('stock-price');
const ownedStocksElement = document.getElementById('owned-stocks');
const portfolioValueElement = document.getElementById('portfolio-value');
const tradingTimerElement = document.getElementById('trading-timer');
const buyAmountInput = document.getElementById('buy-amount');
const buyStockButton = document.getElementById('buy-stock');
const sell25Button = document.getElementById('sell-25');
const sell50Button = document.getElementById('sell-50');
const sell100Button = document.getElementById('sell-100');

function getMittenCost(count) {
    const overrideCost = getMittenCostOverride();
    if (overrideCost !== null) {
        return overrideCost;
    }

    if (count < 10) {
        return Math.ceil(baseMittenCost * Math.pow(1.05, count));
    } else if (count < 16) {
        const costAt9 = baseMittenCost * Math.pow(1.05, 9);
        return Math.ceil(costAt9 * Math.pow(1.1, count - 9));
    } else if (count < 32) {
        const costAt9 = baseMittenCost * Math.pow(1.05, 9);
        const costAt15 = costAt9 * Math.pow(1.1, 6);
        return Math.ceil(costAt15 * Math.pow(1.25, count - 15));
    }
    return Infinity;
}

function getSnowmanCost(count) {
    return Math.ceil(baseSnowmanCost * Math.pow(1.15, count));
}

function getHotChocolateCost(count) {
    return Math.ceil(baseHotChocolateCost * Math.pow(1.08, count));
}

function getGingerbreadCost(count) {
    return Math.ceil(baseGingerbreadCost * Math.pow(1.03, count));
}

function getGingerbreadHouseCost(count) {
    return Math.ceil(baseGingerbreadHouseCost * Math.pow(1.06, count));
}

function incrementClick(event) {
    let incrementAmount = 1;

    const tapBonus = getCurrentTapBonus();
    if (tapBonus > 0) {
        incrementAmount = tapBonus;
    }

    const earningsMultiplier = getCurrentEarningsMultiplier();
    incrementAmount *= earningsMultiplier;

    clickCount += incrementAmount;
    counterElement.textContent = clickCount;
    checkAchievements();

    showFallingText(incrementAmount, event);

    if (activeSnowflakes < 50) {
        activeSnowflakes++;
        const snowflake = document.createElement('img');
        snowflake.src = 'snowflake.webp';
        snowflake.className = 'snowflake';
        snowflake.setAttribute('draggable', 'false');
        const leftSidebarWidth = 600;
        const rightSidebarWidth = 300;
        const minX = leftSidebarWidth;
        const maxX = window.innerWidth - rightSidebarWidth - 120;
        snowflake.style.left = Math.random() * (maxX - minX) + minX + 'px';
        snowflake.style.top = '-120px';
        snowflake.style.animationDuration = (Math.random() * 2 + 1) + 's';
        document.body.appendChild(snowflake);

        setTimeout(() => {
            snowflake.remove();
            activeSnowflakes--;
        }, 3000);
    }
}

function getVisibleMittenCount(total) {
    if (total <= 4) return total;
    if (total <= 8) return Math.ceil(total / 2);
    if (total <= 16) return Math.ceil(total / 4);
    if (total <= 32) return Math.ceil(total / 8);
    return 16;
}

function updateMittenDisplay() {
    const visibleCount = getVisibleMittenCount(mittenCount);
    let mittens = snowballContainer.querySelectorAll('.mitten');

    while (mittens.length > visibleCount) {
        mittens[mittens.length - 1].remove();
        mittens = snowballContainer.querySelectorAll('.mitten');
    }

    while (mittens.length < visibleCount) {
        const mitten = document.createElement('img');
        mitten.setAttribute('draggable', 'false');
        let mittenType;
        if (mittenHistory.length >= 3 &&
            mittenHistory[mittenHistory.length - 1] === mittenHistory[mittenHistory.length - 2] &&
            mittenHistory[mittenHistory.length - 2] === mittenHistory[mittenHistory.length - 3]) {
            mittenType = mittenHistory[mittenHistory.length - 1] === 'mitten.webp' ? 'mitten2.png' : 'mitten.webp';
        } else {
            mittenType = Math.random() < 0.5 ? 'mitten.webp' : 'mitten2.png';
        }
        mitten.src = mittenType;
        mittenHistory.push(mittenType);
        if (mittenHistory.length > 3) {
            mittenHistory.shift();
        }
        mitten.className = 'mitten';
        mitten.style.animationDelay = (mittens.length * 0.5) + 's';
        snowballContainer.appendChild(mitten);
        mittens = snowballContainer.querySelectorAll('.mitten');
    }
}

function showFallingText(amount, event) {
    const textElement = document.createElement('div');
    textElement.className = 'falling-text';
    textElement.textContent = '+' + amount;

    let x, y;
    if (event && event.clientX && event.clientY) {
        x = event.clientX + (Math.random() - 0.5) * 120;
        y = event.clientY - 15 - Math.random() * 10;
    } else {
        const rect = snowballContainer.getBoundingClientRect();
        x = rect.left + rect.width / 2 + (Math.random() - 0.5) * 80;
        y = rect.top + rect.height / 2 - 20 - Math.random() * 15;
    }
    const viewportWidth = window.innerWidth;
    const textWidth = 60;
    x = Math.max(textWidth / 2, Math.min(viewportWidth - textWidth / 2, x));

    textElement.style.left = x + 'px';
    textElement.style.top = y + 'px';
    textElement.style.animationDuration = (Math.random() * 0.4 + 0.8) + 's';
    document.body.appendChild(textElement);

    setTimeout(() => {
        textElement.remove();
    }, 1800);
}

function showAchievement(title, description) {
    const container = document.getElementById('achievement-container');
    const achievement = document.createElement('div');
    achievement.className = 'achievement';
    achievement.innerHTML = `
        <div class="achievement-title">${title}</div>
        <div class="achievement-description">${description}</div>
    `;
    container.appendChild(achievement);
    updateAchievementsButton();

    setTimeout(() => {
        achievement.classList.add('fade-out');
        setTimeout(() => {
            achievement.remove();
            updateAchievementsButton();
        }, 500);
    }, 3000);
}

function updateAchievementsButton() {
    const container = document.getElementById('achievement-container');
    const button = document.getElementById('achievements-button');
    if (container.children.length > 0) {
        button.classList.remove('visible');
    } else {
        button.classList.add('visible');
    }
}

function renderAchievementsList(searchTerm = '') {
    const list = document.getElementById('achievements-list');
    list.innerHTML = '';

    const filtered = Array.from(unlockedAchievements).filter(id => {
        if (!searchTerm) return true;
        const achievement = achievementData[id];
        if (!achievement) return false;
        const searchLower = searchTerm.toLowerCase();
        return achievement.title.toLowerCase().includes(searchLower) ||
               achievement.description.toLowerCase().includes(searchLower);
    });

    if (filtered.length === 0) {
        const empty = document.createElement('div');
        empty.style.padding = '12px';
        empty.style.opacity = '0.5';
        empty.textContent = unlockedAchievements.size === 0 ? 'No achievements earned yet' : 'No achievements match your search';
        list.appendChild(empty);
        return;
    }

    filtered.forEach(id => {
        const achievement = achievementData[id];
        if (!achievement) return;

        const item = document.createElement('div');
        item.className = 'achievement-item';
        item.innerHTML = `
            <div class="achievement-item-title">${achievement.title}</div>
            <div class="achievement-item-description">${achievement.description}</div>
        `;
        list.appendChild(item);
    });
}

const achievementsButton = document.getElementById('achievements-button');
const achievementsPopover = document.getElementById('achievements-popover');
const achievementsSearch = document.getElementById('achievements-search');

achievementsButton.addEventListener('click', function(e) {
    e.stopPropagation();
    achievementsPopover.classList.toggle('visible');
    if (achievementsPopover.classList.contains('visible')) {
        renderAchievementsList();
        achievementsSearch.focus();
    }
});

achievementsSearch.addEventListener('input', function(e) {
    renderAchievementsList(e.target.value);
});

document.addEventListener('click', function(e) {
    if (!achievementsPopover.contains(e.target) && !achievementsButton.contains(e.target)) {
        achievementsPopover.classList.remove('visible');
    }
});

const rebirthButton = document.getElementById('rebirth-button');
const rebirthModal = document.getElementById('rebirth-modal');
const rebirthModalOverlay = document.getElementById('rebirth-modal-overlay');
const rebirthCancel = document.getElementById('rebirth-cancel');
const rebirthConfirm = document.getElementById('rebirth-confirm');

function showRebirthModal() {
    rebirthModal.classList.add('visible');
    rebirthModalOverlay.classList.add('visible');
}

function hideRebirthModal() {
    rebirthModal.classList.remove('visible');
    rebirthModalOverlay.classList.remove('visible');
}

rebirthButton.addEventListener('click', function(e) {
    e.stopPropagation();
    showRebirthModal();
});

rebirthCancel.addEventListener('click', function(e) {
    e.stopPropagation();
    hideRebirthModal();
});

rebirthConfirm.addEventListener('click', function(e) {
    e.stopPropagation();
    rebirth();
    hideRebirthModal();
});

rebirthModalOverlay.addEventListener('click', function(e) {
    e.stopPropagation();
    hideRebirthModal();
});

const tradeModal = document.getElementById('trade-modal');
const tradeModalOverlay = document.getElementById('trade-modal-overlay');
const tradeClose = document.getElementById('trade-close');

function showTradeModal() {
    tradeModal.classList.add('visible')
    tradeModalOverlay.classList.add('visible');
    updateStockDisplay();
}

function hideTradeModal() {
    tradeModal.classList.remove('visible');
    tradeModalOverlay.classList.remove('visible');
    stopTradingSession();
}

function updateStockDisplay() {
    stockPriceElement.firstChild.textContent = '$' + stockPrice.toFixed(2);

    const priceChange = stockPrice - previousPrice;
    const priceChangeElement = document.getElementById('price-change');

    if (priceChange > 0) {
        priceChangeElement.textContent = '+' + priceChange.toFixed(2);
        priceChangeElement.className = 'price-change positive';
    } else if (priceChange < 0) {
        priceChangeElement.textContent = priceChange.toFixed(2);
        priceChangeElement.className = 'price-change negative';
    } else {
        priceChangeElement.textContent = '';
        priceChangeElement.className = 'price-change';
    }

    if (priceChange !== 0) {
        setTimeout(() => {
            priceChangeElement.style.opacity = '0';
            setTimeout(() => {
                priceChangeElement.style.opacity = '1';
            }, 200);
        }, 2000);
    }

    previousPrice = stockPrice;

    ownedStocksElement.textContent = ownedStocks;
    portfolioValueElement.textContent = (ownedStocks * stockPrice).toFixed(2);

    const buyAmount = parseInt(buyAmountInput.value) || 1;
    const canAfford = clickCount >= buyAmount;
    buyStockButton.disabled = !canAfford || buyAmount < 1;
    buyStockButton.style.opacity = canAfford && buyAmount >= 1 ? '1' : '0.5';

    const canSell = ownedStocks > 0;
    sell25Button.disabled = !canSell;
    sell50Button.disabled = !canSell;
    sell100Button.disabled = !canSell;
    sell25Button.style.opacity = canSell ? '1' : '0.5';
    sell50Button.style.opacity = canSell ? '1' : '0.5';
    sell100Button.style.opacity = canSell ? '1' : '0.5';
}


function startTradingSession() {
    if (tradingSessionActive) return;

    tradingSessionActive = true;
    stockPrice = 1.00;
    sessionStartTime = Date.now();
    priceEverOver105 = false;

    updateTradingTimer();

    stockPriceInterval = setInterval(() => {
        fluctuateStockPrice();
    }, 250 + Math.random() * 250);

    const crashTime = 10 + Math.random() * 20;
    setTimeout(() => {
        companyBankruptcy();
    }, crashTime * 1000);
}

function stopTradingSession() {
    tradingSessionActive = false;

    if (stockPriceInterval) {
        clearInterval(stockPriceInterval);
        stockPriceInterval = null;
    }

    if (tradingSessionInterval) {
        clearInterval(tradingSessionInterval);
        tradingSessionInterval = null;
    }

    if (ownedStocks === 0) {
        tradingTimerElement.textContent = "Buy your first $SNOW stock to start.";
    }
}

function updateTradingTimer() {
    if (tradingSessionActive) {
        tradingTimerElement.textContent = "Trading active!";
    }
}

function companyBankruptcy() {
    showAchievement("Winter Meltdown!", "$SNOW went bankrupt!");
    if (ownedStocks > 0) {
        ownedStocks = 0;
        updateStockDisplay();
    }
    stopTradingSession();
}

function fluctuateStockPrice() {
    const rand = Math.random() * 100;

    let downChance;
    if (stockPrice < 0.25) {
        downChance = (55 / 2) / 4;
    } else if (stockPrice < 0.50) {
        downChance = (55 / 2) / 3;
    } else {
        downChance = 55 / 2;
    }

    const stayChance = 5;
    const upChance = 100 - stayChance - downChance;

    const stayThreshold = stayChance;
    const upThreshold = stayThreshold + upChance;

    if (rand < stayThreshold) {
    } else if (rand < upThreshold) {
        const multiplier = 1.05 + Math.random() * 0.15;
        stockPrice *= multiplier;
        if (stockPrice > 1.05) {
            priceEverOver105 = true;
        }
    } else {
        const multiplier = 1.03 + Math.random() * 0.22;
        stockPrice /= multiplier;
    }
    stockPrice = Math.max(0.01, stockPrice);

    updateStockDisplay();
}

tradeClose.addEventListener('click', function(e) {
    e.stopPropagation();
    hideTradeModal();
});

tradeModalOverlay.addEventListener('click', function(e) {
    e.stopPropagation();
    hideTradeModal();
});

buyAmountInput.addEventListener('input', function(e) {
    updateStockDisplay();
});


buyStockButton.addEventListener('click', function(e) {
    e.stopPropagation();
    const buyAmount = parseInt(buyAmountInput.value) || 1;
    if (clickCount >= buyAmount && buyAmount >= 1) {
        clickCount -= buyAmount;
        counterElement.textContent = clickCount;
        ownedStocks += buyAmount;
        showAchievement("Stock Market!", "You bought $SNOW stock!");
        if (!tradingSessionActive && ownedStocks > 0) {
            startTradingSession();
        }

        updateStockDisplay();
        updateUpgradeDisplay();
    }
});

sell25Button.addEventListener('click', function(e) {
    e.stopPropagation();
    if (ownedStocks > 0) {
        const stocksToSell = Math.floor(ownedStocks * 0.25);
        sellStocks(stocksToSell);
    }
});

sell50Button.addEventListener('click', function(e) {
    e.stopPropagation();
    if (ownedStocks > 0) {
        const stocksToSell = Math.floor(ownedStocks * 0.5);
        sellStocks(stocksToSell);
    }
});

sell100Button.addEventListener('click', function(e) {
    e.stopPropagation();
    if (ownedStocks > 0) {
        sellStocks(ownedStocks);
    }
});

function sellStocks(stocksToSell) {
    const earnings = stocksToSell * stockPrice;
    clickCount += Math.floor(earnings);
    counterElement.textContent = clickCount;
    ownedStocks -= stocksToSell;
    successfulTradesCount++;

    updateStockDisplay();
    updateUpgradeDisplay();

    if (ownedStocks === 0) {
        showAchievement("Frosty Fortune!", "You cashed out perfectly before the winter storm!");
        stopTradingSession();
    }
}

function checkAchievements() {
    if (mittenCount >= 1 && !unlockedAchievements.has('getting_mittens')) {
        unlockedAchievements.add('getting_mittens');
        const achievement = achievementData['getting_mittens'];
        showAchievement(achievement.title, achievement.description);
    }
    if (mittenCount >= 3 && !unlockedAchievements.has('out_of_hand')) {
        unlockedAchievements.add('out_of_hand');
        const achievement = achievementData['out_of_hand'];
        showAchievement(achievement.title, achievement.description);
    }
    if (snowmanCount >= 1 && !unlockedAchievements.has('jolly_happy_soul')) {
        unlockedAchievements.add('jolly_happy_soul');
        const achievement = achievementData['jolly_happy_soul'];
        showAchievement(achievement.title, achievement.description);
    }
    if (snowmanCount >= 2 && !unlockedAchievements.has('snowmen')) {
        unlockedAchievements.add('snowmen');
        const achievement = achievementData['snowmen'];
        showAchievement(achievement.title, achievement.description);
    }
    if (snowmanCount >= 6 && !unlockedAchievements.has('disappearing')) {
        unlockedAchievements.add('disappearing');
        const achievement = achievementData['disappearing'];
        showAchievement(achievement.title, achievement.description);
    }
    if (gingerbreadCount >= 1 && !unlockedAchievements.has('house_please')) {
        unlockedAchievements.add('house_please');
        const achievement = achievementData['house_please'];
        showAchievement(achievement.title, achievement.description);
    }
    if (gingerbreadHouseCount >= 1 && !unlockedAchievements.has('thanks_gingerbread_man')) {
        unlockedAchievements.add('thanks_gingerbread_man');
        const achievement = achievementData['thanks_gingerbread_man'];
        showAchievement(achievement.title, achievement.description);
    }
    if (clickCount >= 1000 && !unlockedAchievements.has('rebirths_unlocked')) {
        unlockedAchievements.add('rebirths_unlocked');
        const achievement = achievementData['rebirths_unlocked'];
        showAchievement(achievement.title, achievement.description);
    }
    updateRebirthButton();
}

function updateRebirthButton() {
    const rebirthButton = document.getElementById('rebirth-button');
    if (clickCount >= 1000) {
        rebirthButton.classList.add('visible');
    } else {
        rebirthButton.classList.remove('visible');
    }
}

function calculateCookiesEarned(totalSnowballs, mittens, snowmen, hotChocolates, gingerbreadMen, gingerbreadHouses, snowBankPurchased, successfulTradesCount) {
    let cookies = 0;

    const snowballThresholds = [
        { threshold: 1000, cookies: 3 },
        { threshold: 1500, cookies: 1 },
        { threshold: 2000, cookies: 2 },
        { threshold: 3000, cookies: 3 },
        { threshold: 3200, cookies: 1 },
        { threshold: 3400, cookies: 1 },
        { threshold: 3500, cookies: 2 },
        { threshold: 4000, cookies: 4 },
        { threshold: 5000, cookies: 3 },
        { threshold: 6000, cookies: 1 },
        { threshold: 8000, cookies: 1 },
        { threshold: 10000, cookies: 2 },
        { threshold: 11000, cookies: 1 },
        { threshold: 12000, cookies: 1 },
        { threshold: 13000, cookies: 1 },
        { threshold: 14000, cookies: 1 },
        { threshold: 15000, cookies: 2 },
        { threshold: 16000, cookies: 1 },
        { threshold: 17000, cookies: 1 },
        { threshold: 18000, cookies: 1 },
        { threshold: 19000, cookies: 1 },
        { threshold: 20000, cookies: 3 },
        { threshold: 25000, cookies: 2 },
        { threshold: 30000, cookies: 2 },
        { threshold: 35000, cookies: 1 },
        { threshold: 40000, cookies: 3 },
        { threshold: 50000, cookies: 4 },
        { threshold: 75000, cookies: 2 },
        { threshold: 80000, cookies: 1 },
        { threshold: 100000, cookies: 2 },
        { threshold: 125000, cookies: 1 },
        { threshold: 150000, cookies: 2 },
        { threshold: 200000, cookies: 4 },
        { threshold: 250000, cookies: 3 },
        { threshold: 300000, cookies: 4 },
        { threshold: 310000, cookies: 1 },
        { threshold: 325000, cookies: 2 },
        { threshold: 350000, cookies: 2 },
        { threshold: 355000, cookies: 1 },
        { threshold: 375000, cookies: 3 },
        { threshold: 380000, cookies: 1 },
        { threshold: 400000, cookies: 2 },
        { threshold: 450000, cookies: 3 },
        { threshold: 500000, cookies: 6 },
        { threshold: 505000, cookies: 1 },
        { threshold: 510000, cookies: 1 },
        { threshold: 530000, cookies: 1 },
        { threshold: 550000, cookies: 2 },
        { threshold: 560000, cookies: 1 },
        { threshold: 575000, cookies: 1 },
        { threshold: 600000, cookies: 2 },
        { threshold: 700000, cookies: 1 },
        { threshold: 800000, cookies: 1 },
        { threshold: 850000, cookies: 1 },
        { threshold: 900000, cookies: 2 },
        { threshold: 910000, cookies: 1 },
        { threshold: 920000, cookies: 1 },
        { threshold: 930000, cookies: 1 },
        { threshold: 940000, cookies: 1 },
        { threshold: 950000, cookies: 2 },
        { threshold: 1000000, cookies: 10 },
        { threshold: 1100000, cookies: 1 },
        { threshold: 1200000, cookies: 1 },
        { threshold: 1300000, cookies: 1 },
        { threshold: 1400000, cookies: 2 },
        { threshold: 1500000, cookies: 3 },
        { threshold: 1600000, cookies: 1 },
        { threshold: 1650000, cookies: 1 },
        { threshold: 1700000, cookies: 2 },
        { threshold: 1710000, cookies: 1 },
        { threshold: 1740000, cookies: 1 },
        { threshold: 1750000, cookies: 1 },
        { threshold: 1800000, cookies: 2 },
        { threshold: 1900000, cookies: 3 },
        { threshold: 2000000, cookies: 2 },
        { threshold: 2100000, cookies: 1 },
        { threshold: 2300000, cookies: 1 },
        { threshold: 2400000, cookies: 1 },
        { threshold: 2420000, cookies: 1 },
        { threshold: 2440000, cookies: 1 },
        { threshold: 2450000, cookies: 1 },
        { threshold: 2500000, cookies: 1 },
        { threshold: 2600000, cookies: 1 },
        { threshold: 2700000, cookies: 7 },
        { threshold: 2800000, cookies: 2 },
        { threshold: 2900000, cookies: 1 },
        { threshold: 3000000, cookies: 1 },
        { threshold: 3200000, cookies: 2 },
        { threshold: 3400000, cookies: 3 },
        { threshold: 3500000, cookies: 1 },
        { threshold: 3750000, cookies: 1 },
        { threshold: 3900000, cookies: 1 },
        { threshold: 4000000, cookies: 4 },
        { threshold: 4100000, cookies: 1 },
        { threshold: 4300000, cookies: 2 },
        { threshold: 4500000, cookies: 3 },
        { threshold: 4750000, cookies: 2 },
        { threshold: 4900000, cookies: 1 },
        { threshold: 5000000, cookies: 5 },
        { threshold: 6000000, cookies: 6 },
        { threshold: 7000000, cookies: 7 },
        { threshold: 8000000, cookies: 8 },
        { threshold: 9000000, cookies: 9 },
        { threshold: 10000000, cookies: 10 },
        { threshold: 10500000, cookies: 1 },
        { threshold: 11000000, cookies: 1 },
        { threshold: 12000000, cookies: 12 },
        { threshold: 13000000, cookies: 13 },
        { threshold: 14000000, cookies: 14 },
        { threshold: 15000000, cookies: 15 },
        { threshold: 15100000, cookies: 1 },
        { threshold: 15200000, cookies: 1 },
        { threshold: 15300000, cookies: 3 },
        { threshold: 15400000, cookies: 4 },
        { threshold: 15500000, cookies: 5 },
        { threshold: 15600000, cookies: 6 },
        { threshold: 15700000, cookies: 7 },
        { threshold: 15800000, cookies: 1 },
        { threshold: 15900000, cookies: 1 },
        { threshold: 16000000, cookies: 16 },
        { threshold: 17000000, cookies: 17 },
        { threshold: 18000000, cookies: 18 },
        { threshold: 19000000, cookies: 19 },
        { threshold: 20000000, cookies: 20 },
        { threshold: 30000000, cookies: 30 },
        { threshold: 40000000, cookies: 40 },
        { threshold: 45000000, cookies: 5 },
        { threshold: 50000000, cookies: 50 }
    ];

    for (const { threshold, cookies: cookieReward } of snowballThresholds) {
        if (totalSnowballs >= threshold) {
            cookies += cookieReward;
        }
    }

    cookies += Math.floor(mittens / 100);
    cookies += Math.floor(snowmen / 10);
    cookies += Math.floor(gingerbreadMen / 5);
    cookies += Math.floor(gingerbreadHouses / 3);

    if (gingerbreadHouses >= 10) {
        cookies += 1;
    }
    if (gingerbreadHouses >= 25) {
        cookies += 2;
    }

    if (snowBankPurchased) {
        cookies += 10;
    }

    if (successfulTradesCount >= 1) {
        cookies += 1;
    }
    if (successfulTradesCount >= 3) {
        cookies += 2;
    }
    if (successfulTradesCount >= 5) {
        cookies += 3;
    }
    if (successfulTradesCount >= 10) {
        cookies += 5;
    }

    return cookies;
}

function updateGingerbreadUpgradesDisplay() {
    const goldenMittenUpgrade = document.getElementById('golden-mitten-upgrade');
    const goldenMittenCost = document.getElementById('golden-mitten-cost');
    if (goldenMittenUpgrade) {
        if (gingerbreadCookies > 0 && mittenCount >= 1) {
            goldenMittenUpgrade.style.display = '';
        } else {
            goldenMittenUpgrade.style.display = 'none';
        }

        if (goldenMittenPurchased) {
            goldenMittenUpgrade.classList.add('purchased');
            goldenMittenUpgrade.classList.remove('disabled');
            if (goldenMittenCost) goldenMittenCost.textContent = 'Purchased';
        } else if (gingerbreadCookies >= 1) {
            goldenMittenUpgrade.classList.remove('purchased');
            goldenMittenUpgrade.classList.remove('disabled');
            if (goldenMittenCost) goldenMittenCost.textContent = 'Cost: 1 Gingerbread Cookie';
        } else {
            goldenMittenUpgrade.classList.remove('purchased');
            goldenMittenUpgrade.classList.add('disabled');
            if (goldenMittenCost) goldenMittenCost.textContent = 'Cost: 1 Gingerbread Cookie';
        }
    }

    const goldenSnowmanUpgrade = document.getElementById('golden-snowman-upgrade');
    const goldenSnowmanCost = document.getElementById('golden-snowman-cost');
    if (goldenSnowmanUpgrade) {
        if (gingerbreadCookies > 0 && snowmanCount >= 1) {
            goldenSnowmanUpgrade.style.display = '';
        } else {
            goldenSnowmanUpgrade.style.display = 'none';
        }

        if (goldenSnowmanPurchased) {
            goldenSnowmanUpgrade.classList.add('purchased');
            goldenSnowmanUpgrade.classList.remove('disabled');
            if (goldenSnowmanCost) goldenSnowmanCost.textContent = 'Purchased';
        } else if (gingerbreadCookies >= 3) {
            goldenSnowmanUpgrade.classList.remove('purchased');
            goldenSnowmanUpgrade.classList.remove('disabled');
            if (goldenSnowmanCost) goldenSnowmanCost.textContent = 'Cost: 3 Gingerbread Cookies';
        } else {
            goldenSnowmanUpgrade.classList.remove('purchased');
            goldenSnowmanUpgrade.classList.add('disabled');
            if (goldenSnowmanCost) goldenSnowmanCost.textContent = 'Cost: 3 Gingerbread Cookies';
        }
    }

    const randomBuffUpgrade = document.getElementById('random-buff-upgrade');
    const randomBuffCost = document.getElementById('random-buff-cost');
    if (randomBuffUpgrade) {
        if (gingerbreadCookies >= 5) {
            randomBuffUpgrade.style.display = '';
            randomBuffUpgrade.classList.remove('disabled');
            if (randomBuffCost) randomBuffCost.textContent = 'Cost: 5 Gingerbread Cookies';
        } else {
            randomBuffUpgrade.style.display = 'none';
        }
    }
}

function updateCookiesDisplay() {
    const cookiesDisplay = document.getElementById('cookies-display');
    document.getElementById('cookies-count').textContent = gingerbreadCookies;
    if (gingerbreadCookies > 0) {
        cookiesDisplay.classList.add('visible');
    } else {
        cookiesDisplay.classList.remove('visible');
    }
    updateGingerbreadUpgradesDisplay();
    updateLeftSidebarVisibility();
}

function updateLeftSidebarVisibility() {
    const leftSidebar = document.querySelector('.left-sidebar');
    if (snowmanCount > 0 || gingerbreadCount > 0 || gingerbreadHouseCount > 0 || hotChocolateCount > 0 || snowBankPurchased || gingerbreadCookies > 0) {
        leftSidebar.classList.add('visible');
    } else {
        leftSidebar.classList.remove('visible');
    }
}

function rebirth() {
    if (clickCount < 1000) return;

    document.querySelector('.left-sidebar').classList.remove('visible');
    document.getElementById('achievements-button').classList.remove('visible');
    document.getElementById('rebirth-button').classList.remove('visible');

    const particlesContainer = document.getElementById('crack-particles');
    const body = document.body;

    body.classList.add('crack-shake');
    snowball.classList.add('crack');

    particlesContainer.innerHTML = '';
    for (let i = 0; i < 60; i++) {
        const particle = document.createElement('div');
        particle.className = 'crack-particle';
        const angle = (Math.PI * 2 * i) / 60 + Math.random() * 0.3;
        const distance = 100 + Math.random() * 200;
        const startX = window.innerWidth / 2;
        const startY = window.innerHeight / 2;
        const endX = startX + Math.cos(angle) * distance;
        const endY = startY + Math.sin(angle) * distance;
        const delay = Math.random() * 0.5;
        const duration = 1.5 + Math.random() * 0.5;

        particle.style.left = startX + 'px';
        particle.style.top = startY + 'px';

        const keyframes = [
            { transform: 'translate(0, 0) scale(0)', opacity: 0, offset: 0 },
            { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: delay / duration },
            { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1.5)`, opacity: 0.8, offset: (delay + 0.3) / duration },
            { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0)`, opacity: 0, offset: 1 }
        ];

        particle.animate(keyframes, {
            duration: duration * 1000,
            easing: 'ease-out',
            fill: 'forwards'
        });

        particlesContainer.appendChild(particle);
    }

    const cookiesEarned = calculateCookiesEarned(clickCount, mittenCount, snowmanCount, hotChocolateCount, gingerbreadCount, gingerbreadHouseCount, snowBankPurchased, successfulTradesCount) * rebirthMultiplier;
    gingerbreadCookies += cookiesEarned;
    rebirthMultiplier = 1;

    setTimeout(() => {
        clickCount = 0;
        mittenCount = 0;
        snowmanCount = 0;
        hotChocolateCount = 0;
        gingerbreadCount = 0;
        gingerbreadHouseCount = 0;
        snowBankPurchased = false;
        successfulTradesCount = 0;

        for (const buffId in activeBuffs) {
            deactivateBuff(buffId);
        }
        activeBuffs = {};
        for (const timerId in buffTimers) {
            clearTimeout(buffTimers[timerId]);
        }
        buffTimers = {};
        rebirthMultiplier = 1;

        if (autoClickInterval) {
            clearInterval(autoClickInterval);
            autoClickInterval = null;
        }

        counterElement.textContent = clickCount;
        updateMittenDisplay();
        updateSnowmanDisplay();
        updateGingerbreadDisplay();
        updateGingerbreadHouseDisplay();
        updateHotChocolateDisplay();
        updateSnowbankDisplay();
        updateUpgradeDisplay();
        updateAutoClick();
        updateRebirthButton();
        updateCookiesDisplay();
        updateLeftSidebarVisibility();

        snowball.classList.remove('crack');
        body.classList.remove('crack-shake');
        particlesContainer.innerHTML = '';
    }, 2000);
}

function createMitten() {
    if (mittenCount >= maxMittens) return;
    mittenCount++;
    updateMittenDisplay();
    checkAchievements();
}

function updateAutoClick() {
    if (autoClickInterval) {
        clearInterval(autoClickInterval);
    }
    const mittenMultiplier = goldenMittenPurchased ? 2 : 1;
    const snowmanMultiplier = (goldenSnowmanPurchased ? 2 : 1) * getCurrentSnowmanMultiplier();
    const earningsMultiplier = getCurrentEarningsMultiplier();
    const totalCPS = ((mittenCount * mittenMultiplier) + (snowmanCount * 3 * snowmanMultiplier) + (gingerbreadCount * 10) + (gingerbreadHouseCount * 50) + (hotChocolateCount * 100) + (snowBankPurchased ? 500 : 0)) * earningsMultiplier;
    if (totalCPS > 0) {
        const clickInterval = 1000 / totalCPS;
        autoClickInterval = setInterval(incrementClick, clickInterval);
    }
}

function updateSnowmanDisplay() {
    const container = document.getElementById('snowmen-container');
    const maxDisplay = 5;
    const displayCount = Math.min(snowmanCount, maxDisplay);

    while (container.children.length < displayCount) {
        const snowman = document.createElement('div');
        snowman.className = 'snowman-visual tooltip';
        const img = document.createElement('img');
        img.src = 'snowman.png';
        img.setAttribute('draggable', 'false');
        snowman.appendChild(img);

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-text';
        tooltip.textContent = snowmanNames[Math.floor(Math.random() * snowmanNames.length)];
        snowman.appendChild(tooltip);

        container.appendChild(snowman);
    }

    while (container.children.length > displayCount) {
        container.removeChild(container.lastChild);
    }
}

function updateGingerbreadDisplay() {
    const section = document.getElementById('gingerbread-section');
    const container = document.getElementById('gingerbread-container');

    if (gingerbreadCount >= 1) {
        section.style.display = '';
    } else {
        section.style.display = 'none';
        return;
    }

    const maxDisplay = 5;
    const displayCount = Math.min(gingerbreadCount, maxDisplay);

    while (container.children.length < displayCount) {
        const gingerbread = document.createElement('div');
        gingerbread.className = 'snowman-visual tooltip';
        const img = document.createElement('img');
        img.src = 'gingerbread.webp';
        img.setAttribute('draggable', 'false');
        gingerbread.appendChild(img);

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-text';
        tooltip.textContent = gingerbreadNames[Math.floor(Math.random() * gingerbreadNames.length)];
        gingerbread.appendChild(tooltip);

        container.appendChild(gingerbread);
    }

    while (container.children.length > displayCount) {
        container.removeChild(container.lastChild);
    }
}

function updateGingerbreadHouseDisplay() {
    const section = document.getElementById('gingerbreadhouse-section');
    const container = document.getElementById('gingerbreadhouse-container');

    if (gingerbreadHouseCount >= 1) {
        section.style.display = '';
    } else {
        section.style.display = 'none';
        return;
    }

    const maxDisplay = 5;
    const displayCount = Math.min(gingerbreadHouseCount, maxDisplay);

    while (container.children.length < displayCount) {
        const gingerbreadHouse = document.createElement('div');
        gingerbreadHouse.className = 'snowman-visual';
        const img = document.createElement('img');
        img.src = 'gingerbreadhouse.png';
        img.setAttribute('draggable', 'false');
        gingerbreadHouse.appendChild(img);
        container.appendChild(gingerbreadHouse);
    }

    while (container.children.length > displayCount) {
        container.removeChild(container.lastChild);
    }
}

function updateHotChocolateDisplay() {
    const section = document.getElementById('hotchocolate-section');
    const container = document.getElementById('hotchocolate-container');

    if (hotChocolateCount >= 1) {
        section.style.display = '';
    } else {
        section.style.display = 'none';
        return;
    }

    const maxDisplay = 3;
    const displayCount = Math.min(hotChocolateCount, maxDisplay);

    while (container.children.length < displayCount) {
        const hotChocolate = document.createElement('div');
        hotChocolate.className = 'hot-chocolate-visual';
        const img = document.createElement('img');
        img.src = 'hotcocoa.png';
        img.setAttribute('draggable', 'false');
        hotChocolate.appendChild(img);
        container.appendChild(hotChocolate);
    }

    while (container.children.length > displayCount) {
        container.removeChild(container.lastChild);
    }
}

function updateSnowbankDisplay() {
    const section = document.getElementById('snowbank-section');
    const container = document.getElementById('snowbank-container');
    const tradeButton = document.getElementById('trade-button');

    if (snowBankPurchased) {
        section.style.display = '';
        tradeButton.style.display = 'block';
    } else {
        section.style.display = 'none';
        tradeButton.style.display = 'none';
        return;
    }

    const displayCount = snowBankPurchased ? 1 : 0;

    while (container.children.length < displayCount) {
        const snowbank = document.createElement('div');
        snowbank.className = 'snowbank-visual';
        const img = document.createElement('img');
        img.src = 'snowbank.png';
        img.setAttribute('draggable', 'false');
        snowbank.appendChild(img);
        snowbank.addEventListener('click', function(e) {
            e.stopPropagation();
            showTradeModal();
        });
        container.appendChild(snowbank);
    }

    while (container.children.length > displayCount) {
        container.removeChild(container.lastChild);
    }
}

function createSnowman() {
    snowmanCount++;
    if (snowmanCount > 0) {
        document.querySelector('.left-sidebar').classList.add('visible');
    }
    updateSnowmanDisplay();
    checkAchievements();
}

function updateUpgradeDisplay() {
    const mittenCost = getMittenCost(mittenCount);
    const canAffordMitten = clickCount >= mittenCost;
    const canBuyMoreMittens = mittenCount < maxMittens;

    if (!canAffordMitten || !canBuyMoreMittens) {
        mittenUpgrade.classList.add('disabled');
    } else {
        mittenUpgrade.classList.remove('disabled');
    }

    if (mittenCount >= maxMittens) {
        mittenCostElement.textContent = `Max: ${maxMittens} mittens`;
    } else {
        mittenCostElement.textContent = `Cost: ${mittenCost} (Owned: ${mittenCount})`;
    }

    const snowmanCost = getSnowmanCost(snowmanCount);
    const canAffordSnowman = clickCount >= snowmanCost;
    const hasMitten = mittenCount >= 1;
    const hasSnowman = snowmanCount >= 1;

    if (!canAffordSnowman || !hasMitten) {
        snowmanUpgrade.classList.add('disabled');
    } else {
        snowmanUpgrade.classList.remove('disabled');
    }

    if (!hasMitten) {
        snowmanCostElement.textContent = `Build a mitten first!`;
    } else {
        snowmanCostElement.textContent = `Cost: ${snowmanCost} (Owned: ${snowmanCount}) - 3 CPS`;
    }

    if (hasMitten) {
        gingerbreadUpgrade.style.display = '';

        const gingerbreadCost = getGingerbreadCost(gingerbreadCount);
        const canAffordGingerbread = clickCount >= gingerbreadCost;

        if (!canAffordGingerbread || !hasSnowman) {
            gingerbreadUpgrade.classList.add('disabled');
        } else {
            gingerbreadUpgrade.classList.remove('disabled');
        }

        if (gingerbreadCount >= 1) {
            gingerbreadCostElement.textContent = `Cost: ${gingerbreadCost} (Owned: ${gingerbreadCount}) - 10 CPS each`;
            gingerbreadUpgrade.classList.remove('purchased');
        } else if (!hasSnowman) {
            gingerbreadCostElement.textContent = `Create a snowman first!`;
        } else {
            gingerbreadCostElement.textContent = `Cost: ${gingerbreadCost} - 10 CPS each`;
        }
    } else {
        gingerbreadUpgrade.style.display = 'none';
    }

    if (hasSnowman) {
        gingerbreadHouseUpgrade.style.display = '';

        const gingerbreadHouseCost = getGingerbreadHouseCost(gingerbreadHouseCount);
        const canAffordGingerbreadHouse = clickCount >= gingerbreadHouseCost;

        if (!canAffordGingerbreadHouse) {
            gingerbreadHouseUpgrade.classList.add('disabled');
        } else {
            gingerbreadHouseUpgrade.classList.remove('disabled');
        }

        if (gingerbreadHouseCount >= 1) {
            gingerbreadHouseCostElement.textContent = `Cost: ${gingerbreadHouseCost} (Owned: ${gingerbreadHouseCount}) - 50 CPS each`;
            gingerbreadHouseUpgrade.classList.remove('purchased');
        } else {
            gingerbreadHouseCostElement.textContent = `Cost: ${gingerbreadHouseCost} - 50 CPS each`;
        }
    } else {
        gingerbreadHouseUpgrade.style.display = 'none';
    }

    const hasGingerbreadHouse = gingerbreadHouseCount >= 1;
    if (hasGingerbreadHouse) {
        hotChocolateUpgrade.style.display = '';

        const hotChocolateCost = getHotChocolateCost(hotChocolateCount);
        const canAffordHotChocolate = clickCount >= hotChocolateCost;

        if (!canAffordHotChocolate) {
            hotChocolateUpgrade.classList.add('disabled');
        } else {
            hotChocolateUpgrade.classList.remove('disabled');
        }

        if (hotChocolateCount >= 1) {
            hotChocolateCostElement.textContent = `Cost: ${hotChocolateCost} (Owned: ${hotChocolateCount}) - 100 CPS each`;
            hotChocolateUpgrade.classList.remove('purchased');
        } else {
            hotChocolateCostElement.textContent = `Cost: ${hotChocolateCost} - 100 CPS each`;
        }
    } else {
        hotChocolateUpgrade.style.display = 'none';
    }

    const hasHotChocolate = hotChocolateCount >= 1;
    if (hasHotChocolate) {
        snowBankUpgrade.style.display = '';

        const canAffordSnowBank = clickCount >= snowBankCost;
        const hasHotChocolateCup = hotChocolateCount >= 1;

        if (!canAffordSnowBank || !hasHotChocolateCup || snowBankPurchased) {
            snowBankUpgrade.classList.add('disabled');
        } else {
            snowBankUpgrade.classList.remove('disabled');
        }

        if (snowBankPurchased) {
            snowBankUpgrade.classList.add('purchased');
            snowBankCostElement.textContent = 'Purchased - 500 CPS';
        } else if (!hasHotChocolateCup) {
            snowBankCostElement.textContent = 'Grab a hot chocolate first!';
        } else {
            snowBankCostElement.textContent = `Cost: ${snowBankCost} - 500 CPS`;
        }
    } else {
        snowBankUpgrade.style.display = 'none';
    }
}

mittenUpgrade.addEventListener('click', function(e) {
    e.stopPropagation();
    const currentCost = getMittenCost(mittenCount);
    if (clickCount >= currentCost && mittenCount < maxMittens) {
        clickCount -= currentCost;
        counterElement.textContent = clickCount;
        createMitten();
        updateAutoClick();
        updateUpgradeDisplay();
        updateCookiesDisplay();
    }
});

snowmanUpgrade.addEventListener('click', function(e) {
    e.stopPropagation();
    const currentCost = getSnowmanCost(snowmanCount);
    if (clickCount >= currentCost && mittenCount >= 1) {
        clickCount -= currentCost;
        counterElement.textContent = clickCount;
        createSnowman();
        updateAutoClick();
        updateUpgradeDisplay();
        updateCookiesDisplay();
    }
});

hotChocolateUpgrade.addEventListener('click', function(e) {
    e.stopPropagation();
    const hotChocolateCost = getHotChocolateCost(hotChocolateCount);
    if (clickCount >= hotChocolateCost && gingerbreadHouseCount >= 1) {
        clickCount -= hotChocolateCost;
        counterElement.textContent = clickCount;
        hotChocolateCount++;
        if (hotChocolateCount > 0) {
            document.querySelector('.left-sidebar').classList.add('visible');
        }
        updateHotChocolateDisplay();
        updateAutoClick();
        updateUpgradeDisplay();
    }
});

snowBankUpgrade.addEventListener('click', function(e) {
    e.stopPropagation();
    if (clickCount >= snowBankCost && hotChocolateCount >= 1 && !snowBankPurchased) {
        clickCount -= snowBankCost;
        counterElement.textContent = clickCount;
        snowBankPurchased = true;
        updateSnowbankDisplay();
        updateAutoClick();
        updateUpgradeDisplay();
    }
});

gingerbreadUpgrade.addEventListener('click', function(e) {
    e.stopPropagation();
    const gingerbreadCost = getGingerbreadCost(gingerbreadCount);
    if (clickCount >= gingerbreadCost && snowmanCount >= 1) {
        clickCount -= gingerbreadCost;
        counterElement.textContent = clickCount;
        gingerbreadCount++;
        if (gingerbreadCount > 0) {
            document.querySelector('.left-sidebar').classList.add('visible');
        }
        updateGingerbreadDisplay();
        checkAchievements();
        updateAutoClick();
        updateUpgradeDisplay();
    }
});

gingerbreadHouseUpgrade.addEventListener('click', function(e) {
    e.stopPropagation();
    const gingerbreadHouseCost = getGingerbreadHouseCost(gingerbreadHouseCount);
    if (clickCount >= gingerbreadHouseCost && snowmanCount >= 1) {
        clickCount -= gingerbreadHouseCost;
        counterElement.textContent = clickCount;
        gingerbreadHouseCount++;
        if (gingerbreadHouseCount > 0) {
            document.querySelector('.left-sidebar').classList.add('visible');
        }
        updateGingerbreadHouseDisplay();
        checkAchievements();
        updateAutoClick();
        updateUpgradeDisplay();
    }
});

const goldenMittenUpgrade = document.getElementById('golden-mitten-upgrade');
goldenMittenUpgrade.addEventListener('click', function(e) {
    e.stopPropagation();
    if (!goldenMittenPurchased && gingerbreadCookies >= 1) {
        gingerbreadCookies -= 1;
        goldenMittenPurchased = true;
        customCursor.src = 'golden_mitten.png';
        updateCookiesDisplay();
        updateAutoClick();
    }
});

const goldenSnowmanUpgrade = document.getElementById('golden-snowman-upgrade');
goldenSnowmanUpgrade.addEventListener('click', function(e) {
    e.stopPropagation();
    if (!goldenSnowmanPurchased && gingerbreadCookies >= 3) {
        gingerbreadCookies -= 3;
        goldenSnowmanPurchased = true;
        updateCookiesDisplay();
        updateAutoClick();
    }
});

const randomBuffUpgrade = document.getElementById('random-buff-upgrade');
randomBuffUpgrade.addEventListener('click', function(e) {
    e.stopPropagation();
    if (gingerbreadCookies >= 5) {
        gingerbreadCookies -= 5;
        const selectedBuff = selectRandomBuff();
        activateBuff(selectedBuff);
        updateCookiesDisplay();
    }
});

const tradeButton = document.getElementById('trade-button');
tradeButton.addEventListener('click', function(e) {
    e.stopPropagation();
    showTradeModal();
});

snowball.addEventListener('click', function(e) {
    e.stopPropagation();
    snowball.classList.add('clicked');
    setTimeout(() => {
        snowball.classList.remove('clicked');
    }, 300);
    incrementClick(e);
    updateUpgradeDisplay();
    updateRebirthButton();
});

document.body.addEventListener('click', function(e) {
    if (!e.target.closest('.upgrade') && !e.target.closest('.rebirth-button')) {
        incrementClick(e);
        updateUpgradeDisplay();
        updateRebirthButton();
    }
});

document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    rightClickPressed = true;
    setTimeout(() => {
        rightClickPressed = false;
    }, 1000);
});

window.give = function(amount) {
    if (typeof amount === 'string' && amount.toLowerCase() === 'bank') {
        snowBankPurchased = true;
        updateSnowbankDisplay();
        updateAutoClick();
        updateUpgradeDisplay();
    } else {
        gingerbreadCookies += amount;
        clickCount += amount;
        counterElement.textContent = clickCount;
        updateCookiesDisplay();
        updateUpgradeDisplay();
    }
};

document.addEventListener('keydown', function(e) {
    if (e.key === 'c' || e.key === 'C') {
        if (rightClickPressed) {
            clickCount = 1000000000;
            counterElement.textContent = clickCount;
            updateUpgradeDisplay();
            rightClickPressed = false;
        }
    }
});

updateUpgradeDisplay();
updateAchievementsButton();
updateRebirthButton();
updateCookiesDisplay();

if (goldenMittenPurchased) {
    customCursor.src = 'golden_mitten.png';
}

if (snowmanCount > 0 || gingerbreadCount > 0 || gingerbreadHouseCount > 0 || hotChocolateCount > 0 || snowBankPurchased) {
    document.querySelector('.left-sidebar').classList.add('visible');
    updateSnowmanDisplay();
    updateGingerbreadDisplay();
    updateGingerbreadHouseDisplay();
    updateHotChocolateDisplay(); 
    updateSnowbankDisplay();
}
