import { createAsyncThunk } from "@reduxjs/toolkit";
import { SurPlusCategoryAPI, BusinessAPI } from "../../helpers/backend_helper";
import { makeCRUDThunks } from "../../helpers/thunk_factory";
import { toast } from "react-toastify";

// PDF Generation function
const generateAgreementPDF = (agreementData) => {
  // Note: Install jspdf with: npm install jspdf
  // For now, this is a placeholder that would generate and download the PDF

  const agreementText = `
Agreement between Kamacaash & ${agreementData.businessName}

Date: ${agreementData.date}
Agreement Reference: ${agreementData.agreementReference}

Business Details:
- Owner Name: ${agreementData.ownerName}
- Business Name: ${agreementData.businessName}
- Email: ${agreementData.email || "N/A"}
- Phone: ${agreementData.phone}
- Category: ${agreementData.category}
- Description: ${agreementData.description || "N/A"}
- Registration Number: ${agreementData.registrationNumber || "N/A"}
- Tax ID: ${agreementData.taxId || "N/A"}

Contract Terms:
- Commission Rate: ${agreementData.commissionRate}%
- Currency: ${agreementData.currency}
- Default Language: ${agreementData.defaultLanguage}
- Time Zone: ${agreementData.timeZone}
- Payout Schedule: ${agreementData.payoutSchedule}

Signatures:

Kamacaash Representative: ___________________________ Date: ____________

Business Owner (${agreementData.ownerName}): ___________________________ Date: ____________
`;

  // Create and download the PDF
  const { jsPDF } = require("jspdf");
  const doc = new jsPDF();
  doc.text(agreementText, 10, 10);
  doc.save(`Agreement-${agreementData.businessName}.pdf`);
};

export const {
  list: getCategories,
  create: addCategory,
  update: updateCategory,
  delete: deleteCategory,
} = makeCRUDThunks("business-management/surplusCategory", SurPlusCategoryAPI);

export const { list: getBusinessesData } = makeCRUDThunks(
  "business-management/business",
  BusinessAPI,
);

export const createOrUpdateBusiness = createAsyncThunk(
  "business-management/business/createOrUpdateBusiness",
  async (payload, { dispatch }) => {
    try {
      const isUpdate = !!payload?.id;
      const res = isUpdate
        ? await BusinessAPI.update({ id: payload.id, payload: payload.data })
        : await BusinessAPI.create(payload?.data ?? payload);
      if (!res.success) throw res;
      toast.success(res.message);

      // Generate PDF agreement if agreementData is present (new business)
      // if (res.data?.agreementData) {
      //     generateAgreementPDF(res.data.agreementData);
      // }

      dispatch(getBusinessesData());
      return res.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to take an action";
      toast.error(errorMessage);
      throw error;
    }
  },
);

// register custom endpoints separately
export const archiveBusiness = createAsyncThunk(
  "business-management/business/archive",
  async (id, { dispatch }) => {
    try {
      const res = await BusinessAPI.delete(id);
      if (!res.success) throw res;
      toast.success(res.message);
      dispatch(getBusinessesData());
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete this business";
      toast.error(errorMessage);
    }
  },
);

export const toggleStatusBusiness = createAsyncThunk(
  "business-management/business/toggleStatus",
  async (payload, { dispatch }) => {
    try {
      const res = await BusinessAPI.toggleStatus(payload);
      if (!res.success) throw res;
      toast.success(res.message);
      dispatch(getBusinessesData());
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to toggle status";
      toast.error(errorMessage);
    }
  },
);

export const approveBusiness = createAsyncThunk(
  "business-management/business/approve",
  async (id, { dispatch }) => {
    try {
      const res = await BusinessAPI.approve(id);
      if (!res.success) throw res;
      toast.success(res.message);
      dispatch(getBusinessesData());
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to approve";
      toast.error(errorMessage);
    }
  },
);

export const rejectBusiness = createAsyncThunk(
  "business-management/business/reject",
  async (id, { dispatch }) => {
    try {
      const res = await BusinessAPI.reject(id);
      if (!res.success) throw res;
      toast.success(res.message);
      dispatch(getBusinessesData());
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to reject";
      toast.error(errorMessage);
    }
  },
);

export const signContract = createAsyncThunk(
  "business-management/business/contract",
  async (payload, { dispatch }) => {
    try {
      const res = await BusinessAPI.signContract(payload);
      if (!res.success) throw res;
      toast.success(res.message);
      dispatch(getBusinessesData());
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to upload contract";
      toast.error(errorMessage);
    }
  },
);
