const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'sophyraai',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const listAllUsersRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAllUsers');
}
listAllUsersRef.operationName = 'ListAllUsers';
exports.listAllUsersRef = listAllUsersRef;

exports.listAllUsers = function listAllUsers(dc) {
  return executeQuery(listAllUsersRef(dc));
};

const createDepartmentRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateDepartment', inputVars);
}
createDepartmentRef.operationName = 'CreateDepartment';
exports.createDepartmentRef = createDepartmentRef;

exports.createDepartment = function createDepartment(dcOrVars, vars) {
  return executeMutation(createDepartmentRef(dcOrVars, vars));
};

const getMyPerformanceReviewsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyPerformanceReviews');
}
getMyPerformanceReviewsRef.operationName = 'GetMyPerformanceReviews';
exports.getMyPerformanceReviewsRef = getMyPerformanceReviewsRef;

exports.getMyPerformanceReviews = function getMyPerformanceReviews(dc) {
  return executeQuery(getMyPerformanceReviewsRef(dc));
};

const assignTrainingToUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AssignTrainingToUser', inputVars);
}
assignTrainingToUserRef.operationName = 'AssignTrainingToUser';
exports.assignTrainingToUserRef = assignTrainingToUserRef;

exports.assignTrainingToUser = function assignTrainingToUser(dcOrVars, vars) {
  return executeMutation(assignTrainingToUserRef(dcOrVars, vars));
};
