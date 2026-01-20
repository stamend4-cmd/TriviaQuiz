/*************************************************
 * 🔥 NEON ONLINE QUIZ APP — FULL SCRIPT
 * Firebase + Online Trivia + Leaderboard
 *************************************************/

/* ========== FIREBASE CONFIG (YOUR PROJECT) ========== */
const firebaseConfig = {
  apiKey: "AIzaSyDCCBKiQio6iPKm36MQdGqb9LzTOxbOfiE",
  authDomain: "triviaquiz-2579b.firebaseapp.com",
  projectId: "triviaquiz-2579b"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

/* ========== DOM ELEMENTS ========== */
const authDiv = document.getElementById("authDiv");
const emailDiv = document.getElementById("emailDiv");
const categoryDiv = document.getElementById("categoryDiv");
const quizContainer = document.getElementById("quiz-container");
const quizDiv = document.getElementById("quiz");
const leaderboardList = document.getElementById("leaderboard-list");
const lifelines = document.getElementById("lifelines");
const fiftyBtn = document.getElementById("fiftyBtn");
const hintBtn = document.getElementById("hintBtn");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");
const moneyList = document.getElementById("money-list");
const hintBox = document.getElementById("hint-box");

/* Buttons */
const googleLoginBtn = document.getElementById("googleLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn = document.getElementById("emailCancelBtn");
const logoutBtn = document.getElementById("logoutBtn");
const startBtn = document.getElementById("startBtn");

/* Inputs */
const categorySelect = document.getElementById("categorySelect");
const questionCount = document.getElementById("questionCount");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");

/* Sounds */
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const tickSound = document.getElementById("tick-sound");

/* ========== GLOBAL STATE ========== */
let questions = [];
let current = 0;
let score = 0;
let timer;
let timeLeft = 30;
let fiftyUsed = false;
let hintUsed = false;
let ladderLevel = 0;

/* ========== FALLBACK QUESTIONS ========== */
const fallbackQuestions = [
  {
    question: "What color is the sky?",
    correctAnswer: "Blue",
    incorrectAnswers: ["Red", "Green", "Yellow"],
    hint: "Same color as the ocean"
  },
  {
    question: "Which planet is the Red Planet?",
    correctAnswer: "Mars",
    incorrectAnswers: ["Venus", "Jupiter", "Saturn"],
    hint: "Roman god of war"
  },
  {
    question: "How many days are in a week?",
    correctAnswer: "7",
    incorrectAnswers: ["5", "6", "8"],
    hint: "Monday to Sunday"
  }
];

/* ========== AUTH ========== */
googleLoginBtn.onclick = async () => {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
    onLogin();
  } catch (e) {
    alert("Google login failed");
    console.error(e);
  }
};

emailRegisterBtn.onclick = () => {
  authDiv.style.display = "none";
  emailDiv.style.display = "block";
};

emailCancelBtn.onclick = () => {
  emailDiv.style.display = "none";
  authDiv.style.display = "block";
};

emailLoginBtn.onclick = async () => {
  try {
    await auth.signInWithEmailAndPassword(
      emailInput.value,
      passwordInput.value
    );
    onLogin();
  } catch (e) {
    alert(e.message);
  }
};

emailRegisterSubmitBtn.onclick = async () => {
  try {
    await auth.createUserWithEmailAndPassword(
      emailInput.value,
      passwordInput.value
    );
    onLogin();
  } catch (e) {
    alert(e.message);
  }
};

logoutBtn.onclick = async () => {
  await auth.signOut();
  location.reload();
};

function onLogin() {
  authDiv.style.display = "none";
  emailDiv.style.display = "none";
  categoryDiv.style.display = "block";
  updateLeaderboard();
}

/* ========== START QUIZ ========== */
startBtn.onclick = startQuiz;
fiftyBtn.onclick = useFifty;
hintBtn.onclick = useHint;

async function startQuiz() {
  startBtn.disabled = true;
  quizContainer.style.display = "block";
  lifelines.style.display = "flex";
  hintBox.style.display = "none";

  current = 0;
  score = 0;
  ladderLevel = 0;
  fiftyUsed = false;
  hintUsed = false;

  fiftyBtn.disabled = false;
  hintBtn.disabled = false;

  buildMoneyLadder();

  try {
    const res = await fetch(
      `https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}`
    );
    const data = await res.json();
    questions = data.map(q => ({
      question: q.question,
      correctAnswer: q.correctAnswer,
      incorrectAnswers: q.incorrectAnswers,
      hint: "Think carefully"
    }));
  } catch {
    questions = fallbackQuestions;
  }

  showQuestion();
}

/* ========== QUESTION DISPLAY ========== */
function showQuestion() {
  clearInterval(timer);
  timeLeft = 30;
  updateTimer();

  hintBox.style.display = "none";
  const q = questions[current];

  quizDiv.innerHTML = `<h2>Q${current + 1}: ${q.question}</h2><div id="feedback"></div>`;

  const answers = [...q.incorrectAnswers, q.correctAnswer].sort(
    () => Math.random() - 0.5
  );

  answers.forEach(ans => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = ans;
    btn.onclick = () => checkAnswer(ans, btn);
    quizDiv.appendChild(btn);
  });

  timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 5 && timeLeft > 0) tickSound.play();
    if (timeLeft === 0) nextQuestion(false);
  }, 1000);
}

function updateTimer() {
  timerText.textContent = `${timeLeft}s`;
  timerBar.style.width = (timeLeft / 30) * 100 + "%";
}

/* ========== ANSWER CHECK ========== */
function checkAnswer(answer, btn) {
  clearInterval(timer);
  const correct = questions[current].correctAnswer;
  const feedback = document.getElementById("feedback");

  document.querySelectorAll(".option-btn").forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
    if (b.textContent === answer && answer !== correct)
      b.classList.add("wrong");
  });

  if (answer === correct) {
    score++;
    ladderLevel++;
    correctSound.play();
    updateMoneyLadder();
    feedback.innerHTML = "✅ Correct!";
  } else {
    wrongSound.play();
    feedback.innerHTML = `❌ Wrong!<br>Correct: <b>${correct}</b>`;
  }

  setTimeout(nextQuestion, 1500);
}

function nextQuestion() {
  current++;
  if (current >= questions.length) {
    finishQuiz();
  } else {
    showQuestion();
  }
}

/* ========== LIFELINES ========== */
function useFifty() {
  if (fiftyUsed) return;
  fiftyUsed = true;
  fiftyBtn.disabled = true;

  let removed = 0;
  const correct = questions[current].correctAnswer;
  document.querySelectorAll(".option-btn").forEach(btn => {
    if (btn.textContent !== correct && removed < 2) {
      btn.style.opacity = 0.3;
      removed++;
    }
  });
}

function useHint() {
  if (hintUsed) return;
  hintUsed = true;
  hintBtn.disabled = true;
  hintBox.textContent = "💡 Hint: " + questions[current].hint;
  hintBox.style.display = "block";
}

/* ========== MONEY LADDER ========== */
function buildMoneyLadder() {
  moneyList.innerHTML = "";
  for (let i = questionCount.value; i > 0; i--) {
    const li = document.createElement("li");
    li.textContent = "$" + i * 100;
    moneyList.appendChild(li);
  }
}

function updateMoneyLadder() {
  const items = moneyList.querySelectorAll("li");
  items.forEach(i => i.classList.remove("current"));
  const index = items.length - ladderLevel - 1;
  if (items[index]) items[index].classList.add("current");
}

/* ========== FINISH + LEADERBOARD ========== */
function finishQuiz() {
  quizDiv.innerHTML = `<h2>Finished!</h2><p>Score: ${score}</p>`;
  lifelines.style.display = "none";

  const user = auth.currentUser;
  if (user) {
    db.collection("leaderboard").doc(user.uid).set({
      name: user.displayName || user.email,
      score: score,
      date: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  updateLeaderboard();
}

async function updateLeaderboard() {
  leaderboardList.innerHTML = "";
  const snap = await db
    .collection("leaderboard")
    .orderBy("score", "desc")
    .limit(10)
    .get();

  snap.forEach(doc => {
    const li = document.createElement("li");
    li.textContent = `${doc.data().name} — ${doc.data().score}`;
    leaderboardList.appendChild(li);
  });
}
