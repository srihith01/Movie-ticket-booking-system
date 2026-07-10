Movie Ticket Booking System
A lightweight, clean, and highly interactive Movie Ticket Booking System built using HTML, CSS, JavaScript, and a C++ backend server using the Windows Winsock2 API.

Features
Featured Movie Name: Displays the movie details ("Avengers: Doomsday").
Seat Booking & Selection: Click available seats (green) to select them (violet). Book multiple seats at once.
Dynamic Pricing & Checkout: Live computation of total ticket price based on selected seats.
Payment & Booking Receipt: After confirmation, a beautiful receipt modal overlay appears showing details and a transaction reference ID.
Cancel Booking: Click on any booked seat (red) to cancel its booking instantly.
No Port Conflict: Runs on port 8085 to avoid conflicts with other local development processes.
Project Structure

movie_booking/
├── index.html     - Web UI Layout & structure
├── style.css      - Modern dark mode styles & transitions
├── script.js      - Dynamic rendering & API integration
├── server.cpp     - Lightweight C++ Winsock2 Web Server
└── README.md      - Guide & instructions (this file)
How to Compile and Run
To start the system, you compile and run the C++ server. It will host the webpage and act as the API backend:

### On Windows
1. **Open Terminal**: Open Command Prompt (cmd) or PowerShell, and navigate to this project folder.
2. **Compile the Server**: Compile the `server.cpp` code using `g++` (GCC) with the Windows Socket library (`-lws2_32`):
   ```cmd
   g++ server.cpp -o server.exe -lws2_32
   ```
3. **Start the Server**: Run the compiled executable:
   ```cmd
   .\server.exe
   ```

### On macOS / Linux
1. **Open Terminal**: Open the Terminal app, and navigate to this project folder.
2. **Compile the Server**: Compile the `server.cpp` code using `g++` or `clang++` (no socket libraries need to be linked explicitly):
   ```bash
   g++ -std=c++11 server.cpp -o server
   ```
3. **Start the Server**: Run the compiled executable:
   ```bash
   ./server
   ```

### Step 4: Access in Browser
Once the server says "Server successfully started", open your browser and navigate to: 👉 http://localhost:8085 (or http://127.0.0.1:8085)

Note: The backend maintains the seating states in memory while running. If you restart the server, the seat layouts will reset.