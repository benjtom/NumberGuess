import express from 'express'
import { Server } from "socket.io"
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3500

const app = express()

app.use(express.static(path.join(__dirname, "public")))

const expressServer = app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})

// state 
const UsersState = {
    users: [],
    setUsers: function (newUsersArray) {
        this.users = newUsersArray
    }
}

const HostState = {
    host: null,
    setHost: function (newHost) {
        this.host = newHost
    }
}

const ResponseState = {
    responses: [],
    setResponses: function (newResponsesArray) {
        this.responses = newResponsesArray
    }
}

const io = new Server(expressServer, {
    cors: {
        origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5500", "http://127.0.0.1:5500"]
    }
})

io.on('connection', socket => {

    // Upon connection - only to user 
    // socket.emit('message', "Welcome to Chat App!")

    // Upon connection - to all others 
    // socket.broadcast.emit('message', `User ${socket.id.substring(0, 5)}} connected`)

    // When user disconnects - to all others 
    // socket.on('disconnect', () => {
    //     socket.broadcast.emit('message', `User ${socket.id.substring(0, 5)}} disconnected`)
    // })

    // Listening for a join event 
    socket.on('join', name => {
        console.log(`User ${socket.id}, ${name} joined the game`)

        activateUser(socket.id, name, "player")

        socket.join("player")

        io.emit('playerList', UsersState.users)
    })

    // Listening for the host to start the game (host's name is empty string)
    socket.on('host', hostname => {
        console.log(`User ${socket.id} started the game as host (empty name)`)

        activateHost(socket.id)

        socket.join("host")

        let numPlayers = UsersState.users.length
        let guesserId = Math.floor(Math.random() * numPlayers)
        console.log(`User ${UsersState.users[guesserId]["name"]}, id ${UsersState.users[guesserId]["id"]} chosen as guesser`)
        let newUsersArray = UsersState.users
        newUsersArray[guesserId]["role"] = "guesser"
        UsersState.setUsers(newUsersArray)

        let secretNumber = Math.floor(Math.random() * 11)

        io.emit('startGame', UsersState.users)
        io.to("player").emit('setSecretNumber', secretNumber)
    })

    socket.on('becomeGuesser', data => {
        socket.join("guesser")
    })

    socket.on('response', response => {
        let socketUserName = getUserName(socket.id, UsersState.users)
        console.log(`User ${socketUserName} responded with "${response}"`)

        activateResponse(socket.id, socketUserName, response)

        io.to("host").emit('responseList', ResponseState.responses)
    })
})


// User functions 
function activateUser(id, name, role) {
    const user = { id, name, role }
    UsersState.setUsers([
        ...UsersState.users.filter(user => user.id !== id),
        user
    ])
    return user
}

function activateResponse(id, name, response) {
    const responseObject = { id, name, response }
    ResponseState.setResponses([
        ...ResponseState.responses.filter(response => response.id !== id),
        responseObject
    ])
    return responseObject
}

function getUserName(id, users) {
    let name = ""
    for (let key of Object.keys(users)) {
        const userValues = Object.values(users[key]);

        if (id === userValues[0]) {
            name = userValues[1]
            break
        }
    }
    return name
}

function activateHost(id) {
    HostState.setHost(id)
}