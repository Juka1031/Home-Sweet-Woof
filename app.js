const express = require("express");
const app = express();
const mongoose = require("mongoose");
const db = require("./config/keys").mongoURI;
const passport = require("passport");
const path = require("path");
const users = require("./routes/api/users");
const User = require("./models/User");
const dogs = require("./routes/api/dogs");
const bodyParser = require("body-parser");
const cors = require('cors')


const server = require("http").createServer(app);
const io = require("socket.io")(server, { cors: { origin: "*" } });
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./server_socketio/users_util");

if (process.env.NODE_ENV === "production") {
  app.use(express.static("frontend/build"));
  app.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"));
  });
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors())

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true })
  .then(() => console.log("Connected to MongoDB successfully"))
  .catch((err) => console.log(err));

app.use(passport.initialize());
require("./config/passport")(passport);

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

const port = process.env.PORT || 5000;
// app.listen(port, () => console.log(`Server is running on port ${port}`));
server.listen(port, () => {
  console.log(`Server is running on ${port}`);
});

app.use("/api/users", users);
app.use("/api/dogs", dogs);

io.on("connection", (socket) => {
  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });
    if (error) return callback("error");

    socket.emit("message", {
      user: "admin",
      text: `${user.name}, welcome to the doghouse`,
    }); // send message to user

    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name}, has joined!` }); // send message to everyone in the room

    socket.join(user.room); // add user to the room

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", { user: user.name, text: message }); // listens for message from user and sends message to room??

    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if(user) {
      io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
  }});
});
