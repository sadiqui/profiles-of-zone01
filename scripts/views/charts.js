/*******************************************************
                   Projects chart
********************************************************/

import { fetchGraphQL } from "../logic/graphQL.js";
import { GET_USER_PROGRESS } from "../logic/graphQL.js";
import { formatDate } from "../logic/helpers.js";
import { createSvgElement, drawAxes, drawGridlines } from "../logic/helpers.js";

export const renderTransactionsChart = async () => {
    const token = localStorage.getItem("JWT");
    const data = await getTransactionsData("Module", token);
    if (!data) return;

    const { startAt, endAt, transactions } = data;

    const container = document.getElementById("transactions-chart");
    container.innerHTML = `
    <div class="card-header"></div>
    <h2 class="card-title">Progress Timeline</h2>
    `;

    const width = Math.min(900, container.clientWidth);
    const height = width * 0.5;
    const padding = 50;

    // Get theme colors from CSS variables
    const axisColor = getComputedStyle(document.documentElement).getPropertyValue("--text-color-secondary");
    const lineColor = getComputedStyle(document.documentElement).getPropertyValue("--primary-color");
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue("--bg-color-light");

    const svg = createSvgElement("svg", {
        width,
        height,
        viewBox: `0 0 ${width} ${height}`,
    });

    // Add subtle grid background for better visual appeal
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

    const dates = [new Date(startAt), ...transactions.map((t) => new Date(t.createdAt))];
    const maxDate = Math.max(...dates.map((date) => date.getTime()));
    const minDate = Math.min(new Date(startAt).getTime());

    let sumAmount = 0;
    const sumAmounts = [0, ...transactions.map((t) => {
        sumAmount += t.amount;
        return sumAmount;
    })];

    const maxAmount = Math.max(...sumAmounts);
    const minAmount = 0;

    const scales = {
        xScale: (date) => (date - minDate) / (maxDate - minDate) * (width - 2 * padding) + padding,
        yScale: (amount) => height - padding - (amount - minAmount) / (maxAmount - minAmount) * (height - 2 * padding),
    };    

    drawAxes(svg, width, height, padding, axisColor);
    drawGridlines(svg, width, height, padding, axisColor, maxAmount, minAmount, 5, "KB");
    plotDataPoints(svg, transactions, sumAmounts, scales, { lineColor, axisColor, bgColor }, startAt, height, padding);

    container.appendChild(svg);
};

const getTransactionsData = async (name, token) => {
    try {
        const response = await fetchGraphQL(GET_USER_PROGRESS, { name }, token);
        const event = response.data.event[0].object.events[0];
        const transactions = Array.isArray(response.data.transaction) ? response.data.transaction : [];
        return {
            startAt: event.startAt,
            endAt: event.endAt,
            transactions,
        };
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return null;
    }
};

const plotDataPoints = (svg, transactions, sumAmounts, scales, colors, startAt, height, padding) => {
    // Create a group for the graph elements
    const graphGroup = createSvgElement("g", { class: "graph-data" });
    
    // Create gradient for area under the curve
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
    
    // Create and add area under curve
    const areaPath = createSvgElement("path", {
        d: areaPathD,
        fill: "#10b981",
        "fill-opacity": "0.1",
        class: "area-path"
    });
    graphGroup.appendChild(areaPath);
    
    // Add points data
    let previousPoint = { x: scales.xScale(new Date(startAt).getTime()), y: height - padding };
    
    transactions.forEach((transaction, index) => {
        const x = scales.xScale(new Date(transaction.createdAt).getTime());
        const y = scales.yScale(sumAmounts[index + 1]);
        
        // Add to path strings
        pathD += ` L ${x} ${y}`;
        areaPathD += ` L ${x} ${y}`;
        
        // Draw line from previous point
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
        
        // Main point circle
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
        
        // Add hover events for interactive tooltip
        addHoverEvent(circle, transaction, x, y);
        
        previousPoint = { x, y };
    });
    
    // Complete area path
    areaPathD += ` L ${previousPoint.x} ${height - padding} Z`;
    areaPath.setAttribute("d", areaPathD);
    
    // Create and add line path
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

const addHoverEvent = (circle, transaction, x, y) => {
    const transactionInfo = document.getElementById("transaction-info");

    circle.addEventListener("mouseover", () => {
        const date = new Date(transaction.createdAt);
        transactionInfo.style.display = "block";
        transactionInfo.style.left = `${x + 150}px`;
        transactionInfo.style.top = `${y + 850}px`;
        transactionInfo.innerHTML = `
            <div class="transaction-header">${transaction.object.name}</div>
            <div class="transaction-details">
                <div><strong>Earned XP:</strong> ${transaction.amount / 1000} KB</div>
                <div><strong>Date:</strong> ${date.toDateString()}</div>
            </div>
        `;
    });

    circle.addEventListener("mouseout", () => {
        transactionInfo.style.display = "none";
    });
};

/*******************************************************
                   Skills Chart
********************************************************/

import { GET_USER_SKILLS } from "../logic/graphQL.js";
import { getMaxAmountPerSkill } from "../logic/helpers.js";

export const renderSkillsChart = async () => {
    const token = localStorage.getItem("JWT");
    let skillsMap = [];

    await fetchGraphQL(GET_USER_SKILLS, {}, token)
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
            if (typeof error === "string" && error.includes('JWTExpired')) handleLogout();
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
        label.textContent = skill.replace("skill_", "").charAt(0).toUpperCase() + 
                           skill.replace("skill_", "").slice(1);
        barsGroup.appendChild(label);

        // Add value labels with better styling
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
