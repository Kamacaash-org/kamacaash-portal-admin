import { useMemo } from "react";

export default function useAuthUser() {
  const authUser = useMemo(() => {
    const stored = sessionStorage.getItem("authUser");
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored);
      const responseData = parsed?.data || parsed;
      const staff = responseData?.staff || {};
      const token =
        responseData?.accessToken ||
        responseData?.access_token ||
        parsed?.accessToken ||
        parsed?.access_token ||
        parsed?.token ||
        null;

      return {
        staffId: staff.staffId,
        username: staff.username,
        firstName: staff.firstName,
        lastName: staff.lastName,
        role: staff.role,
        businessId: staff.businessId,
        businessName: staff.businessName,
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
