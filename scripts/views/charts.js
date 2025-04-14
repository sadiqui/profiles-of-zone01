/*******************************************************
                   Projects chart
********************************************************/

import { fetchGraphQL } from "../logic/graphQL.js";
import { GET_TRANSACTIONS } from "../logic/graphQL.js";
import { formatDate } from "../logic/helpers.js";
import { createSvgElement, drawAxes, drawGridlines } from "../logic/helpers.js";

export const renderTransactionsChart = async () => {
    const token = localStorage.getItem("JWT");
    const name = "Module";

    const data = await getTransactionsData(name, token);
    if (!data) return;

    const { startAt, endAt, transactions } = data;

    const container = document.getElementById("transactions-chart");
    container.innerHTML = `
        <div class="chart-border"></div>
        <div class="transactions-chart-info">
            <h2 class="event-name">${name}</h2>
            <span class="event-date">${formatDate(startAt)} -> ${formatDate(endAt)}</span>
        </div>
    `;

    const width = Math.min(900, container.clientWidth);
    const height = width * 0.5;
    const padding = 50;

    const axisColor = getComputedStyle(document.documentElement).getPropertyValue("--text-color");
    const lineColor = getComputedStyle(document.documentElement).getPropertyValue("--primary-color");
    const pointColor = lineColor;

    const svg = createSvgElement("svg", {
        width,
        height,
        viewBox: `0 0 ${width} ${height}`,
    });

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
    plotDataPoints(svg, transactions, sumAmounts, scales, { lineColor, pointColor }, startAt, height, padding);

    container.appendChild(svg);
};


const plotDataPoints = (svg, transactions, sumAmounts, scales, colors, startAt, height, padding) => {
    let previousPoint = { x: scales.xScale(new Date(startAt).getTime()), y: height - padding };

    transactions.forEach((transaction, index) => {
        const x = scales.xScale(new Date(transaction.createdAt).getTime());
        const y = scales.yScale(sumAmounts[index + 1]);

        // Draw line from previous point
        const line = createSvgElement("line", {
            x1: previousPoint.x,
            y1: previousPoint.y,
            x2: x,
            y2: y,
            stroke: colors.lineColor,
            "stroke-width": "1",
        });
        svg.appendChild(line);

        // Draw point
        const circle = createSvgElement("circle", {
            cx: x,
            cy: y,
            r: 3,
            fill: colors.pointColor,
        });
        svg.appendChild(circle);

        // Add hover event to show transaction info
        addHoverEvent(circle, transaction, x, y);

        previousPoint = { x, y };
    });
};

const getTransactionsData = async (name, token) => {
    try {
        const response = await fetchGraphQL(GET_TRANSACTIONS, { name }, token);
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


const addHoverEvent = (circle, transaction, x, y) => {
    const transactionInfo = document.getElementById("transaction-info");

    circle.addEventListener("mouseover", () => {
        const date = new Date(transaction.createdAt);
        transactionInfo.style.display = "block";
        transactionInfo.style.left = `${x + 150}px`;
        transactionInfo.style.top = `${y + 500}px`;
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

import { GET_SKILLS } from "../logic/graphQL.js";
import { getMaxAmountPerSkill } from "../logic/helpers.js";

export const renderSkillsChart = async () => {
    const token = localStorage.getItem("JWT");
    let skillsMap = [];

    await fetchGraphQL(GET_SKILLS, {}, token)
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
        <div class="chart-border"></div>
        <div class="skills-chart-info">
            <h2 class="label">Your skills</h2>
        </div>
    `;

    const width = Math.min(900, container.clientWidth);
    const height = width * 0.6;
    const padding = 50;
    const barWidth = (width - 2 * padding) / skillsMap.length;

    const axisColor = getComputedStyle(document.documentElement).getPropertyValue("--text-color");
    const barColor = getComputedStyle(document.documentElement).getPropertyValue("--primary-color");


    const svg = createSvgElement("svg", {
        width,
        height,
        viewBox: `0 0 ${width} ${height}`,
    });

    const maxAmount = 100;
    const minAmount = 0;

    // Draw axes and gridlines
    drawAxes(svg, width, height, padding, axisColor);
    drawGridlines(svg, width, height, padding, axisColor, maxAmount, minAmount, 10, "%");

    // Draw bars for each skill
    skillsMap.forEach(([skill, amount], index) => {
        const barHeight = (amount / maxAmount) * (height - 2 * padding);
        const x = padding + index * barWidth;
        const y = height - padding - barHeight;

        // Create bar
        const bar = createSvgElement("rect", {
            x,
            y,
            width: barWidth * 0.8, // Add spacing between bars
            height: barHeight,
            fill: barColor,
        });
        svg.appendChild(bar);

        // Add skill labels
        const label = createSvgElement("text", {
            x: x + barWidth * 0.4,
            y: height - padding + 15,
            "text-anchor": "middle",
            "font-size": "10",
            fill: axisColor,
        });
        label.textContent = skill.replace("skill_", "");
        svg.appendChild(label);

        // Add value labels
        const valueLabel = createSvgElement("text", {
            x: x + barWidth * 0.4,
            y: y - 5,
            "text-anchor": "middle",
            "font-size": "13",
            fill: axisColor,
        });
        valueLabel.textContent = amount +" %";
        svg.appendChild(valueLabel);
    });

    container.appendChild(svg);
};
