
d3.text("abalone.data").then(function(text) {
    const data = d3.csvParseRows(text);
    const labels = [
        "Length",
        "Diameter",
        "Height",
        "Whole_weight",
        "Shucked_weight",
        "Viscera_weight",
        "Shell_weight",
        "Rings"
    ];
    
    // Extract data by sex (M, F, I)
    const maleData = data.filter(d => d[0] === "M").map(d => d.slice(1).map(Number));
    const femaleData = data.filter(d => d[0] === "F").map(d => d.slice(1).map(Number));
    const infantData = data.filter(d => d[0] === "I").map(d => d.slice(1).map(Number));

    // Create correlation matrices for each sex
    const maleMatrix = calculateCorrelationMatrix(maleData);
    const femaleMatrix = calculateCorrelationMatrix(femaleData);
    const infantMatrix = calculateCorrelationMatrix(infantData);

    // Create and render correlation matrices
    createCorrelationMatrix("Male", maleMatrix, "maleMatrix");
    createCorrelationMatrix("Female", femaleMatrix, "femaleMatrix");
    createCorrelationMatrix("Infant", infantMatrix, "infantMatrix");
    
    function calculateCorrelationMatrix(data) {
        const dimensions = data[0].length;
        const correlations = Array.from({ length: dimensions }, () => Array(dimensions).fill(0));
        
        for (let i = 0; i < dimensions; i++) {
            for (let j = i; j < dimensions; j++) {
                const dim1 = data.map(d => d[i]);
                const dim2 = data.map(d => d[j]);
    
                const meanDim1 = d3.mean(dim1);
                const meanDim2 = d3.mean(dim2);
    
                let cov = 0;
                for (let k = 0; k < data.length; k++) {
                    cov += (dim1[k] - meanDim1) * (dim2[k] - meanDim2);
                }
                cov /= (data.length - 1); // Use (n-1) as the denominator for sample covariance
    
                const stdDevDim1 = Math.sqrt(d3.variance(dim1));
                const stdDevDim2 = Math.sqrt(d3.variance(dim2));
    
                const correlation = cov / (stdDevDim1 * stdDevDim2);
                
                correlations[i][j] = correlation;
                correlations[j][i] = correlation;
            }
        }
        return correlations;
    }

    // Function to create and render a correlation matrix
    function createCorrelationMatrix(title, correlationMatrix, containerId) {
        // setting
        const svgWidth = 700;
        const svgHeight = 700
        const cellSize = 50;
        const padding = 5;
        const labelX = (svgWidth - cellSize * correlationMatrix.length) / 2;
        const labelY = 30;
        const matrixX = labelX + cellSize;
        const matrixY = labelY + cellSize;
        const legendContainerX = matrixX + cellSize * correlationMatrix.length + 20;
        const legendContainerY = matrixY;

        // Matrix container
        const container = d3.select(`#${containerId}`);
        container.append("h2").text(title);
        const svg = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight);

        
        
        // Init the ColorScale
        const colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
            .domain([0, 1]);

        ///* Legend *///
        // Init the legend
        const legendContainer = svg.append("g")
            .attr("transform", `translate(${legendContainerX}, ${legendContainerY})`);

        // Setting the linearGradient
        const defs = legendContainer.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", "color-gradient")
            .attr("x1", "0%")
            .attr("x2", "0%")
            .attr("y1", "0%")
            .attr("y2", "100%");
        linearGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", colorScale(1));
        linearGradient.append("stop")
            .attr("offset", "20%")
            .attr("stop-color", colorScale(0.8));
        linearGradient.append("stop")
            .attr("offset", "40%")
            .attr("stop-color", colorScale(0.6));
        linearGradient.append("stop")
            .attr("offset", "60%")
            .attr("stop-color", colorScale(0.4));
        linearGradient.append("stop")
            .attr("offset", "80%")
            .attr("stop-color", colorScale(0.2));
        linearGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", colorScale(0));

        // Draw legendContainer
        legendContainer.append("rect")
            .attr("width", 20)
            .attr("height", 200)
            .style("fill", "url(#color-gradient)");

        // Init scale
        const legendScale = d3.scaleLinear()
            .domain([0, 1])
            .range([200, 0]);

        // scale label (5)
        legendContainer.selectAll(".tick-label")
            .data(legendScale.ticks(5))
            .enter().append("text")
            .attr("class", "tick-label")
            .attr("x", 25)
            .attr("y", d => legendScale(d))
            .attr("dy", "0.35em")
            .text(d => d3.format(".2f")(d));

        ///* Labels *///
        // Left label
        svg.selectAll(".colLabels")
            .data(labels)
            .enter().append("text")
            .text(d => d)
            .attr("class", "colLabels")
            .attr("x", (d, i) => labelX + (i-1) * cellSize + cellSize / 100)
            .attr("y", labelY + cellSize * correlationMatrix.length + 75)
            .style("text-anchor", "middle")
            .style("font-weight", "bold")
            .style("font-size", "12px")
            .attr("transform", (d, i) => `rotate(-90, ${labelX + i * cellSize + cellSize / 2}, ${labelY + cellSize * correlationMatrix.length + 20})`); // 旋转文本使其垂直


        // Bottom label
        svg.selectAll(".rowLabel")
            .data(labels)
            .enter().append("text")
            .text(d => d)
            .attr("class", "rowLabel")
            .attr("x", labelX)
            .attr("y", (d, i) => labelY + i * cellSize + cellSize + 20)
            .style("text-anchor", "end")
            .style("font-weight", "bold")
            .style("font-size", "12px");

        ///* Matrix *///
        // Init cells
        const cells = svg.selectAll(".row")
            .data(correlationMatrix)
            .enter().append("g")
            .attr("class", "row")
            .attr("transform", (d, i) => `translate(${matrixX}, ${matrixY + i * cellSize})`);
        
        const rect = cells.selectAll(".cell")
            .data(d => d)
            .enter().append("rect")
            .attr("class", "cell")
            .attr("x", (d, i) => i * cellSize)
            .attr("width", cellSize - padding)
            .attr("height", cellSize - padding)
            .style("fill", function(d) {
                return colorScale(d);
            })
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut);
    }
});

// MouseOver => Enlarge and show info
function handleMouseOver(event, d) {
    // Enlarge the cell
    d3.select(this)
        .transition()
        .duration(200)
        .attr("transform", "scale(1.1) translate(0.5,0.5)");

    // Get the value
    const cellValue = d;

    // Create info box
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ddd")
        .style("padding", "10px")
        .style("opacity", 0.9);

    // Info box HTML
    tooltip.html(`Value: ${d3.format(".2f")(cellValue)}`);

    // Info box CSS
    tooltip.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");
}

// MouseOut => Shrink and remove info
function handleMouseOut() {
    // Shrink the cell
    d3.select(this)
        .transition()
        .duration(200)
        .attr("transform", "scale(1) translate(0,0)");

    // Remove the info box
    d3.select(".tooltip").remove();
}