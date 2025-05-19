export const INTERNAL_SERVER_ERROR = "Internal server error";
export const AUTH_TOKEN_INVALID = "Authentication failed";
export const AUTH_UNAUTHORIZED = "Not Authorized";
export const CREATED = (name: string) => {
  return `${name} created successfully`;
};
export const NOT_FOUND = (name: string, id?: string) => {
  if (!id) {
    return `${name} not found`;
  }
  return `${name} with ID: ${id} not found`;
};
export const UPDATED = (name: string) => `${name} updated successfully`;
export const FETCHED = (name: string) => `${name} fetched successfully`;
export const DELETED = (name: string) => `${name} deleted successfully`;

export const AUTH_TOKEN_EXPIRED = "Token expired";

export const CAN_ACCESS = "User can access the quiz";
export const SUBMISSION_IN_PROGRESS = "User submission in progress";
export const SUBMISSION_SUCCESSFUL = "User submission successful";

export const UNAUTHORIZED_ACTION = "Unauthorized to perform this action";
export const ALREADY_ENROLLED = "User already enrolled for this course";
export const ALREADY_PASSED = "User already this quiz";
export const NOT_ENROLLED = "User not enrolled for this course";
export const ENROLLMENT_SUCCESSFUL =
  "User has been successfully enrolled for course";
