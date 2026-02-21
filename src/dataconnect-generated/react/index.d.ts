import { ListAllUsersData, CreateDepartmentData, CreateDepartmentVariables, GetMyPerformanceReviewsData, AssignTrainingToUserData, AssignTrainingToUserVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useListAllUsers(options?: useDataConnectQueryOptions<ListAllUsersData>): UseDataConnectQueryResult<ListAllUsersData, undefined>;
export function useListAllUsers(dc: DataConnect, options?: useDataConnectQueryOptions<ListAllUsersData>): UseDataConnectQueryResult<ListAllUsersData, undefined>;

export function useCreateDepartment(options?: useDataConnectMutationOptions<CreateDepartmentData, FirebaseError, CreateDepartmentVariables>): UseDataConnectMutationResult<CreateDepartmentData, CreateDepartmentVariables>;
export function useCreateDepartment(dc: DataConnect, options?: useDataConnectMutationOptions<CreateDepartmentData, FirebaseError, CreateDepartmentVariables>): UseDataConnectMutationResult<CreateDepartmentData, CreateDepartmentVariables>;

export function useGetMyPerformanceReviews(options?: useDataConnectQueryOptions<GetMyPerformanceReviewsData>): UseDataConnectQueryResult<GetMyPerformanceReviewsData, undefined>;
export function useGetMyPerformanceReviews(dc: DataConnect, options?: useDataConnectQueryOptions<GetMyPerformanceReviewsData>): UseDataConnectQueryResult<GetMyPerformanceReviewsData, undefined>;

export function useAssignTrainingToUser(options?: useDataConnectMutationOptions<AssignTrainingToUserData, FirebaseError, AssignTrainingToUserVariables>): UseDataConnectMutationResult<AssignTrainingToUserData, AssignTrainingToUserVariables>;
export function useAssignTrainingToUser(dc: DataConnect, options?: useDataConnectMutationOptions<AssignTrainingToUserData, FirebaseError, AssignTrainingToUserVariables>): UseDataConnectMutationResult<AssignTrainingToUserData, AssignTrainingToUserVariables>;
