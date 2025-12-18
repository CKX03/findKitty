// config
const TOTAL_CATS = 15;
const SWIPE_THRESHOLD = 80;

// state
let cats = [];
let currentIndex = 0;
let likedCats = [];
let dislikedCats = [];
let isAnimating = false;
let isDragging = false;
let startX = 0;
let currentX = 0;

// elements
const loadingScreen = document.getElementById('loadingScreen');
const cardContainer = document.getElementById('cardContainer');
const cardStack = document.getElementById('cardStack');
const progressFill = document.getElementById('progressFill');
const currentIndexEl = document.getElementById('currentIndex');
const totalCatsEl = document.getElementById('totalCats');
const actions = document.getElementById('actions');
const instructions = document.getElementById('instructions');
const likeBtn = document.getElementById('likeBtn');
const dislikeBtn = document.getElementById('dislikeBtn');
const resultsScreen = document.getElementById('resultsScreen');
const likedCount = document.getElementById('likedCount');
const passedCount = document.getElementById('passedCount');
const likedCatsGrid = document.getElementById('likedCatsGrid');
const noLikes = document.getElementById('noLikes');
const restartBtn = document.getElementById('restartBtn');

// init
document.addEventListener('DOMContentLoaded', init);

async function init() {
    likeBtn.addEventListener('click', () => handleSwipe('right'));
    dislikeBtn.addEventListener('click', () => handleSwipe('left'));
    restartBtn.addEventListener('click', restart);
    
    document.addEventListener('keydown', e => {
        if (isAnimating || !resultsScreen.classList.contains('hidden')) return;
        if (e.key === 'ArrowRight' || e.key === 'l') handleSwipe('right');
        if (e.key === 'ArrowLeft' || e.key === 'h') handleSwipe('left');
    });
    
    await loadCats();
}

async function loadCats() {
    showLoading(true);
    cats = [];
    
    const tags = ['cute', 'funny', 'sleeping', 'playing', 'fluffy', 'kitten', 'orange', 'black', 'white', 'tabby'];
    
    for (let i = 0; i < TOTAL_CATS; i++) {
        const tag = tags[Math.floor(Math.random() * tags.length)];
        cats.push({
            id: i,
            url: `https://cataas.com/cat/${tag}?width=400&height=500&t=${Date.now() + i}`,
            tag
        });
    }
    
    // preload first few
    await Promise.all(cats.slice(0, 3).map(cat => {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = img.onerror = resolve;
            img.src = cat.url;
        });
    }));
    
    totalCatsEl.textContent = TOTAL_CATS;
    showLoading(false);
    renderCards();
    updateProgress();
}

function showLoading(show) {
    loadingScreen.classList.toggle('hidden', !show);
    cardContainer.classList.toggle('hidden', show);
    actions.classList.toggle('hidden', show);
    instructions.classList.toggle('hidden', show);
}

function renderCards() {
    cardStack.innerHTML = '';
    
    const count = Math.min(3, cats.length - currentIndex);
    for (let i = 0; i < count; i++) {
        const cat = cats[currentIndex + i];
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${cat.url}" alt="Cat" class="card-image">
            <div class="card-label like">LIKE</div>
            <div class="card-label nope">NOPE</div>
        `;
        
        if (i === 0) setupSwipe(card);
        cardStack.appendChild(card);
    }
    
    // preload next
    if (currentIndex + 3 < cats.length) {
        const img = new Image();
        img.src = cats[currentIndex + 3].url;
    }
}

function setupSwipe(card) {
    card.addEventListener('touchstart', dragStart, { passive: true });
    card.addEventListener('touchmove', dragMove, { passive: false });
    card.addEventListener('touchend', dragEnd);
    card.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragEnd);
}

function dragStart(e) {
    if (isAnimating) return;
    isDragging = true;
    e.currentTarget.classList.add('dragging');
    startX = e.touches ? e.touches[0].clientX : e.clientX;
    currentX = 0;
}

function dragMove(e) {
    if (!isDragging || isAnimating) return;
    
    const card = cardStack.querySelector('.card:first-child');
    if (!card) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    currentX = clientX - startX;
    
    // allow vertical scroll
    if (Math.abs(currentX) > Math.abs(clientY - (e.touches ? e.touches[0].clientY : e.clientY)) && e.cancelable) {
        e.preventDefault();
    }
    
    const rotation = Math.max(-25, Math.min(25, currentX * 0.1));
    card.style.transform = `translateX(${currentX}px) rotate(${rotation}deg)`;
    
    card.classList.remove('swiping-left', 'swiping-right');
    if (currentX > SWIPE_THRESHOLD * 0.5) card.classList.add('swiping-right');
    else if (currentX < -SWIPE_THRESHOLD * 0.5) card.classList.add('swiping-left');
}

function dragEnd() {
    if (!isDragging) return;
    isDragging = false;
    
    const card = cardStack.querySelector('.card:first-child');
    if (!card) return;
    
    card.classList.remove('dragging');
    
    if (Math.abs(currentX) >= SWIPE_THRESHOLD) {
        completeSwipe(card, currentX > 0 ? 'right' : 'left');
    } else {
        card.style.transform = '';
        card.classList.remove('swiping-left', 'swiping-right');
    }
    currentX = 0;
}

function handleSwipe(direction) {
    if (isAnimating) return;
    const card = cardStack.querySelector('.card:first-child');
    if (card) completeSwipe(card, direction);
}

function completeSwipe(card, direction) {
    isAnimating = true;
    card.classList.add(direction === 'right' ? 'swipe-right' : 'swipe-left');
    
    const cat = cats[currentIndex];
    if (direction === 'right') likedCats.push(cat);
    else dislikedCats.push(cat);
    
    setTimeout(() => {
        currentIndex++;
        isAnimating = false;
        
        if (currentIndex >= cats.length) {
            showResults();
        } else {
            renderCards();
            updateProgress();
        }
    }, 400);
}

function updateProgress() {
    const pct = ((currentIndex + 1) / TOTAL_CATS) * 100;
    progressFill.style.width = Math.min(pct, 100) + '%';
    currentIndexEl.textContent = Math.min(currentIndex + 1, TOTAL_CATS);
}

function showResults() {
    cardContainer.classList.add('hidden');
    actions.classList.add('hidden');
    instructions.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
    
    likedCount.textContent = likedCats.length;
    passedCount.textContent = dislikedCats.length;
    
    if (likedCats.length > 0) {
        likedCatsGrid.innerHTML = likedCats.map(cat => 
            `<div class="liked-cat-card"><img src="${cat.url}" alt="Liked cat"></div>`
        ).join('');
        noLikes.classList.add('hidden');
    } else {
        likedCatsGrid.innerHTML = '';
        noLikes.classList.remove('hidden');
    }
}

async function restart() {
    currentIndex = 0;
    likedCats = [];
    dislikedCats = [];
    isAnimating = false;
    isDragging = false;
    
    resultsScreen.classList.add('hidden');
    await loadCats();
}
