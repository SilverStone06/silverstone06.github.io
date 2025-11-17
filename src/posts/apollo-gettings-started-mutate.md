---
id: 2a9be0b2-87a1-816f-9598-f2347a80c017
title: Learn how apollo client manages asynchronous state through useMutation
slug: apollo-gettings-started-mutate
date:
  start_date: '2022-06-29'
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
summary: Let's try useMutation and see how it handles real asynchronous state.
thumbnail: null
author:
  - id: e5ed41b6-1017-4d12-bdba-ee217703dd05
    name: morethanmin
    profile_photo: >-
      https://lh5.googleusercontent.com/-lr5pjNrudeM/AAAAAAAAAAI/AAAAAAAAAAA/AMZuuck_j3l31Z6ws1a44V8GfS68MDZZvg/photo.jpg
fullWidth: false
---
## Getting Started

In the previous article, we looked up data using the useQuery hook, so let’s handle mutation through useMutation this time.

## Set up your development environment

It would be good to refer to the previous article about setting up the development environment. This article assumes that the development environment setup has been completed, and continues with the previous article.

## useMutation

When mutation is passed to the hook, the state value for the corresponding result value is delivered like mutateFunction and useQuery that actually request mutate. You can request mutation through the corresponding mutateFunction.

The example below is a component that requests a mutation that creates an item using useMutation.

```JavaScript
//.....

const initialInputs = {
  title: '',
  description: '',
}

const CREATE_ITEM = gql`
mutation CreateItem($input: CreateItemInput!) {
  createItem(input: $input) {
    id
    title
    description
    compleated
  }
}
`

function CreateForm({ data }: Props) {
  const classes = useStyles()
  const [createItem] = useMutation(CREATE_ITEM)
  const [inputs, setInputs] = useState(initialInputs)

  const handleChange: ChangeEventHandler<
    HTMLTextAreaElement | HTMLInputElement
  > = (e) => {
    const { name, value } = e.target
    setInputs({
      ...inputs,
      [name]: value,
    })
  }

  const handleOnSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()

    try {
      if (inputs.title && inputs.description && data?.list?.id) {
        createItem({
          variables: {
            input: {
              listId: listId,
              ...inputs,
            },
          },
          refetchQueries: [GetTodoListDocument],
        })
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <form className={classes.wrapper} onSubmit={handleOnSubmit}>
      <h1>Add todo</h1>
      <TextField
        name="title"
        value={inputs.title}
        onChange={handleChange}
        label="Title"
        variant="outlined"
      />
      <TextField
        name="description"
        value={inputs.description}
        onChange={handleChange}
        label="Description"
        multiline
        minRows={10}
        maxRows={10}
        variant="outlined"
      />
      <Button variant="contained" type="submit">
        add
      </Button>
    </form>
  )
}

export default CreateForm
```

## Updating data cached locally

When using useMutation, there is one thing to consider differently from useQuery. The point is that when a request to modify back-end data is made through mutation, the previously cached data must also be modified to match the changed data in the actual back-end. (Otherwise, you will have to retrieve the data again through refresh to see the modified part.)

### If previously cached data is modified (update)

In the case of modifying existing cached data, if there is __typename and id in the response data when requesting mutation, the corresponding data is automatically modified. (This part felt more comfortable than having to implement it yourself in redux.)

### When data that is not cached is modified (create, delete)

As mentioned earlier, useMutation only requests mutation to the server, so it is necessary to modify the cached data because it does not know how to update the cached state that remains locally.

### Updating the cache using refetching queries

Among the methods of updating cached data, the most common method is to receive the updated data again through communication to inquire the data. In the apollo client, this can be implemented through refetchingQueries. Let's look only at the part that calls createItem in the code above.

```JavaScript
//...
const GetTodoListDocument = gql`
    query getTodoList($listId: ID!) {
  list(id: $listId) {
    id
    title
    items {
      id
      title
      description
      compleated
    }
  }
}
`

createItem({
  variables: {
    input: {
      listId: listId,
      ...inputs,
    },
  },
  refetchQueries: [GetTodoListDocument],
})

//...
```

If you pass the query to the refetchQueries property as follows, you can update the cached data by executing the query after the mutation is normally performed.

### Updating the cache directly through the update function

If you proceed in the above way, one more communication process will occur in addition to mutation. Using the update function, it is also possible to directly modify the cache according to the changed result, depending on whether or not the mutation has responded. Let's check the example below.

```JavaScript
createItem({
  variables: {
    input: {
      listId: listId,
      ...inputs,
    },
  },
  update(cache, result) {
    cache.modify({
      id: cache.identify(data?.list as StoreObject),
      fields: {
        items(cachedItemRefs: StoreObject[], { readField }) {
          const newItemRef = cache.writeFragment({
            data: result.data?.createItem,
            fragment: gql`
              fragment NewItem on Item {
                id
                title
                description
                compleated
              }
            `,
          })
          if (
            cachedItemRefs.some(
              (ref) =>
                readField('id', ref) === result.data?.createItem?.id
            )
          ) {
            return cachedItemRefs
          }

          return [...cachedItemRefs, newItemRef]
        },
      },
    })
  },
})
```

To the update function, we are passing the InMemeryCache instance that we put in when creating the apollo client instance and the result value. You can use the relevant factor to read the api document and modify it appropriately (?).

### Renew ahead of time via OptimisticResponse

If you use the above two methods, the cache is changed only after the communication is over, so it may feel like it is reflected slowly from the user's point of view. Therefore, the form of reflecting the state value that changes in advance in the expected form, leaving it as it is if the mutation was actually performed normally, and returning it if it failed is called Optimistic UI. In the apollo client, this can be easily implemented through the OptimisticResponse property.

```JavaScript
createItem({
  variables: {
    input: {
      listId: data?.list?.id,
      ...inputs,
    },
  },
 optimisticResponse: {
   createItem: {
     id: 'id-temp',
     __typename: 'Item',
     title: inputs.title,
     description: inputs.description,
     compleated: false,
   },
 },
  update(cache, result) {
    cache.modify({
      id: cache.identify(data?.list as StoreObject),
      fields: {
        items(cachedItemRefs: StoreObject[], { readField }) {
          const newItemRef = cache.writeFragment({
            data: result.data?.createItem,
            fragment: gql`
              fragment NewItem on Item {
                id
                title
                description
                compleated
              }
            `,
          })
          if (
            cachedItemRefs.some(
              (ref) =>
                readField('id', ref) === result.data?.createItem?.id
            )
          ) {
            return cachedItemRefs
          }

          return [...cachedItemRefs, newItemRef]
        },
      },
    })
  },
})
```

If the actual update function is applied in the same way and the expected result value is written in the optimisticResponse property, the cache is updated with the expected result value in advance before the response is made.

## Concluding

In fact, no matter what communication (REST API, GraphQL) or any state management library (Redux, Recoil, React-query, Apollo, etc.) is used, if you have a clear understanding of asynchronous state management, you can quickly understand and apply it. same. Among them, we are just managing state using apollo client among communication using GraphQL... I think it's important to always try to understand the essence and become a developer who can use the technology that suits the situation.
