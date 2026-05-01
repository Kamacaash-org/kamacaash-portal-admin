export const BUSINESS_OWNER_MENU_IDS = ["OFFERS_SECTION", "ORDERS"];

export const BUSINESS_OWNER_ALLOWED_PATHS = [
  "/offers",
  "/orders",
  "/orders/history",
  "/users/staff-profile",
  "/business/profile-settings",
  "/auth-change-password",
];

export const getDefaultRouteForRole = (role) => {
  if (role === "BUSINESS_OWNER") {
    return "/orders";
  }

  return "/dashboard";
};

export const getAllowedPathsForRole = (role) => {
  if (role === "BUSINESS_OWNER") {
    return BUSINESS_OWNER_ALLOWED_PATHS;
  }

  return null;
};

export const isPathAllowedForRole = (role, pathname) => {
  const allowedPaths = getAllowedPathsForRole(role);

  if (!allowedPaths) return true;
  if (!pathname) return false;

  return allowedPaths.some((allowedPath) => {
    if (pathname === allowedPath) return true;
    return allowedPath !== "/" && pathname.startsWith(`${allowedPath}/`);
  });
};
