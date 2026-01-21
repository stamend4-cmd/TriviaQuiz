// ======================= Firebase Init =======================
const firebaseConfig = {
  apiKey: "AIzaSyDCCBKiQio6iPKm36MQdGqb9LzTOxbOfiE",
  authDomain: "triviaquiz-2579b.firebaseapp.com",
  projectId: "triviaquiz-2579b"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ======================= DOM Elements =======================
const authDiv = document.getElementById('authDiv');
const emailDiv = document.getElementById('emailDiv');
const logoutDiv = document.getElementById('logoutDiv');
const categoryDiv = document.getElementById('categoryDiv');
const quizContainer = document.getElementById('quiz-container');
const quizEl = document.getElementById('quiz');
const moneyListEl = document.getElementById('money-list');
const startBtn = document.getElementById('startBtn');
const categorySelect = document.getElementById('categorySelect');
const questionCountSelect = document.getElementById('questionCount');

const fiftyBtn = document.getElementById('fiftyBtn');
const callBtn = document.getElementById('callBtn');
const audienceBtn = document.getElementById('audienceBtn');

const timerText = document.getElementById('timer-text');
const timerSvg = document.querySelector('#timer-svg circle');

const hintBox = document.getElementById('hint-box');
const correctSound = document.getElementById('correct-sound');
const wrongSound = document.getElementById('wrong-sound');
const tickSound = document.getElementById('tick-sound');

// ======================= Global Variables =======================
let questions = [];
let currentQuestionIndex = 0;
let currentTimer = 30;
let timerInterval;
let usedFifty = false;
let usedCall = false;
let usedAudience = false;

// ======================= Event Listeners =======================
startBtn.addEventListener('click', startQuiz);
fiftyBtn.addEventListener('click', useFifty);
callBtn.addEventListener('click', useCall);
audienceBtn.addEventListener('click', useAudience);

// ======================= QUIZ FUNCTIONS =======================
async function startQuiz() {
  const category = categorySelect.value;
  const numQuestions = parseInt(questionCountSelect.value);

  quizContainer.style.display = 'block';
  categoryDiv.style.display = 'none';
  currentQuestionIndex = 0;
  usedFifty = false; usedCall = false; usedAudience = false;
  fiftyBtn.disabled = false; callBtn.disabled = false; audienceBtn.disabled = false;
  moneyListEl.innerHTML = generateMoneyLadder(numQuestions);

  // Fetch questions from all sources
  questions = await fetchAllQuestions(category, numQuestions);
  showQuestion();
}

async function fetchAllQuestions(category, limit) {
  try {
    // --- OpenTDB ---
    const opentdbCatMap = {
      science: 17, history: 23, geography: 22, music: 12, film_and_tv: 11, sports:21, food_and_drink: 14, general_knowledge:9
    };
    const opentdbUrl = `https://opentdb.com/api.php?amount=${limit}&category=${opentdbCatMap[category] || 9}&type=multiple`;
    const opentdbRes = await fetch(opentdbUrl);
    const opentdbData = await opentdbRes.json();

    // --- Trivia API ---
    const triviaApiUrl = `https://the-trivia-api.com/api/questions?categories=${category}&limit=${limit}`;
    const triviaRes = await fetch(triviaApiUrl);
    const triviaData = await triviaRes.json();

    // --- QuizAPI.io ---
    const quizApiKey = 'YOUR_QUIZAPI_KEY'; // <-- Replace with your free QuizAPI.io key
    const quizApiUrl = `https://quizapi.io/api/v1/questions?apiKey=${quizApiKey}&limit=${limit}&tags=${category}`;
    const quizRes = await fetch(quizApiUrl);
    const quizData = await quizRes.json();

    // Normalize all questions
    const allQuestions = [];

    // OpenTDB
    opentdbData.results.forEach(q => {
      const options = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
      allQuestions.push({question: q.question, options, correct: q.correct_answer});
    });

    // Trivia API
    triviaData.forEach(q => {
      const opts = [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random() - 0.5);
      allQuestions.push({question: q.question, options: opts, correct: q.correctAnswer});
    });

    // QuizAPI.io
    quizData.forEach(q => {
      const opts = Object.values(q.answers).filter(a=>a).map(a=>a);
      allQuestions.push({question: q.question, options: opts, correct: q.correct_answer});
    });

    // Shuffle all
    return allQuestions.sort(() => Math.random() - 0.5).slice(0, limit);
  } catch(err) {
    console.error(err);
    alert("Failed to fetch questions. Check your internet connection & API keys.");
    return [];
  }
}

function showQuestion() {
  if(currentQuestionIndex >= questions.length){
    alert("🎉 Quiz Complete!");
    return;
  }
  const q = questions[currentQuestionIndex];
  quizEl.innerHTML = `<h3>${q.question}</h3>`;
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.classList.add('option-btn');
    btn.textContent = opt;
    btn.addEventListener('click', () => checkAnswer(btn, q.correct));
    quizEl.appendChild(btn);
  });

  startTimer();
  highlightMoneyLadder();
}

function checkAnswer(btn, correct) {
  stopTimer();
  const buttons = document.querySelectorAll('.option-btn');
  buttons.forEach(b => b.disabled = true);

  if(btn.textContent === correct){
    btn.style.backgroundColor = "#00ff00";
    correctSound.play();
  } else {
    btn.style.backgroundColor = "#ff0000";
    btn.classList.add('shake');
    wrongSound.play();
    // Show correct button
    buttons.forEach(b => { if(b.textContent===correct) b.style.backgroundColor="#00ff00"; });
  }

  // Update ladder
  highlightMoneyLadder();

  // Next question after 2s
  setTimeout(() => {
    currentQuestionIndex++;
    showQuestion();
  }, 2000);
}

// ======================= TIMER =======================
function startTimer() {
  currentTimer = 30;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    currentTimer--;
    updateTimerDisplay();
    tickSound.play();
    if(currentTimer <= 0){
      stopTimer();
      checkAnswer({textContent:''}, questions[currentQuestionIndex].correct); // auto wrong
    }
  },1000);
}

function stopTimer(){ clearInterval(timerInterval); }

function updateTimerDisplay(){
  timerText.textContent = `${currentTimer}s`;
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (currentTimer/30)*circumference;
  timerSvg.style.strokeDasharray = `${circumference} ${circumference}`;
  timerSvg.style.strokeDashoffset = offset;
}

// ======================= MONEY LADDER =======================
function generateMoneyLadder(count){
  const amounts = Array.from({length:count}, (_,i)=>`$${(i+1)*100}`);
  return amounts.reverse().map(a=>`<li>${a}</li>`).join('');
}

function highlightMoneyLadder(){
  const items = moneyListEl.querySelectorAll('li');
  items.forEach((li,i)=>li.style.background='none');
  if(items[currentQuestionIndex]){
    items[currentQuestionIndex].style.background = 'linear-gradient(90deg,#f7971e,#ffd200)';
    items[currentQuestionIndex].style.fontWeight='bold';
  }
}

// ======================= LIFELINES =======================
function useFifty(){
  if(usedFifty) return;
  usedFifty = true;
  fiftyBtn.disabled = true;
  const q = questions[currentQuestionIndex];
  const buttons = document.querySelectorAll('.option-btn');
  const wrongs = Array.from(buttons).filter(b=>b.textContent!==q.correct);
  wrongs.sort(()=>Math.random()-0.5).slice(0,2).forEach(b=>b.disabled=true);
}

function useCall(){
  if(usedCall) return;
  usedCall = true;
  callBtn.disabled = true;
  alert(`📞 Call a Friend suggests: "${questions[currentQuestionIndex].correct}"`);
}

function useAudience(){
  if(usedAudience) return;
  usedAudience = true;
  audienceBtn.disabled = true;
  const q = questions[currentQuestionIndex];
  alert(`👥 Audience Vote: Most people choose "${questions[currentQuestionIndex].correct}"`);
}
