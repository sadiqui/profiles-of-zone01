/*******************************************************
                   Card: Level
********************************************************/

import { graphQLService, QUERIES } from "../logic/graphQL.js";

// Fetches and renders the user's current level
export const renderLevel = async () => {
    // Level data holder
    let levelData = null;

    try {
        // Get auth token
        const token = localStorage.getItem("JWT");

        // Fetch level data
        levelData = await fetchLevelData(token);
    } catch (error) {
        console.error("Failed to render current level:", error);
        return;
    }

    // Render the level to the UI
    renderLevelToUI(levelData);
};

// Fetches level data from the GraphQL service
async function fetchLevelData(token) {
    const response = await graphQLService.execute(QUERIES.USER_LEVEL, {}, token);

    // Handle errors in response
    if (Array.isArray(response.errors)) {
        throw response.errors[0].message;
    }

    // Validate and process response data
    if (response && Array.isArray(response.data.transaction)) {
        return response.data.transaction[0].amount;
    } else {
        throw new Error("Invalid data received!");
    }
}

// Renders level data to the UI
function renderLevelToUI(level) {
    const container = document.getElementById("level-info");
    if (!container) return;

    const rank = ranks[Math.floor(level / 10)]
    container.innerHTML = `
    <div class="card-header"></div>
    <h2 class="card-title">Current Level</h2>
    <div class="level-info-container">
        <span>${level}</span>
    </div>
    <div class="rank">${rank}</div>
    `;
}

const ranks = [
    "Aspiring developer",
    "Beginner developer",
    "Apprentice developer",
    "Assistant developer",
    "Basic developer",
    "Junior developer",
    "Full-Stack developer"
]