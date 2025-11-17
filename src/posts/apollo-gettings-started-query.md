---
id: 2a9be0b2-87a1-8168-82ec-f3b42264de42
title: Handling GraphQL queries in apollo client
slug: apollo-gettings-started-query
date:
  start_date: '2022-06-25'
createdTime: 'Wed Nov 12 2025 13:47:44 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - Next.js
  - GraphQL
  - Apollo
category:
  - "\U0001F4BB Frontend"
summary: Let's use GraphQL using apollo client
thumbnail: >-
  https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F76bfd580-fa91-4171-a89c-0217c96f98ab%2FKakaoTalk_20230104_231348768.jpg?table=block&id=2a9be0b2-87a1-8168-82ec-f3b42264de42&cache=v2
author:
  - id: e5ed41b6-1017-4d12-bdba-ee217703dd05
    name: morethanmin
    profile_photo: >-
      https://lh5.googleusercontent.com/-lr5pjNrudeM/AAAAAAAAAAI/AAAAAAAAAAA/AMZuuck_j3l31Z6ws1a44V8GfS68MDZZvg/photo.jpg
fullWidth: false
---
## Getting Started

Now that you have conceptually grasped GraphQL, let's actually use it in Next.js and see how it differs from the previously used Flux-based state management library. 🙂

Obviously, it is not necessary to use a library to call a GraphQL API. It is possible to simply call the fetch function alone, but using the library provides various functions and has advantages in various aspects such as development experience, so we will go ahead and install the library right away.

Among them, we will use the most used apollo client.

## Building a development environment

First, build the next environment using create-next-app and install the apollo and graphql packages.

```Bash
yarn create next-app [Project Name]
cd [Project Name]
yarn add @apollo/client graphql
```

  - graphql: This is a package that allows js to import data through gql.
  - @apollo/client : It depends on the graphql package and provides several functions to use gql in the client.
Now, if you have installed the desired package and type yarn dev, the script specified in package.json is executed, and you can see that next.js is operating normally by node.js.

## Initializing the ApolloClient instance

Let's write code that creates an apollo client instance to use the library.

```JavaScript
// ./apollo-client.js

import { ApolloClient, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
    uri: "https://countries.trevorblades.com",
    cache: new InMemoryCache(),
});

export default client;
```

Enter the URL of the gql server in uri and put an InMemoryCache instance in cache, which is used when caching data retrieved from the client.

Now, in order to run a query, we need to know what kind of data can be retrieved from the URL we have listed. At this time, Apollo Explorer is used.

## Apollo Explorer

If you use Apollo Explorer, you can see what kind of data can be retrieved through the corresponding url like the API specification of the Rest API. First of all, if you create an account through the link and enter https://countries.trevorblades.com, the endpoint we entered, the following screen will appear.

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F64ab15f5-d7e2-4f35-8a7b-162fc13d951a%2FUntitled.png?table=block&id=2a9be0b2-87a1-8163-bcdd-ce7b2ead193a&cache=v2)

You can check the schema here and run queries easily. (Think of it as a tool similar to the REST API's Postman.)

If you go to the Schema page, the data that can be imported is specified. Of these, we will bring and use the code name emoji from Country.

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F0b99fbff-4949-414a-8c3d-f2f99eb8ea3f%2FUntitled.png?table=block&id=2a9be0b2-87a1-8101-8259-f36bf76bf381&cache=v2)

You can run the query below on the Operations page to check if it is being received normally.

```GraphQL
query ExampleQuery {
  countries {
    code
    name
		emoji
  }
}
```

If the data comes out normally as shown in the image below, it is successful.

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fc9244032-ff5b-43e5-a791-dcc331dcb625%2FUntitled.png?table=block&id=2a9be0b2-87a1-81ac-a79d-fdd84ddd3e69&cache=v2)

## Data fetching in Client-Side-Rendering

Data fetching methods in Next.js are largely divided into SSR method through getServerSideProps, SSG method through getStaticProps, and CSR method. Each method differs only in the loading time, but data fetching through gql is the same, so we use CSR Let's write the logic that takes data into account and considers loading.

First of all, you need to wrap the component in _app.js with ApolloProvider.

```JavaScript
import { ApolloProvider } from '@apollo/client'
import client from '../apollo-client'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return (
    <ApolloProvider client={client}>
      <Component {...pageProps} />
    </ApolloProvider>
  )
}


export default MyApp
```

Now, let's create a ClientOnly component that renders only in the client's environment and a Countries component that gets data.

ClientOnly component

```JavaScript
import { useEffect, useState } from "react";

export default function ClientOnly({ children, ...delegated }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <div {...delegated}>{children}</div>;
}
```

Countries component

```JavaScript
import { useQuery, gql } from "@apollo/client"

const QUERY = gql`
  query Countries {
    countries {
      code
      name
      emoji
    }
  }
`

export default function Countries() {
  const { data, loading, error } = useQuery(QUERY)

  if (loading) {
    return <h2><a href="#loading" aria-hidden="true" id="loading"></a>Loading...</h2>
  }

  if (error) {
    console.error(error)
    return null
  }

  const countries = data.countries.slice(0, 4)

  return (
    <div >
      {countries.map((country) => (
        <div key={country.code} >
          <h3><a href="#country-name" aria-hidden="true" id="country-name"></a>{country.name}</h3>
          <p>
            {country.code} - {country.emoji}
          </p>
        </div>
      ))}
    </div>
  )
}
```

If a gql query is passed to a hook called useQuery, data is fetched through the query. It returns an object containing data, loading, and error, and manages the state of asynchronous processing.

Put that component in index.js.

```JavaScript
import Head from "next/head"
import styles from "../styles/Home.module.css"
import ClientOnly from "../components/ClientOnly"
import Countries from "../components/Countries"

export default function ClientSide() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <ClientOnly>
          <Countries />
        </ClientOnly>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{" "}
          <img src="/vercel.svg" alt="Vercel Logo" className={styles.logo} />
        </a>
      </footer>
    </div>
  )
} 
```

The data should be output normally as shown below.

![Untitled](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F7847e10a-c8f3-4663-84aa-5ccf64b04e75%2FUntitled.png?table=block&id=2a9be0b2-87a1-81c7-8f57-c6abf74a4fee&cache=v2)

## concluding

It was good that using the library for gql made it much simpler to implement compared to Redux, which requires writing a lot of code to process data. However, it seems to be abstracted as much as it is convenient, so it would be better to know how it works without understanding the internal logic.

### Reference

  - https://www.apollographql.com/docs/react/get-started#2-initialize-apolloclient
  - https://www.apollographql.com/blog/apollo-client/next-js/next-js-getting-started/
## Source

  - https://morethan-log.vercel.app/
