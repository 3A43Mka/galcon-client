

function updateNavigation() {
    let allPages = document.querySelectorAll(".page");
    allPages = [...allPages];
    for (let page of allPages) {
        if (store.currentPage === page.getAttribute("data-page")) {
            page.classList.remove("d-none");
        } else {
            page.classList.add("d-none");
        }
    }
}

function updateRegisterFormError() {
    const errorElem = document.querySelector(".input-error");
    errorElem.innerText = store.registerForm.error;
}

function handleRegister() {
    const enteredNickname = document.querySelector("#nickname-input").value;
    if (enteredNickname.length < 1 || !store.registerForm.pickedColor) {
        store.registerForm.error = "Please enter a nickname and pick a color";
    } else {
        createMyUser(enteredNickname, store.registerForm.pickedColor);
        store.currentPage = PAGES.MAIN_MENU;
        updateNavigation();
        renderPlayerGreeting();
        getLobbyList();
    }
    updateRegisterFormError();
}

function handleCreateGame() {
    createNewGame();

}

function addPagesEventListeners() {
    const register = document.querySelector("#register-button");
    register.addEventListener("click", handleRegister);
    const createGame = document.querySelector("#create-game-button");
    createGame.addEventListener("click", handleCreateGame);
    const strtgm = document.querySelector("#start-game-button");
    strtgm.addEventListener("click", () => {
        startGame(store.currentGameId);
    });
}

function renderColorOptions() {
    const oldColorsContainer = document.querySelector(".colors-container");
    const newColorsContainer = document.createElement("div");
    newColorsContainer.className = "colors-container";

    for (let color of possibleColorOptions) {
        const colorElement = document.createElement("div");
        colorElement.className = `color-option-item ${store.registerForm.pickedColor === color ? "color-option-item--selected": ""}`;
        colorElement.setAttribute("data-color", color);
        colorElement.style.setProperty("background-color", color);
        colorElement.addEventListener("click", () => {
            store.registerForm.pickedColor = color;
            renderColorOptions();
        });

        newColorsContainer.appendChild(colorElement);
    }
    oldColorsContainer.parentNode.replaceChild(newColorsContainer, oldColorsContainer);
}

function renderListOfGames() {
    const oldLobbyList = document.querySelector(".lobby-list");
    const newLobbyList = document.createElement("div");
    newLobbyList.className = "lobby-list";

    for (let game of store.allGames) {
        const gameItem = document.createElement("div");
        gameItem.className = "lobby-item";
        gameItem.innerText = `${game.id} (${game.usersAmount} players)`;
        gameItem.addEventListener("click", () => {
           joinGame(game.id);
        });
        newLobbyList.appendChild(gameItem);
    }

    oldLobbyList.parentNode.replaceChild(newLobbyList, oldLobbyList);
}

function renderLobby() {
    const lobbyNameEl = document.querySelector(".lobby-name");
    lobbyNameEl.innerText = store.currentGameId;
    const oldListOfLobbyPlayers = document.querySelector(".lobby-list-of-players");
    const newListOfLobbyPlayers = oldListOfLobbyPlayers.cloneNode(false);
    let counter = 1;
    for (let player of store.currentLobbyPlayers) {
        const playerItem = document.createElement("div");
        playerItem.className = "lobby-list-player-item";
        const playerItemColor = document.createElement("div");
        playerItemColor.className = "lobby-list-player-item-color";
        playerItemColor.style.setProperty("background-color", player.color);
        const playerItemText = document.createElement("span");
        playerItemText.className = "lobby-list-player-item-text";
        playerItemText.innerText = `${counter}. ${player.name}${player.isHost ? " (Host)": ""}`;
        playerItem.appendChild(playerItemText);
        playerItem.appendChild(playerItemColor);
        newListOfLobbyPlayers.appendChild(playerItem);
        counter++;
    }
    oldListOfLobbyPlayers.parentNode.replaceChild(newListOfLobbyPlayers, oldListOfLobbyPlayers);
    // start button update
    const startGameButton = document.querySelector(".start-game-button");
    if (store.currentLobbyPlayers.length < 2) {
        startGameButton.classList.remove("start-game-button--active");
    } else {
        startGameButton.classList.add("start-game-button--active");
    }
}

function renderGameScreen() {
    const playerText = document.querySelector(".game-player-text");
    playerText.innerText = store.lastUserCreated.name;
    const playerColor = document.querySelector(".game-player-color");
    playerColor.style.setProperty("background-color", store.lastUserCreated.color);

    const oldRivalsList = document.querySelector(".rivals-list");
    const newRivalsList = oldRivalsList.cloneNode(false);
    for (let rival of store.currentLobbyPlayers) {
        if (rival.id === store.playerId) {
            continue;
        }
        const rivalItem = document.createElement("div");
        rivalItem.className = "rival-item";
        const rivalColor = document.createElement("div");
        rivalColor.className = "rival-item-color";
        rivalColor.style.setProperty("background-color", rival.color);
        const rivalName = document.createElement("div");
        rivalName.className = "rival-item-name";
        rivalName.innerText = rival.name;
        rivalItem.appendChild(rivalColor);
        rivalItem.appendChild(rivalName);
        newRivalsList.appendChild(rivalItem)
    }
    oldRivalsList.parentNode.replaceChild(newRivalsList, oldRivalsList);
}

function renderGameEnded() {
    const winScreen = document.querySelector(".win-screen");
    const loseScreen = document.querySelector(".lose-screen");
    if (!store.lastGameWinner) {
        const winScreen = document.querySelector(".win-screen");
        winScreen.classList.add("d-none");
        const loseScreen = document.querySelector(".lose-screen");
        loseScreen.classList.add("d-none");
        return;
    }
    if (store.lastGameWinner.id === store.playerId) {
        loseScreen.classList.add("d-none");
        winScreen.classList.remove("d-none");

    } else {
        loseScreen.classList.remove("d-none");
        winScreen.classList.add("d-none");
        const winnerEl = document.querySelector(".lose-screen-winner");
        winnerEl.innerText = `Winnner is ${store.lastGameWinner.name}`;
    }


}

function renderPlayerGreeting() {
    const playerName = document.querySelector(".player-greeting-name")
    playerName.innerText = store.lastUserCreated.name;
    const playerColor = document.querySelector(".player-greeting-color");
    playerColor.style.setProperty("background-color", store.lastUserCreated.color);
}

const possibleColorOptions = ['red', 'green', 'blue', 'cyan', 'brown', 'pink', 'yellow', ]

const PAGES = {
    REGISTER: 'REGISTER',
    MAIN_MENU: 'MAIN_MENU',
    LOBBY: 'LOBBY',
    GAME: 'GAME',
}

//// canvas game stuff:

const socket = io("http://localhost:3000");

window.secretSocket = socket;

const mockLastGameData = {
    "id": "8586b2f7-8e39-4e4f-97c1-4ac61ecaad5c",
    "players": [
        {
            "name": "Shrek",
            "color": "green",
            "id": "nug0RW9tFWy-FohyAAAF",
            "isHost": true
        },
        {
            "name": "me",
            "color": "blue",
            "id": "FXt92dVz9UvKl3hPAAAH",
            "isHost": false
        }
    ],
    "map": {
        "w": 500,
        "h": 200,
        "planetArray": [
            {
                "id": 0,
                "owner": {
                    "name": "Shrek",
                    "color": "green",
                    "id": "nug0RW9tFWy-FohyAAAF",
                    "isHost": true
                },
                "coords": {
                    "x": 74.80785069456772,
                    "y": 32.69527808319023
                },
                "radius": 9,
                "fleet": 28,
                "fleetGenSpeed": 18
            },
            {
                "id": 1,
                "owner": {
                    "name": "me",
                    "color": "blue",
                    "id": "FXt92dVz9UvKl3hPAAAH",
                    "isHost": false
                },
                "coords": {
                    "x": 227.70676860934591,
                    "y": 109.35450006904611
                },
                "radius": 9,
                "fleet": 28,
                "fleetGenSpeed": 18
            },
            {
                "id": 2,
                "owner": null,
                "coords": {
                    "x": 229.76714132776178,
                    "y": 152.01181094780375
                },
                "radius": 23,
                "fleet": 37,
                "fleetGenSpeed": 46
            },
            {
                "id": 3,
                "owner": null,
                "coords": {
                    "x": 112.48928690092882,
                    "y": 126.49078763919213
                },
                "radius": 6,
                "fleet": 27,
                "fleetGenSpeed": 12
            },
            {
                "id": 4,
                "owner": null,
                "coords": {
                    "x": 54.303954892138954,
                    "y": 112.73347276096992
                },
                "radius": 16,
                "fleet": 40,
                "fleetGenSpeed": 32
            },
            {
                "id": 5,
                "owner": null,
                "coords": {
                    "x": 140.31611423124536,
                    "y": 33.00484088436863
                },
                "radius": 12,
                "fleet": 16,
                "fleetGenSpeed": 24
            },
            {
                "id": 6,
                "owner": null,
                "coords": {
                    "x": 296.39769408554355,
                    "y": 95.39056999882409
                },
                "radius": 4,
                "fleet": 46,
                "fleetGenSpeed": 8
            },
            {
                "id": 7,
                "owner": null,
                "coords": {
                    "x": 279.36042149160875,
                    "y": 30.882574791974182
                },
                "radius": 23,
                "fleet": 19,
                "fleetGenSpeed": 46
            },
            {
                "id": 8,
                "owner": null,
                "coords": {
                    "x": 50.259282195216315,
                    "y": 17.30919708763799
                },
                "radius": 9,
                "fleet": 6,
                "fleetGenSpeed": 18
            },
            {
                "id": 9,
                "owner": null,
                "coords": {
                    "x": 392.725757924619,
                    "y": 85.23966752656015
                },
                "radius": 14,
                "fleet": 35,
                "fleetGenSpeed": 28
            }
        ]
    }
};

const mockFlightData = {
    "sender": "5Mr7RhzKYswH-ug_AAAH",
    "unitsAmount": 1157,
    "timeToReachInSec": 6.372361592587368,
    "sourcePlanetId": 1,
    "destinationPlanetId": 3
}

// some initial setup

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const store = {
    lastGameState: mockLastGameData,
    playerId: null,
    selectedPlanetId: null,
    currentFlights: [],
    lastUserCreated: null,
    currentPage: PAGES.REGISTER,
    registerForm: {
        error: '',
        pickedColor: null,
    },
    allGames: [],
    currentGameId: null,
    currentLobby: null,
    currentLobbyPlayers: [],
    lastGameWinner: null,
};

store.lastGameState = null;

addCanvasEventListeners();

//

socket.on("connect", () => {
    console.log("Connected to the server and was assigned an id of ", socket.id);
    store.playerId = socket.id;
});

socket.on('GAME_CREATED', () => {
    console.log("Hey, I hear a new game was created, let me get the lobby list...");
    getLobbyList();
})

socket.on('PLAYER_JOINED', (player) => {
    console.log("Player joined: ", player);
    store.currentLobbyPlayers.push(player);
    renderLobby();
});

socket.on('GAME_STARTED', (gameDetails) => {
    console.log("Game Started: ", gameDetails);
    store.lastGameState = gameDetails;
    store.currentPage = PAGES.GAME;
    renderGameScreen();
    renderGameEnded();
    updateNavigation();
    canvas.width = store.lastGameState.map.w;
    canvas.height = store.lastGameState.map.h;
});

socket.on('SEND_UNITS', (sendUnitsDetails) => {
    console.log("Units were sent: ", sendUnitsDetails);
    registerOngoingFlight(sendUnitsDetails);
});

socket.on('GAME_END', (winner, allPlayers) => {
    console.log("The game ended, winner: ", winner, "allPlayers: ", allPlayers);
    store.lastGameWinner = winner;
    renderGameEnded();
});

socket.on('SYNC', (gameState) => {
    console.log("gameState is:", gameState);
    store.lastGameState = gameState;
});

function createMyUser(name, color) {
    const newUser = {
        name: name,
        color: color,
    };
    store.lastUserCreated = newUser;
}

function createNewGame() {
    if (!store.lastUserCreated) {
        console.log("You have to create a user first!");
        return;
    }
    socket.emit('CREATE_NEW_GAME', store.lastUserCreated, (gameId) => {
        console.log("I have just created a game: ", gameId);
        store.currentGameId = gameId;

        socket.emit('GET_LOBBY_LIST', (lobbyList) => {
            store.allGames = lobbyList;
            store.currentLobby = store.allGames.find(g => g.id === store.currentGameId)
            store.currentLobbyPlayers = [{id: socket.id, name: store.lastUserCreated.name, isHost: true, color: store.lastUserCreated.color}];
            store.currentPage = PAGES.LOBBY;
            renderLobby();
            updateNavigation();
        });
    });
}

function joinGame(gameId) {
    if (!store.lastUserCreated) {
        console.log("You have to create a user first!");
        return;
    }
    socket.emit('JOIN_GAME', store.lastUserCreated, gameId, (game) => {
        console.log("I have just joined a game: ", game);
        store.currentGameId = gameId;
        store.currentLobby = game;
        store.currentLobbyPlayers = game.players;
        store.currentPage = PAGES.LOBBY;
        renderLobby();
        updateNavigation();
    });
}

function startGame(gameId) {
    if (store.currentLobbyPlayers.length > 1) {
        socket.emit('START_GAME', gameId);
        console.log("I am initiating a start of the game: ", gameId);
    }
}

function sendUnits(gameId, sourcePlanetId, destinationPlanetId) {
    socket.emit('SEND_UNITS', gameId, sourcePlanetId, destinationPlanetId);
    console.log("I am initiating sending units: ", gameId, sourcePlanetId, destinationPlanetId);
}

function getLobbyList() {
    socket.emit('GET_LOBBY_LIST', (lobbyList) => {
        console.log("Here are all lobbies", lobbyList);
        store.allGames = lobbyList;
        renderListOfGames();

    });
}

function addCanvasEventListeners() {
    canvas.addEventListener('click', handleCanvasClick);
}

function registerOngoingFlight(data) {
    const timeToReachInSec = data.timeToReachInSec
    const startTime = new Date();
    const endTime = new Date();
    endTime.setMilliseconds(endTime.getMilliseconds() + timeToReachInSec * 1000);
    const planet1 = store.lastGameState.map.planetArray.find(p => p.id === data.sourcePlanetId);
    const planet2 = store.lastGameState.map.planetArray.find(p => p.id === data.destinationPlanetId);
    const fleetRadius = planet1.radius / 4;

    const flightData = {
        startTime: startTime,
        endTime: endTime,
        timeToReachInSec: timeToReachInSec,
        x1: planet1.coords.x,
        y1: planet1.coords.y,
        x2: planet2.coords.x,
        y2: planet2.coords.y,
        fleetOwner: data.sender,
        fleetRadius: fleetRadius,
    }

    console.log("Flight added: ", flightData);

    store.currentFlights.push(flightData);
    console.log("Added the flight to store:", store);

    // setting timer to delete data from array
    setTimeout(() => {
        console.log("Erasing the filght: ", flightData);
        store.currentFlights = store.currentFlights.filter((f) => f !== flightData);
    }, data.timeToReachInSec * 1000);
}

function handleCanvasClick(e) {
    const mouse = utils.oMousePos(canvas, e);
    console.log(mouse);
    const planetsData = store.lastGameState.map.planetArray;
    for (let planet of planetsData) {
        const clickHitCircle =
            Math.sqrt(
                Math.pow((mouse.x - planet.coords.x), 2) +
                Math.pow((mouse.y - planet.coords.y), 2)
            ) < planet.radius;
        if (clickHitCircle) {
            console.log("Clicked on a planet id = ", planet.id);
            if (!store.selectedPlanetId && planet.owner?.id === store.playerId) {
                store.selectedPlanetId = planet.id;
            } else if (store.selectedPlanetId === planet.id) {
                store.selectedPlanetId = null;
            } else {
                sendUnits(store.lastGameState.id, store.selectedPlanetId, planet.id);
                store.selectedPlanetId = null;
            }
            break;
        }
    }
}

const drawUtils = {
    drawBackground(color) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    },
    drawCircle(x, y, radius, fill, stroke, strokeWidth) {
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
        if (fill) {
            ctx.fillStyle = fill
            ctx.fill()
        }
        if (stroke) {
            ctx.lineWidth = strokeWidth
            ctx.strokeStyle = stroke
            ctx.stroke()
        }
    },
    drawTextInCenter(msg, x, y, color, size) {
        ctx.fillStyle = color;
        ctx.font = `${size} Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(msg, x, y);
    }
}

const utils = {
    oMousePos(canvas, evt) {
        var ClientRect = canvas.getBoundingClientRect();
        return {
            x: Math.round(evt.clientX - ClientRect.left),
            y: Math.round(evt.clientY - ClientRect.top)
        }
    },
    getPositionAlongTheLine(x1, y1, x2, y2, percentage) {
        console.log("getPositionAlongTheLine ", x1, y1, x2, y2, percentage);
        const x = x1 * (1.0 - percentage) + x2 * percentage;
        const y = y1 * (1.0 - percentage) + y2 * percentage;
        return {x, y};
    }

}

const colors = {
    mapBackground: '#000421',
    ownColor: '#3950f1',
    ownFlightColor: '#8290f8',
    rivalColor: '#ff3232',
    rivalFlightColor: '#ef7b7b',
    neutralColor: '#a2a2a2',
    transparent: 'transparent',
    selectedColor: '#ffecad',
    white: 'white',
}

function drawAllPlanets() {
    const planetsData = store.lastGameState.map.planetArray;
    for (let planet of planetsData) {
        let currentPlanetColor = colors.neutralColor;
        if (planet.owner) {
            currentPlanetColor = planet.owner.color;
        }

        let strokeColor = colors.transparent;
        if (store.selectedPlanetId === planet.id) {
            strokeColor = colors.selectedColor;
        }
        drawUtils.drawCircle(planet.coords.x, planet.coords.y, planet.radius, currentPlanetColor, strokeColor, 2);
        drawUtils.drawTextInCenter(planet.fleet, planet.coords.x, planet.coords.y, colors.white, planet.radius/2 + "px");
    }
}

function drawAllFlights() {
    for (let flight of store.currentFlights) {
        // console.log("drawAllFlights()2")
        const fleetOwner = store.lastGameState.players.find(p => p.id === flight.fleetOwner)
        const flightColor = fleetOwner.color;
        const now = new Date();
        const q = Math.abs(now - flight.startTime);
        const d = Math.abs(flight.endTime - flight.startTime);
        // console.log("q: ", q, " d: ", d);
        const percent = q / d;
        const fleetPos = utils.getPositionAlongTheLine(flight.x1, flight.y1, flight.x2, flight.y2, percent);
        // console.log("Going to draw fleet: ", fleetPos.x, fleetPos.y, 5, flightColor, colors.transparent, 0);
        drawUtils.drawCircle(fleetPos.x, fleetPos.y, flight.fleetRadius, flightColor, colors.transparent, 0);
        drawUtils.drawCircle(flight.x1, flight.y1, 1, colors.white, colors.transparent, 0);
        drawUtils.drawCircle(flight.x2, flight.y2, 1, colors.white, colors.transparent, 0);
    }
}

// setInterval(drawGameMapOnCanvas, 100);

requestAnimationFrame(drawGameMapOnCanvas)

function drawGameMapOnCanvas() {
    if (store.lastGameState) {

        drawUtils.drawBackground(colors.mapBackground);
        drawAllPlanets();
        drawAllFlights();
    }
    requestAnimationFrame(drawGameMapOnCanvas)
}

addPagesEventListeners();
updateNavigation();
renderColorOptions();
