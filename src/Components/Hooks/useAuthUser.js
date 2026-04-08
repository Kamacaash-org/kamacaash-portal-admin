import { useMemo } from "react";

export default function useAuthUser() {
  const authUser = useMemo(() => {
    const stored = sessionStorage.getItem("authUser");
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored);
      const responseData = parsed?.data || parsed;
      const tokenBag = responseData?.tokens || parsed?.tokens || {};
      const staff = responseData?.staff || {};
      const user = responseData?.user || {};
      const token =
        responseData?.accessToken ||
        responseData?.access_token ||
        tokenBag?.accessToken ||
        tokenBag?.access_token ||
        tokenBag?.token ||
        parsed?.accessToken ||
        parsed?.access_token ||
        parsed?.token ||
        null;
      const refreshToken =
        responseData?.refreshToken ||
        responseData?.refresh_token ||
        tokenBag?.refreshToken ||
        tokenBag?.refresh_token ||
        parsed?.refreshToken ||
        parsed?.refresh_token ||
        null;

      return {
        staffId:
          responseData?.staffId ||
          staff.staffId ||
          staff._id ||
          staff.id ||
          user.staffId ||
          user._id ||
          user.id ||
          null,
        username: staff.username || user.username,
        firstName: staff.firstName || user.firstName,
        lastName: staff.lastName || user.lastName,
        role: staff.role || user.role,
        businessId: staff.businessId || user.businessId,
        businessName: staff.businessName || user.businessName,
        token,
        refreshToken,
        raw: parsed, // full object if needed
      };
    } catch (e) {
      console.error("Failed to parse authUser from session:", e);
      return null;
    }
  }, []);

  return authUser;
}
