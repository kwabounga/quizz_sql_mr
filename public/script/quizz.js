let scores = {};
const sqlElements = [
    { type: 'keyword', value: 'SELECT' },
    { type: 'keyword', value: 'FROM' },
    { type: 'keyword', value: 'WHERE' },
    { type: 'keyword', value: 'AND' },
    { type: 'keyword', value: 'OR' },
    { type: 'field', value: 'nom' },
    { type: 'field', value: 'prenom' },
    { type: 'field', value: 'fonction' },
    { type: 'field', value: 'service' },
    { type: 'table', value: 'employes' },
    { type: 'operator', value: '=' },
    { type: 'value', value: 'Informatique' },
    { type: 'value', value: 'Développement' },
    { type: 'value', value: 'Infrastructure' },
    { type: 'value', value: 'Concepteur de requêtes' },
    { type: 'value', value: 'Développeur Magento' },
    { type: 'value', value: 'Responsable' }
];

const questions = [
    {
        question: "Qui s'occupe de la conception et l'optimisation des requêtes au sein du service Informatique ?",
        correctQuery: "SELECT nom, prenom FROM employes WHERE service = 'Informatique' AND fonction = 'Concepteur de requêtes'",
        answer: "La personne en charge des requêtes au sein du service Informatique est <strong>POUTSI Arsène</strong>"
    },
    {
        question: "Qui sont les Développeurs Magento du service ?",
        correctQuery: "SELECT nom, prenom FROM employes WHERE fonction = 'Développeur Magento'",
        answer: "Les personnes en charge des développements ecommerce sont <strong>Jean-Yves CHAILLOU et Tony</strong>"
    },
    {
        question: "Qui est le Responsable du service Informatique ?",
        correctQuery: "SELECT nom, prenom FROM employes WHERE service = 'Informatique' AND fonction = 'Responsable'",
        answer: "Le Responsable du service Informatique est <strong>Mathilde COSNEAU</strong>"
    }
];

let currentQuestionIndex = 0;
let startTime;
let timerInterval;
let score = 0;
let queryHistory = [];

function initializeElements() {
    const availableElements = document.getElementById('availableElements');
    availableElements.innerHTML = '';
    sqlElements.forEach(element => {
        const el = document.createElement('span');
        el.className = `draggable ${element.type}`;
        el.draggable = true;
        el.textContent = element.value;
        el.ondragstart = drag;
        availableElements.appendChild(el);
    });

    const queryBuilder = document.getElementById('queryBuilder');
    queryBuilder.ondragover = allowDrop;
    queryBuilder.ondrop = drop;
    getScores();
    setScores();
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text/plain", JSON.stringify({
        value: ev.target.textContent,
        type: ev.target.className.split(' ')[1]
    }));
}

function drop(ev) {
    ev.preventDefault();
    const data = JSON.parse(ev.dataTransfer.getData("text/plain"));
    const newElement = document.createElement('span');
    newElement.className = `draggable ${data.type}`;
    newElement.textContent = data.value;
    newElement.draggable = true;
    newElement.ondragstart = drag;

    const removeButton = document.createElement('span');
    removeButton.textContent = ' ×';
    removeButton.className = 'remove-element';
    removeButton.onclick = function() {
        this.parentElement.remove();
    };

    newElement.appendChild(removeButton);

    if (ev.target.id === 'queryBuilder') {
        ev.target.appendChild(newElement);
    } else if (ev.target.className.includes('draggable')) {
        ev.target.parentNode.insertBefore(newElement, ev.target.nextSibling);
    }
}

function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('timer').textContent = `Temps: ${elapsedTime}s`;
}

function stopTimer() {
    clearInterval(timerInterval);
}

function validateQuery() {
    stopTimer();
    const queryBuilder = document.getElementById('queryBuilder');
    let userQuery = Array.from(queryBuilder.children)
        .map(child => {
            let text = child.textContent.replace(' ×', '');
            if (child.classList.contains('value')) {
                text = `'${text}'`;
            }
            return text;
        })
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Ajouter une virgule entre les colonnes si elle est manquante
    userQuery = userQuery.replace(/(\w+)\s+(\w+)\s+FROM/, '$1, $2 FROM');

    const resultElement = document.getElementById('result');
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);

    let correctQuery = questions[currentQuestionIndex].correctQuery
        .replace(/\s+/g, ' ')
        .trim();

    // Rendre la comparaison flexible pour l'ordre des conditions
    const userConditions = userQuery.split('WHERE')[1].split('AND').map(c => c.trim()).sort();
    const correctConditions = correctQuery.split('WHERE')[1].split('AND').map(c => c.trim()).sort();

    let resultHTML = `<div class="user-query">Votre requête : ${userQuery}</div>`;

    const isCorrect = userQuery.split('WHERE')[0] === correctQuery.split('WHERE')[0] &&
                      JSON.stringify(userConditions) === JSON.stringify(correctConditions);

    if (isCorrect) {
        resultHTML += `<p class="success">Bravo ! Votre requête est correcte. Temps : ${elapsedTime} secondes</p>`;
        resultHTML += `<p>${questions[currentQuestionIndex].answer}</p>`;
        score++;
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    } else {
        resultHTML += `<p class="failure">Désolé, votre requête n'est pas correcte. Essayez encore !</p>`;
    }

    resultElement.innerHTML = resultHTML;

    // Ajouter la requête à l'historique
    queryHistory.push({
        query: userQuery,
        isCorrect: isCorrect,
        questionIndex: currentQuestionIndex
    });

    updateQueryHistory();

    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        setTimeout(() => {
            document.getElementById('questionCounter').textContent = `Question: ${currentQuestionIndex + 1}/${questions.length}`;
            document.getElementById('currentQuestion').textContent = questions[currentQuestionIndex].question;
            queryBuilder.innerHTML = '';
            resultElement.innerHTML = '';
            startTimer();
        }, 3000);
    } else {
        setTimeout(() => {
            endQuiz();
        }, 3000);
    }
}

function updateQueryHistory() {
    const historyElement = document.getElementById('queryHistory');
    historyElement.innerHTML = '<h2>Historique des requêtes</h2>';
    queryHistory.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${item.isCorrect ? 'success' : 'failure'}`;
        historyItem.innerHTML = `
            <p><strong>Question ${item.questionIndex + 1}:</strong> ${questions[item.questionIndex].question}</p>
            <p>Requête: ${item.query}</p>
            ${item.isCorrect ? `<p>Réponse : ${questions[item.questionIndex].answer.replace(/<\/?strong>/g, '')}</p>` : ''}
            <p>${item.isCorrect ? 'Correct' : 'Incorrect'}</p>
        `;
        historyElement.appendChild(historyItem);
    });
}

function endQuiz() {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <h1>Quiz terminé !</h1>
        <div id="result" class="success">
            <p>Votre score final est de ${score}/${questions.length}</p>
            <p>${getScoreMessage(score)}</p>
        </div>
        <div class="center-button">
            <button onclick="restartQuiz()">Retournez au Quiz</button>
        </div>
        <div id="queryHistory"></div>
    `;
    updateQueryHistory();
    confetti({
        particleCount: 200,
        spread: 160,
        origin: { y: 0.6 }
    });
}

function getScoreMessage(score) {
    if (score === questions.length) {
        return "Félicitations ! Vous êtes maintenant un expert en SQL !";
    } else if (score >= questions.length / 2) {
        return "Bien joué ! Vous avez de bonnes connaissances en SQL.";
    } else {
        return "Continuez à pratiquer pour  améliorer vos compétences en SQL !";
    }
}

function restartQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    queryHistory = [];
    const container = document.querySelector('.container');
    container.innerHTML = `
        <h1>Constructeur de Requête SQL</h1>
        <div id="timer">Temps: 0s</div>
        <div id="questionCounter">Question: 1/3</div>
        <div id="currentQuestion"></div>
        <div class="grid">
            <div class="card">
                <h2>Éléments SQL disponibles</h2>
                <div id="availableElements"></div>
            </div>
            <div class="card">
                <h2>Constructeur de Requête</h2>
                <div id="queryBuilder" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
                <button onclick="validateQuery()">Valider la Requête</button>
            </div>
        </div>
        <div id="result"></div>
        <div id="queryHistory">
            <h2>Historique des requêtes</h2>
        </div>
    `;
    initializeGame();
}

function initializeGame() {
    initializeElements();
    document.getElementById('currentQuestion').textContent = questions[currentQuestionIndex].question;
    startTimer();
}




function getScores(){
    if(localStorage.getItem('results')){
        let scorss = JSON.parse(localStorage.getItem('results'))
    }
    scores.scores = ||{scores:[]};
    console.log('scores')
    console.log(scores.scores)
    scores.scores.push({
        name:'jean-yves',
        time:'50',
    })
}
function setScores(){
    localStorage.setItem('results', JSON.stringify(scores.scores))
    console.log('setScores get')
    console.log(localStorage.getItem('results'))
}

initializeGame();