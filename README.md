# Code Editor Project Overview

This report provides a comprehensive breakdown of the core files and architectural decisions made in building this Professional Code Editor platform.

## Architecture Paradigm
The application operates entirely on your local machine using a **Monorepo / Fullstack-lite** strategy. To achieve unrestricted code execution in real-time without relying on external third-party API limits, we built a custom NodeJS server that directly interacts with your Mac's native compilers (Java, Python, G++, etc) to run untrusted code strings instantly. The React frontend interacts seamlessly with this server.

---

### `1. backend/server.cjs` (The Code Execution Engine)
This is fundamentally the heart of the "Run & Submit" logic. It is an **Express.js API** server spinning on `localhost:3001`.
- **How it works:** When a request is received, it generates a unique session ID (`uuidv4`) and creates an isolated temporary directory. It takes the big string of text coming from the frontend editor and physically writes it into a literal text file locally (e.g., `main.py` or `Solution.java`). 
- **The Engine:** It uses Node's `child_process` execution tool to programmatically open the terminal under the hood, point to that temporary file, compile it (if necessary like Java or C++), and run it. Whatever strings those processes output to the console (`stdout`) or crash errors (`stderr`) are packaged up sequentially and deleted immediately to clean up your computer.
- **The `/submit` Endpoint:** This goes beyond simple running; it explicitly strips spacing and strictly checks if the user's logged output matches the algorithm's actual expected answer array `[0,1]`. It is solely responsible for verifying and applying the green `Accepted` or red `Wrong Answer` label.

### `2. src/api.js` (The Translation Bridge)
This file represents the critical link between the React user interface and your backend servers. 
- It houses the [executeCode](file:///Users/prithbirajmahanta/Documents/MINI_Project/src/api.js#6-23) and [submitCodeToBackend](file:///Users/prithbirajmahanta/Documents/MINI_Project/src/api.js#24-41) helper functions. 
- Using **Axios**, it prevents the React components from having to messy themselves with HTTP configurations or Promise management. Think of it as a clean phone line—it just takes the language and text string parameters, dials `localhost:3001`, waits for the compiled response arrays, and throws properly formatted errors if it senses the server has crashed.

### `3. src/App.jsx` (The Brain of the UI)
This is the single overarching **React Component Component** orchestrating all visuals and states.
- **`react-split` Layout:** Manages the mathematical logic to allow dragging the center boundary of the window to compress or expand the workspace dynamically without lagging.
- **`@monaco-editor/react` Integration:** Instead of just a `<textarea>`, this renders the exact same source-code intelligence (Syntax Highlighting, Automatic spacing indentations, theme tracking) engine used by Microsoft's VS Code.
- **Feature Handlers:** This tracks over a half dozen React states, controlling when the "Run" buttons should be disabled (`isRunning`), displaying the sleek `showSettings` configuration modal, hiding the problem statement array (`isFullscreen`), and managing the active content displayed in the test-cases console tabs.

### `4. src/index.css` & [src/App.css](file:///Users/prithbirajmahanta/Documents/MINI_Project/src/App.css) (The Design System)
- **Theme Root ([index.css](file:///Users/prithbirajmahanta/Documents/MINI_Project/src/index.css)):** Instead of manually applying colors everywhere, we used CSS Variables (e.g., `var(--bg-editor)`). When you click the Moon icon, React toggles `data-theme="dark"` onto the entire DOM. [index.css](file:///Users/prithbirajmahanta/Documents/MINI_Project/src/index.css) then rapidly swaps every single variable value from whites to navy blues, achieving instant theme switching with no re-renders. 
- **Flexbox Architecting ([App.css](file:///Users/prithbirajmahanta/Documents/MINI_Project/src/App.css)):** This is responsible for the crucial fix preventing the bottom footer from disappearing. By binding the app boundary to `100vh` and forcing intermediate divs to utilize `min-height: 0` alongside strict `hidden` overflows, it forcefully instructs the console area to consume the leftover remaining space and scroll rather than breaking the application's bounds. Layout overlays orchestrate the Settings Modal interactions and the Absolute positioning used in the Fullscreen override.

### `5. package.json` (The Maestro)
While primarily handling dependency tracking, the important customization lives in its `scripts` logic:
```json
"dev": "concurrently \"vite\" \"node backend/server.cjs\""
```
Instead of forcing you to use two separate terminal windows (one to run the backend engine, another to host Vite), we instituted `concurrently`. When you trigger `npm run dev`, it instantly spins up **both** servers in a synchronized ecosystem!
