/*******************************************************
                Authentication Requests
********************************************************/

import { AUTH_URL } from "../app.js"

export const submitLogin = async (credentials) => {
    const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${btoa(credentials.username + ":" + credentials.password)}`
        }
    });
    return response.json();
}

/*******************************************************
                   GraphQL Requests
********************************************************/

import { GRAPHQL_URL } from "../app.js";

export const fetchGraphQL = async (query, variables, token) => {
    const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            query: query,
            variables: variables,
        }),
    });

    return response.json();
};

/*******************************************************
                   GraphQL Structures
********************************************************/

export const GET_USER_INFO = `
{
  user {
    firstName
    lastName
  }
}
`;

export const GET_LEVEL_INFO = `
{
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
}
`;

export const GET_LAST_TRANSACTIONS = `
{
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
}
`;

export const GET_SKILLS = `
{
  user {
    transactions(
      where: { type: { _nin: ["xp", "level", "up", "down"] } }
    ) {
      type
      amount
    }
  }
}
`;

export const GET_TRANSACTIONS = `
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
}
`;

export const GET_AUDITS_INFO = `
{
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
}
`;
