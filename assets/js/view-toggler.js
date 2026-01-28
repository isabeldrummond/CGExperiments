// View toggler: show only the selected section, extracted from inline script
(function(){
	var views = ['national_view','provincial_view','municipal_view','strategy_view'];
	var mapping = { national_view: 'btn-national', provincial_view: 'btn-provincial', municipal_view: 'btn-municipal' };
	function setActive(id){
		Object.keys(mapping).forEach(function(k){
			var btn = document.getElementById(mapping[k]);
			if(!btn) return;
			if(k === id){
				btn.classList.add('active');
				btn.setAttribute('aria-pressed','true');
				btn.setAttribute('aria-current','true');
			} else {
				btn.classList.remove('active');
				btn.setAttribute('aria-pressed','false');
				btn.removeAttribute('aria-current');
			}
		});
	}
	function showView(id, updateHash){
		if(views.indexOf(id) === -1) id = 'national_view';
		views.forEach(function(v){
			var el = document.getElementById(v);
			if(!el) return;
			el.style.display = (v === id) ? '' : 'none';
		});
		// Also show strategy_view when showing any data view
		var strategyView = document.getElementById('strategy_view');
		if(strategyView){
			strategyView.style.display = (views.indexOf(id) !== -1) ? '' : 'none';
		}
		setActive(id);
		// Update strategy chart display when view changes
		if(window.updateStrategyChartDisplay) {
			window.updateStrategyChartDisplay();
		}
		if(updateHash !== false){
			if(history && history.replaceState) history.replaceState(null, null, '#'+id);
			else location.hash = '#'+id;
		}
	}
	document.addEventListener('DOMContentLoaded', function(){
		Object.keys(mapping).forEach(function(k){
			var id = mapping[k];
			var b = document.getElementById(id);
			if(!b) return;
			// replace node to remove any previous listeners
			var nb = b.cloneNode(true);
			b.parentNode.replaceChild(nb, b);
		});
		var btnN = document.getElementById('btn-national');
		var btnP = document.getElementById('btn-provincial');
		var btnM = document.getElementById('btn-municipal');
		if(btnN) btnN.addEventListener('click', function(e){ e.preventDefault(); showView('national_view'); document.getElementById('national_view').scrollIntoView({behavior:'smooth', block:'start'}); });
		if(btnP) btnP.addEventListener('click', function(e){ e.preventDefault(); showView('provincial_view'); document.getElementById('provincial_view').scrollIntoView({behavior:'smooth', block:'start'}); });
		if(btnM) btnM.addEventListener('click', function(e){ e.preventDefault(); showView('municipal_view'); document.getElementById('municipal_view').scrollIntoView({behavior:'smooth', block:'start'}); });
		// initial
		var initial = (location.hash && location.hash.replace('#','')) || 'national_view';
		showView(initial, false);
		// respond to hash changes (back/forward)
		window.addEventListener('hashchange', function(){
			var id = (location.hash && location.hash.replace('#','')) || 'national_view';
			showView(id, false);
		});
	});
})();