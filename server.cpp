#include <iostream>
#include <string>
#include <sstream>
#include <fstream>

#ifdef _WIN32
    #include <winsock2.h>
    #pragma comment(lib, "ws2_32.lib")
    inline int getSocketError() { return WSAGetLastError(); }
#else
    #include <sys/socket.h>
    #include <netinet/in.h>
    #include <unistd.h>
    #include <arpa/inet.h>
    #include <cerrno>
    typedef int SOCKET;
    const int INVALID_SOCKET = -1;
    const int SOCKET_ERROR = -1;
    inline int closesocket(SOCKET s) { return close(s); }
    inline int getSocketError() { return errno; }
#endif
using namespace std;
const int PORT = 8085;
const int NUM_SEATS = 24; // 4 rows of 6 seats
bool seats[NUM_SEATS] = {false};
string readFile(const string& fileName) {
    ifstream file(fileName, ios::binary);
    if (!file.is_open()) return "";
    stringstream ss;
    ss << file.rdbuf();
    return ss.str();
}
void sendResponse(SOCKET clientSocket, const string& status, const string& contentType, const string& body) {
    string response = "HTTP/1.1 " + status + "\r\n"
                      "Content-Type: " + contentType + "\r\n"
                      "Content-Length: " + to_string(body.length()) + "\r\n"
                      "Access-Control-Allow-Origin: *\r\n"
                      "Connection: close\r\n\r\n" + body;
    send(clientSocket, response.c_str(), response.length(), 0);
}
void handleClient(SOCKET clientSocket) {
    char buffer[4096] = {0};
    int bytesRead = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
    if (bytesRead <= 0) return;
    string request(buffer);
    stringstream ss(request);
    string method, path;
    ss >> method >> path;
    cout << "Req: " << method << " " << path << endl;
    if (method == "GET") {
        if (path == "/" || path == "/index.html") {
            sendResponse(clientSocket, "200 OK", "text/html; charset=utf-8", readFile("index.html"));
        } else if (path == "/style.css") {
            sendResponse(clientSocket, "200 OK", "text/css; charset=utf-8", readFile("style.css"));
        } else if (path == "/script.js") {
            sendResponse(clientSocket, "200 OK", "application/javascript; charset=utf-8", readFile("script.js"));
        } else if (path == "/api/seats") {
            string json = "[";
            for (int i = 0; i < NUM_SEATS; ++i) {
                json += (seats[i] ? "true" : "false");
                if (i < NUM_SEATS - 1) json += ",";
            }
            json += "]";
            sendResponse(clientSocket, "200 OK", "application/json", json);
        } else if (path.find("/api/book") == 0) {
            size_t pos = path.find("seat=");
            if (pos != string::npos) {
                int seatIdx = stoi(path.substr(pos + 5));
                if (seatIdx >= 0 && seatIdx < NUM_SEATS) {
                    if (!seats[seatIdx]) {
                        seats[seatIdx] = true;
                        sendResponse(clientSocket, "200 OK", "application/json", "{\"success\":true}");
                    } else {
                        sendResponse(clientSocket, "400 Bad Request", "application/json", "{\"success\":false,\"message\":\"Seat already booked\"}");
                    }
                } else {
                    sendResponse(clientSocket, "400 Bad Request", "application/json", "{\"success\":false,\"message\":\"Invalid seat number\"}");
                }
            } else {
                sendResponse(clientSocket, "400 Bad Request", "application/json", "{\"success\":false,\"message\":\"Missing seat parameter\"}");
            }
        } else if (path.find("/api/cancel") == 0) {
            size_t pos = path.find("seat=");
            if (pos != string::npos) {
                int seatIdx = stoi(path.substr(pos + 5));
                if (seatIdx >= 0 && seatIdx < NUM_SEATS) {
                    if (seats[seatIdx]) {
                        seats[seatIdx] = false;
                        sendResponse(clientSocket, "200 OK", "application/json", "{\"success\":true}");
                    } else {
                        sendResponse(clientSocket, "400 Bad Request", "application/json", "{\"success\":false,\"message\":\"Seat is not booked\"}");
                    }
                } else {
                    sendResponse(clientSocket, "400 Bad Request", "application/json", "{\"success\":false,\"message\":\"Invalid seat number\"}");
                }
            } else {
                sendResponse(clientSocket, "400 Bad Request", "application/json", "{\"success\":false,\"message\":\"Missing seat parameter\"}");
            }
        } else {
            sendResponse(clientSocket, "404 Not Found", "text/plain", "Not Found");
        }
    }
}
int main() {
#ifdef _WIN32
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        cerr << "WSAStartup failed." << endl;
        return 1;
    }
#endif
    SOCKET serverSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (serverSocket == INVALID_SOCKET) {
        cerr << "Socket creation failed: " << getSocketError() << endl;
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }
    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = INADDR_ANY;
    serverAddr.sin_port = htons(PORT);
    if (::bind(serverSocket, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        cerr << "Bind failed: " << getSocketError() << endl;
        closesocket(serverSocket);
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }
    if (listen(serverSocket, SOMAXCONN) == SOCKET_ERROR) {
        cerr << "Listen failed: " << getSocketError() << endl;
        closesocket(serverSocket);
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }
    cout << "==========================================" << endl;
    cout << "  Movie Ticket Booking System Backend  " << endl;
    cout << "==========================================" << endl;
    cout << "Server successfully started." << endl;
    cout << "Open browser at: http://localhost:" << PORT << endl;
    cout << "Press Ctrl+C in terminal to stop." << endl;
    cout << "------------------------------------------" << endl;
    while (true) {
        SOCKET clientSocket = accept(serverSocket, NULL, NULL);
        if (clientSocket != INVALID_SOCKET) {
            handleClient(clientSocket);
            closesocket(clientSocket);
        }
    }
    closesocket(serverSocket);
#ifdef _WIN32
    WSACleanup();
#endif
    return 0;
}