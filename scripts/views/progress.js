/*******************************************************
                   Chart: Progress
********************************************************/

import { createSVG, drawAxes, drawGrids } from "../logic/helpers.js";
import { graphQLService, QUERIES } from "../logic/graphQL.js";

// Fetch and render progress timeline chart
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
    const svg = createSVG("svg", {
        width,
        height,
        viewBox: `0 0 ${width} ${height}`,
    });

    // Add background
    const bgRect = createSVG("rect", {
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
    drawGrids(svg, width, height, padding, axisColor, maxAmount, minAmount, 5, "KB");
    linkChartDots(svg, transactions, sumAmounts, scales, { lineColor, axisColor, bgColor }, startAt, height, padding);

    container.appendChild(svg);
};

// Fetch progress data from API
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

// Plot data points on progress chart
const linkChartDots = (svg, transactions, sumAmounts, scales, colors, startAt, height, padding) => {
    // Create graph group
    const graphGroup = createSVG("g", { class: "graph-data" });

    // Create gradient for area
    const defs = svg.querySelector("defs") || createSVG("defs", {});
    const gradient = createSVG("linearGradient", {
        id: "areaGradient",
        x1: "0%",
        y1: "0%",
        x2: "0%",
        y2: "100%"
    });

    const stop1 = createSVG("stop", {
        offset: "0%",
        "stop-color": colors.lineColor,
        "stop-opacity": "0.3"
    });

    const stop2 = createSVG("stop", {
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
    const areaPath = createSVG("path", {
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
        const line = createSVG("line", {
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
        const circle = createSVG("circle", {
            cx: x,
            cy: y,
            r: 5,
            fill: colors.lineColor,
            stroke: colors.bgColor || "#ffffff",
            "stroke-width": "2",
            class: "data-point"
        });

        // Inner highlight circle
        const innerCircle = createSVG("circle", {
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
    const linePath = createSVG("path", {
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

// Add tooltip events to data points
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