import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AssignTrainingToUserData {
  employeeTraining_insert: EmployeeTraining_Key;
}

export interface AssignTrainingToUserVariables {
  userId: UUIDString;
  trainingCourseId: UUIDString;
  assignedDate: DateString;
  status: string;
}

export interface CreateDepartmentData {
  department_insert: Department_Key;
}

export interface CreateDepartmentVariables {
  name: string;
  description?: string | null;
}

export interface Department_Key {
  id: UUIDString;
  __typename?: 'Department_Key';
}

export interface EmployeeTraining_Key {
  id: UUIDString;
  __typename?: 'EmployeeTraining_Key';
}

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

export interface JobApplication_Key {
  id: UUIDString;
  __typename?: 'JobApplication_Key';
}

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

export interface PerformanceReview_Key {
  id: UUIDString;
  __typename?: 'PerformanceReview_Key';
}

export interface TrainingCourse_Key {
  id: UUIDString;
  __typename?: 'TrainingCourse_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface ListAllUsersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllUsersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListAllUsersData, undefined>;
  operationName: string;
}
export const listAllUsersRef: ListAllUsersRef;

export function listAllUsers(): QueryPromise<ListAllUsersData, undefined>;
export function listAllUsers(dc: DataConnect): QueryPromise<ListAllUsersData, undefined>;

interface CreateDepartmentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateDepartmentVariables): MutationRef<CreateDepartmentData, CreateDepartmentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateDepartmentVariables): MutationRef<CreateDepartmentData, CreateDepartmentVariables>;
  operationName: string;
}
export const createDepartmentRef: CreateDepartmentRef;

export function createDepartment(vars: CreateDepartmentVariables): MutationPromise<CreateDepartmentData, CreateDepartmentVariables>;
export function createDepartment(dc: DataConnect, vars: CreateDepartmentVariables): MutationPromise<CreateDepartmentData, CreateDepartmentVariables>;

interface GetMyPerformanceReviewsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyPerformanceReviewsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyPerformanceReviewsData, undefined>;
  operationName: string;
}
export const getMyPerformanceReviewsRef: GetMyPerformanceReviewsRef;

export function getMyPerformanceReviews(): QueryPromise<GetMyPerformanceReviewsData, undefined>;
export function getMyPerformanceReviews(dc: DataConnect): QueryPromise<GetMyPerformanceReviewsData, undefined>;

interface AssignTrainingToUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AssignTrainingToUserVariables): MutationRef<AssignTrainingToUserData, AssignTrainingToUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AssignTrainingToUserVariables): MutationRef<AssignTrainingToUserData, AssignTrainingToUserVariables>;
  operationName: string;
}
export const assignTrainingToUserRef: AssignTrainingToUserRef;

export function assignTrainingToUser(vars: AssignTrainingToUserVariables): MutationPromise<AssignTrainingToUserData, AssignTrainingToUserVariables>;
export function assignTrainingToUser(dc: DataConnect, vars: AssignTrainingToUserVariables): MutationPromise<AssignTrainingToUserData, AssignTrainingToUserVariables>;

