(function(){
    const CITIES_FILE = './data/cities.json';
    let citiesData = [];
    let provinceKey = null;
    let cityKey = null;

    function detectKeys(obj){
        Object.keys(obj).forEach(k => {
            const lk = k.toLowerCase();
            if(!provinceKey && lk === 'province') provinceKey = k;
            if(!cityKey && lk.indexOf('municip') !== -1) cityKey = k; // "Municipality" key
        });
    }

    function load(){
        return fetch(CITIES_FILE).then(r => r.json()).then(d => {
            citiesData = d;
            if(citiesData.length) detectKeys(citiesData[0]);
            populateProvincialSelect();
            populateMunicipalProvinceSelect();
        }).catch(err => console.error('Error loading cities.json:', err));
    }

    function uniqueProvinces(){
        const s = new Set();
        citiesData.forEach(item => {
            const p = item[provinceKey];
            if(p && p.toString().trim()) s.add(p.toString().trim());
        });
        return Array.from(s).sort();
    }

    function citiesByProvince(prov){
        return citiesData.filter(item => (item[provinceKey] || '').toString().trim() === prov)
                         .map(item => (item[cityKey] || '').toString().trim())
                         .filter(Boolean)
                         .sort((a,b) => a.localeCompare(b));
    }

    function populateProvincialSelect(){
        const sel = document.getElementById('province-select-prov');
        if(!sel) return;
        sel.innerHTML = '';
        const provinces = uniqueProvinces();
        sel.appendChild(optionEl('', 'Select a province'));
        provinces.forEach(p => sel.appendChild(optionEl(p,p)));
    }

    function populateMunicipalProvinceSelect(){
        const sel = document.getElementById('province-select-mun');
        const citySel = document.getElementById('city-select-mun');
        if(!sel || !citySel) return;
        sel.innerHTML = '';
        sel.appendChild(optionEl('', 'Select a province'));
        const provinces = uniqueProvinces();
        provinces.forEach(p => sel.appendChild(optionEl(p,p)));
        sel.addEventListener('change', function(){
            const prov = this.value;
            populateCitySelect(prov);
        });
    }

    function populateCitySelect(prov){
        const citySel = document.getElementById('city-select-mun');
        if(!citySel) return;
        citySel.innerHTML = '';
        if(!prov){
            citySel.appendChild(optionEl('','Select a province first'));
            return;
        }
        const cityList = citiesByProvince(prov);
        if(!cityList.length){
            citySel.appendChild(optionEl('','No cities found'));
            return;
        }
        citySel.appendChild(optionEl('','Select a city'));
        cityList.forEach(c => citySel.appendChild(optionEl(c,c)));
    }

    function optionEl(val, text){
        const o = document.createElement('option');
        o.value = val;
        o.textContent = text;
        return o;
    }

    // init when DOM ready
    document.addEventListener('DOMContentLoaded', function(){
        load();
    });
})();