// ==========================================
// RESOURCE ALLOCATION GRAPH 
// ==========================================
function drawRAG(deadlocked) {
    const container = document.getElementById('ragCanvas');
    container.innerHTML = '';

    const n = systemState.processes;
    const m = systemState.resources;

    const usedProcesses = new Set();
    const usedResources = new Set();
    const requestEdges = [];   
    const assignEdges = [];    

    deadlocked.forEach(waitingP => {
        for (let r = 0; r < m; r++) {
            if (systemState.need[waitingP][r] > 0) {
                for (let holder = 0; holder < n; holder++) {
                    if (holder !== waitingP && systemState.allocation[holder][r] > 0 && deadlocked.includes(holder)) {
                        usedProcesses.add(waitingP);
                        usedProcesses.add(holder);
                        usedResources.add(r);
                        requestEdges.push({ from: `P${waitingP}`, to: `R${r}` });
                        assignEdges.push({ from: `R${r}`, to: `P${holder}` });
                        break;
                    }
                }
            }
        }
    });

    const procs = [...usedProcesses];
    const ress = [...usedResources];
    const W = 400, H = 400;
    const cx = W / 2, cy = H / 2;
    const radius = Math.min(W, H) * 0.36;

    const allNodes = [];
    const maxLen = Math.max(procs.length, ress.length);
    for (let i = 0; i < maxLen; i++) {
        if (i < procs.length) allNodes.push({ id: `P${procs[i]}`, type: 'process' });
        if (i < ress.length)  allNodes.push({ id: `R${ress[i]}`,  type: 'resource' });
    }

    const positions = {};
    allNodes.forEach((node, idx) => {
        const angle = (2 * Math.PI * idx / allNodes.length) - Math.PI / 2;
        positions[node.id] = {
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle),
            type: node.type
        };
    });

    const PROC_R = 28;
    const RES_W = 64, RES_H = 32;

    function edgeEndpoints(fromId, toId) {
        const a = positions[fromId], b = positions[toId];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / dist, uy = dy / dist;
        let sx, sy, ex, ey;

        if (a.type === 'process') { sx = a.x + ux * PROC_R; sy = a.y + uy * PROC_R; } 
        else { const t = Math.min(Math.abs((RES_W/2) / (ux || 0.0001)), Math.abs((RES_H/2) / (uy || 0.0001))); sx = a.x + ux * t; sy = a.y + uy * t; }

        if (b.type === 'process') { ex = b.x - ux * (PROC_R + 6); ey = b.y - uy * (PROC_R + 6); } 
        else { const t = Math.min(Math.abs((RES_W/2) / (ux || 0.0001)), Math.abs((RES_H/2) / (uy || 0.0001))); ex = b.x - ux * (t + 6); ey = b.y - uy * (t + 6); }

        return { sx, sy, ex, ey };
    }

    let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arr-req" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#dc2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker>
    <marker id="arr-asgn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#2563eb" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker>
  </defs>`;

    requestEdges.forEach(e => {
        if (!positions[e.from] || !positions[e.to]) return;
        const { sx, sy, ex, ey } = edgeEndpoints(e.from, e.to);
        svg += `<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="#dc2626" stroke-width="2" stroke-dasharray="6 3" marker-end="url(#arr-req)"/>`;
    });

    assignEdges.forEach(e => {
        if (!positions[e.from] || !positions[e.to]) return;
        const { sx, sy, ex, ey } = edgeEndpoints(e.from, e.to);
        svg += `<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="#2563eb" stroke-width="2" marker-end="url(#arr-asgn)"/>`;
    });

    Object.entries(positions).forEach(([id, pos]) => {
        if (pos.type === 'process') {
            // Dark red background, neon red border, light red text
            svg += `<circle cx="${pos.x.toFixed(1)}" cy="${pos.y.toFixed(1)}" r="${PROC_R}" fill="#450a0a" stroke="#f87171" stroke-width="3"/>
            <text x="${pos.x.toFixed(1)}" y="${pos.y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="Courier New, monospace" font-size="14" font-weight="bold" fill="#fca5a5">${id}</text>`;
        } else {
            const rx = (pos.x - RES_W / 2).toFixed(1), ry = (pos.y - RES_H / 2).toFixed(1);
            // Dark blue background, neon blue border, light blue text
            svg += `<rect x="${rx}" y="${ry}" width="${RES_W}" height="${RES_H}" rx="6" fill="#082f49" stroke="#38bdf8" stroke-width="3"/>
            <text x="${pos.x.toFixed(1)}" y="${pos.y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="Courier New, monospace" font-size="14" font-weight="bold" fill="#7dd3fc">${id}</text>`;
        }
    });

    // Update Legend colors to match neon theme
    svg += `<line x1="10" y1="378" x2="38" y2="378" stroke="#f87171" stroke-width="2" stroke-dasharray="6 3" marker-end="url(#arr-req)"/>
  <text x="44" y="382" font-family="Courier New, monospace" font-size="11" fill="#f87171">Request</text>
  <line x1="110" y1="378" x2="138" y2="378" stroke="#38bdf8" stroke-width="2" marker-end="url(#arr-asgn)"/>
  <text x="144" y="382" font-family="Courier New, monospace" font-size="11" fill="#38bdf8">Assignment</text></svg>`;

    container.innerHTML = svg;
}