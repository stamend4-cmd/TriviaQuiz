// -------------------- GLOBAL VARIABLES --------------------
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let timerDuration = 30; // seconds
let timerInterval;

const quizDiv = document.getElementById("quiz");
const moneyList = document.getElementById("money-list");
const timerText = document.getElementById("timer-text");
const timerCircle = document.querySelector("#timer-svg circle");
const hintBox = document.getElementById("hint-box");
const fiftyBtn = document.getElementById("fiftyBtn");
const callBtn = document.getElementById("callBtn");
const audienceBtn = document.getElementById("audienceBtn");

const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const tickSound = document.getElementById("tick-sound");

// Money ladder levels
const moneyLevels = ["$100","$200","$300","$500","$1,000","$2,000","$4,000","$8,000","$16,000","$32,000","$64,000","$125,000","$250,000","$500,000","$1,000,000"];

// -------------------- UTILITY --------------------
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// -------------------- FETCH QUESTIONS --------------------
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
  } catch (e) { console.error('OpenTDB failed', e); }

  // 2️⃣ Trivia API
  try {
    const tResp = await fetch(`https://the-trivia-api.com/api/questions?categories=${category}&limit=${Math.floor(count/3)}`);
    const tData = await tResp.json();
    questions.push(...tData.map(q => ({
      question: q.question,
      correct: q.correctAnswer,
      answers: shuffle([...q.incorrectAnswers, q.correctAnswer])
    })));
  } catch (e) { console.error('Trivia API failed', e); }

  // 3️⃣ QuizAPI.io
  try {
    const quizAPIKey = 'Wh9Plnz7rOMzEpgZsjHIomRe6nL4TKiB6VQxOk08';
    const qResp = await fetch(`https://quizapi.io/api/v1/questions?apiKey=${quizAPIKey}&category=${category}&limit=${Math.floor(count/3)}`);
    const qData = await qResp.json();
    qData.forEach(q => {
      let answers = [];
      for (let key in q.answers) {
        if (q.answers[key]) answers.push(q.answers[key]);
      }
      questions.push({
        question: q.question,
        correct: q.correct_answer,
        answers: shuffle(answers)
      });
    });
  } catch (e) { console.error('QuizAPI.io failed', e); }

  questions = shuffle(questions).slice(0, count);
  console.log('Loaded questions:', questions);
  buildMoneyLadder();
}

// -------------------- BUILD MONEY LADDER --------------------
function buildMoneyLadder() {
  moneyList.innerHTML = "";
  moneyLevels.slice(-questions.length).forEach((level, i) => {
    const li = document.createElement("li");
    li.textContent = `${questions.length - i}. ${level}`;
    if (i === 0) li.classList.add("active");
    moneyList.appendChild(li);
  });
}

// -------------------- SHOW QUESTION --------------------
function showQuestion() {
  clearInterval(timerInterval);
  if (currentQuestionIndex >= questions.length) {
    alert(`🎉 Quiz finished! Your score: ${score}`);
    return;
  }

  const q = questions[currentQuestionIndex];
  quizDiv.innerHTML = `<h3>${currentQuestionIndex + 1}. ${q.question}</h3>`;

  q.answers.forEach(ans => {
    const btn = document.createElement("button");
    btn.classList.add("answer-btn");
    btn.textContent = ans;
    btn.addEventListener("click", () => checkAnswer(btn, ans));
    quizDiv.appendChild(btn);
  });

  startTimer();
  updateMoneyLadder();
}

// -------------------- CHECK ANSWER --------------------
function checkAnswer(btn, selected) {
  const q = questions[currentQuestionIndex];
  const buttons = document.querySelectorAll(".answer-btn");
  buttons.forEach(b => {
    b.disabled = true;
    if (b.textContent === q.correct) b.classList.add("correct");
  });

  if (selected === q.correct) {
    btn.classList.add("correct");
    correctSound.play();
    score++;
  } else {
    btn.classList.add("wrong");
    wrongSound.play();
  }

  clearInterval(timerInterval);
  currentQuestionIndex++;
  setTimeout(showQuestion, 1500);
}

// -------------------- TIMER --------------------
function startTimer() {
  let time = timerDuration;
  timerText.textContent = `${time}s`;
  timerCircle.style.stroke = "#00ff00";

  timerInterval = setInterval(() => {
    time--;
    timerText.textContent = `${time}s`;
    const pct = (time / timerDuration) * 100;
    timerCircle.style.strokeDasharray = `219 ${219}`;
    timerCircle.style.strokeDashoffset = 219 - (219 * pct / 100);

    if (time <= 5) timerCircle.style.stroke = "#ff0";
    if (time <= 0) {
      clearInterval(timerInterval);
      checkAnswer({classList: {add: ()=>{}}}, ""); // auto fail
      currentQuestionIndex++;
      setTimeout(showQuestion, 500);
    }
  }, 1000);
}

// -------------------- MONEY LADDER UPDATE --------------------
function updateMoneyLadder() {
  const lis = moneyList.querySelectorAll("li");
  lis.forEach((li, i) => li.classList.remove("active"));
  lis[questions.length - currentQuestionIndex - 1]?.classList.add("active");
}

// -------------------- LIFELINES --------------------
fiftyBtn.addEventListener("click", () => {
  const q = questions[currentQuestionIndex];
  const buttons = Array.from(document.querySelectorAll(".answer-btn"));
  let wrongs = buttons.filter(b => b.textContent !== q.correct);
  shuffle(wrongs).slice(0, 2).forEach(b => b.disabled = true);
  hintBox.textContent = "50:50 used!";
});

callBtn.addEventListener("click", () => {
  const q = questions[currentQuestionIndex];
  hintBox.textContent = `Call a Friend suggests: "${q.correct}"`;
});

audienceBtn.addEventListener("click", () => {
  const q = questions[currentQuestionIndex];
  const buttons = document.querySelectorAll(".answer-btn");
  buttons.forEach(b => b.textContent += ` (${Math.floor(Math.random()*40+30)}%)`);
  hintBox.textContent = "Audience voted!";
});

// -------------------- INIT QUIZ --------------------
async function startQuiz(category, count) {
  await fetchQuestions(category, count);
  currentQuestionIndex = 0;
  score = 0;
  document.getElementById("quiz-container").style.display = "block";
  showQuestion();
}

// Example usage
// startQuiz('science', 10);
