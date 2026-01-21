/***********************
  CONFIG
************************/
const TOTAL_QUESTIONS = 10;
const TIME_PER_QUESTION = 30;

/***********************
  STATE
************************/
let questions = [];
let currentIndex = 0;
let scoreIndex = 0;
let timerInterval;

/***********************
  DOM
************************/
const quiz = document.getElementById("quiz");
const startBtn = document.getElementById("start-btn");
const ladderItems = document.querySelectorAll(".ladder li");
const timerText = document.getElementById("timer-text");
const timerCircle = document.getElementById("timer-circle");

/***********************
  FETCH QUESTIONS
************************/
async function loadQuestions(){
  const res = await fetch(
    "https://the-trivia-api.com/api/questions?limit=10&difficulty=medium"
  );
  questions = await res.json();
}

/***********************
  START QUIZ
************************/
startBtn.addEventListener("click", async ()=>{
  startBtn.style.display="none";
  await loadQuestions();
  showQuestion();
});

/***********************
  SHOW QUESTION
************************/
function showQuestion(){
  clearInterval(timerInterval);

  const q = questions[currentIndex];
  quiz.innerHTML = `<h2>${q.question}</h2>`;

  const answers = [...q.incorrectAnswers, q.correctAnswer]
    .sort(()=>Math.random()-0.5);

  answers.forEach(answer=>{
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = answer;
    btn.onclick = ()=>handleAnswer(btn, answer === q.correctAnswer);
    quiz.appendChild(btn);
  });

  startTimer(TIME_PER_QUESTION);
}

/***********************
  TIMER (FIXED)
************************/
function startTimer(seconds){
  let timeLeft = seconds;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;

  timerCircle.style.strokeDasharray = circumference;
  timerCircle.style.strokeDashoffset = 0;

  timerText.textContent = timeLeft;
  timerText.style.color = "#00ff00";
  timerCircle.style.stroke = "#00ff00";

  timerInterval = setInterval(()=>{
    timeLeft--;
    timerText.textContent = timeLeft;

    const offset = circumference * (1 - timeLeft/seconds);
    timerCircle.style.strokeDashoffset = offset;

    if(timeLeft > 10){
      timerCircle.style.stroke = "#00ff00";
      timerText.style.color = "#00ff00";
    } else if(timeLeft > 5){
      timerCircle.style.stroke = "#ffff00";
      timerText.style.color = "#ffff00";
    } else {
      timerCircle.style.stroke = "#ff0000";
      timerText.style.color = "#ff0000";
    }

    if(timeLeft <= 0){
      clearInterval(timerInterval);
      revealCorrect(null);
    }
  },1000);
}

/***********************
  ANSWER HANDLING
************************/
function handleAnswer(button, isCorrect){
  clearInterval(timerInterval);
  const buttons = document.querySelectorAll(".option-btn");

  buttons.forEach(b=>b.disabled=true);

  if(isCorrect){
    button.classList.add("correct");
    updateLadder();
    setTimeout(nextQuestion, 1200);
  } else {
    button.classList.add("wrong","shake");
    revealCorrect(button);
  }
}

/***********************
  REVEAL CORRECT ANSWER
************************/
function revealCorrect(clicked){
  const q = questions[currentIndex];
  const buttons = document.querySelectorAll(".option-btn");

  buttons.forEach(btn=>{
    btn.disabled=true;
    if(btn.textContent === q.correctAnswer){
      btn.classList.add("correct");
    }
  });

  setTimeout(endGame,1500);
}

/***********************
  MONEY LADDER
************************/
function updateLadder(){
  if(ladderItems[scoreIndex]){
    ladderItems[scoreIndex].classList.remove("active");
  }
  scoreIndex++;
  if(ladderItems[scoreIndex]){
    ladderItems[scoreIndex].classList.add("active");
  }
}

/***********************
  NEXT / END
************************/
function nextQuestion(){
  currentIndex++;
  if(currentIndex >= TOTAL_QUESTIONS){
    endGame();
    return;
  }
  showQuestion();
}

function endGame(){
  quiz.innerHTML = `
    <h2>Game Over</h2>
    <p>You reached level ${scoreIndex}</p>
    <button onclick="location.reload()">Restart</button>
  `;
}
