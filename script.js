// ------------------ Firebase config ------------------
const firebaseConfig = {
  apiKey: "AIzaSyDCCBKiQio6iPKm36MQdGqb9LzTOxbOfiE",
  authDomain: "triviaquiz-2579b.firebaseapp.com",
  projectId: "triviaquiz-2579b",
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ------------------ DOM elements ------------------
const authDiv = document.getElementById("authDiv");
const emailDiv = document.getElementById("emailDiv");
const logoutDiv = document.getElementById("logoutDiv");
const categoryDiv = document.getElementById("categoryDiv");
const quizContainer = document.getElementById("quiz-container");
const quizDiv = document.getElementById("quiz");
const moneyList = document.getElementById("money-list");
const timerText = document.getElementById("timer-text");
const timerSvg = document.querySelector("#timer-svg circle");
const hintBox = document.getElementById("hint-box");

const googleLoginBtn = document.getElementById("googleLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn = document.getElementById("emailCancelBtn");
const logoutBtn = document.getElementById("logoutBtn");
const startBtn = document.getElementById("startBtn");
const categorySelect = document.getElementById("categorySelect");
const questionCountSelect = document.getElementById("questionCount");

const fiftyBtn = document.getElementById("fiftyBtn");
const callBtn = document.getElementById("callBtn");
const audienceBtn = document.getElementById("audienceBtn");

const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const tickSound = document.getElementById("tick-sound");

// ------------------ Quiz state ------------------
let questions = [];
let currentQIndex = 0;
let timerInterval;
let timerDuration = 30;
let currentMoneyIndex = 0;

// Money ladder
const moneyValues = ["$100","$200","$300","$500","$1,000","$2,000","$4,000","$8,000","$16,000","$32,000","$64,000","$125,000","$250,000","$500,000","$1,000,000"];
moneyList.innerHTML = moneyValues.map((m,i)=>`<li class="${i===0?'current':''}">${m}</li>`).join("");

// ------------------ Firebase Auth ------------------
auth.onAuthStateChanged(user=>{
  if(user){
    authDiv.style.display="none";
    emailDiv.style.display="none";
    logoutDiv.style.display="block";
    categoryDiv.style.display="block";
  } else {
    authDiv.style.display="block";
    emailDiv.style.display="none";
    logoutDiv.style.display="none";
    categoryDiv.style.display="none";
    quizContainer.style.display="none";
  }
});

googleLoginBtn.onclick = ()=>{
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
};

logoutBtn.onclick = ()=> auth.signOut();

// ------------------ Start Quiz ------------------
startBtn.onclick = async()=>{
  const category = categorySelect.value;
  const count = parseInt(questionCountSelect.value);
  quizContainer.style.display="block";
  categoryDiv.style.display="none";
  questions = await fetchAllQuestions(category, count);
  currentQIndex = 0;
  currentMoneyIndex = 0;
  showQuestion();
};

// ------------------ Fetch questions ------------------
async function fetchAllQuestions(category,count){
  const allQuestions = [];

  // --- OpenTDB ---
  try{
    const res = await fetch(`https://opentdb.com/api.php?amount=${count}&category=${getOpenTDBCategory(category)}&type=multiple`);
    const data = await res.json();
    data.results.forEach(q=>{
      allQuestions.push({
        question: q.question,
        correct_answer: q.correct_answer,
        incorrect_answers: q.incorrect_answers
      });
    });
  } catch(e){console.error("OpenTDB error",e);}

  // --- Trivia API ---
  try{
    const res = await fetch(`https://the-trivia-api.com/api/questions?categories=${category}&limit=${count}`);
    const data = await res.json();
    data.forEach(q=>{
      allQuestions.push({
        question: q.question,
        correct_answer: q.correctAnswer,
        incorrect_answers: q.incorrectAnswers
      });
    });
  } catch(e){console.error("Trivia API error",e);}

  // --- QuizAPI.io ---
  try{
    const res = await fetch(`https://quizapi.io/api/v1/questions?apiKey=Wh9Plnz7rOMzEpgZsjHIomRe6nL4TKiB6VQxOk08&category=${category}&limit=${count}`);
    const data = await res.json();
    data.forEach(q=>{
      const options = Object.values(q.answers).filter(v=>v!==null);
      allQuestions.push({
        question: q.question,
        correct_answer: q.correct_answer,
        incorrect_answers: options.filter(o=>o!==q.correct_answer)
      });
    });
  } catch(e){console.error("QuizAPI.io error",e);}

  // Shuffle all questions
  return allQuestions.sort(()=>Math.random()-0.5);
}

// OpenTDB category mapping
function getOpenTDBCategory(cat){
  const map={
    science:17,
    history:23,
    geography:22,
    music:12,
    film_and_tv:11,
    sports:21,
    food_and_drink:14,
    general_knowledge:9
  };
  return map[cat] || 9;
}

// ------------------ Show Question ------------------
function showQuestion(){
  clearInterval(timerInterval);
  const q = questions[currentQIndex];
  if(!q){alert("Quiz Finished!"); quizContainer.style.display="none"; return;}
  quizDiv.innerHTML="";
  const options = [...q.incorrect_answers,q.correct_answer].sort(()=>Math.random()-0.5);
  options.forEach(opt=>{
    const btn = document.createElement("button");
    btn.className="option-btn";
    btn.innerHTML=opt;
    btn.onclick = ()=> checkAnswer(btn,q);
    quizDiv.appendChild(btn);
  });
  startTimer();
}

// ------------------ Timer ------------------
function startTimer(){
  let timeLeft = timerDuration;
  timerText.textContent = `${timeLeft}s`;
  const radius = timerSvg.r.baseVal.value;
  const circumference = 2*Math.PI*radius;
  timerSvg.style.strokeDasharray = `${circumference} ${circumference}`;
  timerSvg.style.strokeDashoffset = 0;

  timerInterval = setInterval(()=>{
    timeLeft--;
    timerText.textContent = `${timeLeft}s`;
    const offset = circumference - (timeLeft/timerDuration)*circumference;
    timerSvg.style.strokeDashoffset = offset;
    if(timeLeft<=5) timerSvg.style.stroke="#ff0000"; else timerSvg.style.stroke="#00ff00";
    tickSound.play();
    if(timeLeft<=0){
      clearInterval(timerInterval);
      markWrong();
    }
  },1000);
}

// ------------------ Answer Check ------------------
function checkAnswer(btn,q){
  clearInterval(timerInterval);
  const buttons = document.querySelectorAll(".option-btn");
  if(btn.innerHTML===q.correct_answer){
    btn.style.background="#00ff00";
    btn.style.color="#000";
    correctSound.play();
    moneyList.children[currentMoneyIndex].classList.remove("current");
    currentMoneyIndex++;
    if(currentMoneyIndex<moneyList.children.length) moneyList.children[currentMoneyIndex].classList.add("current");
    setTimeout(()=>{currentQIndex++; showQuestion();},1000);
  } else {
    btn.style.background="#ff0000";
    btn.style.color="#fff";
    btn.classList.add("shake");
    wrongSound.play();
    // Show correct
    buttons.forEach(b=>{
      if(b.innerHTML===q.correct_answer){
        b.style.background="#00ff00";
        b.style.color="#000";
      }
    });
    setTimeout(()=>{alert("Quiz Over!"); quizContainer.style.display="none";},1500);
  }
}

// ------------------ Lifelines ------------------
fiftyBtn.onclick = ()=>{
  const buttons = Array.from(document.querySelectorAll(".option-btn"));
  const correctBtn = buttons.find(b=>b.innerHTML===questions[currentQIndex].correct_answer);
  const wrongBtns = buttons.filter(b=>b!==correctBtn);
  wrongBtns.sort(()=>Math.random()-0.5).slice(0,2).forEach(b=>b.disabled=true);
};

callBtn.onclick = ()=>{
  alert(`📞 Call a Friend Suggestion: "${questions[currentQIndex].correct_answer}"`);
};

audienceBtn.onclick = ()=>{
  const buttons = Array.from(document.querySelectorAll(".option-btn"));
  const correctBtn = buttons.find(b=>b.innerHTML===questions[currentQIndex].correct_answer);
  buttons.forEach(b=>{
    if(b===correctBtn) b.innerHTML += " ✅";
    else b.innerHTML += " ❌";
  });
};

// ------------------ Mark wrong if timer ends ------------------
function markWrong(){
  const buttons = document.querySelectorAll(".option-btn");
  buttons.forEach(b=>{
    if(b.innerHTML===questions[currentQIndex].correct_answer){
      b.style.background="#00ff00";
      b.style.color="#000";
    }
  });
  alert("Time's up! Quiz Over!");
  quizContainer.style.display="none";
}
