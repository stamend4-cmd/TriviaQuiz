let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let timerDuration = 30; // seconds
let timerInterval;

// ================== UTILITY ==================
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// ================== FETCH QUESTIONS ==================
async function fetchQuestions(category, count) {
  questions = [];

  // OpenTDB API
  try {
    const resp = await fetch(`https://opentdb.com/api.php?amount=${count}&category=9&type=multiple`);
    const data = await resp.json();
    questions = data.results.map((q) => ({
      question: q.question,
      correct: q.correct_answer,
      answers: shuffle([...q.incorrect_answers, q.correct_answer])
    }));
  } catch (err) {
    console.error("OpenTDB fetch error:", err);
  }
}

// ================== RENDER QUIZ ==================
function showQuestion() {
  if (currentQuestionIndex >= questions.length) {
    alert(`Quiz finished! Score: ${score}/${questions.length}`);
    return;
  }

  const quiz = document.getElementById("quiz");
  const q = questions[currentQuestionIndex];

  quiz.innerHTML = `
    <h2>Question ${currentQuestionIndex + 1} / ${questions.length}</h2>
    <p id="question-text">${q.question}</p>
    <div id="answers"></div>
  `;

  const answersDiv = document.getElementById("answers");
  q.answers.forEach((ans) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = ans;
    btn.onclick = () => selectAnswer(btn, q.correct);
    answersDiv.appendChild(btn);
  });

  updateMoneyLadder();
  startTimer();
}

// ================== SELECT ANSWER ==================
function selectAnswer(btn, correctAnswer) {
  stopTimer();

  const buttons = document.querySelectorAll(".option-btn");
  buttons.forEach(b => b.disabled = true);

  if (btn.textContent === correctAnswer) {
    btn.style.backgroundColor = "#00ff00";
    btn.style.color = "#000";
    score++;
  } else {
    btn.style.backgroundColor = "#ff0000";
    btn.style.color = "#fff";
    btn.classList.add("shake");
    // highlight correct answer
    buttons.forEach(b => {
      if (b.textContent === correctAnswer) {
        b.style.backgroundColor = "#00ff00";
        b.style.color = "#000";
      }
    });
  }

  currentQuestionIndex++;
  setTimeout(showQuestion, 1500);
}

// ================== MONEY LADDER ==================
function updateMoneyLadder() {
  const moneyList = document.getElementById("money-list");
  moneyList.innerHTML = "";
  const amounts = Array.from({length: questions.length}, (_, i) => (i+1)*100);
  amounts.reverse().forEach((amt, i) => {
    const li = document.createElement("li");
    li.textContent = `$${amt}`;
    if (i === questions.length - currentQuestionIndex - 1) {
      li.classList.add("current");
    }
    moneyList.appendChild(li);
  });
}

// ================== TIMER ==================
function startTimer() {
  const timerText = document.getElementById("timer-text");
  const timerCircle = document.querySelector("#timer-svg circle");
  let timeLeft = timerDuration;
  const fullDash = 219.911; // 2π*35
  timerCircle.style.strokeDashoffset = 0;

  timerText.textContent = `${timeLeft}s`;

  timerInterval = setInterval(() => {
    timeLeft--;
    timerText.textContent = `${timeLeft}s`;
    const offset = fullDash * (1 - timeLeft / timerDuration);
    timerCircle.style.strokeDashoffset = offset;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      selectAnswer({textContent:""}, questions[currentQuestionIndex].correct);
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

// ================== INIT ==================
document.getElementById("startBtn").addEventListener("click", async () => {
  const category = document.getElementById("categorySelect").value;
  const count = parseInt(document.getElementById("questionCount").value);
  await fetchQuestions(category, count);
  document.getElementById("categoryDiv").style.display = "none";
  document.getElementById("quiz-container").style.display = "block";
  showQuestion();
});
