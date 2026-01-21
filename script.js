// ================== VARIABLES ==================
let questions = [];
let currentQuestionIndex = 0;
let timerDuration = 30; // seconds
let timerInterval;
let moneyList = [100,200,300,500,1000,2000,4000,8000,16000,32000,64000,125000,250000,500000,1000000];
let usedFifty = false;
let usedCall = false;
let usedAudience = false;

// ================== FETCH QUESTIONS ==================
async function fetchQuestions(amount = 10) {
    try {
        const resp = await fetch(`https://opentdb.com/api.php?amount=${amount}&type=multiple`);
        const data = await resp.json();
        questions = data.results.map(q => ({
            question: decodeHTML(q.question),
            correct: decodeHTML(q.correct_answer),
            answers: shuffle([q.correct_answer, ...q.incorrect_answers].map(a=>decodeHTML(a)))
        }));
        startQuiz();
    } catch (e) {
        alert("Failed to load questions. Check your connection.");
        console.error(e);
    }
}

// ================== SHUFFLE UTILITY ==================
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

// ================== HTML DECODER ==================
function decodeHTML(html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

// ================== START QUIZ ==================
function startQuiz() {
    document.getElementById("authDiv").style.display = "none";
    document.getElementById("quiz-container").style.display = "block";
    buildMoneyList();
    showQuestion();
}

// ================== BUILD MONEY LADDER ==================
function buildMoneyList() {
    const ul = document.getElementById("money-list");
    ul.innerHTML = "";
    moneyList.slice().reverse().forEach((amt,i)=>{
        let li = document.createElement("li");
        li.textContent = `$${amt}`;
        if(i === 0) li.classList.add("current");
        ul.appendChild(li);
    });
}

// ================== SHOW QUESTION ==================
function showQuestion() {
    clearInterval(timerInterval);
    const q = questions[currentQuestionIndex];
    document.getElementById("question-number").textContent = `Question ${currentQuestionIndex+1}`;
    document.getElementById("question-text").textContent = q.question;

    const ansDiv = document.getElementById("answers");
    ansDiv.innerHTML = "";
    q.answers.forEach(a=>{
        const btn = document.createElement("button");
        btn.textContent = a;
        btn.className = "option-btn";
        btn.onclick = () => checkAnswer(btn, q.correct);
        ansDiv.appendChild(btn);
    });

    startTimer();
    updateMoneyHighlight();
}

// ================== CHECK ANSWER ==================
function checkAnswer(btn, correct) {
    stopTimer();
    const allBtns = document.querySelectorAll(".option-btn");
    allBtns.forEach(b=>b.disabled=true);

    if(btn.textContent === correct){
        btn.style.backgroundColor = "#00ff00"; // green
        scoreUp();
        setTimeout(nextQuestion, 1000);
    } else {
        btn.style.backgroundColor = "#ff0000"; // red
        btn.classList.add("shake");
        // Highlight correct answer
        allBtns.forEach(b=>{
            if(b.textContent === correct) b.style.backgroundColor = "#00ff00";
        });
        setTimeout(endQuiz, 1500);
    }
}

// ================== TIMER ==================
function startTimer() {
    let timeLeft = timerDuration;
    const text = document.getElementById("timer-text");
    const circle = document.querySelector("#timer-svg circle");
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = 0;

    text.textContent = `${timeLeft}s`;
    timerInterval = setInterval(()=>{
        timeLeft--;
        text.textContent = `${timeLeft}s`;
        circle.style.strokeDashoffset = circumference * (1 - timeLeft/timerDuration);
        if(timeLeft<=0){
            clearInterval(timerInterval);
            // Highlight correct answer
            document.querySelectorAll(".option-btn").forEach(b=>{
                if(b.textContent === questions[currentQuestionIndex].correct) b.style.backgroundColor = "#00ff00";
                b.disabled=true;
            });
            setTimeout(endQuiz,1500);
        }
    },1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

// ================== NEXT QUESTION ==================
function nextQuestion() {
    currentQuestionIndex++;
    if(currentQuestionIndex < questions.length){
        showQuestion();
    } else {
        alert("🎉 Quiz Finished!");
    }
}

// ================== MONEY LADDER HIGHLIGHT ==================
function updateMoneyHighlight() {
    const lis = document.querySelectorAll("#money-list li");
    lis.forEach((li,i)=>{
        li.classList.remove("current");
        if(i === (moneyList.length - 1 - currentQuestionIndex)) li.classList.add("current");
    });
}

function scoreUp() {
    // Could add sound or animation here
}

// ================== LIFELINES ==================
document.getElementById("fiftyBtn").onclick = function(){
    if(usedFifty) return;
    usedFifty=true;
    const q = questions[currentQuestionIndex];
    const allBtns = Array.from(document.querySelectorAll(".option-btn"));
    const wrongBtns = allBtns.filter(b=>b.textContent !== q.correct);
    shuffle(wrongBtns).slice(0,2).forEach(b=>b.disabled=true);
}

document.getElementById("callBtn").onclick = function(){
    if(usedCall) return;
    usedCall = true;
    alert("📞 Call a Friend suggests: " + questions[currentQuestionIndex].correct);
}

document.getElementById("audienceBtn").onclick = function(){
    if(usedAudience) return;
    usedAudience = true;
    const msg = "👥 Audience Vote:\n";
    const q = questions[currentQuestionIndex];
    const votes = [q.correct, ...q.answers.filter(a=>a!==q.correct)];
    alert(msg + "Most people choose: " + votes[0]);
}

// ================== START BUTTON ==================
document.getElementById("startBtn").onclick = function(){
    fetchQuestions(10); // You can set default 10 questions
}
