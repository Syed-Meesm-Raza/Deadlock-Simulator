// ==========================================
// FIND ALL POSSIBLE SAFE SEQUENCES
// ==========================================
function findAllSafeSequences() {
    const n = systemState.processes;
    const m = systemState.resources;
    const allSequences = [];

    function backtrack(work, finish, currentSequence) {
        if (currentSequence.length === n) {
            allSequences.push([...currentSequence]);
            return;
        }

        const eligibleProcesses = [];
        for (let i = 0; i < n; i++) {
            if (!finish[i]) {
                let canExecute = true;
                for (let j = 0; j < m; j++) {
                    if (systemState.need[i][j] > work[j]) {
                        canExecute = false;
                        break;
                    }
                }
                if (canExecute) eligibleProcesses.push(i);
            }
        }

        for (const proc of eligibleProcesses) {
            const oldWork = [...work];
            finish[proc] = true;
            for (let j = 0; j < m; j++) work[j] += systemState.allocation[proc][j];
            currentSequence.push(`P${proc}`);

            backtrack(work, finish, currentSequence);

            currentSequence.pop();
            finish[proc] = false;
            for (let j = 0; j < m; j++) work[j] = oldWork[j];
        }
    }

    const work = [...systemState.available];
    const finish = Array(systemState.processes).fill(false);
    backtrack(work, finish, []);
    return allSequences;
}

// ==========================================
// BANKER'S ALGORITHM ENGINE
// ==========================================
function runBankersAlgorithm(isRecoveryRun) {
    const n = systemState.processes;
    const m = systemState.resources;
    
    let work = [...systemState.available];
    let finish = Array(n).fill(false);
    let safeSequence = [];
    let cycleTableHTML = '';
    let cycleCount = 1;
    let madeProgress = true;

    while (madeProgress && !finish.every(f => f === true)) {
        madeProgress = false;
        let cycleRows = '';

        for (let i = 0; i < n; i++) {
            if (finish[i]) continue;

            let canExecute = true;
            for (let j = 0; j < m; j++) {
                if (systemState.need[i][j] > work[j]) {
                    canExecute = false;
                    break;
                }
            }

            let availableBefore = `[ ${work.join(', ')} ]`;
            let needStr = `[ ${systemState.need[i].join(', ')} ]`;
            let status = '';
            let availableAfter = '';

            if (canExecute) {
                if (systemState.terminatedProcesses && systemState.terminatedProcesses.has(i)) {
                    status = '<span style="color:#d97706; font-weight:bold;">Terminated</span>';
                } else {
                    status = '<span style="color:green; font-weight:bold;">Executed</span>';
                }
                
                for (let j = 0; j < m; j++) work[j] += systemState.allocation[i][j];
                availableAfter = `[ ${work.join(', ')} ]`;
                finish[i] = true;
                safeSequence.push(`P${i}`);
                madeProgress = true;
            } else {
                status = '<span style="color:red; font-weight:bold;">Waiting</span>';
                availableAfter = availableBefore;
            }

            cycleRows += `
                <tr>
                    <td>${cycleCount}</td>
                    <td>P${i}</td>
                    <td>${needStr}</td>
                    <td>${availableBefore}</td>
                    <td>${status}</td>
                    <td>${availableAfter}</td>
                </tr>
            `;
        }

        if (cycleRows !== '') {
            cycleTableHTML += cycleRows;
            cycleTableHTML += `<tr class="cycle-divider"><td colspan="6">--- End of Cycle ---</td></tr>`;
            cycleCount++;
        }
    }

    const allFinished = finish.every(f => f === true);
    const deadlocked = [];
    for(let i = 0; i < n; i++) if(!finish[i]) deadlocked.push(i);
    systemState.deadlockedProcesses = deadlocked;

    if (!isRecoveryRun) {
        const statusBadge = document.getElementById('statusBadge');
        document.getElementById('cycleTableBody').innerHTML = cycleTableHTML;

        if (allFinished) {
            statusBadge.textContent = "Status: SAFE";
            statusBadge.className = "status-badge safe";
            
            const allSequences = findAllSafeSequences();
            const firstSeq = allSequences[0];
            document.getElementById('safeSequenceDisplay').innerHTML = `<p><strong>Primary Safe Sequence:</strong> ${firstSeq.join(' → ')}</p>`;
            
            const toggleBtn = document.getElementById('toggleOtherSeqBtn');
            const otherList = document.getElementById('otherSequencesList');
            otherList.innerHTML = '';
            
            if (allSequences.length > 1) {
                toggleBtn.classList.remove('hidden');
                toggleBtn.textContent = '🔽 Show Other Safe Sequences';
                otherList.classList.add('hidden'); 
                
                for (let i = 1; i < allSequences.length; i++) {
                    const div = document.createElement('div');
                    div.className = 'sequence-item';
                    div.innerHTML = `<strong>Sequence #${i + 1}:</strong> ${allSequences[i].join(' → ')}`;
                    otherList.appendChild(div);
                }
                
                toggleBtn.onclick = function() {
                    if (otherList.classList.contains('hidden')) {
                        otherList.classList.remove('hidden');
                        toggleBtn.textContent = 'Hide Other Safe Sequences';
                    } else {
                        otherList.classList.add('hidden');
                        toggleBtn.textContent = 'Show Other Safe Sequences';
                    }
                };
            } else {
                toggleBtn.classList.add('hidden');
                otherList.classList.add('hidden');
            }
            
            document.getElementById('safeSection').classList.remove('hidden');
            document.getElementById('deadlockSection').classList.add('hidden');
            document.getElementById('recoverySection').classList.add('hidden');
            addLog(`SUCCESS: System is SAFE. Found ${allSequences.length} possible safe sequence(s).`);
            
        } else {
            statusBadge.textContent = "Status: UNSAFE";
            statusBadge.className = "status-badge unsafe";
            
            document.getElementById('safeSection').classList.remove('hidden');
            document.getElementById('deadlockSection').classList.remove('hidden');
            document.getElementById('recoverySection').classList.remove('hidden');
            
            const deadlockedNames = deadlocked.map(i => `P${i}`).join(', ');
            document.getElementById('deadlockedProcesses').textContent = deadlockedNames;
            document.getElementById('deadlockCycleText').textContent = `Circular wait detected among: ${deadlockedNames}`;
            
            const select = document.getElementById('recoveryTarget');
            select.innerHTML = '';
            deadlocked.forEach(i => {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = `P${i}`;
                select.appendChild(opt);
            });

            drawRAG(deadlocked);
            addLog(`FAILURE: System is UNSAFE. Deadlocked: ${deadlockedNames}`);
        }
    } else {
        const statusBadge = document.getElementById('statusBadge');
        document.getElementById('cycleTableBody').innerHTML = cycleTableHTML;
        document.getElementById('recoveryResult').classList.remove('hidden');
        document.getElementById('newAvailable').textContent = `[ ${work.join(', ')} ]`;
        
        if (allFinished) {
            statusBadge.textContent = "Status: SAFE (Recovered)";
            statusBadge.className = "status-badge safe";
            
            const allSequences = findAllSafeSequences();
            let seqHTML = "";
            allSequences.forEach((seq, index) => {
                seqHTML += `<div style="margin-bottom: 5px;"><strong>Sequence #${index + 1}:</strong> ${seq.join(' → ')}</div>`;
            });
            document.getElementById('newSafeSequence').innerHTML = seqHTML;
            
            document.getElementById('deadlockSection').classList.add('hidden');
            document.getElementById('recoverySection').classList.add('hidden');
            
        } else {
            document.getElementById('newSafeSequence').textContent = "Still Unsafe (Try another action)";
        }
        
        addLog(`Recovery re-run complete. Safe: ${allFinished}`);
    }
}