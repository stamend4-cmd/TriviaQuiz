/* =========================
   GLOBAL STATE
========================= */
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let timer = null;
let timeLeft = 30;
let usedFifty = false;
let usedCall = false;
let usedAudience = false;

/* =========================
   DOM ELEMENTS
========================= */
const quizDiv = document.getElementById("quiz");
const startBtn = document.getElementById("startBtn");
const categorySelect = document.getElementById("categorySelect");
const questionCountSelect = document.getElementById("questionCount");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");
const lifelinesDiv = document.getElementById("lifelines");
const hintBox = document.getElementById("hint-box");
const moneyList = document.getElementById("money-list");

/* =========================
   MONEY LADDER
========================= */
const moneyLevels = [
  "$0", "$100", "$200", "$300", "$500",
  "$1,000", "$2,000", "$4,000", "$8,000",
  "$16,000", "$32,000", "$64,000", "$125,000",
  "$250,000", "$500,000", "$1,000,000"
];

moneyLevels.forEach(level => {
  const li = document.createElement("li");
  li.textContent = level;
  moneyList.appendChild(li);
});

/* =========================
   FETCH QUESTIONS
========================= */
async function fetchQuestions() {
  const amount = questionCountSelect.value;
  const categoryMap = {
    science: 17,
    history: 23,
    geography: 22,
    music: 12,
    film_and_tv: 11,
    sports: 21,
    food_and_drink: 49,
    general_knowledge: 9
  };

  const category = categoryMap[categorySelect.value];
  const url = `https://opentdb.com/api.php?amount=${amount}&category=${category}&type=multiple`;

  const res = await fetch(url);
  const data = await res.json();
  questions = data.results;
}

/* =========================
   START QUIZ
========================= */
startBtn.addEventListener("click", async () => {
  await fetchQuestions();
  currentQuestionIndex = 0;
  score = 0;
  usedFifty = usedCall = usedAudience = false;
  lifelinesDiv.style.display = "block";
  hintBox.innerHTML = "";
  showQuestion();
});

/* =========================
   SHOW QUESTION
========================= */
function showQuestion() {
  resetTimer();
  quizDiv.innerHTML = "";
  quizDiv.classList.add("fade-in");

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
    btn.onclick = () => selectAnswer(btn, q.correct_answer);
    quizDiv.appendChild(btn);
  });

  updateMoneyLadder();
  startTimer();
}

/* =========================
   TIMER
========================= */
function startTimer() {
  timeLeft = 30;
  timerText.textContent = "30s";
  timerBar.style.width = "100%";
  timerBar.style.background = "#00ffcc";

  timer = setInterval(() => {
    timeLeft--;
    timerText.textContent = timeLeft + "s";
    timerBar.style.width = (timeLeft / 30) * 100 + "%";

    if (timeLeft <= 10) timerBar.style.background = "#ff4d4d";

    if (timeLeft <= 0) {
      clearInterval(timer);
      revealCorrect(null);
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timer);
}

/* =========================
   ANSWER HANDLING
========================= */
function selectAnswer(button, correct) {
  clearInterval(timer);
  const buttons = document.querySelectorAll(".option-btn");

  buttons.forEach(btn => btn.disabled = true);

  if (button.innerHTML === correct) {
    button.classList.add("correct");
    score++;
    setTimeout(nextQuestion, 1200);
  } else {
    button.classList.add("wrong", "shake");
    revealCorrect(correct);
  }
}

function revealCorrect(correct) {
  const buttons = document.querySelectorAll(".option-btn");
  buttons.forEach(btn => {
    if (btn.innerHTML === correct) {
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
    quizDiv.innerHTML = `<h2>🎉 Finished!</h2><p>Score: ${score}</p>`;
  }
}

/* =========================
   MONEY LADDER UPDATE
========================= */
function updateMoneyLadder() {
  const items = moneyList.querySelectorAll("li");
  items.forEach(li => li.classList.remove("current"));
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
  let wrongs = q.incorrect_answers.slice(0, 2);

  document.querySelectorAll(".option-btn").forEach(btn => {
    if (wrongs.includes(btn.innerHTML)) btn.style.display = "none";
  });
};

// Call a Friend
document.getElementById("hintBtn").onclick = () => {
  if (usedCall) return;
  usedCall = true;

  const q = questions[currentQuestionIndex];
  hintBox.innerHTML = `📞 Friend thinks the answer is: <b>${q.correct_answer}</b>`;
};

// Audience Vote
document.getElementById("audienceBtn").onclick = () => {
  if (usedAudience) return;
  usedAudience = true;

  const q = questions[currentQuestionIndex];
  hintBox.innerHTML = `
📊 Audience Vote:<br>
${q.correct_answer}: <b>65%</b><br>
Others: <b>35%</b>
`;
};
