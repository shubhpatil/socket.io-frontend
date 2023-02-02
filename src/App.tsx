import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { IAcknowledgement } from "./types/socket";

// Initialize Socket.IO
const socket = io("http://localhost:5000/", {
  reconnectionDelayMax: 5000,
  // auth: {
  //   token: "123",
  // },
  query: {
    "my-key": "my-value",
  },
});

function App() {
  const [socketId, setSocketId] = useState<string>("");
  const [clientMessage, setClientMessage] = useState<string>("");
  const [serverMessage, setServerMessage] = useState<string>("");
  const [roomName, setRoomName] = useState<string>("");
  const [messageQueue, setMessageQueue] = useState<string[]>([]);

  useEffect(() => {
    // On Connection
    socket.on("connect", () => setSocketId(socket.id));

    // Connection Error
    socket.on("connect_error", () => {
      setTimeout(() => socket.connect(), 5000);
    });

    // Disconnect
    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        // the disconnection was initiated by the server, you need to reconnect manually
        socket.connect();
      }
      // else the socket will automatically try to reconnect
    });

    // Message Event
    socket.on("message", (msg: string) => {
      console.log("Message from Server: ", msg);
      setServerMessage(msg);
    });

    // Clean up
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    setMessageQueue([...messageQueue, serverMessage]);
  }, [serverMessage]);

  const _sendMessage = () => {
    if (clientMessage) {
      socket.emit("broadcast", `${socketId}: ${clientMessage}`);
      setClientMessage("");
    }
  };

  const _joinRoom = () => {
    if (roomName) {
      socket.emit("joinRoom", roomName, (response: IAcknowledgement) => {
        alert(`${response.status} - ${response.message}`);
      });
    }
  };

  const _sendMessageToRoom = () => {
    if (clientMessage && roomName) {
      socket.emit("privateMessage", { room: roomName, message: clientMessage });
    }
  };

  return (
    <div>
      <h1>Socket.io - {socketId}</h1>
      <input
        type="text"
        placeholder="Messsage"
        value={clientMessage}
        onChange={(e) => setClientMessage(e.target.value)}
      />
      <button onClick={_sendMessageToRoom}>SEND</button>
      <br />
      <input
        type="text"
        placeholder="Room name"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
      />
      <button onClick={_joinRoom}>JOIN ROOM</button>
      {messageQueue.map((msg, index) => (
        <p key={index}>{msg}</p>
      ))}
    </div>
  );
}

export default App;
