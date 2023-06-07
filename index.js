import colors from "./colors";
import possibleColorOptions from "./possibleColorOptions";
import PAGES from "./pages";
import sounds from "./sounds";

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
        const x = x1 * (1.0 - percentage) + x2 * percentage;
        const y = y1 * (1.0 - percentage) + y2 * percentage;
        return {x, y};
    }

}
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const store = {
    lastGameState: null,
    playerId: null,
    selectedPlanetId: null,
    currentFlights: [],
    lastUserCreated: null,
    currentPage: PAGES.REGISTER,
    registerForm: {
        error: '',
        pickedColor: null,
    },
    settingsForm: {
        pickedColor: null,
        error: '',
    },
    allGames: [],
    currentGameId: null,
    currentLobby: null,
    currentLobbyPlayers: [],
    lastGameWinner: null,
};

const socket = io("http://localhost:3000");
window.secretSocket = socket;
addCanvasEventListeners();
addPagesEventListeners();
updateNavigation();
renderColorOptions();
requestAnimationFrame(drawGameMapOnCanvas);

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

function handleGoToSettings() {
    store.settingsForm.pickedColor = store.lastUserCreated.color;
    store.settingsForm.error = '';
    renderSettingsMenu();
    renderSettingsError();
    store.currentPage = PAGES.SETTINGS;
    updateNavigation();
}

function handleGoBackToMain() {
    store.currentPage = PAGES.MAIN_MENU;
    updateNavigation();
}

function handleSaveSettings() {
    const newName = document.querySelector("#settings-name");
    if (newName.value.length < 1) {
        store.settingsForm.error = 'New name is too short!';
        renderSettingsError();
        return;
    }
    createMyUser(newName.value, store.settingsForm.pickedColor);
    renderPlayerGreeting();
    store.currentPage = PAGES.MAIN_MENU;
    updateNavigation();
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
    const goToSettings = document.querySelector("#go-to-settings-button");
    goToSettings.addEventListener("click", handleGoToSettings);
    const settingsBack = document.querySelector("#settings-back");
    settingsBack.addEventListener("click", handleGoBackToMain);
    const settingsSave = document.querySelector("#settings-save");
    settingsSave.addEventListener("click", handleSaveSettings);
    const returnToMainMenuButtons = document.querySelectorAll(".game-end-return-to-main");
    returnToMainMenuButtons.forEach((button) => button.addEventListener("click", initiateReset));
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

function renderSettingsMenu() {
    const settingsNameInput = document.querySelector("#settings-name");
    settingsNameInput.value = store.lastUserCreated.name;
    renderColorPickerInSettings();
}

function renderColorPickerInSettings() {
    const oldColorsContainer = document.querySelector(".settings-color-picker");
    const newColorsContainer = oldColorsContainer.cloneNode(false);
    for (let color of possibleColorOptions) {
        const colorElement = document.createElement("div");
        colorElement.className = `settings-color-option-item ${store.settingsForm.pickedColor === color ? "settings-color-option-item--selected": ""}`;
        colorElement.setAttribute("data-color", color);
        colorElement.style.setProperty("background-color", color);
        colorElement.addEventListener("click", () => {
            store.settingsForm.pickedColor = color;
            renderColorPickerInSettings();
        });
        newColorsContainer.appendChild(colorElement);
    }
    oldColorsContainer.parentNode.replaceChild(newColorsContainer, oldColorsContainer);
}

function renderSettingsError() {
    const errorEl = document.querySelector(".settings-error");
    errorEl.innerText = store.settingsForm.error;
}

function renderListOfGames() {
    const oldLobbyList = document.querySelector(".lobby-list");
    const newLobbyList = document.createElement("div");
    newLobbyList.className = "lobby-list";

    const gamesToDisplay = store.allGames.filter(g => !g.isStarted);

    for (let game of gamesToDisplay) {
        const gameItem = document.createElement("div");
        gameItem.className = "lobby-item";
        gameItem.innerText = `${game.id} (${game.usersAmount} players)`;
        gameItem.addEventListener("click", () => {
           joinGame(game.id);
        });
        newLobbyList.appendChild(gameItem);
    }

    if (gamesToDisplay < 1) {
        const noGamesEl = document.createElement("div");
        noGamesEl.className = "no-games";
        noGamesEl.innerText = "No games found. Create one!";
        newLobbyList.appendChild(noGamesEl);
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
        playAudio(sounds.WIN);
        loseScreen.classList.add("d-none");
        winScreen.classList.remove("d-none");

    } else {
        playAudio(sounds.LOSE);
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

socket.on("connect", () => {
    store.playerId = socket.id;
    setupLobbyUpdateRunner();
    tryLoadingProfileData();
});

socket.on('GAME_CREATED', () => {
    getLobbyList();
})

socket.on('PLAYER_JOINED', (player) => {
    playAudio(sounds.PLAYER_JOINED);
    store.currentLobbyPlayers.push(player);
    renderLobby();
});

socket.on('GAME_STARTED', (gameDetails) => {
    store.lastGameState = gameDetails;
    store.currentPage = PAGES.GAME;
    renderGameScreen();
    renderGameEnded();
    animateCountDown();
    updateNavigation();
    canvas.width = store.lastGameState.map.w;
    canvas.height = store.lastGameState.map.h;
});

socket.on('SEND_UNITS', (sendUnitsDetails) => {
    registerOngoingFlight(sendUnitsDetails);
});

socket.on('GAME_END', (winner, allPlayers) => {
    store.lastGameWinner = winner;
    renderGameEnded();
});

socket.on('SYNC', (gameState) => {
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
        return;
    }
    socket.emit('CREATE_NEW_GAME', store.lastUserCreated, (gameId) => {
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
    }
}

function sendUnits(gameId, sourcePlanetId, destinationPlanetId) {
    socket.emit('SEND_UNITS', gameId, sourcePlanetId, destinationPlanetId);
}

function getLobbyList() {
    socket.emit('GET_LOBBY_LIST', (lobbyList) => {
        store.allGames = lobbyList;
        renderListOfGames();
    });
}

function setupLobbyUpdateRunner() {
    window.gamesListUpdateRunner = setInterval(() => {
        if (store.currentPage === PAGES.MAIN_MENU) {
            getLobbyList();
        }
    }, 1000);
}

function addCanvasEventListeners() {
    canvas.addEventListener('click', handleCanvasClick);
}

function initiateReset() {
    localStorage.setItem("profileSaveData", JSON.stringify(store.lastUserCreated));
    location.reload();
}

function animateCountDown() {
    const countdownScreen = document.querySelector(".countdown-screen");
    const slide1 = document.querySelector(".countdown-slide-1");
    const slide2 = document.querySelector(".countdown-slide-2");
    const slide3 = document.querySelector(".countdown-slide-3");
    const slide4 = document.querySelector(".countdown-slide-4");
    document.querySelectorAll(".countdown-slide").forEach(slide => {
        slide.classList.remove("countdown-slide--animated");
        slide.classList.add("d-none");
    })
    playAudio(sounds.COUNT_SLIDE);
    countdownScreen.classList.remove("d-none");
    slide1.classList.remove("d-none");
    slide1.classList.add("countdown-slide--animated");
    const delay = 700;
    setTimeout(() => {
        playAudio(sounds.COUNT_SLIDE);
        slide1.classList.add("d-none");
        slide2.classList.remove("d-none");
        slide2.classList.add("countdown-slide--animated");
    }, delay);
    setTimeout(() => {
        playAudio(sounds.COUNT_SLIDE);
        slide2.classList.add("d-none");
        slide3.classList.remove("d-none");
        slide3.classList.add("countdown-slide--animated");
    }, delay*2);
    setTimeout(() => {
        playAudio(sounds.GAME_START);
        slide3.classList.add("d-none");
        slide4.classList.remove("d-none");
        slide4.classList.add("countdown-slide--animated");
    }, delay*3);
    setTimeout(() => {
        slide4.classList.add("d-none");
        countdownScreen.classList.add("d-none");
    }, delay*4);
}

function tryLoadingProfileData() {
    let profileData = null;
    try {
        const gotData = JSON.parse(localStorage.getItem("profileSaveData"));
        profileData = {
            name: gotData.name,
            color: gotData.color,
        };
    } catch (e) {

    }
    localStorage.removeItem("profileSaveData");
    if (!profileData) {
        return;
    }
    autoLogIn(profileData);
}

function autoLogIn(profileData) {
    const nameInput = document.querySelector("#nickname-input");
    nameInput.value = profileData.name;
    const colorOptionToPick = document.querySelector(`.color-option-item[data-color="${profileData.color}"]`);
    colorOptionToPick.click();
    const registerButton = document.querySelector("#register-button");
    registerButton.click();
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
    store.currentFlights.push(flightData);
    // setting timer to delete data from array
    setTimeout(() => {
        store.currentFlights = store.currentFlights.filter((f) => f !== flightData);
    }, data.timeToReachInSec * 1000);
}

function handleCanvasClick(e) {
    const mouse = utils.oMousePos(canvas, e);
    const planetsData = store.lastGameState.map.planetArray;
    for (let planet of planetsData) {
        const clickHitCircle =
            Math.sqrt(
                Math.pow((mouse.x - planet.coords.x), 2) +
                Math.pow((mouse.y - planet.coords.y), 2)
            ) < planet.radius;
        if (clickHitCircle) {
            if (!store.selectedPlanetId && planet.owner?.id === store.playerId) {
                store.selectedPlanetId = planet.id;
                playAudio(sounds.PLANET_SELECT);
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
        const fleetOwner = store.lastGameState.players.find(p => p.id === flight.fleetOwner)
        const flightColor = fleetOwner.color;
        const now = new Date();
        const q = Math.abs(now - flight.startTime);
        const d = Math.abs(flight.endTime - flight.startTime);
        const percent = q / d;
        const fleetPos = utils.getPositionAlongTheLine(flight.x1, flight.y1, flight.x2, flight.y2, percent);
        drawUtils.drawCircle(fleetPos.x, fleetPos.y, flight.fleetRadius, flightColor, colors.transparent, 0);
        drawUtils.drawCircle(flight.x1, flight.y1, 1, colors.white, colors.transparent, 0);
        drawUtils.drawCircle(flight.x2, flight.y2, 1, colors.white, colors.transparent, 0);
    }
}

function playAudio(src) {
    const audioBox = document.querySelector(".audio-box");
    const newAudio = new Audio(src);
    newAudio.play();
}

function drawGameMapOnCanvas() {
    if (store.lastGameState) {

        drawUtils.drawBackground(colors.mapBackground);
        drawAllPlanets();
        drawAllFlights();
    }
    requestAnimationFrame(drawGameMapOnCanvas)
}
