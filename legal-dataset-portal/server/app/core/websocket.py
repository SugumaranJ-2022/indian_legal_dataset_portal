import asyncio
from typing import List
from fastapi import WebSocket

class ConnectionManager:
    """
    Manages active WebSocket connections and handles broadcasting messages.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        # We make a copy of connections list to prevent concurrency removal issues
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                # Remove dead connection
                if connection in self.active_connections:
                    self.active_connections.remove(connection)

manager = ConnectionManager()

def broadcast_sync(message: dict):
    """
    Broadcasting helper allowing synchronous endpoints to send JSON events
    to connected WebSockets through the running event loop.
    """
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    if loop.is_running():
        loop.create_task(manager.broadcast(message))
    else:
        loop.run_until_complete(manager.broadcast(message))
