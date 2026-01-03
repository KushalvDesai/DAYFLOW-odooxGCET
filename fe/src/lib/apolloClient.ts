import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql',
  credentials: 'include', // Send cookies with requests
});

const apolloClient = new ApolloClient({
  ssrMode: typeof window === 'undefined', // Detect SSR mode
  link: httpLink,
  cache: new InMemoryCache(),
});

export default apolloClient;
