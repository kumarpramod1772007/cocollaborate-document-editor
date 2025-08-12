const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

const Document = require("./models/Document");
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }
});

mongoose.connect("mongodb://localhost:27017/realtime-doc", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(cors());
app.use(express.json());

// Create or get document by ID
app.get("/documents/:id", async (req, res) => {
  const doc = await Document.findById(req.params.id);
  res.json(doc);
});

io.on("connection", socket => {
  socket.on("get-document", async documentId => {
    const document = await Document.findById(documentId) || await Document.create({ _id: documentId, data: "" });
    socket.join(documentId);
    socket.emit("load-document", document.data);

    socket.on("send-changes", delta => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async data => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

server.listen(3001, () => console.log("Server started on port 3001"));