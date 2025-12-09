document.addEventListener('DOMContentLoaded', function() {

    // -------------------------------------------------------
    // 1. MASTER CONFIGURATION LIST
    // Define all of your charts here.
    // -------------------------------------------------------
    const allCharts = [
        {
            // CHART 1: Counting entries per year
            // Note: updated to match workspace files
            canvasId: 'leverschart',      // ID of the <canvas> element in your HTML
            dataFile: './data/actions.json',// Data source (existing in workspace)
            labelKey: 'Province',         // Use 'Province' field from actions.json
            valueCalculation: 'count',     // <-- NEW: tells the builder to count entries
            chartType: 'bar',
            color: 'rgba(54, 162, 235, 0.5)',
            label: '# of actions'
        },
        // INSERT MORE CHARTS / FIGURES HERE
    ];


    // -------------------------------------------------------
    // 2. THE BUILDER LOOP
    // This loops through your list and builds each chart.
    // -------------------------------------------------------
    allCharts.forEach(config => {
        buildChart(config);
    });


    // -------------------------------------------------------
    // 3. THE REUSABLE CHART BUILDER FUNCTION
    // This handles the fetching, aggregation, and rendering.
    // -------------------------------------------------------
    function buildChart(config) {
        
        const ctx = document.getElementById(config.canvasId);
        if (!ctx) return; 

        fetch(config.dataFile)
            .then(response => response.json())
            .then(rawData => {
                
                // --- AGGREGATION STEP ---
                let labels, values;

                if (config.valueCalculation === 'count') {
                    // Use the helper function to count entries based on the labelKey
                    const aggregatedData = aggregateCounts(rawData, config.labelKey);
                    
                    // The aggregated data is an object like: {2023: 2, 2024: 4}
                    labels = Object.keys(aggregatedData);
                    values = Object.values(aggregatedData);
                } else {
                    // Fallback for standard (non-aggregated) data, if needed
                    console.warn(`Unknown calculation type: ${config.valueCalculation}. Assuming data is pre-aggregated.`);
                    labels = rawData.map(item => item[config.labelKey]);
                    values = rawData.map(item => item[config.valueKey]);
                }


                // --- CHART.JS RENDERING STEP ---
                new Chart(ctx, {
                    type: config.chartType,
                    data: {
                        labels: labels, // Aggregated labels (e.g., ['2023', '2024'])
                        datasets: [{
                            label: config.label,
                            data: values, // Aggregated values (e.g., [2, 4])
                            backgroundColor: config.color,
                            borderColor: config.color.replace('0.5', '1'),
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: config.label 
                            }
                        },
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }
                });
            })
            .catch(err => console.error(`Error loading data for ${config.canvasId}:`, err));
    }


    // -------------------------------------------------------
    // 4. HELPER FUNCTION FOR AGGREGATION
    // This is the raw JavaScript that does the counting.
    // -------------------------------------------------------
    /**
     * Takes a raw array and counts entries based on a specific key.
     * @param {Array<Object>} rawData - The raw array of objects from the JSON.
     * @param {string} key - The property to group and count by (e.g., 'year').
     * @returns {Object<string, number>} - An object (e.g., {2023: 2, 2024: 2})
     */
    function aggregateCounts(rawData, key) {
        return rawData.reduce((accumulator, item) => {
            const groupKey = item[key];
            // Uses the property as the key; increments if it exists, otherwise starts at 1.
            accumulator[groupKey] = (accumulator[groupKey] || 0) + 1;
            return accumulator;
        }, {});
    }

});