import { graphQLService, QUERIES } from "../logic/graphQLService.js";
import { createSvgElement, getMaxAmountPerSkill } from "../logic/uiHelper.js";
import { logout } from "../logic/authManager.js";

/**
 * Chart Rendering Components
 */

/**
 * Draw axes on an SVG element
 * @param {SVGElement} svg - Target SVG element
 * @param {Number} width - Chart width
 * @param {Number} height - Chart height
 * @param {Number} padding - Chart padding
 * @param {String} axisColor - Axis color
 */
const drawAxes = (svg, width, height, padding, axisColor) => {
    // Create axes group
    const axesGroup = createSvgElement("g", { class: "axes" });

    // Add drop shadow filter
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

    // Create x-axis
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

    // Create y-axis
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

/**
 * Draw gridlines on an SVG element
 * @param {SVGElement} svg - Target SVG element
 * @param {Number} width - Chart width
 * @param {Number} height - Chart height
 * @param {Number} padding - Chart padding
 * @param {String} axisColor - Axis color
 * @param {Number} maxAmount - Maximum data value
 * @param {Number} minAmount - Minimum data value
 * @param {Number} numYLines - Number of horizontal gridlines
 * @param {String} unit - Value unit for labels
 */
const drawGridlines = (svg, width, height, padding, axisColor, maxAmount, minAmount, numYLines, unit) => {
    const chartHeight = height - 2 * padding;
    const step = chartHeight / numYLines;

    // Create gridlines group
    const gridGroup = createSvgElement("g", { class: "grid-lines" });

    // Draw horizontal gridlines with labels
    for (let i = 0; i <= numYLines; i++) {
        const y = padding + i * step;
        const amount = maxAmount - ((maxAmount - minAmount) * i) / numYLines;

        // Draw gridline
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

        // Create label
        const label = createSvgElement("text", {
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

/**
 * Plot data points on progress chart
 * @param {SVGElement} svg - Target SVG element
 * @param {Array} transactions - Transaction data
 * @param {Array} sumAmounts - Cumulative amounts
 * @param {Object} scales - X and Y scaling functions
 * @param {Object} colors - Chart colors
 * @param {String} startAt - Start date
 * @param {Number} height - Chart height
 * @param {Number} padding - Chart padding
 */
const linkChartDots = (svg, transactions, sumAmounts, scales, colors, startAt, height, padding) => {
    // Create graph group
    const graphGroup = createSvgElement("g", { class: "graph-data" });

    // Create gradient for area
    const defs = svg.querySelector("defs") || createSvgElement("defs", {});
    const gradient = createSvgElement("linearGradient", {
        id: "areaGradient",
        x1: "0%",
        y1: "0%",
        x2: "0%",
        y2: "100%"
    });

    const stop1 = createSvgElement("stop", {
        offset: "0%",
        "stop-color": colors.lineColor,
        "stop-opacity": "0.3"
    });

    const stop2 = createSvgElement("stop", {
        offset: "100%",
        "stop-color": colors.lineColor,
        "stop-opacity": "0.05"
    });

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.appendChild(defs);

    // Create path for line
    let pathD = `M ${scales.xScale(new Date(startAt).getTime())} ${height - padding}`;
    let areaPathD = pathD;

    // Create area under curve
    const areaPath = createSvgElement("path", {
        d: areaPathD,
        fill: "#10b981",
        "fill-opacity": "0.1",
        class: "area-path"
    });
    graphGroup.appendChild(areaPath);

    // Add data points
    let previousPoint = {
        x: scales.xScale(new Date(startAt).getTime()),
        y: height - padding
    };

    transactions.forEach((transaction, index) => {
        const x = scales.xScale(new Date(transaction.createdAt).getTime());
        const y = scales.yScale(sumAmounts[index + 1]);

        // Add to path strings
        pathD += ` L ${x} ${y}`;
        areaPathD += ` L ${x} ${y}`;

        // Draw connecting line
        const line = createSvgElement("line", {
            x1: previousPoint.x,
            y1: previousPoint.y,
            x2: x,
            y2: y,
            stroke: colors.lineColor,
            "stroke-width": "2",
            "stroke-opacity": "0.7"
        });
        graphGroup.appendChild(line);

        // Draw data point circle
        const circle = createSvgElement("circle", {
            cx: x,
            cy: y,
            r: 5,
            fill: colors.lineColor,
            stroke: colors.bgColor || "#ffffff",
            "stroke-width": "2",
            class: "data-point"
        });

        // Inner highlight circle
        const innerCircle = createSvgElement("circle", {
            cx: x,
            cy: y,
            r: 2,
            fill: "white",
            class: "point-highlight"
        });

        graphGroup.appendChild(circle);
        graphGroup.appendChild(innerCircle);

        // Add tooltip events
        addTooltipEvents(circle, transaction, x, y);

        previousPoint = { x, y };
    });

    // Complete area path
    areaPathD += ` L ${previousPoint.x} ${height - padding} Z`;
    areaPath.setAttribute("d", areaPathD);

    // Add line path
    const linePath = createSvgElement("path", {
        d: pathD,
        fill: "none",
        stroke: colors.lineColor,
        "stroke-width": "2.5",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        class: "line-path"
    });
    graphGroup.appendChild(linePath);

    svg.appendChild(graphGroup);
};

/**
 * Add tooltip events to data points
 * @param {SVGElement} element - Element to attach events to
 * @param {Object} transaction - Transaction data
 * @param {Number} x - X position
 * @param {Number} y - Y position
 */
const addTooltipEvents = (element, transaction, x, y) => {
    const tooltipInfo = document.getElementById("transaction-info");

    element.addEventListener("mouseover", () => {
        const date = new Date(transaction.createdAt);
        tooltipInfo.style.display = "block";
        tooltipInfo.style.left = `${x + 150}px`;
        tooltipInfo.style.top = `${y + 850}px`;
        tooltipInfo.innerHTML = `
        <div class="transaction-header">${transaction.object.name}</div>
        <div class="transaction-details">
          <div><strong>Earned XP:</strong> ${transaction.amount / 1000} KB</div>
          <div><strong>Date:</strong> ${date.toDateString()}</div>
        </div>
      `;
    });

    element.addEventListener("mouseout", () => {
        tooltipInfo.style.display = "none";
    });
};

/**
 * Fetch and render progress timeline chart
 */
export const renderProgressChart = async () => {
    const token = localStorage.getItem("JWT");
    const chartData = await fetchProgressData("Module", token);

    if (!chartData) return;

    const { startAt, endAt, transactions } = chartData;

    // Set up container
    const container = document.getElementById("transactions-chart");
    container.innerHTML = `
      <div class="card-header"></div>
      <h2 class="card-title">Progress Timeline</h2>
    `;

    // Define chart dimensions
    const width = Math.min(900, container.clientWidth);
    const height = width * 0.5;
    const padding = 50;

    // Get theme colors
    const axisColor = getComputedStyle(document.documentElement).getPropertyValue("--text-color-secondary");
    const lineColor = getComputedStyle(document.documentElement).getPropertyValue("--primary-color");
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue("--bg-color-light");

    // Create SVG
    const svg = createSvgElement("svg", {
        width,
        height,
        viewBox: `0 0 ${width} ${height}`,
    });

    // Add background
    const bgRect = createSvgElement("rect", {
        x: padding,
        y: padding,
        width: width - 2 * padding,
        height: height - 2 * padding,
        fill: "rgba(255, 255, 255, 0.02)",
        rx: "4",
        ry: "4"
    });
    svg.appendChild(bgRect);

    // Calculate data ranges
    const dates = [new Date(startAt), ...transactions.map(t => new Date(t.createdAt))];
    const maxDate = Math.max(...dates.map(date => date.getTime()));
    const minDate = Math.min(new Date(startAt).getTime());

    // Calculate cumulative amounts
    let sumAmount = 0;
    const sumAmounts = [0, ...transactions.map(t => {
        sumAmount += t.amount;
        return sumAmount;
    })];

    const maxAmount = Math.max(...sumAmounts);
    const minAmount = 0;

    // Create scaling functions
    const scales = {
        xScale: (date) => (date - minDate) / (maxDate - minDate) * (width - 2 * padding) + padding,
        yScale: (amount) => height - padding - (amount - minAmount) / (maxAmount - minAmount) * (height - 2 * padding),
    };

    // Draw chart components
    drawAxes(svg, width, height, padding, axisColor);
    drawGridlines(svg, width, height, padding, axisColor, maxAmount, minAmount, 5, "KB");
    linkChartDots(svg, transactions, sumAmounts, scales, { lineColor, axisColor, bgColor }, startAt, height, padding);

    container.appendChild(svg);
};

/**
 * Fetch progress data from API
 * @param {String} name - Module name
 * @param {String} token - Authentication token
 * @returns {Object|null} Progress data or null on error
 */
const fetchProgressData = async (name, token) => {
    try {
        const response = await graphQLService.execute(QUERIES.USER_PROGRESS, { name }, token);
        const event = response.data.event[0].object.events[0];
        const transactions = Array.isArray(response.data.transaction) ? response.data.transaction : [];

        return {
            startAt: event.startAt,
            endAt: event.endAt,
            transactions,
        };
    } catch (error) {
        console.error("Error fetching progress data:", error);
        return null;
    }
};

/**
 * Fetch and render skills chart
 */
export const renderSkillsChart = async () => {
    const token = localStorage.getItem("JWT");
    let skillsMap = [];

    await graphQLService.execute(QUERIES.USER_SKILLS, {}, token)
        .then((response) => {
            if (Array.isArray(response.errors)) {
                throw response.errors[0].message;
            }
            const transactions = response?.data.user[0].transactions;
            if (response && Array.isArray(transactions)) {
                skillsMap = Array.from(getMaxAmountPerSkill(transactions).entries());
            } else {
                throw new Error("Invalid data received!");
            }
        })
        .catch((error) => {
            if (typeof error === "string" && error.includes('JWTExpired')) logout();
            console.error(error);
        });

    const container = document.getElementById("skills-chart");
    container.innerHTML = `
    <div class="card-header"></div>
    <h2 class="card-title">Gained Skills</h2>
    `;

    const width = Math.min(900, container.clientWidth);
    const height = width * 0.6;
    const padding = 50;
    const barWidth = (width - 2 * padding) / skillsMap.length;

    // Get colors from CSS variables
    const axisColor = getComputedStyle(document.documentElement).getPropertyValue("--text-color-secondary");
    const barColorBase = getComputedStyle(document.documentElement).getPropertyValue("--primary-color");
    const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue("--secondary-color");

    const svg = createSvgElement("svg", {
        width,
        height,
        viewBox: `0 0 ${width} ${height}`,
    });

    // Add subtle grid background
    const bgRect = createSvgElement("rect", {
        x: padding,
        y: padding,
        width: width - 2 * padding,
        height: height - 2 * padding,
        fill: "rgba(255, 255, 255, 0.02)",
        rx: "4",
        ry: "4"
    });
    svg.appendChild(bgRect);

    const maxAmount = 100;
    const minAmount = 0;

    // Draw axes and gridlines
    drawAxes(svg, width, height, padding, axisColor);
    drawGridlines(svg, width, height, padding, axisColor, maxAmount, minAmount, 10, "%");

    // Create gradients for bars
    const defs = svg.querySelector("defs") || createSvgElement("defs", {});

    const barGradient = createSvgElement("linearGradient", {
        id: "barGradient",
        x1: "0%",
        y1: "0%",
        x2: "0%",
        y2: "100%"
    });

    const stop1 = createSvgElement("stop", {
        offset: "0%",
        "stop-color": barColorBase
    });

    const stop2 = createSvgElement("stop", {
        offset: "100%",
        "stop-color": secondaryColor
    });

    barGradient.appendChild(stop1);
    barGradient.appendChild(stop2);
    defs.appendChild(barGradient);

    // Create filter for glow effect
    const glowFilter = createSvgElement("filter", {
        id: "barGlow",
        height: "130%"
    });

    const feGaussianBlur = createSvgElement("feGaussianBlur", {
        in: "SourceGraphic",
        stdDeviation: "3",
        result: "blur"
    });

    const feColorMatrix = createSvgElement("feColorMatrix", {
        in: "blur",
        mode: "matrix",
        values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7",
        result: "glow"
    });

    const feMerge = createSvgElement("feMerge", {});
    const feMergeNode1 = createSvgElement("feMergeNode", { in: "glow" });
    const feMergeNode2 = createSvgElement("feMergeNode", { in: "SourceGraphic" });

    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);

    glowFilter.appendChild(feGaussianBlur);
    glowFilter.appendChild(feColorMatrix);
    glowFilter.appendChild(feMerge);

    defs.appendChild(glowFilter);
    svg.appendChild(defs);

    // Create group for bars
    const barsGroup = createSvgElement("g", { class: "skill-bars" });

    // Draw bars for each skill with animation setup
    skillsMap.forEach(([skill, amount], index) => {
        // Calculate bar dimensions
        const fullBarHeight = (maxAmount / maxAmount) * (height - 2 * padding);
        const barHeight = (amount / maxAmount) * (height - 2 * padding);
        const x = padding + index * barWidth;
        const y = height - padding - barHeight;

        // Create background bar (full height) for better visual
        const bgBar = createSvgElement("rect", {
            x: x + barWidth * 0.1,
            y: padding,
            width: barWidth * 0.8,
            height: fullBarHeight,
            fill: "rgba(255, 255, 255, 0.01)",
            rx: "4",
            ry: "4"
        });
        barsGroup.appendChild(bgBar);

        // Create main bar with gradient and rounded corners
        const bar = createSvgElement("rect", {
            x: x + barWidth * 0.1,
            y: height - padding - 0, // Start at zero height for animation
            width: barWidth * 0.8,
            height: 0, // Start at zero height for animation
            fill: "url(#barGradient)",
            rx: "4",
            ry: "4",
            filter: "url(#barGlow)",
            "data-original-height": barHeight,
            "data-original-y": y,
            class: "skill-bar"
        });
        barsGroup.appendChild(bar);

        // Add skill labels with better styling
        const label = createSvgElement("text", {
            x: x + barWidth * 0.5,
            y: height - padding + 20,
            "text-anchor": "middle",
            "font-size": "12",
            "font-family": "Inter, sans-serif",
            "font-weight": "500",
            fill: axisColor,
            opacity: "0.9"
        });
        // Format skill name for better display
        label.textContent = skill.replace("skill_", "")
            .charAt(0).toUpperCase() +
            skill.replace("skill_", "").slice(1);
        barsGroup.appendChild(label);

        // Add value label
        const valueLabel = createSvgElement("text", {
            x: x + barWidth * 0.5,
            y: y - 10,
            "text-anchor": "middle",
            "font-size": "14",
            "font-family": "Inter, sans-serif",
            "font-weight": "600",
            fill: "#ffffff",
            opacity: "0", // Start hidden for animation
            class: "value-label",
            "data-original-y": y - 10
        });
        valueLabel.textContent = amount + "%";
        barsGroup.appendChild(valueLabel);
    });

    svg.appendChild(barsGroup);
    container.appendChild(svg);

    // Animate bars after chart is added to DOM
    setTimeout(() => {
        const bars = svg.querySelectorAll(".skill-bar");
        const labels = svg.querySelectorAll(".value-label");

        bars.forEach((bar, index) => {
            const originalHeight = parseFloat(bar.getAttribute("data-original-height"));
            const originalY = parseFloat(bar.getAttribute("data-original-y"));

            // Animate height and position
            setTimeout(() => {
                bar.style.transition = "height 1s ease-out, y 1s ease-out";
                bar.setAttribute("height", originalHeight);
                bar.setAttribute("y", originalY);

                // Also animate the value label
                if (labels[index]) {
                    labels[index].style.transition = "opacity 0.5s ease-in";
                    labels[index].setAttribute("opacity", "1");
                }
            }, index * 100); // Stagger animation
        });
    }, 300);
};