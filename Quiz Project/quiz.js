const STORAGE_KEY = 'nccQuizState';
const questionTime = 30;

const questions = [
    {
        question: 'Which language is used for web page structure?',
        options: ['CSS', 'JavaScript', 'HTML', 'Python'],
        answerIndex: 2,
    },
    {
        question: 'What is the chemical symbol for water?',
        options: ['H2', 'H2O', 'O2', 'CO2'],
        answerIndex: 1,
    },
    {
        question: 'Which planet is known as the Red Planet?',
        options: ['Mars', 'Venus', 'Jupiter', 'Saturn'],
        answerIndex: 0,
    },
    {
        question: 'What does CSS stand for?',
        options: ['Colorful Style Sheets', 'Creative Style System', 'Cascading Style Sheets', 'Computer Style Syntax'],
        answerIndex: 2,
    },
    {
        question: 'Who wrote the novel "1984"?',
        options: ['Aldous Huxley', 'George Orwell', 'J.K. Rowling', 'Mark Twain'],
        answerIndex: 1,
    },
    {
        question: 'What is the largest ocean on Earth?',
        options: ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'],
        answerIndex: 2,
    },
    {
        question: 'Which organ pumps blood through the body?',
        options: ['Brain', 'Heart', 'Lungs', 'Liver'],
        answerIndex: 1,
    },
    {
        question: 'How many continents are there?',
        options: ['5', '6', '7', '8'],
        answerIndex: 2,
    },
    {
        question: 'Which gas do plants absorb from the atmosphere?',
        options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Helium'],
        answerIndex: 1,
    },
    {
        question: 'What is the value of pi rounded to two decimals?',
        options: ['3.12', '3.14', '3.16', '3.18'],
        answerIndex: 1,
    },
];

const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options');
const progressText = document.getElementById('progress-text');
const progressFill = document.getElementById('progress-fill');
const timerLabel = document.getElementById('timer');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pauseBtn = document.getElementById('pause-btn');
const resultContainer = document.getElementById('result-container');
const restartBtn = document.getElementById('restart-btn');

let state = {
    currentQuestion: 0,
    answers: Array(questions.length).fill(null),
    timeLeft: questionTime,
    paused: false,
    finished: false,
};

let timerInterval = null;

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.answers) && parsed.answers.length === questions.length) {
            state = { ...state, ...parsed };
            if (typeof state.currentQuestion !== 'number' || state.currentQuestion < 0 || state.currentQuestion >= questions.length) {
                state.currentQuestion = 0;
            }
            if (typeof state.timeLeft !== 'number' || state.timeLeft < 0) {
                state.timeLeft = questionTime;
            }
        }
    } catch (error) {
        console.warn('Failed to parse saved quiz state', error);
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetQuiz() {
    state = {
        currentQuestion: 0,
        answers: Array(questions.length).fill(null),
        timeLeft: questionTime,
        paused: false,
        finished: false,
    };
    clearInterval(timerInterval);
    saveState();
    resultContainer.innerHTML = '';
    renderQuestion();
    updateNavigation();
    startTimer();
}

function calculateResults() {
    let correct = 0;
    let unanswered = 0;
    for (let i = 0; i < questions.length; i++) {
        const answer = state.answers[i];
        if (answer === null) {
            unanswered += 1;
            continue;
        }
        if (answer === questions[i].answerIndex) {
            correct += 1;
        }
    }

    const incorrect = questions.length - correct - unanswered;
    const percentage = Math.round((correct / questions.length) * 100);
    let message = 'Needs Improvement';
    if (percentage >= 91) {
        message = 'Excellent';
    } else if (percentage >= 71) {
        message = 'Great Work';
    } else if (percentage >= 41) {
        message = 'Good Effort';
    }

    return {
        total: questions.length,
        correct,
        incorrect,
        unanswered,
        score: correct,
        percentage,
        message,
    };
}

function renderQuestion() {
    const question = questions[state.currentQuestion];
    questionText.textContent = question.question;
    progressText.textContent = `Question ${state.currentQuestion + 1} of ${questions.length}`;
    progressFill.style.width = `${((state.currentQuestion + 1) / questions.length) * 100}%`;
    optionsContainer.innerHTML = '';

    const currentAnswer = state.answers[state.currentQuestion];
    const answered = currentAnswer !== null;

    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-button';
        button.textContent = option;
        button.disabled = answered || state.paused || state.finished;
        if (answered) {
            if (index === currentAnswer) {
                button.classList.add('selected');
            }
            if (index === question.answerIndex) {
                button.classList.add('correct');
            } else if (index === currentAnswer && currentAnswer !== question.answerIndex) {
                button.classList.add('incorrect');
            }
        }

        button.addEventListener('click', () => handleAnswer(index));
        optionsContainer.appendChild(button);
    });

    timerLabel.parentElement.classList.toggle('warning', !answered && !state.finished && !state.paused && state.timeLeft <= 10);

    if (answered) {
        timerLabel.textContent = 'Answered';
    } else if (state.finished) {
        timerLabel.textContent = 'Quiz Ended';
    } else if (state.paused) {
        timerLabel.textContent = 'Paused';
    } else {
        timerLabel.textContent = state.timeLeft;
    }
}

function updateNavigation() {
    prevBtn.disabled = state.currentQuestion === 0;
    nextBtn.disabled = state.currentQuestion === questions.length - 1 || state.finished;
    pauseBtn.textContent = state.paused ? 'Resume' : 'Pause';
    restartBtn.classList.toggle('hidden', !state.finished);
    resultContainer.classList.toggle('visible', state.finished);
}

function handleAnswer(selectedIndex) {
    if (state.paused || state.finished) return;
    const currentAnswer = state.answers[state.currentQuestion];
    if (currentAnswer !== null) return;

    state.answers[state.currentQuestion] = selectedIndex;
    saveState();
    renderQuestion();
    clearInterval(timerInterval);

    setTimeout(() => {
        if (state.currentQuestion < questions.length - 1) {
            state.currentQuestion += 1;
            state.timeLeft = questionTime;
            saveState();
            renderQuestion();
            updateNavigation();
            startTimer();
        } else {
            finishQuiz();
        }
    }, 700);
}

function startTimer() {
    clearInterval(timerInterval);
    if (state.paused || state.finished || state.answers[state.currentQuestion] !== null) return;

    timerInterval = setInterval(() => {
        if (state.paused || state.finished) {
            clearInterval(timerInterval);
            return;
        }

        state.timeLeft -= 1;
        if (state.timeLeft <= 0) {
            state.answers[state.currentQuestion] = null;
            state.timeLeft = questionTime;
            saveState();
            clearInterval(timerInterval);
            setTimeout(() => {
                if (state.currentQuestion < questions.length - 1) {
                    state.currentQuestion += 1;
                    saveState();
                    renderQuestion();
                    updateNavigation();
                    startTimer();
                } else {
                    finishQuiz();
                }
            }, 400);
        } else {
            timerLabel.textContent = state.timeLeft;
            if (state.timeLeft <= 10) {
                timerLabel.parentElement.classList.add('warning');
            }
        }
        saveState();
    }, 1000);
}

function finishQuiz() {
    state.finished = true;
    clearInterval(timerInterval);
    saveState();
    renderQuestion();
    updateNavigation();
    displayResults();
}

function displayResults() {
    const results = calculateResults();
    resultContainer.innerHTML = `
        <h2>Quiz Results</h2>
        <p>Total Questions: <strong>${results.total}</strong></p>
        <p>Correct Answers: <strong>${results.correct}</strong></p>
        <p>Incorrect Answers: <strong>${results.incorrect}</strong></p>
        <p>Unanswered: <strong>${results.unanswered}</strong></p>
        <p>Score: <strong>${results.score}/${results.total}</strong></p>
        <p>Percentage: <strong>${results.percentage}%</strong></p>
        <p><strong>${results.message}</strong></p>
    `;
}

function goToQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    state.currentQuestion = index;
    state.timeLeft = questionTime;
    saveState();
    renderQuestion();
    updateNavigation();
    clearInterval(timerInterval);
    if (!state.answers[state.currentQuestion] && !state.paused && !state.finished) {
        startTimer();
    }
}

prevBtn.addEventListener('click', () => {
    if (state.currentQuestion > 0) {
        goToQuestion(state.currentQuestion - 1);
    }
});

nextBtn.addEventListener('click', () => {
    if (state.currentQuestion < questions.length - 1) {
        goToQuestion(state.currentQuestion + 1);
    }
});

pauseBtn.addEventListener('click', () => {
    if (state.finished) return;
    state.paused = !state.paused;
    if (state.paused) {
        clearInterval(timerInterval);
    } else {
        startTimer();
    }
    saveState();
    renderQuestion();
    updateNavigation();
});

restartBtn.addEventListener('click', () => {
    resetQuiz();
});

window.addEventListener('beforeunload', () => {
    saveState();
});

loadState();
renderQuestion();
updateNavigation();
if (!state.finished && !state.paused && state.answers[state.currentQuestion] === null) {
    startTimer();
}
if (state.finished) {
    displayResults();
}
