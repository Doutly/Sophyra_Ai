# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListAllUsers*](#listallusers)
  - [*GetMyPerformanceReviews*](#getmyperformancereviews)
- [**Mutations**](#mutations)
  - [*CreateDepartment*](#createdepartment)
  - [*AssignTrainingToUser*](#assigntrainingtouser)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListAllUsers
You can execute the `ListAllUsers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listAllUsers(): QueryPromise<ListAllUsersData, undefined>;

interface ListAllUsersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllUsersData, undefined>;
}
export const listAllUsersRef: ListAllUsersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listAllUsers(dc: DataConnect): QueryPromise<ListAllUsersData, undefined>;

interface ListAllUsersRef {
  ...
  (dc: DataConnect): QueryRef<ListAllUsersData, undefined>;
}
export const listAllUsersRef: ListAllUsersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listAllUsersRef:
```typescript
const name = listAllUsersRef.operationName;
console.log(name);
```

### Variables
The `ListAllUsers` query has no variables.
### Return Type
Recall that executing the `ListAllUsers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListAllUsersData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListAllUsersData {
  users: ({
    id: UUIDString;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    department?: {
      name: string;
    };
  } & User_Key)[];
}
```
### Using `ListAllUsers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listAllUsers } from '@dataconnect/generated';


// Call the `listAllUsers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listAllUsers();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listAllUsers(dataConnect);

console.log(data.users);

// Or, you can use the `Promise` API.
listAllUsers().then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

### Using `ListAllUsers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listAllUsersRef } from '@dataconnect/generated';


// Call the `listAllUsersRef()` function to get a reference to the query.
const ref = listAllUsersRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listAllUsersRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.users);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

## GetMyPerformanceReviews
You can execute the `GetMyPerformanceReviews` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyPerformanceReviews(): QueryPromise<GetMyPerformanceReviewsData, undefined>;

interface GetMyPerformanceReviewsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyPerformanceReviewsData, undefined>;
}
export const getMyPerformanceReviewsRef: GetMyPerformanceReviewsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyPerformanceReviews(dc: DataConnect): QueryPromise<GetMyPerformanceReviewsData, undefined>;

interface GetMyPerformanceReviewsRef {
  ...
  (dc: DataConnect): QueryRef<GetMyPerformanceReviewsData, undefined>;
}
export const getMyPerformanceReviewsRef: GetMyPerformanceReviewsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyPerformanceReviewsRef:
```typescript
const name = getMyPerformanceReviewsRef.operationName;
console.log(name);
```

### Variables
The `GetMyPerformanceReviews` query has no variables.
### Return Type
Recall that executing the `GetMyPerformanceReviews` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyPerformanceReviewsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetMyPerformanceReviewsData {
  performanceReviews: ({
    id: UUIDString;
    reviewDate: DateString;
    rating: number;
    comments: string;
    reviewer: {
      firstName: string;
      lastName: string;
    };
  } & PerformanceReview_Key)[];
}
```
### Using `GetMyPerformanceReviews`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyPerformanceReviews } from '@dataconnect/generated';


// Call the `getMyPerformanceReviews()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyPerformanceReviews();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyPerformanceReviews(dataConnect);

console.log(data.performanceReviews);

// Or, you can use the `Promise` API.
getMyPerformanceReviews().then((response) => {
  const data = response.data;
  console.log(data.performanceReviews);
});
```

### Using `GetMyPerformanceReviews`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyPerformanceReviewsRef } from '@dataconnect/generated';


// Call the `getMyPerformanceReviewsRef()` function to get a reference to the query.
const ref = getMyPerformanceReviewsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyPerformanceReviewsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.performanceReviews);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.performanceReviews);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateDepartment
You can execute the `CreateDepartment` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createDepartment(vars: CreateDepartmentVariables): MutationPromise<CreateDepartmentData, CreateDepartmentVariables>;

interface CreateDepartmentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateDepartmentVariables): MutationRef<CreateDepartmentData, CreateDepartmentVariables>;
}
export const createDepartmentRef: CreateDepartmentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createDepartment(dc: DataConnect, vars: CreateDepartmentVariables): MutationPromise<CreateDepartmentData, CreateDepartmentVariables>;

interface CreateDepartmentRef {
  ...
  (dc: DataConnect, vars: CreateDepartmentVariables): MutationRef<CreateDepartmentData, CreateDepartmentVariables>;
}
export const createDepartmentRef: CreateDepartmentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createDepartmentRef:
```typescript
const name = createDepartmentRef.operationName;
console.log(name);
```

### Variables
The `CreateDepartment` mutation requires an argument of type `CreateDepartmentVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateDepartmentVariables {
  name: string;
  description?: string | null;
}
```
### Return Type
Recall that executing the `CreateDepartment` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateDepartmentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateDepartmentData {
  department_insert: Department_Key;
}
```
### Using `CreateDepartment`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createDepartment, CreateDepartmentVariables } from '@dataconnect/generated';

// The `CreateDepartment` mutation requires an argument of type `CreateDepartmentVariables`:
const createDepartmentVars: CreateDepartmentVariables = {
  name: ..., 
  description: ..., // optional
};

// Call the `createDepartment()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createDepartment(createDepartmentVars);
// Variables can be defined inline as well.
const { data } = await createDepartment({ name: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createDepartment(dataConnect, createDepartmentVars);

console.log(data.department_insert);

// Or, you can use the `Promise` API.
createDepartment(createDepartmentVars).then((response) => {
  const data = response.data;
  console.log(data.department_insert);
});
```

### Using `CreateDepartment`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createDepartmentRef, CreateDepartmentVariables } from '@dataconnect/generated';

// The `CreateDepartment` mutation requires an argument of type `CreateDepartmentVariables`:
const createDepartmentVars: CreateDepartmentVariables = {
  name: ..., 
  description: ..., // optional
};

// Call the `createDepartmentRef()` function to get a reference to the mutation.
const ref = createDepartmentRef(createDepartmentVars);
// Variables can be defined inline as well.
const ref = createDepartmentRef({ name: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createDepartmentRef(dataConnect, createDepartmentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.department_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.department_insert);
});
```

## AssignTrainingToUser
You can execute the `AssignTrainingToUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
assignTrainingToUser(vars: AssignTrainingToUserVariables): MutationPromise<AssignTrainingToUserData, AssignTrainingToUserVariables>;

interface AssignTrainingToUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AssignTrainingToUserVariables): MutationRef<AssignTrainingToUserData, AssignTrainingToUserVariables>;
}
export const assignTrainingToUserRef: AssignTrainingToUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
assignTrainingToUser(dc: DataConnect, vars: AssignTrainingToUserVariables): MutationPromise<AssignTrainingToUserData, AssignTrainingToUserVariables>;

interface AssignTrainingToUserRef {
  ...
  (dc: DataConnect, vars: AssignTrainingToUserVariables): MutationRef<AssignTrainingToUserData, AssignTrainingToUserVariables>;
}
export const assignTrainingToUserRef: AssignTrainingToUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the assignTrainingToUserRef:
```typescript
const name = assignTrainingToUserRef.operationName;
console.log(name);
```

### Variables
The `AssignTrainingToUser` mutation requires an argument of type `AssignTrainingToUserVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AssignTrainingToUserVariables {
  userId: UUIDString;
  trainingCourseId: UUIDString;
  assignedDate: DateString;
  status: string;
}
```
### Return Type
Recall that executing the `AssignTrainingToUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AssignTrainingToUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AssignTrainingToUserData {
  employeeTraining_insert: EmployeeTraining_Key;
}
```
### Using `AssignTrainingToUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, assignTrainingToUser, AssignTrainingToUserVariables } from '@dataconnect/generated';

// The `AssignTrainingToUser` mutation requires an argument of type `AssignTrainingToUserVariables`:
const assignTrainingToUserVars: AssignTrainingToUserVariables = {
  userId: ..., 
  trainingCourseId: ..., 
  assignedDate: ..., 
  status: ..., 
};

// Call the `assignTrainingToUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await assignTrainingToUser(assignTrainingToUserVars);
// Variables can be defined inline as well.
const { data } = await assignTrainingToUser({ userId: ..., trainingCourseId: ..., assignedDate: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await assignTrainingToUser(dataConnect, assignTrainingToUserVars);

console.log(data.employeeTraining_insert);

// Or, you can use the `Promise` API.
assignTrainingToUser(assignTrainingToUserVars).then((response) => {
  const data = response.data;
  console.log(data.employeeTraining_insert);
});
```

### Using `AssignTrainingToUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, assignTrainingToUserRef, AssignTrainingToUserVariables } from '@dataconnect/generated';

// The `AssignTrainingToUser` mutation requires an argument of type `AssignTrainingToUserVariables`:
const assignTrainingToUserVars: AssignTrainingToUserVariables = {
  userId: ..., 
  trainingCourseId: ..., 
  assignedDate: ..., 
  status: ..., 
};

// Call the `assignTrainingToUserRef()` function to get a reference to the mutation.
const ref = assignTrainingToUserRef(assignTrainingToUserVars);
// Variables can be defined inline as well.
const ref = assignTrainingToUserRef({ userId: ..., trainingCourseId: ..., assignedDate: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = assignTrainingToUserRef(dataConnect, assignTrainingToUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.employeeTraining_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.employeeTraining_insert);
});
```

