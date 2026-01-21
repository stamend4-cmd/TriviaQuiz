// ---------------- FIREBASE CONFIG ----------------
const firebaseConfig = {
  apiKey: "AIzaSyDCCBKiQio6iPKm36MQdGqb9LzTOxbOfiE",
  authDomain: "triviaquiz-2579b.firebaseapp.com",
  projectId: "triviaquiz-2579b"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ---------------- DOM ELEMENTS ----------------
const googleLoginBtn = document.getElementById("googleLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn = document.getElementById("emailCancelBtn");
const logoutBtn = document.getElementById("logoutBtn");

const startBtn = document.getElementById("startBtn");
const categorySelect = document.getElementById("categorySelect");
const questionCount = document.getElementById("questionCount");
const quizDiv = document.getElementById("quiz");
const moneyList = document.getElementById("money-list");
const lifelines = document.getElementById("lifelines");
const fiftyBtn = document.getElementById("fiftyBtn");
const callBtn = document.getElementById("callBtn");
const audienceBtn = document.getElementById("audienceBtn");

const timerText = document.getElementById("timer-text");
const timerSVG = document.getElementById("timer-svg").querySelector("circle");
const hintBox = document.getElementById("hint-box");
const leaderboardList = document.getElementById("leaderboard-list");

const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const tickSound = document.getElementById("tick-sound");

// ---------------- GLOBALS ----------------
let questions = [];
let current = 0;
let score = 0;
let timer;
let timePerQuestion = 30;
let fiftyUsed = false;
let callUsed = false;
let audienceUsed = false;
let ladderLevel = 0;

// ---------------- FALLBACK QUESTIONS ----------------
const fallbackQuestions = [
  { question: "What color is the sky?", correctAnswer: "Blue", incorrectAnswers: ["Red","Green","Yellow"], hint: "It's the same color as the ocean." },
  { question: "How many days are in a week?", correctAnswer: "7", incorrectAnswers: ["5","6","8"], hint: "Think Monday to Sunday." },
  { question: "Which planet is known as the Red Planet?", correctAnswer: "Mars", incorrectAnswers: ["Venus","Jupiter","Saturn"], hint: "Named after Roman god of war." }
];

// ---------------- LOGIN ----------------
googleLoginBtn.addEventListener("click", async () => {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
    onLoginSuccess();
  } catch(e) { alert("Login failed!"); console.error(e); }
});

emailRegisterBtn.addEventListener("click", () => {
  document.getElementById("emailDiv").style.display="block";
  document.getElementById("authDiv").style.display="none";
});

emailCancelBtn.addEventListener("click", () => {
  document.getElementById("emailDiv").style.display="none";
  document.getElementById("authDiv").style.display="block";
});

emailLoginBtn.addEventListener("click", async () => {
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;
  try {
    await auth.signInWithEmailAndPassword(email,password);
    onLoginSuccess();
  } catch(e) { alert("Login failed: "+e.message); }
});

emailRegisterSubmitBtn.addEventListener("click", async () => {
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;
  try {
    await auth.createUserWithEmailAndPassword(email,password);
    onLoginSuccess();
  } catch(e) { alert("Register failed: "+e.message); }
});

logoutBtn.addEventListener("click", async () => {
  await auth.signOut();
  location.reload();
});

function onLoginSuccess() {
  document.getElementById("authDiv").style.display="none";
  document.getElementById("emailDiv").style.display="none";
  document.getElementById("categoryDiv").style.display="block";
  updateLeaderboard();
}

// ---------------- START QUIZ ----------------
startBtn.addEventListener("click", startQuiz);
fiftyBtn.addEventListener("click", useFifty);
callBtn.addEventListener("click", useCall);
audienceBtn.addEventListener("click", useAudience);

async function startQuiz() {
  startBtn.disabled = true;
  document.getElementById("quiz-container").style.display="block";
  lifelines.style.display="flex";
  ladderLevel=current=score=0;
  fiftyUsed=callUsed=audienceUsed=false;
  fiftyBtn.disabled=false; callBtn.disabled=false; audienceBtn.disabled=false;
  buildMoneyLadder();

  try {
    const res = await fetch(`https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}`);
    if(!res.ok) throw "API error";
    const data = await res.json();
    questions = data.map(q => ({
      question: q.question,
      correctAnswer: q.correctAnswer,
      incorrectAnswers: q.incorrectAnswers,
      hint: q.hint || "Think carefully."
    }));
  } catch {
    questions = fallbackQuestions;
  }
  showQuestion();
}

// ---------------- SHOW QUESTION ----------------
function showQuestion() {
  clearInterval(timer);
  let timeLeft = timePerQuestion;
  updateTimer(timeLeft);

  const q = questions[current];
  quizDiv.innerHTML = `<h2>Q${current+1}: ${q.question}</h2><div id="feedback"></div>`;

  const answers = [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random()-0.5);
  answers.forEach(a => {
    const btn = document.createElement("button");
    btn.textContent = a;
    btn.className = "option-btn";
    btn.addEventListener("click", ()=>checkAnswer(a,btn));
    quizDiv.appendChild(btn);
  });

  // TIMER
  const radius = timerSVG.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  timerSVG.style.strokeDasharray = circumference;
  timerSVG.style.strokeDashoffset = 0;

  timer = setInterval(() => {
    timeLeft--;
    updateTimer(timeLeft);
    const offset = circumference - (timeLeft/timePerQuestion)*circumference;
    timerSVG.style.strokeDashoffset = offset;

    if(timeLeft <= 5 && timeLeft > 0) tickSound.play();
    if(timeLeft <= 0) { clearInterval(timer); nextQuestion(false); }
  }, 1000);
}

// ---------------- TIMER UPDATE ----------------
function updateTimer(timeLeft) {
  timerText.textContent = `${timeLeft}s`;
  timerText.style.color = timeLeft>10?"#00ff00":timeLeft>5?"#ffcc00":"#ff4d4d";
  timerText.style.textAlign = "center";
  timerText.style.lineHeight = "80px";
  timerSVG.style.stroke = timeLeft>10?"#00ff00":timeLeft>5?"#ffcc00":"#ff4d4d";
}

// ---------------- CHECK ANSWER ----------------
function checkAnswer(answer, btnClicked) {
  clearInterval(timer);
  const correct = questions[current].correctAnswer;
  const feedback = document.getElementById("feedback");
  const buttons = document.querySelectorAll(".option-btn");

  buttons.forEach(btn => {
    btn.disabled=true;
    if(btn.textContent === correct) {
      btn.classList.add("correct");
    }
    if(btn.textContent === answer && answer !== correct) {
      btn.classList.add("wrong");
      btn.classList.add("shake");
      setTimeout(()=>btn.classList.remove("shake"),500);
    }
  });

  if(answer === correct) {
    score++; ladderLevel++; updateMoneyLadder();
    feedback.innerHTML="✅ <b>Correct!</b>";
    correctSound.play();
  } else {
    feedback.innerHTML=`❌ <b>Wrong!</b><br><span class="correct-answer">Correct: ${correct}</span>`;
    wrongSound.play();
  }

  setTimeout(nextQuestion,1800);
}

// ---------------- NEXT QUESTION ----------------
function nextQuestion() {
  current++;
  if(current >= questions.length) {
    quizDiv.innerHTML=`<h2>Finished!</h2><p>Score: ${score}/${questions.length}</p><button id="restartBtn">Restart</button>`;
    document.getElementById("restartBtn").addEventListener("click", ()=>location.reload());
    lifelines.style.display="none"; moneyList.style.display="none"; hintBox.style.display="none";
    const user = auth.currentUser; if(user) saveScore(user, score);
    return;
  }
  showQuestion();
}

// ---------------- LIFELINES ----------------
function useFifty() {
  if(fiftyUsed) return;
  fiftyUsed = true; fiftyBtn.disabled = true;
  const correct = questions[current].correctAnswer;
  let removed=0;
  const btns=Array.from(document.querySelectorAll(".option-btn"));
  btns.forEach(b=>{
    if(b.textContent !== correct && removed<2){ b.style.opacity=0.3; removed++; }
  });
}

function useCall() {
  if(callUsed) return;
  callUsed=true; callBtn.disabled=true;
  const q=questions[current];
  const correct=q.correctAnswer;
  const options=[...q.incorrectAnswers, correct];
  const suggested=options[Math.floor(Math.random()*options.length)];
  alert(`Call a Friend suggests: "${suggested}"`);
}

function useAudience() {
  if(audienceUsed) return;
  audienceUsed=true; audienceBtn.disabled=true;
  const q=questions[current];
  const correct=q.correctAnswer;
  const options=[...q.incorrectAnswers, correct];
  let percentages={};
  options.forEach(o=>{
    percentages[o] = (o===correct?Math.floor(Math.random()*50)+50:Math.floor(Math.random()*50));
  });
  let message = "Audience vote:\n";
  for(let o of options) message += `${o}: ${percentages[o]}%\n`;
  alert(message);
}

// ---------------- MONEY LADDER ----------------
function buildMoneyLadder() {
  moneyList.innerHTML="";
  const numQuestions = parseInt(questionCount.value);
  const increment = 100;
  for(let i=numQuestions;i>0;i--){
    const li=document.createElement("li");
    li.textContent="$"+(i*increment);
    moneyList.appendChild(li);
  }
}

function updateMoneyLadder() {
  const lis = moneyList.querySelectorAll("li");
  lis.forEach(li=>li.classList.remove("current"));
  const idx = moneyList.children.length - ladderLevel;
  if(lis[idx]) lis[idx].classList.add("current");
}

// ---------------- LEADERBOARD ----------------
async function saveScore(user, score) {
  if(!user) return;
  const userData={uid:user.uid, name:user.displayName||user.email, avatar:user.photoURL||"", score, date: firebase.firestore.FieldValue.serverTimestamp()};
  await db.collection("leaderboard").doc(user.uid).set(userData,{merge:true});
  updateLeaderboard();
}

async function updateLeaderboard() {
  if(!leaderboardList) return;
  leaderboardList.innerHTML="";
  const snapshot = await db.collection("leaderboard").orderBy("score","desc").limit(10).get();
  snapshot.forEach(doc=>{
    const data=doc.data();
    const li=document.createElement("li");
    const img=document.createElement("img");
    img.src=data.avatar||"";
    img.width=30; img.height=30;
    li.appendChild(img);
    li.appendChild(document.createTextNode(`${data.name} — ${data.score} pts`));
    leaderboardList.appendChild(li);
  });
}

updateLeaderboard();
