export const profileRoles = ["admin", "manager", "seller"] as const;

export type ProfileRole = (typeof profileRoles)[number];
