const board = document.getElementById('game-board');
const triesSpan = document.getElementById('tries');
const resetBtn = document.getElementById('reset');
const resultDiv = document.getElementById('result');
const leaderboardDiv = document.getElementById('leaderboard');

const symbols = ['🍎','🍌','🍒','🍇','🍉','🍋','🍑','🍍'];
let cards = [];
let flipped = [];
let matched = [];
let tries = 0;

// Supabase 클라이언트 초기화
const SUPABASE_URL = 'https://twavtxwwapshjvwwhgst.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3YXZ0eHd3YXBzaGp2d3doZ3N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNTU5NDEsImV4cCI6MjA2NzczMTk0MX0.xEid7zNNTNTwitlkNiJRkeWdeU-ogQPsA1hliV3E2dM';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let userId = localStorage.getItem('card_flip_user_id');
if (!userId) {
  userId = prompt('유저 이름을 입력하세요:', 'test_user') || 'test_user';
  localStorage.setItem('card_flip_user_id', userId);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function initGame() {
  cards = [...symbols, ...symbols].map((symbol, idx) => ({
    id: idx,
    symbol,
    flipped: false,
    matched: false
  }));
  shuffle(cards);
  flipped = [];
  matched = [];
  tries = 0;
  triesSpan.textContent = '시도: 0';
  resultDiv.textContent = '';
  render();
  renderLeaderboard();
}

function render() {
  board.innerHTML = '';
  cards.forEach((card, idx) => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card' + (card.flipped || card.matched ? ' flipped' : '');
    if (card.matched) cardDiv.classList.add('matched');
    cardDiv.onclick = () => handleFlip(idx);

    // 카드 3D 구조
    const innerDiv = document.createElement('div');
    innerDiv.className = 'card-inner';

    const frontDiv = document.createElement('div');
    frontDiv.className = 'card-front';
    frontDiv.textContent = card.symbol;

    const backDiv = document.createElement('div');
    backDiv.className = 'card-back';
    backDiv.textContent = '★';

    innerDiv.appendChild(frontDiv);
    innerDiv.appendChild(backDiv);
    cardDiv.appendChild(innerDiv);
    board.appendChild(cardDiv);
  });
}

function handleFlip(idx) {
  if (cards[idx].flipped || cards[idx].matched || flipped.length === 2) return;
  cards[idx].flipped = true;
  flipped.push(idx);
  render();
  if (flipped.length === 2) {
    tries++;
    triesSpan.textContent = `시도: ${tries}`;
    setTimeout(checkMatch, 700);
  }
}

function checkMatch() {
  const [i, j] = flipped;
  if (cards[i].symbol === cards[j].symbol) {
    cards[i].matched = true;
    cards[j].matched = true;
    matched.push(i, j);
    if (matched.length === cards.length) {
      resultDiv.textContent = `축하합니다! 모든 카드를 맞췄어요. 총 시도: ${tries}`;
      saveScore(userId, tries);
    }
  } else {
    cards[i].flipped = false;
    cards[j].flipped = false;
  }
  flipped = [];
  render();
}

async function saveScore(userId, score) {
  const { error } = await supabase.from('card_flip_scores').insert({ user_id: userId, score });
  if (error) {
    resultDiv.textContent += '\n(점수 저장 실패: ' + error.message + ')';
  } else {
    resultDiv.textContent += '\n(점수가 저장되었습니다!)';
    await renderLeaderboard();
  }
}

async function renderLeaderboard() {
  leaderboardDiv.innerHTML = '<b>🏆 리더보드 (최소 시도 TOP 5)</b><br>불러오는 중...';
  const { data, error } = await supabase
    .from('card_flip_scores')
    .select('user_id, score')
    .order('score', { ascending: true })
    .limit(5);
  if (error) {
    leaderboardDiv.innerHTML = '리더보드 불러오기 실패: ' + error.message;
    return;
  }
  if (!data || data.length === 0) {
    leaderboardDiv.innerHTML = '아직 기록이 없습니다.';
    return;
  }
  leaderboardDiv.innerHTML = '<b>🏆 리더보드 (최소 시도 TOP 5)</b><ol style="text-align:left;max-width:300px;margin:0 auto;">' +
    data.map(r => `<li><b>${r.user_id}</b> - <span style='color:#1976d2'>${r.score}회</span></li>`).join('') + '</ol>';
}

resetBtn.onclick = initGame;

initGame();
// 게임 시작 시 리더보드 표시
renderLeaderboard(); 