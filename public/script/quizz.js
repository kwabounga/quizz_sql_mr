
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
    { type: 'value', value: "'Informatique'" },
    { type: 'value', value: "'Développement'" },
    { type: 'value', value: "'Infrastructure'" },
    { type: 'value', value: "'Concepteur_de_requêtes'" },
    { type: 'value', value: "'Développeur_Magento'" },
    { type: 'value', value: "'Cheffe_Design'" },
    { type: 'value', value: "'Responsable'" }
];

const questions = [
    {
        question: "Qui s'occupe de rien? ",
        correctQuery: "SELECT nom, prenom FROM employes WHERE service = 'Informatique' AND fonction = 'Cheffe_Design'",
        answer: "La personne qui ne fout rien est <strong>Claire GUILLOTON</strong>",
        ids:['claire']
    },
    {
        question: "Qui s'occupe de la conception et l'optimisation des requêtes au sein du service Informatique ?",
        correctQuery: "SELECT nom, prenom FROM employes WHERE service = 'Informatique' AND fonction = 'Concepteur_de_requêtes'",
        answer: "La personne en charge des requêtes au sein du service Informatique est <strong>Arsène POUTSI</strong>",
        ids:['arsene']
    },
    {
        question: "Qui sont les Développeurs Magento du service ?",
        correctQuery: "SELECT nom, prenom FROM employes WHERE fonction = 'Développeur_Magento'",
        answer: "Les personnes en charge des développements ecommerce sont <strong>Jean-Yves CHAILLOU et Tony EVEN</strong>",
        ids:['jeanyves','tony']
    },
    {
        question: "Qui est le Responsable du service Informatique ?",
        correctQuery: "SELECT nom, prenom FROM employes WHERE service = 'Informatique' AND fonction = 'Responsable'",
        answer: "Le Responsable du service Informatique est <strong>Mathilde COSNEAU</strong>",
        ids:['mathilde']
    }
];

let currentQuestionIndex = 0;
const maxQuestions = 3;
let startTime;
let timerInterval;
let score = 0;
let queryHistory = [];
let scores = {};
let globalTime = 0;
let player_name = 'Arsène';


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
}

/* DRAG n DROP PART */
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
        if(this.parentElement.title){
            let ne = createTip(this.parentElement.title, true);
            this.parentElement.parentElement.insertBefore(ne, this.parentElement);
        }
        this.parentElement.remove();
    };

    newElement.appendChild(removeButton);

    if (ev.target.id === 'queryBuilder') {
        ev.target.appendChild(newElement);
    } else if (ev.target.classList.contains('draggable')) {
        ev.target.parentNode.insertBefore(newElement, ev.target.nextSibling);
    }else if (ev.target.classList.contains('tips-element')) {
        newElement.title = ev.target.title;
        ev.target.parentNode.insertBefore(newElement, ev.target.nextSibling);
        ev.target.parentNode.removeChild(ev.target)
    }
}
/*------------*/

function startGame() {    
    const btn = document.getElementById('btnValidateQuery');
    btn.classList.remove('hidden')
    startTimer();
}

/* TIMER PART */
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
    document.getElementById('timer').textContent = `Temps: 0s`;
}

function updateTimer() {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('timer').textContent = `Temps: ${elapsedTime}s`;
}

function stopTimer() {
    clearInterval(timerInterval);
}
/*------------*/


/* Logic */

function validateQuery() {

    globalTime += Math.floor((Date.now() - startTime) / 1000);
    console.log('globalTime',globalTime)
    stopTimer();

    const btn = document.getElementById('btnValidateQuery');
    btn.classList.add('hidden')
    const queryBuilder = document.getElementById('queryBuilder');

    let userQuery = Array.from(queryBuilder.children)
        .map(child => {
            let text = child.textContent.replace(' ×', '');
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
    resultHTML += `<div class="correct-query">Bonne réponse : ${correctQuery}</div>`;

    const isCorrect = userQuery.split('WHERE')[0] === correctQuery.split('WHERE')[0] &&
                      JSON.stringify(userConditions) === JSON.stringify(correctConditions);

    if (isCorrect) {
        resultHTML += `<p class="success">Bravo ! Votre requête est correcte. Temps : ${elapsedTime} secondes</p>`;
        resultHTML += `<p>${questions[currentQuestionIndex].answer}</p>`;
        questions[currentQuestionIndex].ids.forEach(identifier => {
            resultHTML += `<div class="grid id-grid">${getIdentityCardHtml(identifier)}</div>`;
        });
        
        score++;        
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    } else {
        resultHTML += `<p class="failure">Désolé, votre requête n'est pas correcte. Essayez encore !</p>`;
    }
    
    if(currentQuestionIndex < maxQuestions-1) {
        resultHTML += '<button id="nextQuestion">Question suivante</button>';
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
    if (currentQuestionIndex < maxQuestions) {
        document.getElementById('nextQuestion').addEventListener("click", () => {
            document.getElementById('questionCounter').textContent = `Question: ${currentQuestionIndex + 1}/${maxQuestions}`;
            document.getElementById('currentQuestion').textContent = questions[currentQuestionIndex].question;
            queryBuilder.innerHTML = '';
            resultElement.innerHTML = '';
            initializeTips();
            startGame();
        })
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
        historyItem.innerHTML = raw.history(item);
        historyElement.appendChild(historyItem);
    });
}

function endQuiz() {    
    addScoreToLeaderBoard({
        name: player_name,
        score: score,
        time: globalTime,
    })
    
    const container = document.querySelector('.container');
    container.innerHTML = raw.endQuiz();

    updateQueryHistory();
    confetti({
        particleCount: 200,
        spread: 160,
        origin: { y: 0.6 }
    });
    displayLeaderBoard();
    showAllTeam();
    
}

function restartQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    globalTime = 0;
    queryHistory = [];

    const container = document.querySelector('.container');
    container.innerHTML = raw.game();

    initializeGame();
}

function initializeLogin(){

    const container = document.querySelector('.container');
    container.innerHTML = raw.login();

    const btStart = document.getElementById("btnStartGame");
    btStart.addEventListener("click",(ev)=>{
        const inputName = document.getElementById("inputName");
        console.log(inputName.value);
        player_name = inputName.value.trim();
        restartQuiz();
    })
}
function initializeGame() {    
    initializeElements();
    document.getElementById('currentQuestion').textContent = questions[currentQuestionIndex].question;
    initializeTips();
    startGame();
}

function initializeTips(){
    const queryBuilder = document.getElementById('queryBuilder');
    queryBuilder.innerHTML = "";
    let tips = questions[currentQuestionIndex].correctQuery.replaceAll(',', '').split(" ");
    console.log(tips);
    tips.forEach((tip, id)=>{
        const el = createTip(tip,(id % (3-currentQuestionIndex) == 0));
        queryBuilder.appendChild(el)
    })
}
function createTip(tip, isHidden){
    const el = document.createElement('span');
        el.className = `no-draggable ${getType(tip)} `;
        
        el.textContent = tip;
        if(isHidden){
            el.className += ` tips-element`;
            el.title = tip;
            el.textContent = el.textContent.split('').map((l=>'x')).join("");
        }
        return el;
}
/*------------*/


/* Messages and scores PART */
function getType(value){
    return sqlElements.find(el => el.value == value).type;
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

function getScores(){
    let registered_scores;
    if(localStorage.getItem('results')){
        registered_scores = JSON.parse(localStorage.getItem('results'))
    }
    scores = {scores:( registered_scores??[] )};
    console.log('scores');
    scores.scores.sort((a,b)=> {
        let sa = (+a.score) * 1000
        let sb = (+b.score) * 1000
        sa -= +a.time;
        sb -= +b.time;
        return sb - sa;

    })
    console.log(scores)
    
    return scores.scores;
}
function setScores(){
    console.log('setScores')
    localStorage.setItem('results', JSON.stringify(scores.scores))
}
function addScoreToLeaderBoard(_score){
    getScores();
    console.log('add Score To leaderBoard')
    scores.scores.push(_score);
    setScores()
}



function displayLeaderBoard(){
    let leaderBoard = getScores();
    console.log(leaderBoard)
    const leaderBoardContainer = document.querySelector('#leaderBoard');
    let htmlContent = `<div class="header">Meilleurs Scores!</div><div class="game">`
    leaderBoard.forEach(s => {
        htmlContent += raw.leaderBoardElement(s);
    });
    htmlContent += `</div>`
    leaderBoardContainer.innerHTML = htmlContent;
}
/*------------*/

function showAllTeam(){
    const teamWrapper = document.getElementById('team')
    let html = '<div class="grid id-grid">'
    Object.keys(identities).forEach(key => {
        html += getIdentityCardHtml(key)
    });
     html += '</div>'
     teamWrapper.innerHTML = html;

}
function getIdentityCardHtml(identifier) {
    const p = identities[identifier]
    return raw.identityCard(p);
}
const identities = {
    arsene:{
        firstname: 'Arsène',
        lastname: 'POUTSI',
        poste: 'Concepteur de requête',
        service: 'Informatique',
        img: './assets/avatars/arsene.jpg',
        description:''
    },
    mathilde:{
        firstname: 'Mathilde',
        lastname: 'COSNEAU',
        poste: 'Responsable',
        service: 'Informatique',
        img: './assets/avatars/mathilde.jpg',
        description:''
    },
    thomas:{
        firstname: 'Thomas',
        lastname: 'PICOT',
        poste: 'Responsable',
        service: 'Infrastructure',
        img: './assets/avatars/thomas.jpg',
        description:''
    },
    etienne:{
        firstname: 'Etienne',
        lastname: 'LEMEE',
        poste: 'Développeur Alternant',
        service: 'Développement',
        img: './assets/avatars/etienne.jpg',
        description:''
    },
    ilan:{
        firstname: 'Ilan',
        lastname: 'HARDY',
        poste: 'Alternant',
        service: 'Infrastructure',
        img: './assets/avatars/ilan.jpg',
        description:''
    },
    marie:{
        firstname: 'Marie',
        lastname: 'RACINE',
        poste: 'Responsable Produits',
        service: 'Informatique',
        img: './assets/avatars/marie.jpg',
        description:''
    },
    enola:{
        firstname: 'Enola',
        lastname: 'GOAZOU',
        poste: 'Alternant',
        service: 'Informatique',
        img: './assets/avatars/enola.jpg',
        description:''
    },
    tony:{
        firstname: 'Tony',
        lastname: 'EVEN',
        poste: 'Développeur Indépandant',
        service: 'Informatique',
        img: './assets/avatars/tony.jpg',
        description:''
    },
    jeanyves:{
        firstname: 'Jean-Yves',
        lastname: 'CHAILLOU',
        poste: 'Développeur',
        service: 'Informatique',
        img: './assets/avatars/jeanyves.jpg',
        description:''
    },
    anouk:{
        firstname: 'Anouk',
        lastname: 'STEPHAN',
        poste: 'Responsable Web',
        service: 'Informatique',
        img: './assets/avatars/anouk.jpg',
        description:''
    },
    claire:{
        firstname: 'Claire',
        lastname: 'GUILLOTON',
        poste: 'Cheffe Design',
        service: 'Informatique',
        img: './assets/avatars/claire.jpg',
        description:''
    },
}


const raw = {
    history:(item)=>{
        return `
            <p><strong>Question ${item.questionIndex + 1}:</strong> ${questions[item.questionIndex].question}</p>
            <p>Requête: ${item.query}</p>
            ${item.isCorrect ? `<p>Réponse : ${questions[item.questionIndex].answer.replace(/<\/?strong>/g, '')}</p>` : ''}
            <p>${item.isCorrect ? 'Correct' : 'Incorrect'}</p>
        `
    },
    login:()=>{
        return `
        <h1>Constructeur de Requête SQL</h1>
        <div id="currentQuestion">Bienvenue sur votre test en SQL</div>
        <div id="questionCounter">Répondez aux ${maxQuestions} questions</div>
        <div id="timer">Le plus rapidement possible</div>
        <div class="card center-button">
                <div><input type="text" id="inputName" placeHolder="Votre Nom"/></div>
                <div><button id="btnStartGame"">Commencer le Test</button></div>
        </div>
    `
    },
    game:()=>{
        return `
        <h1>Constructeur de Requête SQL</h1>
        <div id="timer">Temps: 0s</div>
        <div id="questionCounter">Question: ${currentQuestionIndex + 1}/${maxQuestions}</div>
        <div id="currentQuestion"></div>
        <div class="grid">
            <div class="card">
                <h2>Éléments SQL disponibles</h2>
                <div id="availableElements"></div>
            </div>
            <div class="card">
                <h2>Constructeur de Requête</h2>
                <div id="queryBuilder" class="bordered" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
                <button id="btnValidateQuery" onclick="validateQuery()">Valider la Requête</button>
            </div>
        </div>
        <div id="result"></div>
        <div id="queryHistory">
            <h2>Historique des requêtes</h2>
        </div>
    `
    },
    endQuiz:()=>{
        return `
        <h1>Quiz terminé !</h1>
        <div id="result" class="success">
            <p>Votre score final est de ${score}/${maxQuestions}</p>
            <p>${getScoreMessage(score)}</p>
        </div>
        <div class="center-button">
            <button onclick="initializeLogin()">Retournez au Quiz</button>
        </div>
        <div id="queryHistory"></div>
        <div id="leaderBoard"></div>
        <div id="team"></div>
    `
    },
    identityCard:(p)=>{
        return `
        <div class="id-card card">
            <div class="info">
                <div class="name">${p.firstname} ${p.lastname}</div>
                <div class="poste">${p.poste}</div>
                <div class="service">du service ${p.service}</div>
                <div class="description">${p.description}</div>
            </div>
            <div class="avatar"><img src="${p.img}" alt="${p.firstname} ${p.lastname}"></div>
        </div>
    `
    },
    leaderBoardElement:(s)=>{
        return `
<div class="party">
    <span class="player">${s.name}:</span>
    <span class="score  score${s.score}">${s.score}pts ${s.time}sec </span>
</div>`
    },
}


/* Initialization */

document.addEventListener("DOMContentLoaded", initializeLogin)
