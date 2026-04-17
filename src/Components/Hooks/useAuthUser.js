import { useMemo } from "react";

const resolveEntityId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    return (
      value.id ||
      value._id ||
      value.uuid ||
      value.businessId ||
      value.business_id ||
      null
    );
  }
  return null;
};

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
      const responseBusiness = responseData?.business || {};
      const staffBusiness = staff?.business || {};
      const userBusiness = user?.business || {};
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

      const businessId =
        resolveEntityId(responseData?.businessId) ||
        resolveEntityId(responseData?.business_id) ||
        resolveEntityId(staff?.businessId) ||
        resolveEntityId(staff?.business_id) ||
        resolveEntityId(user?.businessId) ||
        resolveEntityId(user?.business_id) ||
        resolveEntityId(responseBusiness) ||
        resolveEntityId(staffBusiness) ||
        resolveEntityId(userBusiness) ||
        null;

      const businessName =
        responseData?.businessName ||
        responseData?.business_name ||
        responseBusiness?.name ||
        responseBusiness?.businessName ||
        staff?.businessName ||
        staff?.business_name ||
        staffBusiness?.name ||
        staffBusiness?.businessName ||
        user?.businessName ||
        user?.business_name ||
        userBusiness?.name ||
        userBusiness?.businessName ||
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
        businessId,
        businessName,
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
