(function(){
    const CITIES_FILE = './data/cities.json';
    const containerId = 'municipal-cap-table';
    const placeholderId = 'municipal-table-placeholder';
    let cities = [];
    let municipalityKey = null;
    let yearKey = null;
    const provinceKeyName = 'Province';

    function detectKeys(obj){
        Object.keys(obj).forEach(k => {
            const lk = k.toLowerCase();
            if(!municipalityKey && lk.indexOf('municip') !== -1) municipalityKey = k;
            if(!yearKey && lk.indexOf('year') !== -1) yearKey = k;
        });
        // graceful fallbacks
        if(!municipalityKey) municipalityKey = Object.keys(obj)[0];
        if(!yearKey) yearKey = 'Year';
    }

    function el(id){ return document.getElementById(id); }

    function clearContainer(){
        if(el(containerId)) el(containerId).innerHTML = '';
        if(el(containerId)) el(containerId).style.display = 'none';
        if(el(placeholderId)) el(placeholderId).style.display = '';
    }

    function renderTableForProvince(prov, selectedCity){
        const tableWrap = el(containerId);
        const placeholder = el(placeholderId);

        // Require both province and municipality (city) to be selected
        if(!prov || !selectedCity){
            clearContainer();
            return;
        }

        const rows = cities.filter(c => String((c[provinceKeyName] || '')).trim() === String(prov).trim());
        if(!rows.length){
            clearContainer();
            return;
        }

        // find the single city row matching selectedCity (case-insensitive)
        const normalizedSelected = String(selectedCity).trim().toLowerCase();
        const row = rows.find(r => String((r[municipalityKey] || '')).trim().toLowerCase() === normalizedSelected);
        if(!row){
            clearContainer();
            return;
        }

        // Hide placeholder and show table
        if(placeholder) placeholder.style.display = 'none';
        if(tableWrap) tableWrap.style.display = '';

        const table = document.createElement('table');
        table.className = 'cap-table';
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        const thead = document.createElement('thead');
        thead.innerHTML = `<tr>
            <th>Municipality</th>
            <th>Climate action plan link [province as placeholder until i merge the cap links]</th>
            <th>Year published</th>
        </tr>`;

        const tbody = document.createElement('tbody');
        const city = (row[municipalityKey] || '').toString();
        const year = (row[yearKey] !== undefined) ? row[yearKey] : '';
        const tr = document.createElement('tr');
        tr.className = 'selected';
        tr.innerHTML = `<td>${city}</td><td>${prov}</td><td>${year}</td>`;
        tbody.appendChild(tr);

        table.appendChild(thead);
        table.appendChild(tbody);

        tableWrap.innerHTML = '';
        tableWrap.appendChild(table);
    }

    function onProvinceChange(e){
        const prov = e.target.value;
        const citySelect = el('city-select-mun');
        // clear any selected city when province changes so table won't show until user picks a city
        if(citySelect) citySelect.value = '';
        renderTableForProvince(prov, null);
    }

    function onCityChange(e){
        const prov = el('province-select-mun') ? el('province-select-mun').value : '';
        const city = e.target.value;
        renderTableForProvince(prov, city);
    }

    function init(){
        fetch(CITIES_FILE).then(r => r.json()).then(data => {
            cities = data;
            if(cities.length) detectKeys(cities[0]);

            const provSelect = el('province-select-mun');
            const citySelect = el('city-select-mun');

            if(provSelect) provSelect.addEventListener('change', onProvinceChange);
            if(citySelect) citySelect.addEventListener('change', onCityChange);

            // Only render if both a province and a city are already selected
            const currentProv = provSelect ? provSelect.value : '';
            const currentCity = citySelect ? citySelect.value : '';
            if(currentProv && currentCity) renderTableForProvince(currentProv, currentCity);
        }).catch(err => {
            console.error('visual_captable failed to load cities.json', err);
            clearContainer();
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();