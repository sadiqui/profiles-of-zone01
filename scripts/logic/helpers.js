/*******************************************************
                      General Use
********************************************************/

export const formatDate = (date) => {
    if (!date) return ""
    date = new Date(date)
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

export const writeErrorMessage = (elementID, message) => {
    const errorElement = document.getElementById(elementID);
    if (errorElement) {
        errorElement.textContent = message
    }
}

/*******************************************************
                         Visuals
********************************************************/

export const createSvgElement = (name, attributes) => {
    const svgNS = "http://www.w3.org/2000/svg";
    const element = document.createElementNS(svgNS, name);
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    return element;
}

export const drawAxes = (svg, width, height, padding, axisColor) => {
    // Create axes group for better organization
    const axesGroup = createSvgElement("g", { class: "axes" });
    
    // Add subtle drop shadow filter for depth
    const defs = createSvgElement("defs", {});
    const filter = createSvgElement("filter", { id: "axisGlow" });
    const feGaussianBlur = createSvgElement("feGaussianBlur", { 
        in: "SourceGraphic",
        stdDeviation: "1",
        result: "blur"
    });
    filter.appendChild(feGaussianBlur);
    defs.appendChild(filter);
    svg.appendChild(defs);
    
    // Create x-axis with improved styling
    const xAxis = createSvgElement("line", {
        x1: padding,
        y1: height - padding,
        x2: width - padding,
        y2: height - padding,
        stroke: axisColor,
        "stroke-width": "1.5",
        "stroke-opacity": "0.7",
        filter: "url(#axisGlow)"
    });
    
    // Create y-axis with improved styling
    const yAxis = createSvgElement("line", {
        x1: padding,
        y1: padding,
        x2: padding,
        y2: height - padding,
        stroke: axisColor,
        "stroke-width": "1.5",
        "stroke-opacity": "0.7",
        filter: "url(#axisGlow)"
    });
    
    axesGroup.appendChild(xAxis);
    axesGroup.appendChild(yAxis);
    svg.appendChild(axesGroup);
};

export const drawGridlines = (svg, width, height, padding, axisColor, maxAmount, minAmount, numYLines, unit) => {
    const chartHeight = height - 2 * padding;
    const step = chartHeight / numYLines;
    
    // Create a group for gridlines for better organization
    const gridGroup = createSvgElement("g", { class: "grid-lines" });
    
    // Draw horizontal gridlines with labels
    for (let i = 0; i <= numYLines; i++) {
        const y = padding + i * step;
        const amount = maxAmount - ((maxAmount - minAmount) * i) / numYLines;

        // Draw a more subtle, modern gridline
        const gridline = createSvgElement("line", {
            x1: padding,
            y1: y,
            x2: width - padding,
            y2: y,
            stroke: axisColor,
            "stroke-width": "0.8",
            "stroke-dasharray": "2,4",
            "stroke-opacity": "0.2",
            class: "grid-line"
        });
        
        gridGroup.appendChild(gridline);

        // Create a more modern label with better positioning
        const label = createSvgElement("text", {
            x: padding - 12,
            y: y + 4, // Adjusted for better vertical alignment
            "text-anchor": "end",
            "dominant-baseline": "middle",
            fill: axisColor,
            "font-size": "11",
            "font-family": "Inter, sans-serif",
            "font-weight": "500",
            "opacity": "0.8",
            class: "axis-label"
        });

        // Format the label text for better readability
        const displayValue = amount > 100 ? Math.round(amount / 1000) : Math.round(amount);
        label.textContent = `${displayValue} ${unit}`;
        gridGroup.appendChild(label);
    }
    
    svg.appendChild(gridGroup);
};

export const getMaxAmountPerSkill = (transactions) => {
    const maxSkillMap = new Map();

    transactions.forEach((transaction) => {
        const { type, amount } = transaction;

        if (!maxSkillMap.has(type) || maxSkillMap.get(type) < amount) {
            maxSkillMap.set(type, amount);
        }
    });

    return maxSkillMap;
}
