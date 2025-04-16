/*******************************************************
                   Chart: Skills
********************************************************/

import { createSVG, drawAxes, drawGrids } from "../logic/helpers.js";
import { graphQLService, QUERIES } from "../logic/graphQL.js";
import { logout } from "../logic/handles.js";

// Fetch and render skills chart
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
                skillsMap = Array.from(getSkillAmount(transactions).entries());
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

    const svg = createSVG("svg", {
        width,
        height,
        viewBox: `0 0 ${width} ${height}`,
    });

    // Add subtle grid background
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

    const maxAmount = 100;
    const minAmount = 0;

    // Draw axes and gridlines
    drawAxes(svg, width, height, padding, axisColor);
    drawGrids(svg, width, height, padding, axisColor, maxAmount, minAmount, 10, "%");

    // Create gradients for bars
    const defs = svg.querySelector("defs") || createSVG("defs", {});

    const barGradient = createSVG("linearGradient", {
        id: "barGradient",
        x1: "0%",
        y1: "0%",
        x2: "0%",
        y2: "100%"
    });

    const stop1 = createSVG("stop", {
        offset: "0%",
        "stop-color": barColorBase
    });

    const stop2 = createSVG("stop", {
        offset: "100%",
        "stop-color": secondaryColor
    });

    barGradient.appendChild(stop1);
    barGradient.appendChild(stop2);
    defs.appendChild(barGradient);

    // Create filter for glow effect
    const glowFilter = createSVG("filter", {
        id: "barGlow",
        height: "130%"
    });

    const feGaussianBlur = createSVG("feGaussianBlur", {
        in: "SourceGraphic",
        stdDeviation: "3",
        result: "blur"
    });

    const feColorMatrix = createSVG("feColorMatrix", {
        in: "blur",
        mode: "matrix",
        values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7",
        result: "glow"
    });

    const feMerge = createSVG("feMerge", {});
    const feMergeNode1 = createSVG("feMergeNode", { in: "glow" });
    const feMergeNode2 = createSVG("feMergeNode", { in: "SourceGraphic" });

    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);

    glowFilter.appendChild(feGaussianBlur);
    glowFilter.appendChild(feColorMatrix);
    glowFilter.appendChild(feMerge);

    defs.appendChild(glowFilter);
    svg.appendChild(defs);

    // Create group for bars
    const barsGroup = createSVG("g", { class: "skill-bars" });

    // Draw bars for each skill with animation setup
    skillsMap.forEach(([skill, amount], index) => {
        // Calculate bar dimensions
        const fullBarHeight = (maxAmount / maxAmount) * (height - 2 * padding);
        const barHeight = (amount / maxAmount) * (height - 2 * padding);
        const x = padding + index * barWidth;
        const y = height - padding - barHeight;

        // Create background bar (full height) for better visual
        const bgBar = createSVG("rect", {
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
        const bar = createSVG("rect", {
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
        const label = createSVG("text", {
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
        const valueLabel = createSVG("text", {
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

// Get maximum amount per skill
const getSkillAmount = (transactions) => {
    const maxSkillMap = new Map();

    transactions.forEach((transaction) => {
        const { type, amount } = transaction;

        if (!maxSkillMap.has(type) || maxSkillMap.get(type) < amount) {
            maxSkillMap.set(type, amount);
        }
    });

    return maxSkillMap;
};