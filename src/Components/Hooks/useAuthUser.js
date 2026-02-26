import { useMemo } from "react";

export default function useAuthUser() {
  const authUser = useMemo(() => {
    const stored = sessionStorage.getItem("authUser");
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored);
      const responseData = parsed?.data || parsed;
      const staff = responseData?.staff || {};
      const user = responseData?.user || {};
      const token =
        responseData?.accessToken ||
        responseData?.access_token ||
        parsed?.accessToken ||
        parsed?.access_token ||
        parsed?.token ||
        null;

      return {
        staffId:
          staff.staffId ||
          user.staffId ||
          user._id ||
          user.id ||
          responseData?.staffId,
        username: staff.username || user.username,
        firstName: staff.firstName || user.firstName,
        lastName: staff.lastName || user.lastName,
        role: staff.role || user.role,
        businessId: staff.businessId || user.businessId,
        businessName: staff.businessName || user.businessName,
        token,
        raw: parsed, // full object if needed
      };
    } catch (e) {
      console.error("Failed to parse authUser from session:", e);
      return null;
    }
  }, []);

  return authUser;
}
