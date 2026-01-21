/* =========================
   GLOBAL STATE
========================= */
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let timerInterval = null;
let timeLeft = 30;
let usedFifty = false;
let usedHint = false;

/* =========================
   DOM ELEMENTS
========================= */
const categoryDiv = document.getElementById("categoryDiv");
const quizContainer = document.getElementById("quiz-container");
const quizDiv = document.getElementById("quiz");
const startBtn = document.getElementById("startBtn");
const categorySelect = document.getElementById("categorySelect");
const questionCountSelect = document.getElementById("questionCount");
const lifelinesDiv = document.getElementById("lifelines");
const hintBox = document.getElementById("hint-box");

const timerText = document.getElementById("timer-text");
const timerCircle = document.querySelector("#timer-svg circle");
const CIRCUMFERENCE = 2 * Math.PI * 35;

const moneyList = document.getElementById("money-list");

/* =========================
   INIT
========================= */
timerCircle.style.strokeDasharray = CIRCUMFERENCE;
timerCircle.style.strokeDashoffset = 0;
categoryDiv.style.display = "block";

/* =========================
   MONEY LADDER
========================= */
const moneyLevels = [
  "$0", "$100", "$200", "$300", "$500",
  "$1,000", "$2,000", "$4,000", "$8,000",
  "$16,000", "$32,000", "$64,000",
  "$125,000", "$250,000", "$500,000", "$1,000,000"
];

moneyLevels.forEach(level => {
  const li = document.createElement("li");
  li.textContent = level;
  moneyList.appendChild(li);
});

/* =========================
   FETCH QUESTIONS (OPEN TRIVIA DB)
========================= */
async function fetchQuestions() {
  const amount = questionCountSelect.value;
  const categories = {
    science: 17,
    history: 23,
    geography: 22,
    music: 12,
    film_and_tv: 11,
    sports: 21,
    food_and_drink: 49,
    general_knowledge: 9
  };

  const category = categories[categorySelect.value];
  const url = `https://opentdb.com/api.php?amount=${amount}&category=${category}&type=multiple`;

  const res = await fetch(url);
  const data = await res.json();
  questions = data.results;
}

/* =========================
   START QUIZ
========================= */
startBtn.onclick = async () => {
  await fetchQuestions();

  currentQuestionIndex = 0;
  score = 0;
  usedFifty = false;
  usedHint = false;

  categoryDiv.style.display = "none";
  quizContainer.style.display = "block";
  lifelinesDiv.style.display = "block";
  hintBox.innerHTML = "";

  showQuestion();
};

/* =========================
   SHOW QUESTION
========================= */
function showQuestion() {
  resetTimer();
  quizDiv.innerHTML = "";

  const q = questions[currentQuestionIndex];
  const questionEl = document.createElement("h2");
  questionEl.innerHTML = q.question;
  quizDiv.appendChild(questionEl);

  let answers = [...q.incorrect_answers, q.correct_answer];
  answers.sort(() => Math.random() - 0.5);

  answers.forEach(answer => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerHTML = answer;
    btn.onclick = () => handleAnswer(btn, q.correct_answer);
    quizDiv.appendChild(btn);
  });

  updateMoneyLadder();
  startTimer();
}

/* =========================
   TIMER (CIRCULAR)
========================= */
function startTimer() {
  timeLeft = 30;
  timerText.textContent = "30s";
  timerCircle.style.stroke = "#00ff00";
  timerCircle.style.strokeDashoffset = 0;

  timerInterval = setInterval(() => {
    timeLeft--;
    timerText.textContent = timeLeft + "s";

    const offset = CIRCUMFERENCE - (timeLeft / 30) * CIRCUMFERENCE;
    timerCircle.style.strokeDashoffset = offset;

    if (timeLeft <= 10) timerCircle.style.stroke = "#ff0000";

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      revealCorrect();
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
}

/* =========================
   ANSWER LOGIC
========================= */
function handleAnswer(button, correctAnswer) {
  clearInterval(timerInterval);
  const buttons = document.querySelectorAll(".option-btn");

  buttons.forEach(b => b.disabled = true);

  if (button.innerHTML === correctAnswer) {
    button.classList.add("correct");
    score++;
    setTimeout(nextQuestion, 1200);
  } else {
    button.classList.add("wrong", "shake");
    revealCorrect(correctAnswer);
  }
}

function revealCorrect(correctAnswer) {
  const buttons = document.querySelectorAll(".option-btn");
  buttons.forEach(btn => {
    if (btn.innerHTML === correctAnswer) {
      btn.classList.add("correct");
    }
  });
}

/* =========================
   NEXT QUESTION
========================= */
function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    quizDiv.innerHTML = `<h2>🎉 Quiz Finished</h2><p>Score: ${score}</p>`;
  }
}

/* =========================
   MONEY LADDER
========================= */
function updateMoneyLadder() {
  const items = moneyList.querySelectorAll("li");
  items.forEach(i => i.classList.remove("current"));
  if (items[currentQuestionIndex]) {
    items[currentQuestionIndex].classList.add("current");
  }
}

/* =========================
   LIFELINES
========================= */

// 50:50
document.getElementById("fiftyBtn").onclick = () => {
  if (usedFifty) return;
  usedFifty = true;

  const q = questions[currentQuestionIndex];
  let removed = 0;

  document.querySelectorAll(".option-btn").forEach(btn => {
    if (btn.innerHTML !== q.correct_answer && removed < 2) {
      btn.style.display = "none";
      removed++;
    }
  });
};

// Call a Friend (Hint)
document.getElementById("hintBtn").onclick = () => {
  if (usedHint) return;
  usedHint = true;

  const q = questions[currentQuestionIndex];
  hintBox.innerHTML = `📞 Friend says: <b>${q.correct_answer}</b>`;
};
