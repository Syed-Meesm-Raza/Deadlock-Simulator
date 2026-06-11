// ==========================================
// GLOBAL STATE & DOM REFERENCES
// ==========================================
let systemState = {
    processes: 0,
    resources: 0,
    total: [],
    allocation: [],
    max: [],
    need: [],
    available: [],
    deadlockedProcesses: [],
    terminatedProcesses: new Set()
};

const generateBtn = document.getElementById('generateBtn');
const simulateBtn = document.getElementById('simulateBtn');
const dynamicInputs = document.getElementById('dynamicInputs');
const resultsContainer = document.getElementById('resultsContainer');
const errorMsg = document.getElementById('errorMsg');
const logBox = document.getElementById('simulationLog');

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function addLog(message) {
    const p = document.createElement('p');
    p.textContent = `> ${message}`;
    logBox.appendChild(p);
    logBox.scrollTop = logBox.scrollHeight;
}