/*******************************************************
                   GraphQL Requests
********************************************************/

import { API } from "../app.js";

// GraphQL API service
export const graphQLService = {
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

// GraphQL query definitions
export const QUERIES = {
  // Basic
  USER_PROFILE: `{
    user {
      firstName
      lastName
    }
  }`,
  
  // With Arguments (_and, _eq, and object nesting)
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
  
  // Nested (user → transactions → object → name)
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

  // with Arguments (_nin)
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

  // With Arguments ($name, _eq, ordering)
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
  
  // Nested (user → audits_aggregate → aggregate → count)
  // with Aggregation (audits_aggregate)
  // with Aliases (failed_audits)
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