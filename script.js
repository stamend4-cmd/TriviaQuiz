document.addEventListener("DOMContentLoaded", () => {
  // ---------------- FIREBASE INIT ----------------
  const firebaseConfig = {
    apiKey: "AIzaSyDCCBKiQio6iPKm36MQdGqb9LzTOxbOfiE",
    authDomain: "triviaquiz-2579b.firebaseapp.com",
    projectId: "triviaquiz-2579b",
  };
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  // ---------------- SELECTORS ----------------
  const googleLoginBtn = document.querySelector("#googleLoginBtn");
  const emailRegisterBtn = document.querySelector("#emailRegisterBtn");
  const authDiv = document.querySelector("#authDiv");
  const emailDiv = document.querySelector("#emailDiv");
  const logoutDiv = document.querySelector("#logoutDiv");
  const logoutBtn = document.querySelector("#logoutBtn");
  const categoryDiv = document.querySelector("#categoryDiv");
  const startBtn = document.querySelector("#startBtn");
  const quizContainer = document.querySelector("#quiz-container");
  const quizEl = document.querySelector("#quiz");
  const moneyList = document.querySelector("#money-list");
  const timerText = document.querySelector("#timer-text");
  const timerCircle = document.querySelector("#timer-svg circle");
  const lifelinesDiv = document.querySelector("#lifelines");
  const fiftyBtn = document.querySelector("#fiftyBtn");
  const callBtn = document.querySelector("#callBtn");
  const audienceBtn = document.querySelector("#audienceBtn");
  const hintBox = document.querySelector("#hint-box");
  const correctSound = document.querySelector("#correct-sound");
  const wrongSound = document.querySelector("#wrong-sound");
  const tickSound = document.querySelector("#tick-sound");

  // ---------------- GLOBAL VARIABLES ----------------
  let questions = [];
  let currentQuestionIndex = 0;
  let timerInterval = null;
  let timerSeconds = 30;
  let currentMoneyIndex = 0;

  const moneyValues = [
    "$100", "$200", "$300", "$500", "$1,000",
    "$2,000", "$4,000", "$8,000", "$16,000", "$32,000",
    "$64,000", "$125,000", "$250,000", "$500,000", "$1,000,000"
  ];

  // ---------------- AUTH ----------------
  const googleProvider = new firebase.auth.GoogleAuthProvider();

  googleLoginBtn.addEventListener("click", () => {
    auth.signInWithPopup(googleProvider)
      .then(() => showCategory())
      .catch(console.error);
  });

  emailRegisterBtn.addEventListener("click", () => {
    authDiv.style.display = "none";
    emailDiv.style.display = "block";
  });

  document.querySelector("#emailLoginBtn").addEventListener("click", () => {
    const email = document.querySelector("#emailInput").value;
    const password = document.querySelector("#passwordInput").value;
    auth.signInWithEmailAndPassword(email, password)
      .then(() => showCategory())
      .catch(alert);
  });

  document.querySelector("#emailRegisterSubmitBtn").addEventListener("click", () => {
    const email = document.querySelector("#emailInput").value;
    const password = document.querySelector("#passwordInput").value;
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => showCategory())
      .catch(alert);
  });

  document.querySelector("#emailCancelBtn").addEventListener("click", () => {
    emailDiv.style.display = "none";
    authDiv.style.display = "block";
  });

  logoutBtn.addEventListener("click", () => auth.signOut().then(() => location.reload()));

  auth.onAuthStateChanged(user => {
    if (user) showCategory();
    else authDiv.style.display = "block";
  });

  function showCategory() {
    authDiv.style.display = "none";
    emailDiv.style.display = "none";
    logoutDiv.style.display = "block";
    categoryDiv.style.display = "block";
  }

  // ---------------- START QUIZ ----------------
  startBtn.addEventListener("click", async () => {
    const category = document.querySelector("#categorySelect").value;
    const questionCount = parseInt(document.querySelector("#questionCount").value);

    questions = await fetchQuestions(category, questionCount);
    if (!questions.length) return alert("No questions found!");

    categoryDiv.style.display = "none";
    quizContainer.style.display = "block";
    lifelinesDiv.style.display = "flex";

    currentQuestionIndex = 0;
    currentMoneyIndex = moneyValues.length - questions.length;
    showMoneyLadder();
    showQuestion();
  });

  async function fetchQuestions(category, count) {
    try {
      const snapshot = await db.collection("trivia").where("category", "==", category).limit(count).get();
      return snapshot.docs.map(doc => doc.data());
    } catch (e) {
      console.error(e);
      alert("Failed to fetch questions from Firebase. Check Firestore rules/API.");
      return [];
    }
  }

  // ---------------- MONEY LADDER ----------------
  function showMoneyLadder() {
    moneyList.innerHTML = "";
    moneyValues.forEach((val, i) => {
      const li = document.createElement("li");
      li.textContent = val;
      if (i === currentMoneyIndex) li.classList.add("current");
      moneyList.appendChild(li);
    });
  }

  function updateMoneyLadder() {
    const lis = moneyList.querySelectorAll("li");
    lis.forEach(li => li.classList.remove("current"));
    lis[currentMoneyIndex].classList.add("current");
  }

  // ---------------- TIMER ----------------
  function startTimer() {
    clearInterval(timerInterval);
    timerSeconds = 30;
    updateTimerCircle();

    timerInterval = setInterval(() => {
      timerSeconds--;
      updateTimerCircle();
      if (timerSeconds <= 0) {
        clearInterval(timerInterval);
        handleAnswer(null); // Timeout
      }
    }, 1000);
  }

  function updateTimerCircle() {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (timerSeconds / 30) * circumference;
    timerCircle.style.strokeDasharray = `${circumference}`;
    timerCircle.style.strokeDashoffset = `${offset}`;
    timerText.textContent = `${timerSeconds}s`;

    if (timerSeconds <= 10) timerCircle.style.stroke = "#ff0000";
    else timerCircle.style.stroke = "#00ff00";
  }

  // ---------------- SHOW QUESTION ----------------
  function showQuestion() {
    const q = questions[currentQuestionIndex];
    quizEl.innerHTML = `<h3>${q.question}</h3>`;

    q.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = opt;
      btn.addEventListener("click", () => handleAnswer(opt));
      quizEl.appendChild(btn);
    });

    startTimer();
  }

  // ---------------- HANDLE ANSWER ----------------
  function handleAnswer(selected) {
    clearInterval(timerInterval);
    const q = questions[currentQuestionIndex];
    const buttons = quizEl.querySelectorAll(".option-btn");

    buttons.forEach(btn => {
      btn.disabled = true;
      if (btn.textContent === q.answer) {
        btn.classList.add("correct");
      } else if (btn.textContent === selected) {
        btn.classList.add("wrong");
        btn.classList.add("shake");
      }
    });

    if (selected === q.answer) {
      correctSound.play();
      currentMoneyIndex++;
      updateMoneyLadder();
    } else {
      wrongSound.play();
    }

    setTimeout(() => {
      currentQuestionIndex++;
      if (currentQuestionIndex >= questions.length) {
        alert("Quiz Finished!");
        location.reload();
      } else {
        showQuestion();
      }
    }, 2000);
  }

  // ---------------- LIFELINES ----------------
  fiftyBtn.addEventListener("click", () => {
    const q = questions[currentQuestionIndex];
    const buttons = quizEl.querySelectorAll(".option-btn");
    let removed = 0;
    buttons.forEach(btn => {
      if (btn.textContent !== q.answer && removed < 2) {
        btn.style.display = "none";
        removed++;
      }
    });
    fiftyBtn.disabled = true;
  });

  callBtn.addEventListener("click", () => {
    const q = questions[currentQuestionIndex];
    alert(`Call a Friend Suggests: "${q.answer}"`);
    callBtn.disabled = true;
  });

  audienceBtn.addEventListener("click", () => {
    const q = questions[currentQuestionIndex];
    const percentages = [0, 0, 0, 0];
    const correctIndex = q.options.indexOf(q.answer);
    percentages[correctIndex] = Math.floor(Math.random() * 50) + 50;
    let remaining = 100 - percentages[correctIndex];
    for (let i = 0; i < percentages.length; i++) {
      if (i !== correctIndex) {
        let val = Math.floor(Math.random() * remaining);
        percentages[i] = val;
        remaining -= val;
      }
    }

    const result = q.options.map((opt, i) => `${opt}: ${percentages[i]}%`).join("\n");
    alert("Audience Vote:\n" + result);
    audienceBtn.disabled = true;
  });
});
