const socket = io('ws://localhost:3500')

const playerName = document.querySelector('#player-name')
const usersList = document.querySelector('.user-list')
const lobbyScreen = document.querySelector('#lobby-screen')

const response = document.querySelector('#response')
const respondedUsersList = document.querySelector('.responded-user-list')

function joinLobby(e) {
    e.preventDefault()
    if (playerName.value) {
        socket.emit('join', playerName.value)
        document.getElementById("host-form").remove()
        document.getElementById("player-form").remove()

        const msg = document.createElement('p')
        msg.textContent = "Waiting for game to start..."
        lobbyScreen.appendChild(msg)
    }
}

function hostGame(e) {
    e.preventDefault()
    socket.emit('host', '')
}

function submitResponse(e) {
    e.preventDefault()
    if (response.value) {
        socket.emit('response', response.value)
        document.getElementById("response-form").style.display = "none"
    }
}

document.querySelector('#host-form').addEventListener('submit', hostGame)
document.querySelector('#player-form').addEventListener('submit', joinLobby)

document.querySelector('#response-form').addEventListener('submit', submitResponse)

// Listen for player list update 
socket.on("playerList", (users) => {
    showUsers(users)
})

socket.on("responseList", (responses) => {
    showRespondedUsers(responses)
})

// Listen for game start
socket.on("startGame", (users) => {
    let isPlayer = false
    for (let key of Object.keys(users)) {
        const userValues = Object.values(users[key]);

        if (socket.id === userValues[0]) {
            isPlayer = true
            if (userValues[2] === "player") {
                loadPlayerScreen()
            }
            else if (userValues[2] === "guesser") {
                socket.emit('becomeGuesser', '')
                loadGuesserScreen()
            }
            break
        }
    }
    if (!isPlayer){
        loadHostScreen()
    }
})

socket.on("setSecretNumber", number => {
    document.getElementById("secret-number").innerHTML = `${number}`
})

function showUsers(users) {
    usersList.textContent = ''
    if (users) {
        usersList.innerHTML = `<em>Connected Players:</em>`
        users.forEach((user, i) => {
            usersList.textContent += ` ${user.name}`
            if (users.length > 1 && i !== users.length - 1) {
                usersList.textContent += ","
            }
        })
    }
}

function showRespondedUsers(responses) {
    respondedUsersList.textContent = ''
    if (responses) {
        respondedUsersList.innerHTML = `<em></em>`
        responses.forEach((response, i) => {
            respondedUsersList.textContent += ` ${response.name}`
            if (responses.length > 1 && i !== responses.length - 1) {
                respondedUsersList.textContent += ","
            }
        })
    }
}

function loadPlayerScreen() {
    document.getElementById("lobby-screen").style.display = "none"

    document.getElementById("player-screen").style.display = "block"
    document.getElementById("response-form").style.display = "block"
}

function loadGuesserScreen() {
    document.getElementById("lobby-screen").style.display = "none"

    document.getElementById("guesser-screen").style.display = "block"
}

function loadHostScreen() {
    document.getElementById("lobby-screen").style.display = "none"

    document.getElementById("host-screen").style.display = "block"
}
