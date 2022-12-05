const WebSocket = require("ws");
const fs = require("fs");

const tasks = [];

readDirectory("./data").then(async () => {
  for (let i = 0; i < tasks.length; i++) {
    console.log(`Sending task ${i + 1} of ${tasks.length}`);
    console.log(JSON.parse(tasks[i]));
    const ws = new WebSocket("ws://localhost:8901");
    ws.on("open", async () => {
        ws.send(tasks[i]);
    });
  }
});

function addTask(path) {
  console.log(`Adding send file ${path}`);
  const data = fs.readFileSync(path)?.toString();
  const message = JSON.stringify({
    date: new Date().toISOString(),
    path,
    data,
  });
  tasks.push(message);
}

function readDirectory(path) {
  return new Promise((resolve, reject) => {
    console.log(`Reading directory ${path}`);
    const files = fs.readdirSync(path);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (fs.lstatSync(`${path}/${file}`).isDirectory()) {
        readDirectory(`${path}/${file}`);
        continue;
      }
      addTask(`${path}/${file}`);
    }
    resolve();
  });
}

async function send(socket, message) {
  while (true) {
    console.log(socket.readyState);
    try {
      if (socket.readyState === 0) {
        socket.send(message);
        break;
      }
    } catch (e) {
      console.log(e);
      return true;
    }
    console.log("Waiting for socket to be ready");
  }
  return false;
}