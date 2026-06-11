// ==========================================
// 1. GENERATE DYNAMIC INPUTS
// ==========================================
generateBtn.addEventListener('click', () => {
    const n = parseInt(document.getElementById('numProcesses').value);
    const m = parseInt(document.getElementById('numResources').value);

    if (n < 1 || m < 1 || isNaN(n) || isNaN(m)) {
        errorMsg.textContent = "Please enter valid numbers (≥ 1).";
        return;
    }

    errorMsg.textContent = "";
    systemState.processes = n;
    systemState.resources = m;

    document.getElementById('totalInstancesContainer').innerHTML = '';
    document.getElementById('allocThead').innerHTML = '';
    document.getElementById('allocTbody').innerHTML = '';
    document.getElementById('maxThead').innerHTML = '';
    document.getElementById('maxTbody').innerHTML = '';

    const defaultTotal = [1, 2];
    const defaultAlloc = [[1, 0], [0, 1], [0, 1]];
    const defaultMax = [[1, 2], [1, 2], [1, 2]];

    const totalContainer = document.getElementById('totalInstancesContainer');
    for (let j = 0; j < m; j++) {
        const val = defaultTotal[j] !== undefined ? defaultTotal[j] : 0;
        const label = document.createElement('label');
        label.innerHTML = `R${j}: <input type="number" id="totalR${j}" value="${val}" min="0">`;
        totalContainer.appendChild(label);
    }

    let headerHTML = '<tr><th>Process</th>';
    for (let j = 0; j < m; j++) headerHTML += `<th>R${j}</th>`;
    headerHTML += '</tr>';
    document.getElementById('allocThead').innerHTML = headerHTML;
    document.getElementById('maxThead').innerHTML = headerHTML;
    document.getElementById('needThead').innerHTML = headerHTML;

    for (let i = 0; i < n; i++) {
        let allocRow = `<tr><td>P${i}</td>`;
        let maxRow = `<tr><td>P${i}</td>`;
        for (let j = 0; j < m; j++) {
            const allocVal = defaultAlloc[i] && defaultAlloc[i][j] !== undefined ? defaultAlloc[i][j] : 0;
            const maxVal = defaultMax[i] && defaultMax[i][j] !== undefined ? defaultMax[i][j] : 0;
            allocRow += `<td><input type="number" class="alloc-input" data-p="${i}" data-r="${j}" value="${allocVal}" min="0"></td>`;
            maxRow += `<td><input type="number" class="max-input" data-p="${i}" data-r="${j}" value="${maxVal}" min="0"></td>`;
        }
        document.getElementById('allocTbody').innerHTML += allocRow + '</tr>';
        document.getElementById('maxTbody').innerHTML += maxRow + '</tr>';
    }

    dynamicInputs.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
    document.getElementById('recoveryResult').classList.add('hidden');
    addLog(`Generated configuration: ${n} Processes, ${m} Resources. Ready for input.`);
});

// ==========================================
// 2. COMPUTE & SIMULATE
// ==========================================
simulateBtn.addEventListener('click', () => {
    errorMsg.textContent = "";
    systemState.terminatedProcesses = new Set(); 
    document.getElementById('recoveryResult').classList.add('hidden'); 
    const n = systemState.processes;
    const m = systemState.resources;

    systemState.total = [];
    for (let j = 0; j < m; j++) systemState.total.push(parseInt(document.getElementById(`totalR${j}`).value) || 0);

    systemState.allocation = Array(n).fill().map(() => Array(m).fill(0));
    systemState.max = Array(n).fill().map(() => Array(m).fill(0));

    document.querySelectorAll('.alloc-input').forEach(input => {
        systemState.allocation[input.dataset.p][input.dataset.r] = parseInt(input.value) || 0;
    });
    document.querySelectorAll('.max-input').forEach(input => {
        systemState.max[input.dataset.p][input.dataset.r] = parseInt(input.value) || 0;
    });

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            if (systemState.allocation[i][j] > systemState.max[i][j]) {
                errorMsg.textContent = `Error: Allocation for P${i}, R${j} cannot exceed Maximum!`;
                return;
            }
        }
    }

    systemState.available = [];
    for (let j = 0; j < m; j++) {
        let sumAlloc = 0;
        for (let i = 0; i < n; i++) sumAlloc += systemState.allocation[i][j];
        const avail = systemState.total[j] - sumAlloc;
        if (avail < 0) {
            errorMsg.textContent = `Error: Total instances of R${j} is less than allocated!`;
            return;
        }
        systemState.available.push(avail);
    }

    systemState.need = Array(n).fill().map(() => Array(m).fill(0));
    let needTbodyHTML = '';
    for (let i = 0; i < n; i++) {
        let rowHTML = `<tr><td>P${i}</td>`;
        for (let j = 0; j < m; j++) {
            systemState.need[i][j] = systemState.max[i][j] - systemState.allocation[i][j];
            rowHTML += `<td>${systemState.need[i][j]}</td>`;
        }
        needTbodyHTML += rowHTML + '</tr>';
    }
    document.getElementById('needTbody').innerHTML = needTbodyHTML;
    document.getElementById('availableVector').textContent = `[ ${systemState.available.join(', ')} ]`;

    resultsContainer.classList.remove('hidden');
    addLog("Computed Available Vector and Need Matrix.");
    runBankersAlgorithm(false); 
});

// ==========================================
// 5. RECOVERY LOGIC
// ==========================================
document.getElementById('btnKill').addEventListener('click', () => {
    const target = parseInt(document.getElementById('recoveryTarget').value);
    const m = systemState.resources;
    
    if (!systemState.terminatedProcesses) systemState.terminatedProcesses = new Set();
    systemState.terminatedProcesses.add(target);
    addLog(`RECOVERY: Terminating P${target}...`);
    
    for (let j = 0; j < m; j++) {
        systemState.available[j] += systemState.allocation[target][j];
        systemState.allocation[target][j] = 0;
        systemState.need[target][j] = 0;
    }
    
    document.getElementById('recoveryActionText').textContent = `Terminated Process P${target} and released its resources.`;
    runBankersAlgorithm(true);
});

document.getElementById('btnPreempt').addEventListener('click', () => {
    const target = parseInt(document.getElementById('recoveryTarget').value);
    const m = systemState.resources;
    let preempted = false;
    let preemptedResourceIndex = -1;

    addLog(`RECOVERY: Attempting preemption on P${target}...`);

    for (let j = 0; j < m; j++) {
        if (systemState.allocation[target][j] > 0) {
            systemState.allocation[target][j] -= 1;
            systemState.need[target][j] += 1; 
            systemState.available[j] += 1;    
            preempted = true;
            preemptedResourceIndex = j;
            addLog(`Preempted 1 unit of R${j} from P${target}.`);
            break; 
        }
    }

    document.getElementById('recoveryResult').classList.remove('hidden');

    if (!preempted) {
        addLog("RECOVERY FAILED: Process holds no resources to preempt.");
        document.getElementById('recoveryActionText').textContent = `Failed: P${target} holds no resources to preempt.`;
        document.getElementById('newAvailable').textContent = `[ ${systemState.available.join(', ')} ]`;
        document.getElementById('newSafeSequence').textContent = "N/A";
        return; 
    }

    document.getElementById('recoveryActionText').textContent = `Preempted 1 unit of R${preemptedResourceIndex} from P${target}.`;
    runBankersAlgorithm(true);
});

// ==========================================
// 6. TOGGLE SIMULATION LOG
// ==========================================
document.getElementById('toggleLogBtn').addEventListener('click', () => {
    const logBox = document.getElementById('simulationLog');
    const btn = document.getElementById('toggleLogBtn');
    
    if (logBox.classList.contains('hidden')) {
        logBox.classList.remove('hidden');
        btn.textContent = 'Hide Log';
        logBox.scrollTop = logBox.scrollHeight; 
    } else {
        logBox.classList.add('hidden');
        btn.textContent = 'Show Log';
    }
});