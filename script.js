// ---------------- FIREBASE CONFIG ----------------
const firebaseConfig = {
  apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
  authDomain: "neon-quiz-app.firebaseapp.com",
  projectId: "neon-quiz-app",
  storageBucket: "neon-quiz-app.appspot.com",
  messagingSenderId: "891061147021",
  appId: "1:891061147021:web:7b3d80020f642da7b699c4"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ---------------- DOM ----------------
const googleLoginBtn=document.getElementById("googleLoginBtn");
const emailRegisterBtn=document.getElementById("emailRegisterBtn");
const emailDiv=document.getElementById("emailDiv");
const emailLoginBtn=document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn=document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn=document.getElementById("emailCancelBtn");
const logoutBtn=document.getElementById("logoutBtn");

const startBtn=document.getElementById("startBtn");
const categorySelect=document.getElementById("categorySelect");
const questionCount=document.getElementById("questionCount");
const quizDiv=document.getElementById("quiz");
const lifelines=document.getElementById("lifelines");
const fiftyBtn=document.getElementById("fiftyBtn");
const hintBtn=document.getElementById("hintBtn");
const moneyList=document.getElementById("money-list");
const hintBox=document.getElementById("hint-box");
const leaderboardList=document.getElementById("leaderboard-list");
const quizContainer=document.getElementById("quiz-container");
const categoryDiv=document.getElementById("categoryDiv");
const authDiv=document.getElementById("authDiv");
const correctSound=document.getElementById("correct-sound");
const wrongSound=document.getElementById("wrong-sound");
const tickSound=document.getElementById("tick-sound");
const timerCircle=document.querySelector("#timer-svg circle");
const timerText=document.getElementById("timer-text");

// ---------------- GLOBALS ----------------
let questions=[], current=0, score=0, timer;
let fiftyUsed=false, hintUsed=false, ladderLevel=0;
const timePerQuestion=30;

// ---------------- LOGIN ----------------
googleLoginBtn.addEventListener("click", async()=>{
  const provider=new firebase.auth.GoogleAuthProvider();
  try{ await auth.signInWithPopup(provider); onLoginSuccess(); }catch(e){ alert("Login failed");}
});
emailRegisterBtn.addEventListener("click",()=>{ emailDiv.style.display="block"; authDiv.style.display="none"; });
emailCancelBtn.addEventListener("click",()=>{ emailDiv.style.display="none"; authDiv.style.display="block"; });
logoutBtn.addEventListener("click", async()=>{ await auth.signOut(); location.reload(); });

function onLoginSuccess(){ authDiv.style.display="none"; emailDiv.style.display="none"; categoryDiv.style.display="block"; updateLeaderboard(); }

// ---------------- START QUIZ ----------------
startBtn.addEventListener("click", startQuiz);
fiftyBtn.addEventListener("click", useFifty);
hintBtn.addEventListener("click", useHint);

async function startQuiz(){
  startBtn.disabled=true;
  quizDiv.innerHTML="Loading...";
  quizContainer.style.display="block";
  lifelines.style.display="flex";
  moneyList.style.display="block";
  hintBox.style.display="none";
  ladderLevel=current=score=0; fiftyUsed=hintUsed=false;
  fiftyBtn.disabled=false; hintBtn.disabled=false;
  buildMoneyLadder();

  try{
    const res=await fetch(`https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}`);
    if(!res.ok) throw "API error";
    const data=await res.json();
    questions=data.map(q=>({question:q.question, correctAnswer:q.correctAnswer, incorrectAnswers:q.incorrectAnswers, hint:q.hint||"Think carefully"}));
  }catch{ questions=[{question:"Fallback question?", correctAnswer:"Yes", incorrectAnswers:["No"], hint:"Choose wisely"}]; }

  showQuestion();
}

// ---------------- SHOW QUESTION ----------------
function showQuestion(){
  clearInterval(timer);
  let timeLeft=timePerQuestion;
  updateTimer(timeLeft);
  hintBox.classList.remove("show");

  const q=questions[current];
  quizDiv.innerHTML=`<h2>Q${current+1}: ${q.question}</h2><div id="feedback"></div>`;
  const answers=[...q.incorrectAnswers,q.correctAnswer].sort(()=>Math.random()-0.5);
  answers.forEach(a=>{ const btn=document.createElement("button"); btn.textContent=a; btn.className="option-btn"; btn.addEventListener("click", ()=>checkAnswer(a,btn)); quizDiv.appendChild(btn); });

  // Timer animation
  const radius=35;
  const circumference=2*Math.PI*radius;
  timerCircle.style.strokeDasharray=circumference;
  timerCircle.style.strokeDashoffset=0;
  timerCircle.style.stroke="#00ff00";

  timer=setInterval(()=>{
    timeLeft--;
    updateTimer(timeLeft);
    if(timeLeft<=5 && timeLeft>0) tickSound.play();
    if(timeLeft<=0){ clearInterval(timer); nextQuestion(false);}
  },1000);
}

function updateTimer(timeLeft){
  timerText.textContent=`${timeLeft}s`;
  const radius=35;
  const circumference=2*Math.PI*radius;
  const offset=circumference*(1 - timeLeft/timePerQuestion);
  timerCircle.style.strokeDashoffset=offset;
  timerCircle.style.stroke=(timeLeft>10)?"#00ff00":(timeLeft>5?"#ffcc00":"#ff4d4d");
}

// ---------------- CHECK ANSWER ----------------
function checkAnswer(answer,btnClicked){
  clearInterval(timer);
  const correct=questions[current].correctAnswer;
  const feedback=document.getElementById("feedback");
  const buttons=document.querySelectorAll(".option-btn");
  buttons.forEach(btn=>{btn.disabled=true; if(btn.textContent===correct) btn.classList.add("correct"); if(btn.textContent===answer && answer!==correct){ btn.classList.add("wrong"); btn.classList.add("shake"); setTimeout(()=>btn.classList.remove("shake"),500);}});
  if(answer===correct){score++; ladderLevel++; updateMoneyLadder(); feedback.innerHTML="✅ Correct!"; correctSound.play();}
  else{feedback.innerHTML=`❌ Wrong! Correct: ${correct}`; wrongSound.play();}
  setTimeout(nextQuestion,1800);
}

// ---------------- NEXT QUESTION ----------------
function nextQuestion(){
  current++;
  if(current>=questions.length){
    quizDiv.innerHTML=`<h2>Finished!</h2><p>Score: ${score}/${questions.length}</p><button id="restartBtn">Restart</button>`;
    document.getElementById("restartBtn").addEventListener("click",()=>location.reload());
    lifelines.style.display="none"; moneyList.style.display="none"; hintBox.classList.remove("show");
    const user=auth.currentUser; if(user) saveScore(user,score);
    return;
  }
  showQuestion();
}

// ---------------- LIFELINES ----------------
function useFifty(){ if(fiftyUsed) return; fiftyUsed=true; fiftyBtn.disabled=true; const correct=questions[current].correctAnswer; let removed=0; const btns=Array.from(document.querySelectorAll(".option-btn")); btns.forEach(b=>{if(b.textContent!==correct && removed<2){b.style.opacity=0.3; removed++;}});}
function useHint(){if(hintUsed) return; hintUsed=true; hintBtn.disabled=true; const q=questions[current]; hintBox.textContent="💡 Hint: "+q.hint; hintBox.classList.add("show");}

// ---------------- MONEY LADDER ----------------
function buildMoneyLadder(){ moneyList.innerHTML=""; const numQuestions=parseInt(questionCount.value); for(let i=numQuestions;i>0;i--){const li=document.createElement("li"); li.textContent="$"+(i*100); moneyList.appendChild(li);}}
function updateMoneyLadder(){ const lis=moneyList.querySelectorAll("li"); lis.forEach(li=>li.classList.remove("current")); const idx=moneyList.children.length-ladderLevel-1; if(lis[idx]) lis[idx].classList.add("current");}

// ---------------- LEADERBOARD ----------------
async function saveScore(user,score){ if(!user) return; const userData={uid:user.uid, name:user.displayName||user.email, avatar:user.photoURL||"", score, date: firebase.firestore.FieldValue.serverTimestamp()}; await db.collection("leaderboard").doc(user.uid).set(userData,{merge:true}); updateLeaderboard();}
async function updateLeaderboard(){ if(!leaderboardList) return; leaderboardList.innerHTML="";
