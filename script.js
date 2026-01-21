// ---------------- VARIABLES ----------------
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let timerInterval;
let timerDuration = 30; // seconds
let timerRemaining = timerDuration;

// ---------------- UTILITY ----------------
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// ---------------- FETCH QUESTIONS ----------------
async function fetchQuestions(category, count) {
  questions = [];
  // 1️⃣ OpenTDB
  try {
    const otResp = await fetch(`https://opentdb.com/api.php?amount=${Math.floor(count/3)}&category=9&type=multiple`);
    const otData = await otResp.json();
    questions.push(...otData.results.map(q => ({
      question: q.question,
      correct: q.correct_answer,
      answers: shuffle([...q.incorrect_answers, q.correct_answer])
    })));
  } catch(e) { console.error('OpenTDB failed', e); }

  // 2️⃣ Trivia API
  try {
    const tResp = await fetch(`https://the-trivia-api.com/api/questions?categories=${category}&limit=${Math.floor(count/3)}`);
    const tData = await tResp.json();
    questions.push(...tData.map(q => ({
      question: q.question,
      correct: q.correctAnswer,
      answers: shuffle([...q.incorrectAnswers, q.correctAnswer])
    })));
  } catch(e) { console.error('Trivia API failed', e); }

  // 3️⃣ QuizAPI.io
  try {
    const quizAPIKey = 'Wh9Plnz7rOMzEpgZsjHIomRe6nL4TKiB6VQxOk08';
    const qResp = await fetch(`https://quizapi.io/api/v1/questions?apiKey=${quizAPIKey}&category=${category}&limit=${Math.floor(count/3)}`);
    const qData = await qResp.json();
    qData.forEach(q => {
      let answers = [];
      for (let key in q.answers) { if (q.answers[key]) answers.push(q.answers[key]); }
      questions.push({
        question: q.question,
        correct: q.correct_answer,
        answers: shuffle(answers)
      });
    });
  } catch(e) { console.error('QuizAPI.io failed', e); }

  questions = shuffle(questions).slice(0, count);
  console.log('Loaded questions:', questions);
}

// ---------------- START QUIZ ----------------
const quizDiv = document.getElementById('quiz');
const moneyList = document.getElementById('money-list');
const timerText = document.getElementById('timer-text');
const timerCircle = document.querySelector('#timer-svg circle');

function startQuiz() {
  currentQuestionIndex = 0;
  score = 0;
  displayMoneyLadder();
  showQuestion();
}

// ---------------- SHOW QUESTION ----------------
function showQuestion() {
  if (currentQuestionIndex >= questions.length) return endQuiz();

  clearInterval(timerInterval);
  timerRemaining = timerDuration;
  updateTimerDisplay();
  timerInterval = setInterval(countdown, 1000);

  const q = questions[currentQuestionIndex];
  quizDiv.innerHTML = `<h2>Q${currentQuestionIndex+1}: ${q.question}</h2>`;

  q.answers.forEach(ans => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerText = ans;
    btn.onclick = () => checkAnswer(btn, ans, q.correct);
    quizDiv.appendChild(btn);
  });
}

// ---------------- CHECK ANSWER ----------------
function checkAnswer(btn, answer, correct) {
  clearInterval(timerInterval);

  const allBtns = document.querySelectorAll('.option-btn');
  allBtns.forEach(b => b.disabled = true);

  if (answer === correct) {
    btn.classList.add('correct');
    score++;
    updateMoneyLadder();
    document.getElementById('correct-sound').play();
  } else {
    btn.classList.add('wrong', 'shake');
    document.getElementById('wrong-sound').play();
    allBtns.forEach(b => { if (b.innerText === correct) b.classList.add('correct'); });
  }

  setTimeout(() => {
    currentQuestionIndex++;
    showQuestion();
  }, 1500);
}

// ---------------- TIMER ----------------
function countdown() {
  timerRemaining--;
  updateTimerDisplay();
  if (timerRemaining <= 0) {
    clearInterval(timerInterval);
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.disabled = true);
    allBtns.forEach(b => { if (b.innerText === questions[currentQuestionIndex].correct) b.classList.add('correct'); });
    setTimeout(() => {
      currentQuestionIndex++;
      showQuestion();
    }, 1500);
  }
}

function updateTimerDisplay() {
  timerText.innerText = `${timerRemaining}s`;
  const circumference = 2 * Math.PI * 35;
  timerCircle.style.strokeDashoffset = circumference - (timerRemaining / timerDuration) * circumference;
  timerCircle.style.stroke = timerRemaining > 10 ? "#00ff00" : (timerRemaining > 5 ? "#ffff00" : "#ff0000");
}

// ---------------- MONEY LADDER ----------------
const moneySteps = ['$100','$200','$300','$500','$1,000','$2,000','$4,000','$8,000','$16,000','$32,000','$64,000','$125,000','$250,000','$500,000','$1,000,000'];

function displayMoneyLadder() {
  moneyList.innerHTML = '';
  moneySteps.forEach((amt,i) => {
    const li = document.createElement('li');
    li.innerText = amt;
    if (i === 0) li.classList.add('current');
    moneyList.appendChild(li);
  });
}

function updateMoneyLadder() {
  const items = moneyList.querySelectorAll('li');
  items.forEach((li,i) => li.classList.remove('current'));
  items[currentQuestionIndex].classList.add('current');
}

// ---------------- LIFELINES ----------------
document.getElementById('fiftyBtn').onclick = () => {
  const q = questions[currentQuestionIndex];
  const incorrectBtns = [...document.querySelectorAll('.option-btn')].filter(b => b.innerText !== q.correct);
  shuffle(incorrectBtns).slice(0,2).forEach(b => b.disabled = true);
};

document.getElementById('callBtn').onclick = () => {
  alert(`Call a friend suggests: "${questions[currentQuestionIndex].correct}"`);
};

document.getElementById('audienceBtn').onclick = () => {
  const q = questions[currentQuestionIndex];
  alert(`Audience votes majority for: "${q.correct}"`);
};

// ---------------- END QUIZ ----------------
function endQuiz() {
  quizDiv.innerHTML = `<h2>Quiz Finished! Score: ${score}/${questions.length}</h2>`;
}

// ---------------- START BUTTON ----------------
document.getElementById('startBtn').onclick = async () => {
  const cat = document.getElementById('categorySelect').value;
  const count = parseInt(document.getElementById('questionCount').value);
  await fetchQuestions(cat,count);
  document.getElementById('quiz-container').style.display = 'block';
  startQuiz();
};
