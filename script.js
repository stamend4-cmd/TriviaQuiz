// ---------------- FIREBASE CONFIG ----------------
const firebaseConfig = {
  apiKey: "AIzaSyDCCBKiQio6iPKm36MQdGqb9LzTOxbOfiE",
  authDomain: "triviaquiz-2579b.firebaseapp.com",
  projectId: "triviaquiz-2579b",
  storageBucket: "triviaquiz-2579b.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ---------------- DOM ELEMENTS ----------------
const googleLoginBtn = document.getElementById("googleLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const facebookLoginBtn = document.getElementById("facebookLoginBtn");
const emailDiv = document.getElementById("emailDiv");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn = document.getElementById("emailCancelBtn");
const logoutBtn = document.getElementById("logoutBtn");
const startBtn = document.getElementById("startBtn");
const categorySelect = document.getElementById("categorySelect");
const questionCount = document.getElementById("questionCount");
const quizDiv = document.getElementById("quiz");
const lifelines = document.getElementById("lifelines");
const fiftyBtn = document.getElementById("fiftyBtn");
const hintBtn = document.getElementById("hintBtn");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");
const moneyList = document.getElementById("money-list");
const hintBox = document.getElementById("hint-box");
const leaderboardList = document.getElementById("leaderboard-list");
const quizContainer = document.getElementById("quiz-container");
const categoryDiv = document.getElementById("categoryDiv");
const authDiv = document.getElementById("authDiv");
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const tickSound = document.getElementById("tick-sound");

// ---------------- GLOBALS ----------------
let questions = [], current = 0, score = 0, timer;
let fiftyUsed = false, hintUsed = false, ladderLevel = 0;
let timePerQuestion = 30;

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
  } catch (e) {
    alert("Login failed!"); console.error(e);
  }
});

emailRegisterBtn.addEventListener("click", ()=>{ emailDiv.style.display="block"; authDiv.style.display="none"; });
emailCancelBtn.addEventListener("click", ()=>{ emailDiv.style.display="none"; authDiv.style.display="block"; });

emailLoginBtn.addEventListener("click", async ()=>{
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;
  try { await auth.signInWithEmailAndPassword(email,password); onLoginSuccess(); }
  catch(e){ alert("Login failed: "+e.message); }
});

emailRegisterSubmitBtn.addEventListener("click", async ()=>{
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;
  try { await auth.createUserWithEmailAndPassword(email,password); onLoginSuccess(); }
  catch(e){ alert("Register failed: "+e.message); }
});

logoutBtn.addEventListener("click", async ()=>{
  await auth.signOut();
  location.reload();
});

function onLoginSuccess() {
  authDiv.style.display="none";
  emailDiv.style.display="none";
  categoryDiv.style.display="block";
  updateLeaderboard();
}

// ---------------- START QUIZ ----------------
startBtn.addEventListener("click", startQuiz);
fiftyBtn.addEventListener("click", useFifty);
hintBtn.addEventListener("click", useHint);

async function startQuiz() {
  startBtn.disabled=true;
  quizDiv.innerHTML="Loading...";
  quizContainer.style.display="block";
  lifelines.style.display="flex";
  moneyList.style.display="block";
  hintBox.style.display="none";
  ladderLevel = current = score = 0;
  fiftyUsed = hintUsed = false;
  fiftyBtn.disabled=false; hintBtn.disabled=false;
  buildMoneyLadder();

  const categoryMap = {
    "general_knowledge": 9,
    "science": 17,
    "history": 23,
    "geography": 22,
    "music": 12,
    "film_and_tv": 11,
    "sports": 21,
    "food_and_drink": 14
  };
  const catId = categoryMap[categorySelect.value] || 9;
  const numQ = questionCount.value || 10;

  try {
    const res = await fetch(`https://opentdb.com/api.php?amount=${numQ}&category=${catId}&type=multiple`);
    const data = await res.json();
    if (!data.results || data.results.length === 0) throw "No questions found";

    questions = data.results.map(q => ({
      question: decodeHTML(q.question),
      correctAnswer: decodeHTML(q.correct_answer),
      incorrectAnswers: q.incorrect_answers.map(a => decodeHTML(a)),
      hint: "Think carefully!"
    }));
  } catch (err) {
    console.error("API fetch error:", err);
    questions = fallbackQuestions;
  }

  showQuestion();
}

// Decode HTML entities
function decodeHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

// ---------------- SHOW QUESTION ----------------
function showQuestion() {
  clearInterval(timer);
  let timeLeft = timePerQuestion;
  hintBox.style.display="none";
  const q = questions[current];

  quizDiv.innerHTML=`<h2>Q${current+1}: ${q.question}</h2><div id="feedback"></div>`;

  const answers = [...q.incorrectAnswers, q.correctAnswer].sort(()=>Math.random()-0.5);
  answers.forEach(a=>{
    const btn = document.createElement("button");
    btn.textContent=a;
    btn.className="option-btn";
    btn.addEventListener("click", ()=>checkAnswer(a,btn));
    quizDiv.appendChild(btn);
  });

  // Circular timer animation
  timerBar.style.width="100%";
  timerText.textContent=`${timePerQuestion}s`;
  timer = setInterval(()=>{
    timeLeft--;
    updateTimer(timeLeft);
    if(timeLeft <=5 && timeLeft>0) tickSound.play();
    if(timeLeft<=0){ clearInterval(timer); nextQuestion(false); }
  },1000);
}

// ---------------- TIMER ----------------
function updateTimer(timeLeft){
  timerText.textContent = `${timeLeft}s`;
  timerBar.style.width = (timeLeft/timePerQuestion*100) + "%";
  if(timeLeft>10){ timerBar.style.background="#00ff00"; timerText.style.color="#00ff00";}
  else if(timeLeft>5){ timerBar.style.background="#ffcc00"; timerText.style.color="#ffcc00";}
  else{ timerBar.style.background="#ff4d4d"; timerText.style.color="#ff4d4d";}
}

// ---------------- CHECK ANSWER ----------------
function checkAnswer(answer, btnClicked){
  clearInterval(timer);
  const correct = questions[current].correctAnswer;
  const feedback = document.getElementById("feedback");
  const buttons = document.querySelectorAll(".option-btn");

  buttons.forEach(btn=>{
    btn.disabled=true;
    if(btn.textContent === correct) btn.classList.add("correct");
    if(btn.textContent === answer && answer !== correct){
      btn.classList.add("wrong");
      btn.classList.add("shake");
      setTimeout(()=>btn.classList.remove("shake"),500);
    }
  });

  if(answer===correct){
    score++; ladderLevel++; updateMoneyLadder();
    feedback.innerHTML="✅ <b>Correct!</b>"; correctSound.play();
  } else {
    feedback.innerHTML=`❌ <b>Wrong!</b><br><span class="correct-answer">Correct: <b>${correct}</b></span>`; 
    wrongSound.play();
  }

  setTimeout(nextQuestion,1800);
}

// ---------------- NEXT QUESTION ----------------
function nextQuestion(){
  current++;
  if(current>=questions.length){
    quizDiv.innerHTML=`<h2>Finished!</h2><p>Score: ${score}/${questions.length}</p><button id="restartBtn">Restart</button>`;
    document.getElementById("restartBtn").addEventListener("click", ()=>location.reload());
    lifelines.style.display="none"; moneyList.style.display="none"; hintBox.style.display="none";
    const user = auth.currentUser; if(user) saveScore(user, score);
    return;
  }
  showQuestion();
}

// ---------------- LIFELINES ----------------
function useFifty(){
  if(fiftyUsed) return;
  fiftyUsed=true; fiftyBtn.disabled=true;
  const correct = questions[current].correctAnswer;
  let removed=0;
  const btns = Array.from(document.querySelectorAll(".option-btn"));
  btns.forEach(b=>{
    if(b.textContent!==correct && removed<2){ b.style.opacity=0.3; removed++; }
  });
}

function useHint(){
  if(hintUsed) return;
  hintUsed=true; hintBtn.disabled=true;
  const q = questions[current];
  hintBox.textContent="💡 Hint: "+q.hint;
  hintBox.style.display="block";
  hintBtn.style.opacity=0.3;
}

// ---------------- MONEY LADDER ----------------
function buildMoneyLadder(){
  moneyList.innerHTML="";
  const numQuestions = parseInt(questionCount.value) || 10;
  const increment = 100;
  for(let i=numQuestions;i>0;i--){
    const li = document.createElement("li");
    li.textContent = "$"+(i*increment);
    moneyList.appendChild(li);
  }
}

function updateMoneyLadder(){
  const lis = moneyList.querySelectorAll("li");
  lis.forEach(li=>li.classList.remove("current"));
  const idx = moneyList.children.length-ladderLevel-1;
  if(lis[idx]) lis[idx].classList.add("current");
}

// ---------------- LEADERBOARD ----------------
async function saveScore(user,score){
  if(!user) return;
  const userData={uid:user.uid,name:user.displayName||user.email,avatar:user.photoURL||"",score,date: firebase.firestore.FieldValue.serverTimestamp()};
  await db.collection("leaderboard").doc(user.uid).set(userData,{merge:true});
  updateLeaderboard();
}

async function updateLeaderboard(){
  if(!leaderboardList) return;
  leaderboardList.innerHTML="";
  const snapshot = await db.collection("leaderboard").orderBy("score","desc").limit(10).get();
  snapshot.forEach(doc=>{
    const data = doc.data();
    const li = document.createElement("li");
    const img = document.createElement("img");
    img.src = data.avatar||"";
    img.width=30; img.height=30;
    li.appendChild(img);
    li.appendChild(document.createTextNode(`${data.name} — ${data.score} pts`));
    leaderboardList.appendChild(li);
  });
}

updateLeaderboard();
