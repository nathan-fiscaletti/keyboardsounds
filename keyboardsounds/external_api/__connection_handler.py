import socket
import base64
import json

from typing import Callable


class _ConnectionHandler:
    def __init__(self, conn: socket.socket, on_command: Callable[[dict], None]) -> None:
        self.__connection = conn
        self.__continue = True
        self.__on_command = on_command

    def stop(self):
        self.__continue = False
        self.__connection.close()

    def handle_connection(self):
        """
        Handles an incoming connection to the external API.

        This function reads the incoming data from the connection and processes it
        based on the command received.

        Parameters:
        - conn: The socket connection object to the client.

        Returns:
        - None
        """
        remote_port = self.__connection.getpeername()[1]
        with self.__connection.makefile("r") as f:
            # I want this to only loop while the connection is open
            while self.__continue:
                data = f.readline()
                if data is None or len(data) == 0:
                    print(f"({remote_port}) Connection closed")
                    return

                # Decode from base-64
                decoded = None
                try:
                    decoded = base64.b64decode(data.strip(), validate=True)
                except base64.binascii.Error:
                    print(f"({remote_port}) Failed to decode base64 data")
                    continue

                if decoded is None:
                    print(f"({remote_port}) Invalid base64 data")
                    continue

                # Parse the decoded data as JSON
                try:
                    command = json.loads(decoded)
                except json.JSONDecodeError:
                    print(f"({remote_port}) Failed to parse JSON")
                    continue

                print(f"({remote_port}) {command}")
                self.__on_command(command)
