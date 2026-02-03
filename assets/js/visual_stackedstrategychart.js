/* visual_stackedstrategychart.js
   Renders a single stacked-bar chart showing proportions (%) of "strategies" in data/actions.json.
   Filtered by selected lever (policy lever) and displays based on current geography view.
*/
(function(){
    const DATA_FILE = './data/actions_mod.json';
    let actions = [];
    let strategyKey = null;
    let leverKey = null;
    let provinceKey = null;
    let cityKey = null;

    // Chart instance
    let strategyChart = null;
    let currentLever = null;
    
    // HTML legend plugin (shared by all charts)
    const htmlLegendPlugin = {
        id: 'htmlLegend',
        afterUpdate(chart, args, options) {
            const containerID = options.containerID;
            if (!containerID) return;

            const legendContainer = document.getElementById(containerID);
            if (!legendContainer) return;

            legendContainer.innerHTML = '';

            const items =
                chart.options.plugins.legend.labels.generateLabels(chart);

            items.forEach(item => {
                const li = document.createElement('li');
                li.style.cursor = 'pointer';
                li.style.display = 'flex';
                li.style.alignItems = 'center';
                li.style.marginBottom = '6px';

                li.onclick = () => {
                    chart.setDatasetVisibility(
                        item.datasetIndex,
                        !chart.isDatasetVisible(item.datasetIndex)
                    );
                    chart.update();
                };

                const box = document.createElement('span');
                box.style.backgroundColor = item.fillStyle;
                box.style.width = '12px';
                box.style.height = '12px';
                box.style.marginRight = '8px';
                box.style.display = 'inline-block';

                const text = document.createElement('span');
                text.textContent = item.text;
                if (item.hidden) text.style.textDecoration = 'line-through';

                li.appendChild(box);
                li.appendChild(text);
                legendContainer.appendChild(li);
            });
        }
    };
    // Init
    function init(){
        fetch(DATA_FILE).then(r => r.json()).then(d => {
            actions = d;
            if(!actions.length) return console.warn('No actions in data file.');
            detectKeys(actions[0]);
            const levers = allLevers(actions);
            
            // Populate lever selector
            populateLeverSelector(levers);
            
            // Setup listeners for lever dropdown
            setupLeverSelectors(levers);
            
            // Setup listeners for geography changes
            setupGeographyListeners();
            
        }).catch(err => console.error('Error loading actions_mod.json:', err));
    }

    function detectKeys(obj){
        Object.keys(obj).forEach(k => {
            const lk = k.toLowerCase();
            if(!strategyKey && lk.indexOf('strateg') !== -1) strategyKey = k;
            if(!leverKey && lk.indexOf('lever') !== -1) leverKey = k;
            if(!provinceKey && (lk === 'province' || lk.indexOf('provinc') !== -1)) provinceKey = k;
            if(!cityKey && (lk.indexOf('municip') !== -1 || lk.indexOf('city') !== -1)) cityKey = k;
        });
    }

    function splitValues(val){
        if(!val && val !== 0) return [];
        if(Array.isArray(val)) return val.map(String);
        return String(val).split(';').map(s => s.trim()).filter(Boolean);
    }


    function allStrategies(items){
        const s = new Set();
        items.forEach(it => {
            const v = it[strategyKey];
            splitValues(v).forEach(x => s.add(x));
        });
        return Array.from(s).sort();
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

    function countsByStrategies(items, strategies){
        const counts = {};
        strategies.forEach(s => counts[s] = 0);
        items.forEach(it => {
            splitValues(it[strategyKey]).forEach(s => {
                if(typeof counts[s] === 'number') counts[s] += 1;
                else counts[s] = 1;
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

    function filterByLever(items, lever){
        if(!lever) return items;
        return items.filter(it => {
            const levers = splitValues(it[leverKey]);
            return levers.includes(lever);
        });
    }

    function dataForProvinceByLever(prov, lever){
        const subset = filterByLever(
            actions.filter(it => (String(it[provinceKey]||'').trim()) === prov),
            lever
        );
        return countsByStrategies(subset, allStrategies(filterByLever(actions, lever)));
    }

    function dataForCityByLever(city, prov, lever){
        const subset = filterByLever(
            actions.filter(it => {
                const c = String(it[cityKey]||'').trim();
                const p = String(it[provinceKey]||'').trim();
                return c === city && (!prov || p === prov);
            }),
            lever
        );
        return countsByStrategies(subset, allStrategies(filterByLever(actions, lever)));
    }

    function populateLeverSelector(levers){
        const sel = document.getElementById('lever-select-strategy');
        if(!sel) return;
        sel.innerHTML = '<option value="">Select a lever...</option>';
        levers.forEach(lever => {
            const opt = document.createElement('option');
            opt.value = lever;
            opt.textContent = lever;
            sel.appendChild(opt);
        });
    }

    function renderStrategyChart(lever, dataArray, labels, title, description){
        const ctx = document.getElementById('strategychart');
        if(!ctx) return;
        
        if(!lever){
            const placeholder = document.getElementById('strategy-placeholder');
            const content = document.getElementById('strategy-content');
            if(placeholder) placeholder.style.display = '';
            if(content) content.style.display = 'none';
            return;
        }
        
        const filteredActions = filterByLever(actions, lever);
        const strategies = allStrategies(filteredActions);
        
        const datasets = strategies.map((strategy,idx) => ({
            label: strategy,
            data: dataArray.map(row => +(row[strategy]||0).toFixed(2)),
            backgroundColor: paletteColor(idx)
        }));

        const cfg = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { position: 'right' },
                    tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': ' + ctx.parsed.y + '%' } }
                },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, ticks: { callback: v => v + '%' }, max: 100 }
                }
            }
        };

        // Update title and description
        const titleEl = document.getElementById('strategy-chart-title');
        const descEl = document.getElementById('strategy-chart-desc');
        if(titleEl) titleEl.textContent = title;
        if(descEl) descEl.textContent = description;

        // Show content, hide placeholder
        const placeholder = document.getElementById('strategy-placeholder');
        const content = document.getElementById('strategy-content');
        if(placeholder) placeholder.style.display = 'none';
        if(content) content.style.display = '';

        if(strategyChart) strategyChart.destroy();
        strategyChart = new Chart(ctx, cfg);
    }

    function setupLeverSelectors(levers){
        const sel = document.getElementById('lever-select-strategy');
        if(!sel) return;

        sel.addEventListener('change', function(){
            currentLever = sel.value;
            updateChartForCurrentView();
        });
    }

    function setupGeographyListeners(){
        // Listen for province changes in provincial view
        const provSel = document.getElementById('province-select-prov');
        if(provSel){
            provSel.addEventListener('change', function(){
                if(currentLever) updateChartForCurrentView();
            });
        }

        // Listen for province/city changes in municipal view
        const provSelMun = document.getElementById('province-select-mun');
        const citySel = document.getElementById('city-select-mun');
        if(provSelMun){
            provSelMun.addEventListener('change', function(){
                if(currentLever) updateChartForCurrentView();
            });
        }
        if(citySel){
            citySel.addEventListener('change', function(){
                if(currentLever) updateChartForCurrentView();
            });
        }
    }

    function renderStrategyChart(lever, dataArray, labels, title, description){
        const ctx = document.getElementById('strategychart');
        if(!ctx) return;
        
        if(!lever){
            const placeholder = document.getElementById('strategy-placeholder');
            const content = document.getElementById('strategy-content');
            if(placeholder) placeholder.style.display = '';
            if(content) content.style.display = 'none';
            return;
        }
        
        const filteredActions = filterByLever(actions, lever);
        const strategies = allStrategies(filteredActions);
        
        const datasets = strategies.map((strategy,idx) => ({
            label: strategy,
            data: dataArray.map(row => +(row[strategy]||0).toFixed(2)),
            backgroundColor: paletteColor(idx)
        }));

        const cfg = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: true },
                    tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': ' + ctx.parsed.y + '%' } }
                },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, ticks: { callback: v => v + '%' }, max: 100 }
                }
            }
        };

        // Update title and description
        const titleEl = document.getElementById('strategy-chart-title');
        const descEl = document.getElementById('strategy-chart-desc');
        if(titleEl) titleEl.textContent = title;
        if(descEl) descEl.textContent = description;

        // Show content, hide placeholder
        const placeholder = document.getElementById('strategy-placeholder');
        const content = document.getElementById('strategy-content');
        if(placeholder) placeholder.style.display = 'none';
        if(content) content.style.display = '';

        if(strategyChart) strategyChart.destroy();
        strategyChart = new Chart(ctx, cfg);
    }

    function updateChartForCurrentView(){
        if(!currentLever) return;

        // Check which view is active
        const nationalView = document.getElementById('national_view');
        const provincialView = document.getElementById('provincial_view');
        const municipalView = document.getElementById('municipal_view');

        if(nationalView && nationalView.style.display !== 'none'){
            // National view
            const provinces = uniqueProvinces(filterByLever(actions, currentLever));
            const perProvinceCounts = provinces.map(p => countsByStrategies(
                filterByLever(actions.filter(it => String(it[provinceKey]||'').trim() === p), currentLever),
                allStrategies(filterByLever(actions, currentLever))
            ));
            const perProvincePercent = perProvinceCounts.map(c => percentize(c));
            renderStrategyChart(
                currentLever,
                perProvincePercent,
                provinces,
                'Strategies by Province (National)',
                'This stacked bar chart shows the proportional (%) use of each strategy within the selected policy lever across the provinces and territories studied.'
            );
        }
        else if(provincialView && provincialView.style.display !== 'none'){
            // Provincial view
            const provSel = document.getElementById('province-select-prov');
            if(!provSel || !provSel.value){
                const placeholder = document.getElementById('strategy-placeholder');
                const content = document.getElementById('strategy-content');
                if(placeholder) placeholder.style.display = '';
                if(content) content.style.display = 'none';
                return;
            }
            
            const selectedProv = provSel.value;
            const provCounts = countsByStrategies(
                filterByLever(actions.filter(it => String(it[provinceKey]||'').trim() === selectedProv), currentLever),
                allStrategies(filterByLever(actions, currentLever))
            );
            const natCounts = countsByStrategies(filterByLever(actions, currentLever), allStrategies(filterByLever(actions, currentLever)));
            const provPerc = percentize(provCounts);
            const natPerc = percentize(natCounts);
            
            renderStrategyChart(
                currentLever,
                [provPerc, natPerc],
                [selectedProv || 'Selected province', 'Canada'],
                'Strategies — Selected province vs National',
                'This stacked bar chart shows the proportional (%) use of each strategy within the selected policy lever in the selected province, as well as the overall use of each strategy nationally for comparison.'
            );
        }
        else if(municipalView && municipalView.style.display !== 'none'){
            // Municipal view
            const provSelMun = document.getElementById('province-select-mun');
            const citySel = document.getElementById('city-select-mun');
            if(!provSelMun || !citySel || !provSelMun.value || !citySel.value){
                const placeholder = document.getElementById('strategy-placeholder');
                const content = document.getElementById('strategy-content');
                if(placeholder) placeholder.style.display = '';
                if(content) content.style.display = 'none';
                return;
            }
            
            const selectedCity = citySel.value;
            const selectedProv = provSelMun.value;
            
            const cityCounts = countsByStrategies(
                filterByLever(actions.filter(it => {
                    const c = String(it[cityKey]||'').trim();
                    const p = String(it[provinceKey]||'').trim();
                    return c === selectedCity && p === selectedProv;
                }), currentLever),
                allStrategies(filterByLever(actions, currentLever))
            );
            const provCounts = countsByStrategies(
                filterByLever(actions.filter(it => String(it[provinceKey]||'').trim() === selectedProv), currentLever),
                allStrategies(filterByLever(actions, currentLever))
            );
            const natCounts = countsByStrategies(filterByLever(actions, currentLever), allStrategies(filterByLever(actions, currentLever)));
            
            const cityPerc = percentize(cityCounts);
            const provPerc = percentize(provCounts);
            const natPerc = percentize(natCounts);
            
            renderStrategyChart(
                currentLever,
                [cityPerc, provPerc, natPerc],
                [selectedCity || 'Selected city', selectedProv || 'Province', 'Canada'],
                'Strategies — City, Province, National',
                'This stacked bar chart shows the proportional (%) use of each strategy within the selected policy lever in the selected municipality as well as the overall use of each strategy provincially and nationally for comparison.'
            );
        }
    }

    // Expose function to be called when view changes
    window.updateStrategyChartDisplay = function(){
        if(currentLever) updateChartForCurrentView();
    };

    // Simple color palette
    function paletteColor(i){
        const base = [ '#76A5AF','#D0E2F3','#4286F5','#A4C2F4','#86BCDB','#93A4C9'];
        return base[i % base.length];
    }

    if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);

})();
