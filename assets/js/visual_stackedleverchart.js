/* visual_stackedleverchart.js
   Renders three stacked-bar charts (national, provincial, municipal)
   showing proportions (%) of "levers" in data/actions.json.
*/
(function(){
    const DATA_FILE = './data/actions.json';
    let actions = [];
    let leverKey = null;
    let provinceKey = null;
    let cityKey = null;

    // Chart instances
    let nationalChart = null;
    let provincialChart = null;
    let municipalChart = null;

    // Init
    function init(){
        fetch(DATA_FILE).then(r => r.json()).then(d => {
            actions = d;
            if(!actions.length) return console.warn('No actions in data file.');
            detectKeys(actions[0]);
            const levers = allLevers(actions);
            const provinces = uniqueProvinces(actions);
            renderNational(provinces, levers);
            setupProvinceListeners(levers);
            setupMunicipalListeners(levers);
        }).catch(err => console.error('Error loading actions.json:', err));
    }

    function detectKeys(obj){
        Object.keys(obj).forEach(k => {
            const lk = k.toLowerCase();
            if(!leverKey && lk.indexOf('lever') !== -1) leverKey = k;
            if(!provinceKey && (lk === 'province' || lk.indexOf('provinc') !== -1)) provinceKey = k;
            if(!cityKey && (lk.indexOf('municip') !== -1 || lk.indexOf('city') !== -1)) cityKey = k;
        });
        if(!leverKey) {
            // Fallback: some datasets call them 'strategy' or similar
            Object.keys(obj).forEach(k => { if(!leverKey && k.toLowerCase().indexOf('strateg') !== -1) leverKey = k; });
            if(!leverKey) console.warn('No lever key found in actions.json. Looking for "lever" or "strategy" in keys.');
            else console.info('Using', leverKey, 'as lever-like key');
        }
    }

    function splitValues(val){
        if(!val && val !== 0) return [];
        if(Array.isArray(val)) return val.map(String);
        return String(val).split(/[;,]/).map(s => s.trim()).filter(Boolean);
    }

    function allLevers(items){
        const s = new Set();
        items.forEach(it => {
            const v = it[leverKey];
            splitValues(v).forEach(x => s.add(x));
        });
        return Array.from(s).sort();
    }

    function uniqueProvinces(items){
        const s = new Set();
        items.forEach(it => {
            const p = it[provinceKey];
            if(p && String(p).trim()) s.add(String(p).trim());
        });
        return Array.from(s).sort();
    }

    function countsByLevers(items, levers){
        const counts = {};
        levers.forEach(l => counts[l] = 0);
        items.forEach(it => {
            splitValues(it[leverKey]).forEach(l => {
                if(typeof counts[l] === 'number') counts[l] += 1;
                else counts[l] = 1; // in case new lever appears
            });
        });
        return counts;
    }

    function percentize(counts){
        const total = Object.values(counts).reduce((a,b)=>a+b,0) || 1;
        const out = {};
        Object.keys(counts).forEach(k => { out[k] = (counts[k]/total)*100; });
        return out;
    }

    function dataForProvince(prov){
        const subset = actions.filter(it => (String(it[provinceKey]||'').trim()) === prov);
        return countsByLevers(subset, allLevers(actions));
    }

    function dataForCity(city, prov){
        const subset = actions.filter(it => {
            const c = String(it[cityKey]||'').trim();
            const p = String(it[provinceKey]||'').trim();
            return c === city && (!prov || p === prov);
        });
        return countsByLevers(subset, allLevers(actions));
    }

    function renderNational(provinces, levers){
        const ctx = document.getElementById('nationalleverschart');
        if(!ctx) { console.warn('No #nationalleverschart canvas found'); return; }
        // Build data: datasets per lever, each dataset has a value per province (percent)
        const perProvinceCounts = provinces.map(p => countsByLevers(actions.filter(it => String(it[provinceKey]||'').trim() === p), levers));
        const perProvincePercent = perProvinceCounts.map(c => percentize(c));
        const datasets = levers.map((lever,idx) => ({
            label: lever,
            data: perProvincePercent.map(pp => +(pp[lever]||0).toFixed(2)),
            backgroundColor: paletteColor(idx)
        }));

        const cfg = {
            type: 'bar',
            data: {
                labels: provinces,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, ticks: { callback: v => v + '%' }, max: 100 }
                }
            }
        };
        if(nationalChart) nationalChart.destroy();
        nationalChart = new Chart(ctx, cfg);
    }

    function renderProvincial(selectedProv, levers){
        const ctx = document.getElementById('provincialleverschart');
        if(!ctx) return;
        const provCounts = countsByLevers(actions.filter(it => String(it[provinceKey]||'').trim() === selectedProv), levers);
        const natCounts = countsByLevers(actions, levers);
        const provPerc = percentize(provCounts);
        const natPerc = percentize(natCounts);
        const labels = [selectedProv || 'Selected province', 'National'];
        const datasets = levers.map((lever,idx) => ({
            label: lever,
            data: [ +(provPerc[lever]||0).toFixed(2), +(natPerc[lever]||0).toFixed(2) ],
            backgroundColor: paletteColor(idx)
        }));
        const cfg = {
            type: 'bar',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } },
                scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: v => v + '%' }, max: 100 } }
            }
        };
        if(provincialChart) provincialChart.destroy();
        provincialChart = new Chart(ctx, cfg);
    }

    function renderMunicipal(city, prov, levers){
        const ctx = document.getElementById('municipalleverschart');
        if(!ctx) return;
        const cityCounts = dataForCity(city, prov);
        const provCounts = countsByLevers(actions.filter(it => String(it[provinceKey]||'').trim() === prov), levers);
        const natCounts = countsByLevers(actions, levers);
        const cityPerc = percentize(cityCounts);
        const provPerc = percentize(provCounts);
        const natPerc = percentize(natCounts);
        const labels = [city || 'Selected city', prov || 'Province', 'National'];
        const datasets = levers.map((lever,idx) => ({
            label: lever,
            data: [ +(cityPerc[lever]||0).toFixed(2), +(provPerc[lever]||0).toFixed(2), +(natPerc[lever]||0).toFixed(2) ],
            backgroundColor: paletteColor(idx)
        }));
        const cfg = {
            type: 'bar',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } },
                scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: v => v + '%' }, max: 100 } }
            }
        };
        if(municipalChart) municipalChart.destroy();
        municipalChart = new Chart(ctx, cfg);
    }

    function setupProvinceListeners(levers){
        const sel = document.getElementById('province-select-prov');
        if(!sel) return;
        const placeholder = document.getElementById('provincial-placeholder');
        const content = document.getElementById('provincial-content');

        function toggle(){
            const p = sel.value;
            if(p){
                if(placeholder) placeholder.style.display = 'none';
                if(content) content.style.display = '';
                renderProvincial(p, levers);
            } else {
                if(placeholder) placeholder.style.display = '';
                if(content) content.style.display = 'none';
            }
        }

        sel.addEventListener('change', toggle);
        // Initial visibility
        toggle();
    }

    function setupMunicipalListeners(levers){
        const provSel = document.getElementById('province-select-mun');
        const citySel = document.getElementById('city-select-mun');
        if(!provSel || !citySel) return;
        const placeholder = document.getElementById('municipal-placeholder');
        const content = document.getElementById('municipal-content');

        function update(){
            const p = provSel.value;
            const c = citySel.value;
            if(p && c){
                if(placeholder) placeholder.style.display = 'none';
                if(content) content.style.display = '';
                renderMunicipal(c, p, levers);
            } else {
                if(placeholder) placeholder.style.display = '';
                if(content) content.style.display = 'none';
            }
        }

        provSel.addEventListener('change', update);
        citySel.addEventListener('change', update);
        // Initial visibility
        update();
    }

    // Simple color palette
    function paletteColor(i){
        const base = [ '#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc949','#af7aa1','#ff9da7','#9c755f','#bab0ac' ];
        return base[i % base.length];
    }

    if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);

})();
