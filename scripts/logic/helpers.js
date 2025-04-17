/*******************************************************
                      General Use
********************************************************/

// Display an error message in the specified element
export const displayError = (elementId, message) => {
    const errorElement = document.getElementById(elementId);
    if (errorElement) errorElement.textContent = message;
};

// Check if on mobile, if yes deliver a warning
export const showMobileWarning = () => {
    function isMobileDevice() {
        const isMobileWidth = window.innerWidth < 600;
        const isMobileAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return isMobileWidth && isMobileAgent;
    }

    const mobileWarning = document.getElementById('mobile-warning');

    if (isMobileDevice() && mobileWarning) {
        mobileWarning.style.display = 'block';
        mobileWarning.style.display = 'flex';
        return true; // Warning shown
    }

    return false; // No warning needed
};

/*******************************************************
                         Visuals
********************************************************/

// Create an SVG element with attributes
export const createSVG = (name, attributes = {}) => {
    const svgNS = "http://www.w3.org/2000/svg";
    const element = document.createElementNS(svgNS, name);

    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });

    return element;
};

// Draw axes on an SVG element
export const drawAxes = (svg, width, height, padding, axisColor) => {
    // Create axes group
    const axesGroup = createSVG("g", { class: "axes" });

    // Add drop shadow filter
    const defs = createSVG("defs", {});
    const filter = createSVG("filter", { id: "axisGlow" });
    const feGaussianBlur = createSVG("feGaussianBlur", {
        in: "SourceGraphic",
        stdDeviation: "1",
        result: "blur"
    });

    filter.appendChild(feGaussianBlur);
    defs.appendChild(filter);
    svg.appendChild(defs);

    // Create x-axis
    const xAxis = createSVG("line", {
        x1: padding,
        y1: height - padding,
        x2: width - padding,
        y2: height - padding,
        stroke: axisColor,
        "stroke-width": "1.5",
        "stroke-opacity": "0.7",
        filter: "url(#axisGlow)"
    });

    // Create y-axis
    const yAxis = createSVG("line", {
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

// Draw gridlines on an SVG element
export const drawGrids = (svg, width, height, padding, axisColor, maxAmount, minAmount, numYLines, unit) => {
    const chartHeight = height - 2 * padding;
    const step = chartHeight / numYLines;

    // Create gridlines group
    const gridGroup = createSVG("g", { class: "grid-lines" });

    // Draw horizontal gridlines with labels
    for (let i = 0; i <= numYLines; i++) {
        const y = padding + i * step;
        const amount = maxAmount - ((maxAmount - minAmount) * i) / numYLines;

        // Draw gridline
        const gridline = createSVG("line", {
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

        // Create label
        const label = createSVG("text", {
            x: padding - 12,
            y: y + 4,
            "text-anchor": "end",
            "dominant-baseline": "middle",
            fill: axisColor,
            "font-size": "11",
            "font-family": "Inter, sans-serif",
            "font-weight": "500",
            "opacity": "0.8",
            class: "axis-label"
        });

        // Format label text
        const displayValue = amount > 100 ? Math.round(amount / 1000) : Math.round(amount);
        label.textContent = `${displayValue} ${unit}`;
        gridGroup.appendChild(label);
    }

    svg.appendChild(gridGroup);
};