import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'sophyraai',
  location: 'us-central1'
};

export const listAllUsersRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAllUsers');
}
listAllUsersRef.operationName = 'ListAllUsers';

export function listAllUsers(dc) {
  return executeQuery(listAllUsersRef(dc));
}

export const createDepartmentRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateDepartment', inputVars);
}
createDepartmentRef.operationName = 'CreateDepartment';

export function createDepartment(dcOrVars, vars) {
  return executeMutation(createDepartmentRef(dcOrVars, vars));
}

export const getMyPerformanceReviewsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyPerformanceReviews');
}
getMyPerformanceReviewsRef.operationName = 'GetMyPerformanceReviews';

export function getMyPerformanceReviews(dc) {
  return executeQuery(getMyPerformanceReviewsRef(dc));
}

export const assignTrainingToUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AssignTrainingToUser', inputVars);
}
assignTrainingToUserRef.operationName = 'AssignTrainingToUser';

export function assignTrainingToUser(dcOrVars, vars) {
  return executeMutation(assignTrainingToUserRef(dcOrVars, vars));
}

