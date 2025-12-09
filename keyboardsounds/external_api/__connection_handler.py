import socket
import base64
import json

from typing import Callable, Optional


class _ConnectionHandler:
    def __init__(self, conn: socket.socket, on_command: Callable[[dict], Optional[dict]]) -> None:
        self.__connection = conn
        self.__continue = True
        self.__on_command = on_command

    def stop(self):
        self.__continue = False
        self.__connection.close()

    def _send_response(self, response: dict):
        """Send a response back to the client."""
        try:
            response_json = json.dumps(response)
            response_b64 = base64.b64encode(response_json.encode('utf-8')).decode('utf-8')
            # Send response directly via socket (not through makefile)
            self.__connection.sendall((response_b64 + "\n").encode('utf-8'))
        except Exception as e:
            print(f"Failed to send response: {e}")

    def handle_connection(self):
        """
        Handles an incoming connection to the external API.

        This function reads the incoming data from the connection and processes it
        based on the command received. Supports both fire-and-forget commands and
        request/response commands.

        Parameters:
        - conn: The socket connection object to the client.

        Returns:
        - None
        """
        remote_port = self.__connection.getpeername()[1]
        print(f"new external api connection ::{remote_port}")
        # Use read-only makefile for reading requests
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
                
                # Check if this is a request that expects a response
                request_id = command.get("id")
                response_expected = request_id is not None
                
                # Call the command handler
                response = self.__on_command(command)
                
                # If a response is expected, send it back
                if response_expected and response is not None:
                    response["id"] = request_id
                    self._send_response(response)
                elif response_expected:
                    # Send error response if no response was provided
                    error_response = {
                        "id": request_id,
                        "error": "Command did not return a response"
                    }
                    self._send_response(error_response)
