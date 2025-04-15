import { API } from "../app.js";

/**
 * GraphQL API service
 * Handles all GraphQL API communication
 */
export const graphQLService = {
  /**
   * Execute a GraphQL query with authorization
   * @param {String} query - GraphQL query string
   * @param {Object} variables - Query variables
   * @param {String} token - JWT authentication token
   * @returns {Promise} Query results or error
   */
  execute: async (query, variables = {}, token) => {
    const response = await fetch(API.DATA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    return response.json();
  }
};

/**
 * GraphQL query definitions
 * Centralized location for all query strings
 */
export const QUERIES = {
  USER_PROFILE: `{
    user {
      firstName
      lastName
    }
  }`,
  
  USER_LEVEL: `{
    transaction(
      where: {
        _and: [
          { type: { _eq: "level" } },
          { event: { object: { name: { _eq: "Module" } } } }
        ]
      },
      order_by: { amount: desc },
      limit: 1
    ) {
      amount
    }
  }`,
  
  USER_TRANSACTIONS: `{
    user {
      transactions(
        where: { type: { _eq: "xp" } },
        order_by: { createdAt: desc }
      ) {
        object {
          name
        }
        amount
        createdAt
      }
    }
  }`,
  
  USER_SKILLS: `{
    user {
      transactions(
        where: { type: { _nin: ["xp", "level", "up", "down"] } }
      ) {
        type
        amount
      }
    }
  }`,
  
  USER_PROGRESS: `
  query GetTransactions($name: String!) {
    event(where: { object: { name: { _eq: $name } } }) {
      object {
        events {
          startAt
          endAt
        }
      }
    }
    transaction(
      where: {
        _and: [
          { type: { _eq: "xp" } },
          { event: { object: { name: { _eq: $name } } } }
        ]
      },
      order_by: { createdAt: asc }
    ) {
      amount
      object {
        name
      }
      createdAt
    }
  }`,
  
  USER_AUDITS: `{
    user {
      auditRatio
      audits_aggregate(where: { closureType: { _eq: succeeded } }) {
        aggregate {
          count
        }
      }
      failed_audits: audits_aggregate(where: { closureType: { _eq: failed } }) {
        aggregate {
          count
        }
      }
    }
  }`
};