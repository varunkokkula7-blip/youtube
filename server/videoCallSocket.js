const MAX_PARTICIPANTS = 6;

const rooms = new Map();

const createRoom = (roomId, socket, user) => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      hostId: socket.id,
      locked: false,
      participants: new Map(),
    });
  }

  const room = rooms.get(roomId);

  room.participants.set(socket.id, {
    socketId: socket.id,
    userId: user?.id || null,
    name: user?.name || "User",
    image: user?.image || null,
    mic: true,
    camera: true,
    speaking: false,
    handRaised: false,
    coHost: false,
    canShareScreen: true,
    canChat: true,
  });

  return room;
};

const getParticipants = (room) => {
  return Array.from(room.participants.values());
};

const emitRoomState = (io, roomId) => {
  const room = rooms.get(roomId);

  if (!room) return;

  io.to(roomId).emit("room-state", {
    hostId: room.hostId,
    locked: room.locked,
    participants: getParticipants(room),
  });
};

export const setupVideoCallSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Video socket connected:", socket.id);

    // ==========================================
    // JOIN ROOM
    // ==========================================

    socket.on("join-room", ({ roomId, user }) => {
      if (!roomId) return;

      let room = rooms.get(roomId);

      // Create room
      if (!room) {
        room = createRoom(roomId, socket, user);
      } else {
        // Check meeting lock
        if (room.locked) {
          socket.emit("join-denied", {
            reason: "This meeting is locked.",
          });

          return;
        }

        // Check maximum participants
        if (
          room.participants.size >=
          MAX_PARTICIPANTS
        ) {
          socket.emit("join-denied", {
            reason:
              "Maximum participant limit reached.",
          });

          return;
        }

        room.participants.set(socket.id, {
          socketId: socket.id,
          userId: user?.id || null,
          name: user?.name || "User",
          image: user?.image || null,
          mic: true,
          camera: true,
          speaking: false,
          handRaised: false,
          coHost: false,
          canShareScreen: true,
          canChat: true,
        });
      }

      socket.join(roomId);

      socket.data.roomId = roomId;

      const existingUsers =
        getParticipants(room).filter(
          (participant) =>
            participant.socketId !== socket.id
        );

      socket.emit("existing-users", existingUsers);

      socket.to(roomId).emit("user-joined", {
        participant:
          room.participants.get(socket.id),
      });

      emitRoomState(io, roomId);

      console.log(
        `${socket.id} joined room ${roomId}`
      );
    });

    // ==========================================
    // WEBRTC SIGNAL
    // ==========================================

    socket.on(
      "signal",
      ({ target, signal }) => {
        if (!target || !signal) return;

        io.to(target).emit("signal", {
          sender: socket.id,
          signal,
        });
      }
    );

    // ==========================================
    // MEDIA STATUS
    // ==========================================

    socket.on(
      "media-status",
      ({ roomId, mic, camera }) => {
        const room = rooms.get(roomId);

        if (!room) return;

        const participant =
          room.participants.get(socket.id);

        if (!participant) return;

        if (typeof mic === "boolean") {
          participant.mic = mic;
        }

        if (typeof camera === "boolean") {
          participant.camera = camera;
        }

        emitRoomState(io, roomId);
      }
    );

    // ==========================================
    // SPEAKING INDICATOR
    // ==========================================

    socket.on(
      "speaking-status",
      ({ roomId, speaking }) => {
        const room = rooms.get(roomId);

        if (!room) return;

        const participant =
          room.participants.get(socket.id);

        if (!participant) return;

        participant.speaking = !!speaking;

        io.to(roomId).emit(
          "participant-speaking",
          {
            socketId: socket.id,
            speaking: !!speaking,
          }
        );
      }
    );

    // ==========================================
    // RAISE HAND
    // ==========================================

    socket.on(
      "raise-hand",
      ({ roomId, raised }) => {
        const room = rooms.get(roomId);

        if (!room) return;

        const participant =
          room.participants.get(socket.id);

        if (!participant) return;

        participant.handRaised = !!raised;

        emitRoomState(io, roomId);
      }
    );

    // ==========================================
    // CHAT
    // ==========================================

    socket.on(
      "chat-message",
      ({ roomId, message }) => {
        const room = rooms.get(roomId);

        if (!room) return;

        const participant =
          room.participants.get(socket.id);

        if (!participant) return;

        if (!participant.canChat) {
          return;
        }

        io.to(roomId).emit("chat-message", {
          id:
            Date.now().toString() +
            Math.random(),
          socketId: socket.id,
          name: participant.name,
          message,
          timestamp: Date.now(),
        });
      }
    );

    // ==========================================
    // SCREEN SHARING STATUS
    // ==========================================

    socket.on(
      "screen-status",
      ({ roomId, sharing }) => {
        const room = rooms.get(roomId);

        if (!room) return;

        const participant =
          room.participants.get(socket.id);

        if (!participant) return;

        if (
          !participant.canShareScreen &&
          sharing
        ) {
          return;
        }

        io.to(roomId).emit(
          "screen-status",
          {
            socketId: socket.id,
            sharing: !!sharing,
          }
        );
      }
    );

    // ==========================================
    // HOST ACTION
    // ==========================================

    socket.on(
      "host-action",
      ({
        roomId,
        action,
        targetId,
        value,
      }) => {
        const room = rooms.get(roomId);

        if (!room) return;

        const requester =
          room.participants.get(socket.id);

        if (!requester) return;

        const isHost =
          room.hostId === socket.id;

        const isCoHost =
          requester.coHost === true;

        if (!isHost && !isCoHost) {
          return;
        }

        // --------------------------------------
        // MUTE PARTICIPANT
        // --------------------------------------

        if (action === "mute") {
          io.to(targetId).emit(
            "host-action",
            {
              action: "force-mute",
            }
          );
        }

        // --------------------------------------
        // REMOVE PARTICIPANT
        // --------------------------------------

        if (
          action === "remove" &&
          targetId !== room.hostId
        ) {
          io.to(targetId).emit(
            "host-action",
            {
              action: "removed",
            }
          );

          const targetSocket =
            io.sockets.sockets.get(
              targetId
            );

          if (targetSocket) {
            targetSocket.leave(roomId);
          }

          room.participants.delete(
            targetId
          );

          io.to(roomId).emit(
            "user-left",
            {
              socketId: targetId,
            }
          );

          emitRoomState(io, roomId);
        }

        // --------------------------------------
        // LOCK ROOM
        // --------------------------------------

        if (action === "lock") {
          room.locked = !!value;

          emitRoomState(io, roomId);
        }

        // --------------------------------------
        // CO-HOST
        // --------------------------------------

        if (
          action === "cohost" &&
          isHost
        ) {
          const target =
            room.participants.get(
              targetId
            );

          if (target) {
            target.coHost = !!value;
          }

          emitRoomState(io, roomId);
        }

        // --------------------------------------
        // SCREEN PERMISSION
        // --------------------------------------

        if (
          action === "screen-permission"
        ) {
          const target =
            room.participants.get(
              targetId
            );

          if (target) {
            target.canShareScreen =
              !!value;
          }

          io.to(targetId).emit(
            "permission-update",
            {
              canShareScreen: !!value,
            }
          );

          emitRoomState(io, roomId);
        }

        // --------------------------------------
        // CHAT PERMISSION
        // --------------------------------------

        if (
          action === "chat-permission"
        ) {
          const target =
            room.participants.get(
              targetId
            );

          if (target) {
            target.canChat = !!value;
          }

          io.to(targetId).emit(
            "permission-update",
            {
              canChat: !!value,
            }
          );

          emitRoomState(io, roomId);
        }
      }
    );

    // ==========================================
    // RECONNECT
    // ==========================================

    socket.on(
      "reconnect-room",
      ({ roomId, user }) => {
        if (!roomId) return;

        const room = rooms.get(roomId);

        if (!room) return;

        room.participants.set(
          socket.id,
          {
            socketId: socket.id,
            userId: user?.id || null,
            name: user?.name || "User",
            image: user?.image || null,
            mic: true,
            camera: true,
            speaking: false,
            handRaised: false,
            coHost: false,
            canShareScreen: true,
            canChat: true,
          }
        );

        socket.join(roomId);

        socket.data.roomId = roomId;

        socket.emit(
          "existing-users",
          getParticipants(room).filter(
            (p) =>
              p.socketId !== socket.id
          )
        );

        emitRoomState(io, roomId);
      }
    );

    // ==========================================
    // LEAVE ROOM
    // ==========================================

    socket.on(
      "leave-room",
      ({ roomId }) => {
        removeParticipant(
          io,
          socket,
          roomId
        );
      }
    );

    // ==========================================
    // DISCONNECT
    // ==========================================

    socket.on("disconnect", () => {
      const roomId =
        socket.data.roomId;

      if (roomId) {
        removeParticipant(
          io,
          socket,
          roomId
        );
      }

      console.log(
        "Video socket disconnected:",
        socket.id
      );
    });
  });
};

// ==========================================
// REMOVE PARTICIPANT
// ==========================================

function removeParticipant(
  io,
  socket,
  roomId
) {
  const room = rooms.get(roomId);

  if (!room) return;

  room.participants.delete(
    socket.id
  );

  socket.leave(roomId);

  io.to(roomId).emit(
    "user-left",
    {
      socketId: socket.id,
    }
  );

  // Assign new host if host leaves
  if (room.hostId === socket.id) {
    const firstParticipant =
      room.participants.values().next()
        .value;

    if (firstParticipant) {
      room.hostId =
        firstParticipant.socketId;
    }
  }

  if (room.participants.size === 0) {
    rooms.delete(roomId);
  } else {
    emitRoomState(io, roomId);
  }
}