**Deadlock Simulator: Banker's Algorithm & Recovery Engine**

    A comprehensive, interactive web-based simulator for Operating System deadlock detection, avoidance, and recovery. This project visualizes the Banker's Algorithm, dynamically generates Resource Allocation Graphs (RAG), and provides interactive Deadlock Recovery mechanisms.

**Features**

    1. Dynamic Input Generation: Configure any number of Processes (N) and Resources (M).
    2. Banker's Algorithm Engine: Computes the Available vector and Need matrix, and simulates cycle-by-cycle process execution.
    3. Multiple Safe Sequences: Identifies and displays all possible safe sequences for a given state.
    4. Visual Resource Allocation Graph (RAG): Automatically draws a circular SVG graph highlighting circular waits      during  a deadlock.
    5. Interactive Recovery Phase: Resolve deadlocks by Terminating a Process or Preempting Resources, with instant visual feedback.
    
**Software Dependencies**

    This project is built using pure, vanilla web technologies. There are no external libraries, frameworks, or build tools required.

        1)Web Browser: Any modern browser (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari).
        2)Code Editor: Visual Studio Code (recommended for viewing the code).

**How to Compile and Run**

    Because this is a client-side web application, no compilation is required.

    Option 1: Direct Execution

        Download or clone the project repository to your local machine.
        Ensure all files (index.html, style.css, state.js, rag.js, algorithms.js, app.js) are in the same directory.
        Double-click index.html to open it in your default web browser.

    Option 2: Using a Local Server

        Open the project folder in Visual Studio Code.
        Install the "Live Server" extension by Ritwick Dey.
        Right-click on index.html and select "Open with Live Server".   

**Usage Instructions**

    1. System Configuration

        Enter the Number of Processes (N) and Number of Resources (M).
        Click Generate Matrices. The UI will dynamically build the input tables for your specific configuration.

    2. Enter System State

        Total Instances Vector: Enter the total number of instances for each resource (e.g., R0, R1, R2).
        Allocation Matrix: Enter the number of resources currently held by each process.
        Maximum Matrix: Enter the maximum number of resources each process may request.
        (Note: The system will automatically validate that Allocation ≤ Maximum and Total ≥ Sum of Allocations).

    3. Compute & Simulate

        Click Simulate.
        The system will calculate the Available Vector and Need Matrix.
        The Execution Cycle Table will display the step-by-step execution. Processes that cannot run immediately will be marked as Waiting (Red) and pushed to the next cycle.

    4. Analyze Safe/Unsafe States

        If SAFE: The status badge will turn green. The primary safe sequence will be displayed. You can click "Show Other Safe Sequences" to view alternative valid execution orders.
        If UNSAFE (Deadlock): The status badge will turn red. The system will display the Deadlocked Processes and draw a Resource Allocation Graph (RAG) showing the exact circular wait condition.

    5. Recovery Phase (Only if Unsafe)

        Select a deadlocked process from the dropdown menu.
        Option 1: Kill Process: Terminates the process, releases all its held resources back to the Available pool, and re-runs the algorithm.
        Option 2: Preempt Resource: Forcibly takes 1 unit of a held resource from the process, updates the Need matrix, and re-runs the algorithm.
        The Execution Cycle Table will instantly update to show the newly recovered state, marking the killed process as Terminated (Orange).

**Project Structure**

    To maintain clean code and separation of concerns, the JavaScript logic is split into four modular files:

    index.html
        The structural layout of the UI dashboard.

    style.css
        The dark terminal theme, responsive design, and layout styling.

    state.js
        Global state variables, DOM element references, and utility functions (logging).

    rag.js
        Pure SVG generation logic for drawing the Resource Allocation Graph.

    algorithms.js
        The core mathematical logic: Banker's Algorithm and Safe Sequence backtracking.

    app.js
        Event listeners and UI interaction handlers (button clicks, table generation).
