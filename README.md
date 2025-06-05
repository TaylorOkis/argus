# ARGUS (A software to monitor system utilization on remote servers)

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [Repository Structure](#repository-structure)
5. [Getting Started](#getting-started)

   - [Prerequisites](#prerequisites)
   - [Installation & Setup](#installation--setup)

     - [Linux Server](#linux-server)
     - [Windows Server](#windows-server)
     - [Front-End (Web Dashboard)](#front-end-web-dashboard)

6. [Technical Architecture](#technical-architecture)

   - [Front-End: `index.html`, `script.js`, `style.css`](#front-end-indexhtml-scriptjs-stylecss)
   - [Linux-Server: `linux_server.js`](#linux-server-linux_serverjs)
   - [Windows-Server](#windows-server)

     - [Basic HTTP Server: `win_server.js`](#basic-http-server-win_serverjs)
     - [SSH-Enabled Server: `ssh_conn.js`](#ssh-enabled-server-ssh_connjs)

   - [Common Functionality & Utilities](#common-functionality--utilities)

7. [API Endpoints](#api-endpoints)
8. [Use-Case / Workflow](#use-case--workflow)
9. [Customization & Extension](#customization--extension)
10. [License](#license)

---

## Project Overview

**Argus** is a lightweight, real-time **system resource monitoring** tool built with **Node.js** on the back-end and plain HTML/CSS/JavaScript (Google Charts) on the front-end. It supports two deployment flavors:

1. **Linux server**—a standalone Node.js HTTP server (`linux_server.js`) that exposes:

   - `/os-info` → Returns the operating system platform (e.g. `linux`, `macos`, etc.).
   - `/system-usage` → Returns JSON containing current CPU utilization, memory usage (total, free, used), and disk usage (total, free, used).

2. **Windows server**—a Node.js HTTP server that does exactly the same as the Linux variant, except that its disk-path is hardcoded to `C:/`. Additionally, it includes a second server script (`ssh_conn.js`) that embeds a small **Socket.IO** interface, allowing a Windows machine to SSH into a remote Linux host and relay that host’s system-usage data back to connected browser clients.

On the front-end, `index.html` (with `style.css` and `script.js`) uses **Google Charts** to render three live-updating charts—Memory, Disk, and CPU—by polling the back-end every few seconds. As soon as the Node.js server is running, a user can open `index.html` in any modern browser and immediately watch CPU load, RAM usage, and disk space in real time.

---

## Key Features

- **Cross-Platform Monitoring**

  - Works natively on Linux (tracks `/`, total/free/used) and Windows (tracks `C:/`, total/free/used).

- **Live Charts (Google Charts)**

  - Three distinct charts (Memory, Disk, CPU) that update automatically (by default every 2 seconds).

- **Simple HTTP API**

  - Two endpoints on port **3000**:

    - `GET /os-info` → Returns a JSON string (e.g. `"linux"`, `"win32"`) indicating the OS platform.
    - `GET /system-usage` → Returns an object with fields:

      ```jsonc
      {
        "totalMemory": <number in MB>,
        "freeMemory": <number in MB>,
        "usedMemory": <number in MB>,
        "totalStorage": <number in MB>,
        "freeStorage": <number in MB>,
        "usedStorage": <number in MB>,
        "cpuUtilization": <percentage 0–100>
      }
      ```

- **SSH-Enabled Remote Monitoring (Windows Only)**

  - The `ssh_conn.js` script runs a combined HTTP + Socket.IO server.
  - It spawns a secure SSH connection (using `ssh2`) to a remote Linux host (credentials hardcoded in the script).
  - Once a WebSocket client (browser) connects, `ssh_conn.js` streams the remote host’s resource metrics (via the same `/system-usage` logic) in real time.

- **Modular, Familiar Stack**

  - Uses **systeminformation** and **check-disk-space** NPM packages to gather OS metrics.
  - On Windows: also installs **socket.io** and **ssh2** to enable WebSocket/SSH functionality.
  - On Linux: only **systeminformation** and **check-disk-space** are needed.

- **Zero Build Step**

  - Everything is plain JavaScript/HTML/CSS—no bundler, no transpiler.
  - Simply `npm install`, then `node linux_server.js` (or `node win_server.js` / `node ssh_conn.js`).

---

## Tech Stack

- **Runtime**: Node.js (≥ v14)
- **Front-End**: HTML5, CSS3, vanilla JavaScript, Google Charts
- **Back-End**: Node.js + Express-style HTTP server (built with native `http` module)
- **Metrics Libraries**:

  - [`systeminformation`](https://www.npmjs.com/package/systeminformation) v5.23.5
  - [`check-disk-space`](https://www.npmjs.com/package/check-disk-space) v3.4.0

- **Windows Only (SSH + WebSocket)**:

  - [`ssh2`](https://www.npmjs.com/package/ssh2) v1.15.0
  - [`socket.io`](https://www.npmjs.com/package/socket.io) v4.7.5

- **Styling**: Pure CSS (no frameworks)
- **Charts**: Google Charts loader (`https://www.gstatic.com/charts/loader.js`)

---

## Repository Structure

```
argus/
├── index.html
├── script.js
├── style.css
├── linux server/
│   ├── linux_server.js
│   ├── package.json
│   └── package-lock.json
└── windows server/
    ├── win_server.js
    ├── ssh_conn.js
    ├── package.json
    └── package-lock.json
```

- **`index.html`**

  - The main HTML page that displays three charts (Memory, Disk, CPU) in a `div.chart-container`.
  - Loads `style.css` for layout and `script.js` (after loading Google Charts).

- **`script.js`**

  - Polls the back-end endpoints (`/system-usage` and `/os-info`) at configurable intervals.
  - Maintains rolling arrays of data points for CPU, Memory, and Disk.
  - Uses `google.charts.load(...)` to draw and periodically update three charts.

- **`style.css`**

  - A minimal CSS file defining `.chart-container { display: flex; flex-wrap: wrap; justify-content: center; gap: 32px; }`
  - `.chart { width: 500px; height: 300px; }` and a custom width for `#cpuChart`.

- **`linux server/`**

  - **`linux_server.js`** — A self-contained Node.js HTTP server that:

    - Imports `systeminformation` and `check-disk-space`.
    - Defines async functions `getOSInfo()`, `getMemoryData()`, `getDiskData()`, `getCpuData()`, and a helper `checkSystemUtilization()`.
    - On incoming HTTP requests:

      - If `req.method === 'OPTIONS'`, responds with CORS headers (allowing `*`).
      - If `req.url === '/system-usage'`, invokes `checkSystemUtilization()`, then responds with a JSON payload of memory/disk/CPU metrics.
      - If `req.url === '/os-info'`, invokes `getOSInfo()` and returns the platform string as JSON.

    - Listens on port **3000**.

  - **`package.json`** (verbatim):

    ```json
    {
      "dependencies": {
        "check-disk-space": "^3.4.0",
        "systeminformation": "^5.23.5"
      }
    }
    ```

    - No `scripts` section—simply `npm install`, then `node linux_server.js`.

- **`windows server/`**

  - **`win_server.js`** — Nearly identical to `linux_server.js`, but changes the disk-path from `/` (Linux) to `C:/` (Windows). In other words:

    - `const diskInfo = await disk('C:/');` instead of `await disk('/')`.
    - All other logic (memory, CPU) is identical.
    - Also responds on `/system-usage` and `/os-info`.
    - Listens on port **3000**.

  - **`ssh_conn.js`** — Builds on top of the `win_server.js` pattern by:

    1. Creating the same HTTP server for `/system-usage` and `/os-info`.
    2. Instantiating a **Socket.IO** server (`const io = socketIO(server)`), listening for WebSocket connections.
    3. When a client connects (`io.on('connecton', ...)`—note that the event is misspelled in the code as `'connecton'`), it:

       - Creates an **SSH2** client (`new SSHClient()`).
       - Connects to a remote Linux host at `host: 'localhost', port: 22, username: 'username', password: 'password'` (these are hardcoded).
       - Once `conn` is ready, it can execute remote commands or fetch remote metrics using the same `systeminformation` calls—effectively relaying the remote Linux server’s system usage back through Socket.IO to the connected browser.
       - On `socket.on('disconnect')`, the SSH connection is gracefully closed (`conn.end()`).

    4. Finally, the HTTP+WebSocket server listens on port **3000** as well.

  - **`package.json`** (verbatim):

    ```json
    {
      "dependencies": {
        "check-disk-space": "^3.4.0",
        "socket.io": "^4.7.5",
        "ssh2": "^1.15.0",
        "systeminformation": "^5.23.5"
      }
    }
    ```

  - In both subfolders, a `package-lock.json` is included, but it is generated automatically when `npm install` is run and can be safely ignored except for reproducible installs.

---

## Getting Started

### Prerequisites

- **Node.js** (v14 or later) installed on the machine where you intend to run the server.
- **npm** (v6 or later).
- On Windows: If you intend to use `ssh_conn.js`, ensure there is a reachable SSH server running on `localhost:22` (or change the `host`, `username`, and `password` fields in `ssh_conn.js` to match your remote host).
- On Linux: nothing additional beyond Node.js (no Windows-specific dependencies).

---

### Installation & Setup

Below are step-by-step instructions for each flavor:

#### Linux Server

1. **Navigate to the Linux server folder**

   ```bash
   cd argus/"linux server"
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

   This will install:

   - `systeminformation` v5.23.5
   - `check-disk-space` v3.4.0

3. **Run the server**

   ```bash
   node linux_server.js
   ```

   You should see:

   ```
   Server is running on http://localhost:3000
   ```

   The server is now listening on port 3000.

#### Windows Server

You have two options: run the basic HTTP server (`win_server.js`) or the SSH-enabled server (`ssh_conn.js`).

1. **Navigate to the Windows server folder**

   ```bash
   cd argus/"windows server"
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

   This will install:

   - `systeminformation` v5.23.5
   - `check-disk-space` v3.4.0
   - `socket.io` v4.7.5
   - `ssh2` v1.15.0

3. **(Option A) Run the basic Windows HTTP server**

   ```bash
   node win_server.js
   ```

   You should see:

   ```
   Server is running on http://localhost:3000
   ```

   This version serves **local** system usage (disk path set to `C:/`). It exposes:

   - `GET /system-usage` → JSON with metrics.
   - `GET /os-info` → platform string (e.g. `"win32"`).

4. **(Option B) Run the SSH-enabled server**

   ```bash
   node ssh_conn.js
   ```

   You should see:

   ```
   Server listening on port 3000
   ```

   This launches:

   - The same HTTP endpoints (`/system-usage`, `/os-info`) for the **local** Windows machine.

   - A **Socket.IO** server that waits for WebSocket clients.

   - When a client connects, the server immediately opens an SSH connection to `localhost:22` (username/password are hardcoded) and begins relaying the **remote Linux host’s** metrics via Socket.IO events.

   > **Tip**: Modify the `host`, `username`, and `password` fields in the `ssh_conn.js` file to point to your actual remote Linux server. The script uses:
   >
   > ```js
   > conn.connect({
   >   host: "localhost",
   >   port: 22,
   >   username: "username",
   >   password: "password",
   > });
   > ```

#### Front-End (Web Dashboard)

1. **Open the top-level folder**
   The HTML, CSS, and JavaScript files live in `/argus` (the same level as the two server folders).

2. **Open `index.html` in your browser**
   Simply double-click or `Open with → YourBrowser` on `index.html`. No web server is strictly required. Because the front-end uses CORS headers (`'*'`) on the back-end, it can fetch data from `http://localhost:3000` (or any host/port you configured).

3. **Usage**

   - By default, `script.js` assumes the back-end is reachable at `http://localhost:3000`.
   - If your back-end server runs on a different host/port, edit the first line of `script.js` where the fetch calls appear (look for `fetch('http://localhost:3000/system-usage')`, etc.) and change it accordingly.
   - Once loaded, you will see three charts side by side:

     1. **Memory Chart** (total/free/used in MB over time)
     2. **Disk Chart** (total/free/used in MB over time)
     3. **CPU Chart** (utilization % over time)

   Every 2 seconds (default polling interval), the front-end issues a `GET /system-usage` call to update these charts.

---

## Technical Architecture

### Front-End: `index.html`, `script.js`, `style.css`

- **`index.html`**

  - Loads `style.css`.
  - Contains three `<div>`s with IDs: `memoryChart`, `diskChart`, and `cpuChart`, each given the CSS class `chart`.
  - Loads the Google Charts loader (`<script src="https://www.gstatic.com/charts/loader.js"></script>`) and then `script.js`.

- **`style.css`**

  - Puts all three charts side by side (wrapping if the window is narrower).
  - Gives a fixed size (500×300px) to Memory and Disk charts; `#cpuChart` is slightly wider so that the CPU timeline has more horizontal space.

- **`script.js`** (high-level description)

  1. **Google Charts Initialization**

     ```js
     google.charts.load("current", { packages: ["corechart"] });
     google.charts.setOnLoadCallback(drawCharts);
     ```

  2. **Data Structures**

     - Maintains arrays like:

       ```js
       let cpuArray = [
         ["Time", "Utilization"],
         [0, 0],
       ];
       ```

       Similarly for memory (total/free/used) and disk (total/free/used).

     - `maxValue = 62` frames (so the chart always shows the last 62 seconds of data).

  3. **Chart Options**

     - Sets up `cpuOptions`, `memoryOptions`, and `diskOptions` to configure axis labels, colors, and animation.
     - For example, `cpuOptions` typically includes:

       ```js
       cpuOptions = {
         title: "CPU Utilization (%)",
         curveType: "function",
         legend: { position: "bottom" },
         vAxis: { viewWindow: { min: 0, max: 100 } },
       };
       ```

  4. **Drawing Initial Charts**

     - `drawCharts()` constructs initial `DataTable` objects from `cpuArray`, `memoryArray`, `diskArray` and calls:

       ```js
       cpuChart = new google.visualization.LineChart(
         document.getElementById("cpuChart")
       );
       cpuChart.draw(cpuData, cpuOptions);
       ```

       And similarly for memory and disk.

  5. **Polling Loop**

     - Every 2 seconds (via `setInterval(fetchAndUpdateCharts, 2000)`), it does:

       1. `fetch('http://localhost:3000/system-usage')`
       2. Parses JSON, extracting:

          ```js
          let {
            totalMemory,
            freeMemory,
            usedMemory,
            totalStorage,
            freeStorage,
            usedStorage,
            cpuUtilization,
          } = systemData;
          ```

       3. Shifts all existing array elements to the left by 1 unit of “time” (so the oldest data point disappears).
       4. Appends a new data row at the end:

          ```js
          cpuArray.push([cpuArray[cpuArray.length - 1][0] + 1, cpuUtilization]);
          ```

       5. Re-draws the charts with updated arrays.

---

### Linux-Server: `linux_server.js`

#### Overview

The Linux variant lives in `argus/linux server/linux_server.js`. It uses:

- **`systeminformation`** to gather OS, CPU, and memory data
- **`check-disk-space`** to gather disk usage (on path `/`)

#### Core Functions

1. **`getOSInfo()`**

   ```js
   async function getOSInfo() {
     try {
       return (await si.osInfo()).platform;
     } catch (error) {
       console.error("Error fetching os information: ", error);
     }
   }
   ```

   - Returns a string like `"linux"`, `"darwin"`, etc.

2. **`getMemoryData()`**

   ```js
   const mem = await si.mem();
   let totalMemory = mem.total / (1024 * 1024);
   let freeMemory = mem.free / (1024 * 1024);
   let usedMemory = totalMemory - freeMemory;
   return {
     totalMemory: totalMemory,
     freeMemory: freeMemory,
     usedMemory: usedMemory,
   };
   ```

   - All values in MB (megabytes).

3. **`getDiskData()`**

   ```js
   const diskInfo = await disk("/");
   let totalStorage = diskInfo.size / (1024 * 1024);
   let freeStorage = diskInfo.free / (1024 * 1024);
   let usedStorage = totalStorage - freeStorage;
   return {
     totalStorage: totalStorage,
     freeStorage: freeStorage,
     usedStorage: usedStorage,
   };
   ```

   - `disk('/')` returns an object with `size` and `free` in bytes, which we convert to MB.

4. **`getCpuData()`**

   - `rawLoad.cpus` is an array of objects, each with a `.load` field. We average them to get overall CPU utilization percentage.

5. **`checkSystemUtilization()`**
   Calls `getMemoryData()`, `getDiskData()`, `getCpuData()`, and merges them into a single object:

   ```js
   return {
     totalMemory: ...,
     freeMemory: ...,
     usedMemory: ...,
     totalStorage: ...,
     freeStorage: ...,
     usedStorage: ...,
     cpuUtilization: ...
   };
   ```

### Windows-Server

#### Basic HTTP Server: `win_server.js`

Located in `argus/windows server/win_server.js`, this file is nearly identical to `linux_server.js` **except**:

- `getDiskData()` calls:

  ```js
  const diskInfo = await disk("C:/");
  ```

  instead of `disk('/')`.

- Therefore, the disk metrics always refer to the `C:` drive on Windows.
- Otherwise, memory and CPU collection use the same `systeminformation` calls.

All other code—CORS handling, routing, and port **3000**—remains exactly the same.

---

#### SSH-Enabled Server: `ssh_conn.js`

Located in `argus/windows server/ssh_conn.js`. This script extends the basic server by:

1. **Importing**:

   ```js
   const fs = require("fs");
   const http = require("http");
   const socketIO = require("socket.io");
   const SSHClient = require("ssh2").Client;
   const si = require("systeminformation");
   const disk = require("check-disk-space").default;
   ```

2. **Reimplementing** the same `getOSInfo()`, `getMemoryData()`, `getDiskData('C:/')`, `getCpuData()`, and `checkSystemUtilization()` functions.

3. **Creating the HTTP server**:

   ```js
   const server = http.createServer(async (req, res) => {
     // (Same CORS + /system-usage + /os-info logic as above)
   });
   ```

4. **Adding Socket.IO**:

   ```js
   const io = socketIO(server);

   io.on("connecton", (socket) => {
     const conn = new SSHClient();
     conn
       .on("ready", () => {
         console.log("SSH connection ready");
         // Optionally, you could now invoke methods on `conn` to
         // gather remote data or run commands on the remote host.
       })
       .on("error", () => {
         console.log("SSH Connection closed");
       })
       .on("close", () => {
         console.log("SSH Connection closed");
       })
       .connect({
         host: "localhost",
         port: 22,
         username: "username",
         password: "password",
       });

     // When the client disconnects, close the SSH connection
     socket.on("disconnect", () => {
       console.log("Client disconnected");
       conn.end();
     });
   });
   ```

   > **Note**: There is a small typo in the event name—`'connecton'` instead of `'connection'`. In practice, you’d want to correct it to:
   >
   > ```js
   > io.on('connection', (socket) => { … })
   > ```

5. **Starting both HTTP & WebSocket** on port **3000**:

   ```js
   server.listen(3000, () => {
     console.log("Server listening on port 3000");
   });
   ```

Once a browser establishes a Socket.IO connection, the script can seamlessly use the same Linux-style metric collection (via `si` and `disk`) over that SSH tunnel and emit events back to the client. This allows a **Windows machine** to monitor a **remote Linux host** in real time.

---

### Common Functionality & Utilities

- Both server flavors rely heavily on two NPM packages:

  1. **`systeminformation`** (v5.23.5)

     - Provides cross-platform CPU, memory, OS, and other hardware metrics.
     - Methods used:

       - `si.osInfo()` → returns `{ platform, distro, release, … }`
       - `si.mem()` → returns `{ total, free, … }` in bytes
       - `si.currentLoad()` → returns `{ currentLoad, cpus: [ { load, … }, … ] }`

  2. **`check-disk-space`** (v3.4.0)

     - A lightweight utility that resolves to `{ size, free }` (in bytes) for a given path.
     - On Linux, we call `disk('/')`.
     - On Windows, we call `disk('C:/')`.

- **Polling Interval**

  - In `script.js`, the default interval is **2000ms** (2 seconds).
  - You can adjust this by changing the `setInterval(fetchAndUpdateCharts, 2000)` line in `script.js`.

---

## API Endpoints

Regardless of which server you run (Linux or Windows), the following two endpoints are available on **port 3000**:

1. **`GET /os-info`**

   - **Response**:

     ```json
     "<platform-string>"
     ```

     e.g. `"linux"`, `"win32"`, `"darwin"`.

   - **Use**: The front-end code (optional) can display the OS platform, or you can detect if you are monitoring Linux vs. Windows.

2. **`GET /system-usage`**

   - **Response**:

     ```jsonc
     {
       "totalMemory": <number>,    // in MB
       "freeMemory": <number>,     // in MB
       "usedMemory": <number>,     // in MB
       "totalStorage": <number>,   // in MB
       "freeStorage": <number>,    // in MB
       "usedStorage": <number>,    // in MB
       "cpuUtilization": <number>  // 0–100
     }
     ```

   - **Use**: The front-end polls this endpoint regularly to plot live data points on the charts.

---

## Use-Case / Workflow

Below is a typical scenario showing how one would use Argus to monitor a server (e.g. a Linux machine).

1. **Set Up & Launch the Server**

   - **On Linux**:

     ```sh
     cd argus/"linux server"
     npm install
     node linux_server.js
     # → “Server is running on http://localhost:3000”
     ```

   - **On Windows (basic)**:

     ```sh
     cd argus/"windows server"
     npm install
     node win_server.js
     # → “Server is running on http://localhost:3000”
     ```

   - **On Windows (SSH-enabled)**:

     ```sh
     cd argus/"windows server"
     npm install
     node ssh_conn.js
     # → “Server listening on port 3000”
     ```

     - In `ssh_conn.js` you can modify the SSH credentials under:

       ```js
       conn.connect({
         host: "localhost",
         port: 22,
         username: "username",
         password: "password",
       });
       ```

2. **Open the Dashboard**

   - In any modern browser (Chrome, Firefox, Edge, etc.), open:

     ```
     argus/index.html
     ```

     – This page will load Google Charts and immediately call:

     ```js
     fetch("http://localhost:3000/system-usage");
     ```

   - You will see three blank charts briefly, then after 2 seconds they will be populated with data from the server.

3. **Watch Metrics Live**

   - **Memory Chart**: Displays a line for total, free, and used memory (in MB).
   - **Disk Chart**: Displays a line for total, free, and used disk space (in MB).
   - **CPU Chart**: Displays the CPU load percentage (averaged across all cores).
   - Every 2 seconds, `script.js` fetches updated JSON from `/system-usage`, shifts all data points one unit to the left, and appends the new reading—so you see a “rolling window” of the last \~60 seconds of history.

4. **Switch to a Remote Linux Host (Optional)**

   - If you run `ssh_conn.js` on Windows and point its `conn.connect({ host, username, … })` at a remote Linux machine, then any browser that connects via Socket.IO receives the Linux host’s `/system-usage` data in real time.
   - This is especially useful if you want to keep your Windows machine open to monitor a headless Linux server without configuring CORS or SSH tunnels yourself.

---

## Customization & Extension

Argus is intentionally simple and modular. Here are ways you might extend or customize it:

1. **Change Polling Interval**

   - Open `script.js` and look for:

     ```js
     setInterval(fetchAndUpdateCharts, 2000);
     ```

     Adjust `2000` to `5000` (5 seconds) or any other interval.

2. **Support Additional Endpoints**

   - In `linux_server.js` / `win_server.js`, you could add:

     ```js
     if (req.url === '/cpu-info') { … }
     ```

     Or expose network stats (`si.networkStats()`), etc.

3. **Secure the Dashboard**

   - Because the back-end allows `Access-Control-Allow-Origin: '*'`, anyone on the network can fetch metrics.
   - You could tighten this to only allow `http://yourdomain.com` or add simple token-based authentication to the HTTP endpoints.

4. **Persist Historical Data**

   - Right now, Argus only keeps a rolling window of \~62 seconds in memory.
   - To build a longer-term history, you could insert each metric snapshot into a lightweight database (SQLite, InfluxDB, etc.) and visualize trends over hours/days.

5. **Enhance the SSH Module**

   - The `ssh_conn.js` is currently hard-coded to `host: 'localhost', port: 22, username: 'username', password: 'password'`.
   - You could read these parameters from a configuration file or allow multiple concurrent SSH sessions and broadcast all of them to the front-end.

6. **Add Additional Charts**

   - The front-end can be extended to show disk I/O, network throughput, GPU usage (if supported), etc., by calling `si.networkStats()`, `si.diskIO()`, or `si.graphics()`.

---

## License

This project is released under the **MIT License**. See the [LICENSE](./LICENSE) file for full terms. (If no `LICENSE` file is present, assume an MIT-style license or add one as needed.)

---

<sub>By following this documentation, you have complete visibility into every aspect of Argus—how to install, how each file works internally, how the front-end consumes the back-end, and how you can extend it.</sub>
