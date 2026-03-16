export type Roles = "admin" | "salesperson" | "dsm" | "hr" | "vehicle"

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles
    }
  }
}
