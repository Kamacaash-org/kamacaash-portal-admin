import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Col,
  Container,
  Row,
  Form,
  Input,
  Label,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Button,
  Badge,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Alert,
} from "reactstrap";
import DataTable from "react-data-table-component";
import Select from "react-select";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";

// Import FilePond for file uploads
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginImageExifOrientation from "filepond-plugin-image-exif-orientation";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import { PDFDownloadLink } from "@react-pdf/renderer";
import AgreementPdf from "../../../Components/Common/AgreementPdf";

// Register the plugins
registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";

// Redux thunks
import {
  getBusinessesData as onGetBusinesses,
  archiveBusiness as onDeleteBusiness,
  createOrUpdateBusiness as onCreateOrUpdateBusiness,
  toggleStatusBusiness as onToggleBusinessActiveStatus,
  getCategories as onGetCategories,
  getStaffs as onGetStaffData,
} from "../../../slices/thunks";

// Selectors
const selectBusinessesData = createSelector(
  (state) => state.BusinessManagement,
  (businessesData) => businessesData.businessesData || [],
);
const selectCategoriesData = createSelector(
  (state) => state.BusinessManagement,
  (categoriesData) => categoriesData.categoriesData || [],
);

const selectStaffData = createSelector(
  (state) => state.UserManagement,
  (staffData) => staffData.staffData || [],
);

const resizeObserverErr = window.ResizeObserver;
window.ResizeObserver = class extends resizeObserverErr {
  constructor(callback) {
    super((...args) => {
      try {
        callback(...args);
      } catch (e) {
        // ignore ResizeObserver errors
      }
    });
  }
};

const dayMappings = [
  { key: "mon", day_of_week: 1 },
  { key: "tue", day_of_week: 2 },
  { key: "wed", day_of_week: 3 },
  { key: "thur", day_of_week: 4 },
  { key: "fri", day_of_week: 5 },
  { key: "sat", day_of_week: 6 },
  { key: "sun", day_of_week: 7 },
];

const defaultOpeningHours = {
  mon: { open: "08:00", close: "20:00" },
  tue: { open: "08:00", close: "20:00" },
  wed: { open: "08:00", close: "20:00" },
  thur: { open: "08:00", close: "20:00" },
  fri: { open: "14:00", close: "20:00" },
  sat: { open: "08:00", close: "20:00" },
  sun: { open: "08:00", close: "18:00" },
};

const getEntityId = (entity) => entity?._id || entity?.id || "";

const normalizeList = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const buildInitialFormData = () => ({
  ownerName: "",
  legalName: "",
  displayName: "",
  category: "",
  subcategoriesText: "",
  tagsText: "",
  primaryStaffAccount: "",
  countryCode: "+252",
  phoneNumber: "",
  secondaryPhone: "",
  email: "",
  websiteUrl: "",
  socialLinks: {
    facebook: "",
    instagram: "",
  },
  description: "",
  shortDescription: "",
  notes: "",
  logo: "",
  bannerImage: "",
  galleryImages: [],
  galleryImageUrlsText: "",
  licenseDocument: "",
  address: {
    street: "",
    addressLine2: "",
    city: "",
    state: "",
    district: "",
    country: "Somalia",
    postcode: "",
    coordinates: {
      type: "Point",
      coordinates: [0, 0],
    },
  },
  openingHours: { ...defaultOpeningHours },
  contract: {
    payoutSchedule: "WEEKLY",
  },
  bankAccountDetails: {
    accountHolderName: "",
    sortCode: "",
    accountNumber: "",
  },
  taxId: "",
  registrationNumber: "",
  defaultLanguage: "en",
  currency: "USD",
  timeZone: "Africa/Mogadishu",
});

const splitPhone = (phoneE164 = "") => {
  if (!phoneE164 || typeof phoneE164 !== "string") {
    return { countryCode: "+252", phoneNumber: "" };
  }

  const cleaned = phoneE164.trim();
  if (!cleaned.startsWith("+")) {
    return { countryCode: "+252", phoneNumber: cleaned };
  }

  const match = cleaned.match(/^\+\d{1,4}/);
  const countryCode = match?.[0] || "+252";
  const phoneNumber = cleaned.replace(countryCode, "").trim();
  return { countryCode, phoneNumber };
};

const normalizeBusiness = (business = {}) => {
  const id = getEntityId(business);
  const openingHours = { ...defaultOpeningHours };

  if (Array.isArray(business.opening_hours)) {
    business.opening_hours.forEach((entry) => {
      const mapping = dayMappings.find(
        (day) => day.day_of_week === entry.day_of_week,
      );
      if (mapping) {
        openingHours[mapping.key] = {
          open: entry.opens_at || defaultOpeningHours[mapping.key].open,
          close: entry.closes_at || defaultOpeningHours[mapping.key].close,
        };
      }
    });
  } else if (business.openingHours) {
    Object.keys(business.openingHours).forEach((key) => {
      if (openingHours[key]) {
        openingHours[key] = {
          open: business.openingHours[key]?.open || openingHours[key].open,
          close: business.openingHours[key]?.close || openingHours[key].close,
        };
      }
    });
  }

  const resolvedCategoryId =
    typeof business.category === "object"
      ? getEntityId(business.category)
      : business.category_id || business.category || "";

  const resolvedCategoryName =
    business.category?.name ||
    business.category_name ||
    business.category ||
    "";
  const staffId =
    business.primary_staff_id ||
    getEntityId(business.primaryStaffAccount) ||
    getEntityId(business.primary_staff);
  const { countryCode, phoneNumber } = splitPhone(
    business.phone_e164 ||
      `${business.countryCode || ""}${business.phoneNumber || ""}`,
  );
  const galleryImages = Array.isArray(business.gallery_images)
    ? business.gallery_images
    : Array.isArray(business.galleryImages)
      ? business.galleryImages
      : [];

  return {
    ...business,
    id,
    _id: id,
    ownerName: business.owner_name || business.ownerName || "",
    legalName: business.legal_name || business.legalName || "",
    displayName:
      business.display_name ||
      business.displayName ||
      business.businessName ||
      "",
    businessName:
      business.display_name ||
      business.legal_name ||
      business.businessName ||
      "",
    category: resolvedCategoryId,
    subcategoriesText: Array.isArray(business.subcategories)
      ? business.subcategories.join(", ")
      : "",
    tagsText: Array.isArray(business.tags) ? business.tags.join(", ") : "",
    categoryName: resolvedCategoryName,
    primaryStaffAccount: { _id: staffId },
    countryCode,
    phoneNumber,
    secondaryPhone: business.secondary_phone || business.secondaryPhone || "",
    email: business.email || "",
    websiteUrl: business.website_url || business.websiteUrl || "",
    socialLinks: {
      facebook:
        business.social_links?.facebook || business.socialLinks?.facebook || "",
      instagram:
        business.social_links?.instagram ||
        business.socialLinks?.instagram ||
        "",
    },
    description: business.description || "",
    shortDescription:
      business.short_description || business.shortDescription || "",
    notes: business.notes || "",
    logo: business.logo_url || business.logo || "",
    bannerImage: business.banner_url || business.bannerImage || "",
    galleryImages,
    galleryImageUrlsText: galleryImages.join(", "),
    licenseDocument:
      business.license_document_url || business.licenseDocument || "",
    address: {
      street: business.address_line1 || business.address?.street || "",
      addressLine2:
        business.address_line2 || business.address?.addressLine2 || "",
      city: business.city || business.address?.city || "",
      state: business.region || business.address?.state || "",
      district: business.district || business.address?.district || "",
      country: business.country || business.address?.country || "Somalia",
      postcode: business.postal_code || business.address?.postcode || "",
      coordinates: {
        type: "Point",
        coordinates: [
          Number(
            business.longitude ??
              business.address?.coordinates?.coordinates?.[0] ??
              0,
          ),
          Number(
            business.latitude ??
              business.address?.coordinates?.coordinates?.[1] ??
              0,
          ),
        ],
      },
    },
    openingHours,
    contract: business.contract || { payoutSchedule: "WEEKLY" },
    bankAccountDetails: {
      accountHolderName:
        business.bank_account?.account_holder_name ||
        business.bankAccountDetails?.accountHolderName ||
        "",
      bankName:
        business.bank_account?.bank_name ||
        business.bankAccountDetails?.bankName ||
        "",
      sortCode:
        business.bank_account?.sort_code ||
        business.bankAccountDetails?.sortCode ||
        "",
      accountNumber:
        business.bank_account?.account_number ||
        business.bankAccountDetails?.accountNumber ||
        "",
      merchantHolderName:
        business.bank_account?.merchant_holder_name ||
        business.bankAccountDetails?.merchantHolderName ||
        "",
      merchantName:
        business.bank_account?.merchant_name ||
        business.bankAccountDetails?.merchantName ||
        "",
      merchantNumber:
        business.bank_account?.merchant_number ||
        business.bankAccountDetails?.merchantNumber ||
        "",
      iban:
        business.bank_account?.iban || business.bankAccountDetails?.iban || "",
      swiftBic:
        business.bank_account?.swift_bic ||
        business.bankAccountDetails?.swiftBic ||
        "",
    },
    taxId: business.tax_id || business.taxId || "",
    registrationNumber:
      business.registration_number || business.registrationNumber || "",
    defaultLanguage:
      business.default_language || business.defaultLanguage || "en",
    currency: business.currency || "USD",
    timeZone: business.time_zone || business.timeZone || "Africa/Mogadishu",
    isActive: business.is_active ?? business.isActive ?? true,
    status: business.status || "PENDING",
  };
};

const buildBusinessPayload = (formData) => {
  const submitData = new FormData();
  const phoneDigits = (formData.phoneNumber || "").replace(/^0+/, "");
  const phoneE164 = `${formData.countryCode || "+252"}${phoneDigits}`;
  const parseCommaSeparated = (value = "") =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const subcategories = parseCommaSeparated(formData.subcategoriesText || "");
  const tags = parseCommaSeparated(formData.tagsText || "");
  const galleryFromText = parseCommaSeparated(
    formData.galleryImageUrlsText || "",
  );
  const galleryFromState = Array.isArray(formData.galleryImages)
    ? formData.galleryImages
    : [];
  const galleryUrls = [
    ...galleryFromState.filter((item) => typeof item === "string" && item),
    ...galleryFromText,
  ];
  const galleryFiles = galleryFromState.filter((item) => item instanceof File);

  submitData.append("owner_name", formData.ownerName || "");
  submitData.append(
    "legal_name",
    formData.legalName || formData.displayName || "",
  );
  submitData.append(
    "display_name",
    formData.displayName || formData.legalName || "",
  );
  submitData.append("category_id", formData.category || "");
  submitData.append("primary_staff_id", formData.primaryStaffAccount || "");
  submitData.append("subcategories", JSON.stringify(subcategories));
  submitData.append("tags", JSON.stringify(tags));
  submitData.append("city", formData.address.city || "");
  submitData.append("region", formData.address.state || "");
  submitData.append("district", formData.address.district || "");
  submitData.append("address_line1", formData.address.street || "");
  submitData.append("address_line2", formData.address.addressLine2 || "");
  submitData.append("postal_code", formData.address.postcode || "");
  submitData.append(
    "latitude",
    Number(formData.address.coordinates.coordinates[1] || 0),
  );
  submitData.append(
    "longitude",
    Number(formData.address.coordinates.coordinates[0] || 0),
  );
  submitData.append("phone_e164", phoneE164);
  submitData.append("secondary_phone", formData.secondaryPhone || "");
  submitData.append("email", formData.email || "");
  submitData.append("website_url", formData.websiteUrl || "");
  submitData.append(
    "social_links",
    JSON.stringify({
      facebook: formData.socialLinks.facebook || "",
      instagram: formData.socialLinks.instagram || "",
    }),
  );
  submitData.append("description", formData.description || "");
  submitData.append("short_description", formData.shortDescription || "");
  submitData.append("registration_number", formData.registrationNumber || "");
  submitData.append("tax_id", formData.taxId || "");
  submitData.append("notes", formData.notes || "");

  const openingHours = dayMappings.map(({ key, day_of_week }) => ({
    day_of_week,
    opens_at: formData.openingHours[key]?.open || defaultOpeningHours[key].open,
    closes_at:
      formData.openingHours[key]?.close || defaultOpeningHours[key].close,
  }));
  submitData.append("opening_hours", JSON.stringify(openingHours));

  submitData.append(
    "bank_account",
    JSON.stringify({
      account_holder_name: formData.bankAccountDetails.accountHolderName || "",
      account_number: formData.bankAccountDetails.accountNumber || "",
      sort_code: formData.bankAccountDetails.sortCode || "",
      bank_name: formData.bankAccountDetails.bankName || "",
      merchant_holder_name:
        formData.bankAccountDetails.merchantHolderName || "",
      merchant_name: formData.bankAccountDetails.merchantName || "",
      merchant_number: formData.bankAccountDetails.merchantNumber || "",
      iban: formData.bankAccountDetails.iban || "",
      swift_bic: formData.bankAccountDetails.swiftBic || "",
    }),
  );

  submitData.append("gallery_images", JSON.stringify(galleryUrls));
  galleryFiles.forEach((file) => {
    submitData.append("gallery_image_files", file);
  });

  if (formData.logo instanceof File) {
    submitData.append("logo_url", formData.logo);
  } else if (formData.logo) {
    submitData.append("logo_url", formData.logo);
  }

  if (formData.bannerImage instanceof File) {
    submitData.append("banner_url", formData.bannerImage);
  } else if (formData.bannerImage) {
    submitData.append("banner_url", formData.bannerImage);
  }

  if (formData.licenseDocument instanceof File) {
    submitData.append("license_document_url", formData.licenseDocument);
  } else if (formData.licenseDocument) {
    submitData.append("license_document_url", formData.licenseDocument);
  }

  return submitData;
};

const BusinessesPage = () => {
  document.title = "Businesses | Kamacaash";

  const dispatch = useDispatch();
  const businessesData = useSelector(selectBusinessesData);
  const categoriesData = useSelector(selectCategoriesData);
  const staffData = useSelector(selectStaffData);

  // State management
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [activeTab, setActiveTab] = useState("1");
  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    category: "all",
  });

  // Categories for dropdown
  const [categories, setCategories] = useState([]);

  // Form state
  const [formData, setFormData] = useState(buildInitialFormData());

  const [logoFiles, setLogoFiles] = useState([]);
  const [bannerFiles, setBannerFiles] = useState([]);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [licenseFiles, setLicenseFiles] = useState([]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await dispatch(onGetBusinesses());
      await dispatch(onGetCategories());
      await dispatch(onGetStaffData());
    } catch (error) {
      console.error("Error loading businesses:", error);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // Load data
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update lists when data changes
  useEffect(() => {
    const businessRows = normalizeList(businessesData, [
      "businesses",
      "rows",
      "data",
    ]);
    const initialBusinesses = Array.isArray(businessRows)
      ? businessRows.map((item) => normalizeBusiness(item))
      : [];
    setBusinesses(initialBusinesses);
  }, [businessesData]);

  useEffect(() => {
    const initialStaffsData = normalizeList(staffData, [
      "staffs",
      "rows",
      "data",
    ]);
    setStaffList(initialStaffsData);
  }, [staffData]);

  useEffect(() => {
    const initialCategories = normalizeList(categoriesData, [
      "categories",
      "rows",
      "data",
    ]);
    setCategories([
      ...(initialCategories || []).map((cat) => ({
        value: getEntityId(cat),
        label: cat.name || cat.label || cat.title || "Unknown Category",
      })),
    ]);
  }, [categoriesData]);

  useEffect(() => {
    const searchTerm = filters.search.toLowerCase().trim();
    const filtered = businesses.filter((business) => {
      const matchesSearch =
        !searchTerm ||
        business.businessName?.toLowerCase().includes(searchTerm) ||
        business.ownerName?.toLowerCase().includes(searchTerm) ||
        business.email?.toLowerCase().includes(searchTerm);

      const matchesStatus =
        filters.status === "all" ||
        (business.status || "").toUpperCase() === filters.status;
      const matchesCategory =
        filters.category === "all" || business.category === filters.category;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    setFilteredBusinesses(filtered);
  }, [businesses, filters]);

  // Prepare staff options for dropdown
  const staffOptions = [
    { value: "", label: "Select Staff" },
    ...staffList
      .filter((staff) => staff?.isActive ?? staff?.is_active)
      .map((staff) => ({
        value: getEntityId(staff),
        label: `${staff.firstName || ""} ${staff.lastName || ""} (${staff.phone || staff.phone_e164 || "N/A"})`,
      })),
  ];

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle nested object changes
  const handleNestedChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Handle address changes
  const handleAddressChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  // Handle opening hours changes
  const handleOpeningHoursChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day],
          [field]: value,
        },
      },
    }));
  };

  // Handle file upload for logo
  const handleLogoFileUpdate = (fileItems) => {
    setLogoFiles(fileItems);
    if (fileItems.length > 0) {
      setFormData((prev) => ({
        ...prev,
        logo: fileItems[0].file,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        logo: "",
      }));
    }
  };

  // Handle file upload for banner
  const handleBannerFileUpdate = (fileItems) => {
    setBannerFiles(fileItems);
    if (fileItems.length > 0) {
      setFormData((prev) => ({
        ...prev,
        bannerImage: fileItems[0].file,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        bannerImage: "",
      }));
    }
  };

  // Handle file upload for license
  const handleLicenseFileUpdate = (fileItems) => {
    setLicenseFiles(fileItems);
    if (fileItems.length > 0) {
      setFormData((prev) => ({
        ...prev,
        licenseDocument: fileItems[0].file,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        licenseDocument: "",
      }));
    }
  };

  const handleGalleryFileUpdate = (fileItems) => {
    setGalleryFiles(fileItems);
    setFormData((prev) => ({
      ...prev,
      galleryImages: fileItems.map((item) => item.file),
    }));
  };

  const hasValue = (value) => {
    if (typeof value === "string") return value.trim() !== "";
    return value !== null && value !== undefined;
  };

  const getTabMissingFields = (tabId) => {
    const missing = [];

    if (tabId === "1") {
      if (!hasValue(formData.ownerName)) missing.push("Owner Name");
      if (!hasValue(formData.legalName)) missing.push("Legal Name");
      if (!hasValue(formData.displayName)) missing.push("Display Name");
      if (!hasValue(formData.category)) missing.push("Category");
      if (!hasValue(formData.primaryStaffAccount)) {
        missing.push("Primary Staff Account");
      }
      if (!hasValue(formData.countryCode)) missing.push("Country Code");
      if (!hasValue(formData.phoneNumber)) missing.push("Phone Number");
      if (!hasValue(formData.email)) missing.push("Email");
      if (!hasValue(formData.description)) missing.push("Description");
      if (!hasValue(formData.shortDescription)) {
        missing.push("Short Description");
      }
    }

    if (tabId === "2") {
      if (!hasValue(formData.address.street)) missing.push("Address Line 1");
      if (!hasValue(formData.address.addressLine2))
        missing.push("Address Line 2");
      if (!hasValue(formData.address.city)) missing.push("City");
      if (!hasValue(formData.address.state)) missing.push("Region/State");
      if (!hasValue(formData.address.district)) missing.push("District");
      if (!hasValue(formData.address.postcode)) missing.push("Postal Code");

      const latitude = Number(formData.address.coordinates.coordinates[1]);
      const longitude = Number(formData.address.coordinates.coordinates[0]);
      if (!Number.isFinite(latitude) || latitude === 0)
        missing.push("Latitude");
      if (!Number.isFinite(longitude) || longitude === 0) {
        missing.push("Longitude");
      }

      const invalidHours = dayMappings.some(({ key }) => {
        const open = formData.openingHours?.[key]?.open;
        const close = formData.openingHours?.[key]?.close;
        return !hasValue(open) || !hasValue(close);
      });
      if (invalidHours) missing.push("Opening Hours (all days)");
    }

    if (tabId === "3") {
      if (!hasValue(formData.registrationNumber)) {
        missing.push("Registration Number");
      }
      if (!hasValue(formData.taxId)) missing.push("Tax ID");
      if (!hasValue(formData.notes)) missing.push("Notes");
      if (!hasValue(formData.contract?.payoutSchedule)) {
        missing.push("Payout Schedule");
      }

      if (!hasValue(formData.bankAccountDetails?.accountHolderName)) {
        missing.push("Account Holder Name");
      }
      if (!hasValue(formData.bankAccountDetails?.bankName)) {
        missing.push("Bank Name");
      }
      if (!hasValue(formData.bankAccountDetails?.accountNumber)) {
        missing.push("Account Number");
      }
      if (!hasValue(formData.bankAccountDetails?.sortCode)) {
        missing.push("Sort Code");
      }
      if (!hasValue(formData.bankAccountDetails?.merchantHolderName)) {
        missing.push("Merchant Holder Name");
      }
      if (!hasValue(formData.bankAccountDetails?.merchantName)) {
        missing.push("Merchant Name");
      }
      if (!hasValue(formData.bankAccountDetails?.merchantNumber)) {
        missing.push("Merchant Number");
      }
      if (!hasValue(formData.bankAccountDetails?.iban)) missing.push("IBAN");
      if (!hasValue(formData.bankAccountDetails?.swiftBic)) {
        missing.push("SWIFT/BIC");
      }
    }

    if (tabId === "4") {
      if (!hasValue(formData.logo)) missing.push("Logo");
      if (!hasValue(formData.bannerImage)) missing.push("Banner Image");
      if (!hasValue(formData.licenseDocument)) {
        missing.push("License Document");
      }

      const hasGalleryUrls = hasValue(formData.galleryImageUrlsText);
      const hasGalleryUploads =
        Array.isArray(galleryFiles) && galleryFiles.length > 0;
      if (!hasGalleryUrls && !hasGalleryUploads) {
        missing.push("Gallery Images");
      }
    }

    return missing;
  };

  const validateTab = (tabId) => {
    const missing = getTabMissingFields(tabId);
    if (!missing.length) return true;

    toast.warning(
      `Please complete ${missing.slice(0, 4).join(", ")}${missing.length > 4 ? "..." : ""} before continuing.`,
    );
    return false;
  };

  const handleTabChange = (targetTab) => {
    const current = Number(activeTab);
    const target = Number(targetTab);

    if (target <= current) {
      setActiveTab(targetTab);
      return;
    }

    for (let tab = current; tab < target; tab += 1) {
      if (!validateTab(String(tab))) {
        setActiveTab(String(tab));
        return;
      }
    }

    setActiveTab(targetTab);
  };

  // Validate form
  const validateForm = () => {
    for (const tabId of ["1", "2", "3", "4"]) {
      if (!validateTab(tabId)) {
        setActiveTab(tabId);
        return false;
      }
    }

    // Validate email format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.warning("Please enter a valid email address");
      return false;
    }

    return true;
  };

  // Reset form
  const resetForm = () => {
    setFormData(buildInitialFormData());
    setLogoFiles([]);
    setBannerFiles([]);
    setGalleryFiles([]);
    setLicenseFiles([]);
    setSelectedBusiness(null);
    setActiveTab("1");
  };

  // Handle modal close
  const handleModalClose = () => {
    setLogoFiles([]);
    setBannerFiles([]);
    setGalleryFiles([]);
    setLicenseFiles([]);
    setModal(false);
    resetForm();
  };

  // Create new business
  const createBusiness = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const submitData = buildBusinessPayload(formData);
      await dispatch(onCreateOrUpdateBusiness({ data: submitData })).unwrap();
      handleModalClose();
    } catch (error) {
      console.error("Error creating business:", error);
      toast.error("Failed to create business");
    }
  };

  // Update business
  const updateBusiness = async (e) => {
    e.preventDefault();
    if (!validateForm() || !selectedBusiness) return;

    try {
      const submitData = buildBusinessPayload(formData);
      await dispatch(
        onCreateOrUpdateBusiness({ id: selectedBusiness.id, data: submitData }),
      ).unwrap();
      handleModalClose();
    } catch (error) {
      console.error("Error updating business:", error);
      toast.error("Failed to update business");
    }
  };

  // Delete business
  const deleteBusiness = async () => {
    if (!selectedBusiness) return;

    try {
      await dispatch(onDeleteBusiness(selectedBusiness.id)).unwrap();
      setDeleteModal(false);
    } catch (error) {
      console.error("Error deleting business:", error);
    }
  };

  // Toggle business status
  const toggleBusinessStatus = async () => {
    if (!selectedBusiness) return;

    try {
      await dispatch(
        onToggleBusinessActiveStatus({
          id: selectedBusiness.id,
          is_active: !selectedBusiness.isActive,
        }),
      ).unwrap();
      setStatusModal(false);
    } catch (error) {
      console.error("Error toggling business status:", error);
    }
  };

  // Open modal for edit
  const handleEdit = (business) => {
    const normalizedBusiness = normalizeBusiness(business);
    const mergedOpeningHours = {
      ...defaultOpeningHours,
      ...(normalizedBusiness.openingHours || {}),
    };

    setSelectedBusiness(normalizedBusiness);
    setFormData({
      ownerName: normalizedBusiness.ownerName || "",
      legalName: normalizedBusiness.legalName || "",
      displayName: normalizedBusiness.displayName || "",
      category: normalizedBusiness.category || "",
      subcategoriesText: normalizedBusiness.subcategoriesText || "",
      tagsText: normalizedBusiness.tagsText || "",
      primaryStaffAccount: normalizedBusiness.primaryStaffAccount?._id || "",
      countryCode: normalizedBusiness.countryCode || "+252",
      phoneNumber: normalizedBusiness.phoneNumber || "",
      secondaryPhone: normalizedBusiness.secondaryPhone || "",
      email: normalizedBusiness.email || "",
      websiteUrl: normalizedBusiness.websiteUrl || "",
      socialLinks: normalizedBusiness.socialLinks || {
        facebook: "",
        instagram: "",
      },
      description: normalizedBusiness.description || "",
      shortDescription: normalizedBusiness.shortDescription || "",
      notes: normalizedBusiness.notes || "",
      logo: normalizedBusiness.logo || "",
      bannerImage: normalizedBusiness.bannerImage || "",
      galleryImages: normalizedBusiness.galleryImages || [],
      galleryImageUrlsText: normalizedBusiness.galleryImageUrlsText || "",
      licenseDocument: normalizedBusiness.licenseDocument || "",
      address: normalizedBusiness.address,
      openingHours: mergedOpeningHours,
      defaultLanguage: normalizedBusiness.defaultLanguage || "en",
      currency: normalizedBusiness.currency || "USD",
      timeZone: normalizedBusiness.timeZone || "Africa/Mogadishu",
      contract: normalizedBusiness.contract || { payoutSchedule: "WEEKLY" },
      bankAccountDetails: normalizedBusiness.bankAccountDetails || {
        accountHolderName: "",
        bankName: "",
        sortCode: "",
        accountNumber: "",
        merchantHolderName: "",
        merchantName: "",
        merchantNumber: "",
        iban: "",
        swiftBic: "",
      },
      taxId: normalizedBusiness.taxId || "",
      registrationNumber: normalizedBusiness.registrationNumber || "",
    });
    setIsEdit(true);
    setModal(true);
    setActiveTab("1");
  };

  // Open modal for view
  const handleView = (business) => {
    setSelectedBusiness(normalizeBusiness(business));
    setViewModal(true);
    setActiveTab("1");
  };

  // Open modal for create
  const handleCreate = () => {
    setSelectedBusiness(null);
    resetForm();
    setIsEdit(false);
    setModal(true);
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "PENDING":
        return "warning";
      case "REJECTED":
        return "danger";
      default:
        return "secondary";
    }
  };

  // Get active status badge
  const getActiveBadge = (isActive) => {
    return isActive ? "success" : "danger";
  };

  // Table columns
  const columns = [
    {
      name: "#",
      cell: (row, index) => index + 1,
      width: "60px",
    },
    {
      name: "Logo",
      cell: (row) => (
        <div className="avatar-xs">
          {row.logo ? (
            <img
              src={row.logo}
              alt={row.businessName}
              className="avatar-title bg-light rounded-circle"
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          ) : (
            <div className="avatar-title bg-light text-secondary rounded-circle">
              <i className="ri-store-line" />
            </div>
          )}
        </div>
      ),
      width: "70px",
    },
    {
      name: "Business Name",
      selector: (row) => row.businessName,
      wrap: true,
      sortable: true,
    },
    {
      name: "Owner",
      selector: (row) => row.ownerName,
      sortable: true,
    },
    {
      name: "Contact",
      cell: (row) => (
        <div>
          <div>{row.phoneNumber}</div>
          {row.email && <small className="text-muted">{row.email}</small>}
        </div>
      ),
    },
    {
      name: "Status",
      cell: (row) => (
        <div>
          <Badge color={getStatusBadge(row.status)} className="me-1">
            {row.status}
          </Badge>
          <Badge color={getActiveBadge(row.isActive)}>
            {row.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      ),
    },
    {
      name: "Location",
      cell: (row) => row.address?.city || "N/A",
    },
    {
      name: "Created",
      cell: (row) =>
        row.created_at ? new Date(row.created_at).toLocaleDateString() : "N/A",
      width: "120px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-1">
          <Button
            color="outline-info"
            size="sm"
            onClick={() => handleView(row)}
            title="View Details"
            className="btn-icon"
          >
            <i className="ri-eye-line" />
          </Button>
          <Button
            color="outline-primary"
            size="sm"
            onClick={() => handleEdit(row)}
            title="Edit"
            className="btn-icon"
          >
            <i className="ri-pencil-line" />
          </Button>
          {/* Agreement Download */}
          <PDFDownloadLink
            document={<AgreementPdf business={row} />}
            fileName={`Kamacaash-Agreement-${row.businessName}.pdf`}
          >
            {({ loading }) => (
              <Button
                color="outline-success"
                size="sm"
                className="btn-icon"
                title="Download Agreement"
                disabled={loading}
              >
                <i className="ri-file-download-line" />
              </Button>
            )}
          </PDFDownloadLink>
          <Button
            color={row.isActive ? "outline-warning" : "outline-success"}
            size="sm"
            onClick={() => {
              setSelectedBusiness(row);
              setStatusModal(true);
            }}
            title={row.isActive ? "Deactivate" : "Activate"}
            className="btn-icon"
          >
            <i className={row.isActive ? "ri-pause-line" : "ri-play-line"} />
          </Button>
          <Button
            color="outline-danger"
            size="sm"
            onClick={() => {
              setSelectedBusiness(row);
              setDeleteModal(true);
            }}
            title="Delete"
            className="btn-icon"
          >
            <i className="ri-delete-bin-line" />
          </Button>
        </div>
      ),
      width: "200px",
    },
  ];

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Businesses" pageTitle="Management" />

        {/* Stats Cards */}
        <Row className="mb-4">
          <Col xl={3} md={6}>
            <Card className="card-animate">
              <CardBody>
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <p className="text-uppercase fw-medium text-muted mb-0">
                      Total Businesses
                    </p>
                    <h4 className="mb-0">{businesses.length}</h4>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="avatar-sm">
                      <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-2">
                        <i className="ri-store-line"></i>
                      </span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col xl={3} md={6}>
            <Card className="card-animate">
              <CardBody>
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <p className="text-uppercase fw-medium text-muted mb-0">
                      Active Businesses
                    </p>
                    <h4 className="mb-0">
                      {businesses.filter((b) => b.isActive).length}
                    </h4>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="avatar-sm">
                      <span className="avatar-title bg-success-subtle text-success rounded-circle fs-2">
                        <i className="ri-checkbox-circle-line"></i>
                      </span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col xl={3} md={6}>
            <Card className="card-animate">
              <CardBody>
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <p className="text-uppercase fw-medium text-muted mb-0">
                      Pending Approval
                    </p>
                    <h4 className="mb-0">
                      {businesses.filter((b) => b.status === "PENDING").length}
                    </h4>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="avatar-sm">
                      <span className="avatar-title bg-warning-subtle text-warning rounded-circle fs-2">
                        <i className="ri-time-line"></i>
                      </span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col xl={3} md={6}>
            <Card className="card-animate">
              <CardBody>
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <p className="text-uppercase fw-medium text-muted mb-0">
                      Approved
                    </p>
                    <h4 className="mb-0">
                      {businesses.filter((b) => b.status === "APPROVED").length}
                    </h4>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="avatar-sm">
                      <span className="avatar-title bg-info-subtle text-info rounded-circle fs-2">
                        <i className="ri-shield-check-line"></i>
                      </span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Filter Controls */}
        <Card className="mb-4">
          <CardBody className="p-3">
            <Row className="g-3 align-items-end">
              <Col md={4}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Search Businesses</Label>
                  <Input
                    type="text"
                    name="search"
                    placeholder="Search by name, owner, or email..."
                    value={filters.search}
                    onChange={handleFilterChange}
                    className="form-control"
                  />
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Status</Label>
                  <Select
                    options={[
                      { value: "all", label: "All" },
                      { value: "PENDING", label: "Pending" },
                      { value: "APPROVED", label: "Approved" },
                      { value: "REJECTED", label: "Rejected" },
                    ]}
                    value={{
                      value: filters.status,
                      label: filters.status === "all" ? "All" : filters.status,
                    }}
                    onChange={(opt) =>
                      setFilters((prev) => ({ ...prev, status: opt.value }))
                    }
                    className="react-select"
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Category</Label>
                  <Select
                    options={[{ value: "all", label: "All" }, ...categories]}
                    value={{
                      value: filters.category,
                      label:
                        filters.category === "all"
                          ? "All"
                          : categories.find(
                              (cat) => cat.value === filters.category,
                            )?.label || "All",
                    }}
                    onChange={(opt) =>
                      setFilters((prev) => ({ ...prev, category: opt.value }))
                    }
                    className="react-select"
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
              <Col md={2}>
                <Button
                  color="primary"
                  className="w-100 mb-3"
                  onClick={handleCreate}
                >
                  <i className="ri-add-line me-1"></i>
                  Add Business
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* Businesses Table */}
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center bg-light">
            <h5 className="card-title mb-0 flex-grow-1">
              <i className="ri-store-line align-middle me-2"></i>
              Businesses List
              <Badge color="primary" className="ms-2">
                {filteredBusinesses.length}
              </Badge>
            </h5>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Loader />
            ) : (
              <DataTable
                columns={columns}
                data={filteredBusinesses}
                pagination
                responsive
                // highlightOnHover
                noDataComponent={
                  <div className="text-center py-5">
                    <i className="ri-inbox-line display-4 text-muted"></i>
                    <h5 className="mt-3">No businesses found</h5>
                    <p className="text-muted">
                      Try adjusting your search criteria or add a new business.
                    </p>
                  </div>
                }
                customStyles={{
                  headCells: {
                    style: {
                      fontWeight: "600",
                      fontSize: "0.875rem",
                      // backgroundColor: '#f8f9fa',
                    },
                  },
                  cells: {
                    style: {
                      fontSize: "0.875rem",
                      padding: "12px 8px",
                    },
                  },
                }}
              />
            )}
          </CardBody>
        </Card>
      </Container>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modal}
        toggle={handleModalClose}
        unmountOnClose={false}
        size="xl"
        centered
        scrollable
      >
        <ModalHeader toggle={handleModalClose} className="bg-light">
          <i className={`ri-${isEdit ? "pencil" : "add"}-line me-2`}></i>
          {isEdit ? "Edit Business" : "Create New Business"}
        </ModalHeader>
        <Form noValidate onSubmit={isEdit ? updateBusiness : createBusiness}>
          <ModalBody style={{ maxHeight: "70vh", overflowY: "auto" }}>
            {/* Step Navigation */}
            <div className="step-arrow-nav mb-4">
              <Nav
                className="nav-pills custom-nav nav-justified"
                role="tablist"
              >
                <NavItem>
                  <NavLink
                    className={activeTab === "1" ? "active" : ""}
                    onClick={() => handleTabChange("1")}
                  >
                    <i className="ri-user-line me-1" /> Basic Info
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={activeTab === "2" ? "active" : ""}
                    onClick={() => handleTabChange("2")}
                  >
                    <i className="ri-map-pin-line me-1" /> Location & Hours
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={activeTab === "3" ? "active" : ""}
                    onClick={() => handleTabChange("3")}
                  >
                    <i className="ri-information-line me-1" /> Information
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={activeTab === "4" ? "active" : ""}
                    onClick={() => handleTabChange("4")}
                  >
                    <i className="ri-image-line me-1" /> Images & Documents
                  </NavLink>
                </NavItem>
              </Nav>
            </div>

            <TabContent activeTab={activeTab}>
              {/* Tab 1: Basic Information */}
              <TabPane tabId="1">
                <Row>
                  <Col lg={6}>
                    <Card className="border">
                      <CardHeader className="bg-light">
                        <h6 className="mb-0">Owner Information</h6>
                      </CardHeader>
                      <CardBody>
                        <FormGroup>
                          <Label className="form-label">
                            Owner Name <span className="text-danger">*</span>
                          </Label>
                          <Input
                            name="ownerName"
                            value={formData.ownerName}
                            onChange={handleInputChange}
                            placeholder="Enter owner's full name"
                            className="form-control-lg"
                            required
                          />
                        </FormGroup>

                        <FormGroup>
                          <Label className="form-label">Email Address</Label>
                          <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="owner@example.com"
                            className="form-control-lg"
                          />
                        </FormGroup>

                        <FormGroup>
                          <Label>
                            Primary Staff Account{" "}
                            <span className="text-danger">*</span>
                          </Label>
                          <Select
                            options={staffOptions}
                            value={staffOptions.find(
                              (opt) =>
                                opt.value === formData.primaryStaffAccount,
                            )}
                            onChange={(opt) =>
                              setFormData((prev) => ({
                                ...prev,
                                primaryStaffAccount: opt.value,
                              }))
                            }
                            placeholder="Select category"
                            className="react-select"
                            classNamePrefix="select"
                          />
                        </FormGroup>
                      </CardBody>
                    </Card>

                    <Card className="border mt-3">
                      <CardHeader className="bg-light">
                        <h6 className="mb-0">Contact Information</h6>
                      </CardHeader>
                      <CardBody>
                        <Row>
                          <Col sm={4}>
                            <FormGroup>
                              <Label className="form-label">Country Code</Label>
                              <Input
                                name="countryCode"
                                value={formData.countryCode}
                                onChange={handleInputChange}
                                className="form-control-lg"
                              />
                            </FormGroup>
                          </Col>
                          <Col sm={8}>
                            <FormGroup>
                              <Label className="form-label">
                                Phone Number{" "}
                                <span className="text-danger">*</span>
                              </Label>
                              <Input
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                placeholder="612345678"
                                className="form-control-lg"
                                required
                              />
                            </FormGroup>
                          </Col>
                        </Row>

                        <FormGroup>
                          <Label className="form-label">Secondary Phone</Label>
                          <Input
                            name="secondaryPhone"
                            value={formData.secondaryPhone}
                            onChange={handleInputChange}
                            placeholder="+252615555555"
                            className="form-control-lg"
                          />
                        </FormGroup>

                        <FormGroup>
                          <Label className="form-label">Website URL</Label>
                          <Input
                            name="websiteUrl"
                            value={formData.websiteUrl}
                            onChange={handleInputChange}
                            placeholder="https://ahmedfresh.so"
                            className="form-control-lg"
                          />
                        </FormGroup>

                        <Row>
                          <Col sm={6}>
                            <FormGroup>
                              <Label className="form-label">Facebook URL</Label>
                              <Input
                                value={formData.socialLinks.facebook}
                                onChange={(e) =>
                                  handleNestedChange(
                                    "socialLinks",
                                    "facebook",
                                    e.target.value,
                                  )
                                }
                                placeholder="https://facebook.com/business"
                                className="form-control-lg"
                              />
                            </FormGroup>
                          </Col>
                          <Col sm={6}>
                            <FormGroup>
                              <Label className="form-label">
                                Instagram URL
                              </Label>
                              <Input
                                value={formData.socialLinks.instagram}
                                onChange={(e) =>
                                  handleNestedChange(
                                    "socialLinks",
                                    "instagram",
                                    e.target.value,
                                  )
                                }
                                placeholder="https://instagram.com/business"
                                className="form-control-lg"
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                      </CardBody>
                    </Card>
                  </Col>

                  <Col lg={6}>
                    <Card className="border">
                      <CardHeader className="bg-light">
                        <h6 className="mb-0">Business Information</h6>
                      </CardHeader>
                      <CardBody>
                        <FormGroup>
                          <Label className="form-label">
                            Legal Name <span className="text-danger">*</span>
                          </Label>
                          <Input
                            name="legalName"
                            value={formData.legalName}
                            onChange={handleInputChange}
                            placeholder="Enter legal business name"
                            className="form-control-lg"
                            required
                          />
                        </FormGroup>

                        <FormGroup>
                          <Label className="form-label">
                            Display Name <span className="text-danger">*</span>
                          </Label>
                          <Input
                            name="displayName"
                            value={formData.displayName}
                            onChange={handleInputChange}
                            placeholder="Enter display name"
                            className="form-control-lg"
                            required
                          />
                        </FormGroup>

                        <FormGroup>
                          <Label className="form-label">
                            Category <span className="text-danger">*</span>
                          </Label>
                          <Select
                            options={categories}
                            value={categories.find(
                              (cat) => cat.value === formData.category,
                            )}
                            onChange={(opt) =>
                              setFormData((prev) => ({
                                ...prev,
                                category: opt.value,
                              }))
                            }
                            placeholder="Select category"
                            className="react-select"
                            classNamePrefix="select"
                          />
                        </FormGroup>

                        <FormGroup>
                          <Label className="form-label">Description</Label>
                          <Input
                            type="textarea"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Brief description of the business"
                            rows="3"
                            className="form-control-lg"
                          />
                        </FormGroup>

                        <FormGroup>
                          <Label className="form-label">
                            Short Description
                          </Label>
                          <Input
                            name="shortDescription"
                            value={formData.shortDescription}
                            onChange={handleInputChange}
                            placeholder="Short summary for listings"
                            className="form-control-lg"
                          />
                        </FormGroup>

                        <FormGroup>
                          <Label className="form-label">
                            Subcategories (IDs)
                          </Label>
                          <Input
                            name="subcategoriesText"
                            value={formData.subcategoriesText}
                            onChange={handleInputChange}
                            placeholder="id1, id2, id3"
                            className="form-control-lg"
                          />
                        </FormGroup>

                        <FormGroup className="mb-0">
                          <Label className="form-label">Tags</Label>
                          <Input
                            name="tagsText"
                            value={formData.tagsText}
                            onChange={handleInputChange}
                            placeholder="grocery, fresh, halal"
                            className="form-control-lg"
                          />
                        </FormGroup>
                      </CardBody>
                    </Card>

                    <Card className="border mt-3">
                      <CardHeader className="bg-light">
                        <h6 className="mb-0">Legal Information</h6>
                      </CardHeader>
                      <CardBody>
                        <FormGroup>
                          <Label className="form-label">Tax ID</Label>
                          <Input
                            name="taxId"
                            value={formData.taxId}
                            onChange={handleInputChange}
                            placeholder="TAX1234567"
                            className="form-control-lg"
                          />
                        </FormGroup>

                        <FormGroup>
                          <Label className="form-label">
                            Registration Number
                          </Label>
                          <Input
                            name="registrationNumber"
                            value={formData.registrationNumber}
                            onChange={handleInputChange}
                            placeholder="REG9876543"
                            className="form-control-lg"
                          />
                        </FormGroup>
                      </CardBody>
                    </Card>
                  </Col>
                </Row>
              </TabPane>

              {/* Tab 2: Location & Hours */}
              <TabPane tabId="2">
                <Row>
                  <Col lg={6}>
                    <Card className="border">
                      <CardHeader className="bg-light">
                        <h6 className="mb-0">Address Information</h6>
                      </CardHeader>
                      <CardBody>
                        <FormGroup>
                          <Label className="form-label">Street Address</Label>
                          <Input
                            value={formData.address.street}
                            onChange={(e) =>
                              handleAddressChange("street", e.target.value)
                            }
                            placeholder="Hamarweyne Market Rd"
                            className="form-control-lg"
                          />
                        </FormGroup>

                        <FormGroup>
                          <Label className="form-label">Address Line 2</Label>
                          <Input
                            value={formData.address.addressLine2}
                            onChange={(e) =>
                              handleAddressChange(
                                "addressLine2",
                                e.target.value,
                              )
                            }
                            placeholder="Near landmark"
                            className="form-control-lg"
                          />
                        </FormGroup>

                        <Row>
                          <Col sm={6}>
                            <FormGroup>
                              <Label className="form-label">City</Label>
                              <Input
                                value={formData.address.city}
                                onChange={(e) =>
                                  handleAddressChange("city", e.target.value)
                                }
                                placeholder="Mogadishu"
                                className="form-control-lg"
                              />
                            </FormGroup>
                          </Col>
                          <Col sm={6}>
                            <FormGroup>
                              <Label className="form-label">State</Label>
                              <Input
                                value={formData.address.state}
                                onChange={(e) =>
                                  handleAddressChange("state", e.target.value)
                                }
                                placeholder="Banaadir"
                                className="form-control-lg"
                              />
                            </FormGroup>
                          </Col>
                        </Row>

                        <FormGroup>
                          <Label className="form-label">District</Label>
                          <Input
                            value={formData.address.district}
                            onChange={(e) =>
                              handleAddressChange("district", e.target.value)
                            }
                            placeholder="Hodan"
                            className="form-control-lg"
                          />
                        </FormGroup>

                        <Row>
                          <Col sm={6}>
                            <FormGroup>
                              <Label className="form-label">Country</Label>
                              <Input
                                value={formData.address.country}
                                onChange={(e) =>
                                  handleAddressChange("country", e.target.value)
                                }
                                className="form-control-lg"
                                disabled
                              />
                            </FormGroup>
                          </Col>
                          <Col sm={6}>
                            <FormGroup>
                              <Label className="form-label">Postcode</Label>
                              <Input
                                value={formData.address.postcode}
                                onChange={(e) =>
                                  handleAddressChange(
                                    "postcode",
                                    e.target.value,
                                  )
                                }
                                placeholder="25210"
                                className="form-control-lg"
                              />
                            </FormGroup>
                          </Col>
                        </Row>

                        <Row>
                          <Col sm={6}>
                            <FormGroup>
                              <Label className="form-label">Latitude</Label>
                              <Input
                                type="number"
                                step="any"
                                value={
                                  formData.address.coordinates.coordinates[1]
                                }
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    address: {
                                      ...prev.address,
                                      coordinates: {
                                        ...prev.address.coordinates,
                                        coordinates: [
                                          prev.address.coordinates
                                            .coordinates[0],
                                          e.target.value,
                                        ],
                                      },
                                    },
                                  }))
                                }
                                placeholder="2.0469"
                                className="form-control-lg"
                              />
                            </FormGroup>
                          </Col>
                          <Col sm={6}>
                            <FormGroup>
                              <Label className="form-label">Longitude</Label>
                              <Input
                                type="number"
                                step="any"
                                value={
                                  formData.address.coordinates.coordinates[0]
                                }
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    address: {
                                      ...prev.address,
                                      coordinates: {
                                        ...prev.address.coordinates,
                                        coordinates: [
                                          e.target.value,
                                          prev.address.coordinates
                                            .coordinates[1],
                                        ],
                                      },
                                    },
                                  }))
                                }
                                placeholder="45.3182"
                                className="form-control-lg"
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                      </CardBody>
                    </Card>
                  </Col>

                  <Col lg={6}>
                    <Card className="border">
                      <CardHeader className="bg-light">
                        <h6 className="mb-0">Business Hours</h6>
                      </CardHeader>
                      <CardBody>
                        {["mon", "tue", "wed", "thur", "fri", "sat", "sun"].map(
                          (day) => (
                            <Row key={day} className="mb-2">
                              <Col sm={3}>
                                <Label className="form-label text-capitalize">
                                  {day === "thur"
                                    ? "Thursday"
                                    : day === "tue"
                                      ? "Tuesday"
                                      : day === "wed"
                                        ? "Wednesday"
                                        : day === "fri"
                                          ? "Friday"
                                          : day === "sat"
                                            ? "Saturday"
                                            : day === "sun"
                                              ? "Sunday"
                                              : "Monday"}
                                </Label>
                              </Col>
                              <Col sm={4}>
                                <Input
                                  type="time"
                                  value={formData.openingHours[day].open}
                                  onChange={(e) =>
                                    handleOpeningHoursChange(
                                      day,
                                      "open",
                                      e.target.value,
                                    )
                                  }
                                  className="form-control"
                                />
                              </Col>
                              <Col sm={1} className="text-center pt-2">
                                <span className="text-muted">to</span>
                              </Col>
                              <Col sm={4}>
                                <Input
                                  type="time"
                                  value={formData.openingHours[day].close}
                                  onChange={(e) =>
                                    handleOpeningHoursChange(
                                      day,
                                      "close",
                                      e.target.value,
                                    )
                                  }
                                  className="form-control"
                                />
                              </Col>
                            </Row>
                          ),
                        )}
                      </CardBody>
                    </Card>
                  </Col>
                </Row>
              </TabPane>

              {/* Tab 3: Information */}
              <TabPane tabId="3">
                <Row>
                  <Col lg={6}>
                    <Card className="border">
                      <CardHeader className="bg-light">
                        <h6 className="mb-0">Contract Details</h6>
                      </CardHeader>
                      <CardBody>
                        <FormGroup>
                          <Label className="form-label">
                            Registration Number
                          </Label>
                          <Input
                            name="registrationNumber"
                            value={formData.registrationNumber}
                            onChange={handleInputChange}
                            placeholder="SO-REG-2026-001"
                            className="form-control-lg"
                          />
                        </FormGroup>

                        <FormGroup>
                          <Label className="form-label">Tax ID</Label>
                          <Input
                            name="taxId"
                            value={formData.taxId}
                            onChange={handleInputChange}
                            placeholder="SO-TAX-123456"
                            className="form-control-lg"
                          />
                        </FormGroup>

                        <FormGroup>
                          <Label className="form-label">Payout Schedule</Label>
                          <Select
                            options={[
                              { value: "DAILY", label: "Daily" },
                              { value: "WEEKLY", label: "Weekly" },
                              { value: "MONTHLY", label: "Monthly" },
                              { value: "QUARTERLY", label: "Quarterly" },
                              { value: "YEARLY", label: "Yearly" },
                            ]}
                            value={{
                              value: formData.contract.payoutSchedule,
                              label: formData.contract.payoutSchedule,
                            }}
                            onChange={(opt) =>
                              handleNestedChange(
                                "contract",
                                "payoutSchedule",
                                opt.value,
                              )
                            }
                            className="react-select"
                            classNamePrefix="select"
                          />
                        </FormGroup>

                        <FormGroup className="mb-0">
                          <Label className="form-label">Notes</Label>
                          <Input
                            type="textarea"
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            placeholder="Additional onboarding notes"
                            rows="4"
                            className="form-control-lg"
                          />
                        </FormGroup>
                      </CardBody>
                    </Card>
                  </Col>

                  <Col lg={6}>
                    <Card className="border">
                      <CardHeader className="bg-light">
                        <h6 className="mb-0">Bank Account Details</h6>
                      </CardHeader>
                      <CardBody>
                        <FormGroup>
                          <Label className="form-label">
                            Account Holder Name
                          </Label>
                          <Input
                            value={
                              formData.bankAccountDetails.accountHolderName
                            }
                            onChange={(e) =>
                              handleNestedChange(
                                "bankAccountDetails",
                                "accountHolderName",
                                e.target.value,
                              )
                            }
                            placeholder="Ahmed Ali"
                            className="form-control-lg"
                          />
                        </FormGroup>

                        <FormGroup>
                          <Label className="form-label">Bank Name</Label>
                          <Input
                            value={formData.bankAccountDetails.bankName}
                            onChange={(e) =>
                              handleNestedChange(
                                "bankAccountDetails",
                                "bankName",
                                e.target.value,
                              )
                            }
                            placeholder="Salaam Somali Bank"
                            className="form-control-lg"
                          />
                        </FormGroup>

                        <FormGroup>
                          <Label className="form-label">Sort Code</Label>
                          <Input
                            value={formData.bankAccountDetails.sortCode}
                            onChange={(e) =>
                              handleNestedChange(
                                "bankAccountDetails",
                                "sortCode",
                                e.target.value,
                              )
                            }
                            placeholder="12-34-56"
                            className="form-control-lg"
                          />
                        </FormGroup>

                        <FormGroup>
                          <Label className="form-label">Account Number</Label>
                          <Input
                            value={formData.bankAccountDetails.accountNumber}
                            onChange={(e) =>
                              handleNestedChange(
                                "bankAccountDetails",
                                "accountNumber",
                                e.target.value,
                              )
                            }
                            placeholder="12345678"
                            className="form-control-lg"
                          />
                        </FormGroup>

                        <Row>
                          <Col sm={6}>
                            <FormGroup>
                              <Label className="form-label">
                                Merchant Holder Name
                              </Label>
                              <Input
                                value={
                                  formData.bankAccountDetails.merchantHolderName
                                }
                                onChange={(e) =>
                                  handleNestedChange(
                                    "bankAccountDetails",
                                    "merchantHolderName",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ahmed Fresh Market"
                                className="form-control-lg"
                              />
                            </FormGroup>
                          </Col>
                          <Col sm={6}>
                            <FormGroup>
                              <Label className="form-label">
                                Merchant Name
                              </Label>
                              <Input
                                value={formData.bankAccountDetails.merchantName}
                                onChange={(e) =>
                                  handleNestedChange(
                                    "bankAccountDetails",
                                    "merchantName",
                                    e.target.value,
                                  )
                                }
                                placeholder="WAAFI"
                                className="form-control-lg"
                              />
                            </FormGroup>
                          </Col>
                        </Row>

                        <Row>
                          <Col sm={6}>
                            <FormGroup>
                              <Label className="form-label">
                                Merchant Number
                              </Label>
                              <Input
                                value={
                                  formData.bankAccountDetails.merchantNumber
                                }
                                onChange={(e) =>
                                  handleNestedChange(
                                    "bankAccountDetails",
                                    "merchantNumber",
                                    e.target.value,
                                  )
                                }
                                placeholder="678899"
                                className="form-control-lg"
                              />
                            </FormGroup>
                          </Col>
                          <Col sm={6}>
                            <FormGroup>
                              <Label className="form-label">SWIFT/BIC</Label>
                              <Input
                                value={formData.bankAccountDetails.swiftBic}
                                onChange={(e) =>
                                  handleNestedChange(
                                    "bankAccountDetails",
                                    "swiftBic",
                                    e.target.value,
                                  )
                                }
                                placeholder="SSBLSOMS"
                                className="form-control-lg"
                              />
                            </FormGroup>
                          </Col>
                        </Row>

                        <FormGroup>
                          <Label className="form-label">IBAN</Label>
                          <Input
                            value={formData.bankAccountDetails.iban}
                            onChange={(e) =>
                              handleNestedChange(
                                "bankAccountDetails",
                                "iban",
                                e.target.value,
                              )
                            }
                            placeholder="SO123456789012345678901234"
                            className="form-control-lg"
                          />
                        </FormGroup>
                      </CardBody>
                    </Card>
                  </Col>
                </Row>
              </TabPane>

              {/* Tab 4: Images & Documents */}
              <TabPane tabId="4">
                <Row>
                  <Col lg={6}>
                    <Card className="border">
                      <CardHeader className="bg-light">
                        <h6 className="mb-0">Business Media</h6>
                      </CardHeader>
                      <CardBody>
                        <FormGroup>
                          <Label className="form-label">Business Logo</Label>
                          <Input
                            name="logo"
                            value={
                              typeof formData.logo === "string"
                                ? formData.logo
                                : ""
                            }
                            onChange={handleInputChange}
                            placeholder="https://cdn.site.com/logo.png"
                            className="form-control-lg mb-3"
                          />
                          <FilePond
                            files={logoFiles}
                            onupdatefiles={handleLogoFileUpdate}
                            allowMultiple={false}
                            maxFiles={1}
                            name="logo"
                            labelIdle='<div class="text-center"><i class="ri-image-line display-4 text-muted"></i><p class="mt-2">Drag & Drop logo or <span class="filepond--label-action">Browse</span></p></div>'
                            acceptedFileTypes={["image/*"]}
                            imagePreviewHeight={100}
                            credits={false}
                            className="filepond-border"
                          />
                          <small className="text-muted">
                            Recommended size: 300x300px
                          </small>
                        </FormGroup>

                        <FormGroup className="mt-3">
                          <Label className="form-label">Banner Image</Label>
                          <Input
                            name="bannerImage"
                            value={
                              typeof formData.bannerImage === "string"
                                ? formData.bannerImage
                                : ""
                            }
                            onChange={handleInputChange}
                            placeholder="https://cdn.site.com/banner.png"
                            className="form-control-lg mb-3"
                          />
                          <FilePond
                            files={bannerFiles}
                            onupdatefiles={handleBannerFileUpdate}
                            allowMultiple={false}
                            maxFiles={1}
                            name="bannerImage"
                            labelIdle='<div class="text-center"><i class="ri-landscape-line display-4 text-muted"></i><p class="mt-2">Drag & Drop banner or <span class="filepond--label-action">Browse</span></p></div>'
                            acceptedFileTypes={["image/*"]}
                            imagePreviewHeight={150}
                            credits={false}
                            className="filepond-border"
                          />
                          <small className="text-muted">
                            Recommended size: 1200x400px
                          </small>
                        </FormGroup>

                        <FormGroup className="mt-3 mb-0">
                          <Label className="form-label">Gallery Images</Label>
                          <Input
                            name="galleryImageUrlsText"
                            value={formData.galleryImageUrlsText}
                            onChange={handleInputChange}
                            placeholder="https://cdn.site.com/img1.jpg, https://cdn.site.com/img2.jpg"
                            className="form-control-lg mb-3"
                          />
                          <FilePond
                            files={galleryFiles}
                            onupdatefiles={handleGalleryFileUpdate}
                            allowMultiple={true}
                            maxFiles={10}
                            name="galleryImages"
                            labelIdle='<div class="text-center"><i class="ri-gallery-line display-4 text-muted"></i><p class="mt-2">Drag & Drop gallery images or <span class="filepond--label-action">Browse</span></p></div>'
                            acceptedFileTypes={["image/*"]}
                            imagePreviewHeight={120}
                            credits={false}
                            className="filepond-border"
                          />
                          <small className="text-muted">
                            Enter URLs separated by comma, or upload multiple
                            images.
                          </small>
                        </FormGroup>
                      </CardBody>
                    </Card>
                  </Col>

                  <Col lg={6}>
                    <Card className="border">
                      <CardHeader className="bg-light">
                        <h6 className="mb-0">Legal Documents</h6>
                      </CardHeader>
                      <CardBody>
                        <FormGroup>
                          <Label className="form-label">License Document</Label>
                          <FilePond
                            files={licenseFiles}
                            onupdatefiles={handleLicenseFileUpdate}
                            allowMultiple={false}
                            maxFiles={1}
                            name="licenseDocument"
                            labelIdle='<div class="text-center"><i class="ri-file-text-line display-4 text-muted"></i><p class="mt-2">Drag & Drop license file or <span class="filepond--label-action">Browse</span></p></div>'
                            acceptedFileTypes={["application/pdf", "image/*"]}
                            credits={false}
                            className="filepond-border"
                          />
                          <small className="text-muted">
                            Accepted formats: PDF, Images
                          </small>
                        </FormGroup>

                        {/* Image Previews */}
                        {formData.logo && !logoFiles.length && (
                          <div className="mt-3">
                            <Label>Current Logo:</Label>
                            <img
                              src={formData.logo}
                              alt="Logo preview"
                              className="img-thumbnail mt-1"
                              style={{ maxHeight: "100px" }}
                            />
                          </div>
                        )}

                        {formData.bannerImage && !bannerFiles.length && (
                          <div className="mt-3">
                            <Label>Current Banner:</Label>
                            <img
                              src={formData.bannerImage}
                              alt="Banner preview"
                              className="img-thumbnail mt-1"
                              style={{ maxHeight: "150px" }}
                            />
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </Col>
                </Row>
              </TabPane>
            </TabContent>
          </ModalBody>
          <ModalFooter className="bg-light">
            <div className="w-100 d-flex justify-content-between">
              <div>
                {activeTab !== "1" && (
                  <Button
                    color="light"
                    onClick={() =>
                      setActiveTab((parseInt(activeTab) - 1).toString())
                    }
                  >
                    <i className="ri-arrow-left-line me-1" /> Previous
                  </Button>
                )}
              </div>
              <div>
                {activeTab !== "4" ? (
                  <Button
                    color="primary"
                    onClick={() =>
                      handleTabChange((parseInt(activeTab) + 1).toString())
                    }
                  >
                    Next <i className="ri-arrow-right-line ms-1" />
                  </Button>
                ) : (
                  <Button color="success" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <i className="ri-loader-4-line spin me-1"></i>
                        {isEdit ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <i className="ri-save-line me-1"></i>
                        {isEdit ? "Update Business" : "Create Business"}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </ModalFooter>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={viewModal}
        toggle={() => setViewModal(false)}
        unmountOnClose={false}
        size="xl"
        centered
        scrollable
      >
        <ModalHeader toggle={() => setViewModal(false)} className="bg-light">
          <i className="ri-store-line me-2"></i>
          Business Details - {selectedBusiness?.businessName}
        </ModalHeader>
        <ModalBody style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {selectedBusiness && (
            <>
              {/* Step Navigation for View */}
              <div className="step-arrow-nav mb-4">
                <Nav
                  className="nav-pills custom-nav nav-justified"
                  role="tablist"
                >
                  <NavItem>
                    <NavLink
                      className={activeTab === "1" ? "active" : ""}
                      onClick={() => setActiveTab("1")}
                    >
                      <i className="ri-user-line me-1" /> Basic Info
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={activeTab === "2" ? "active" : ""}
                      onClick={() => setActiveTab("2")}
                    >
                      <i className="ri-map-pin-line me-1" /> Location
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={activeTab === "3" ? "active" : ""}
                      onClick={() => setActiveTab("3")}
                    >
                      <i className="ri-bank-card-line me-1" /> Details
                    </NavLink>
                  </NavItem>
                </Nav>
              </div>

              <TabContent activeTab={activeTab}>
                {/* Tab 1: Basic Information */}
                <TabPane tabId="1">
                  <Row>
                    <Col md={4} className="text-center mb-4">
                      {selectedBusiness.logo ? (
                        <img
                          src={selectedBusiness.logo}
                          alt={selectedBusiness.businessName}
                          className="rounded-circle img-thumbnail mb-3"
                          style={{
                            width: "150px",
                            height: "150px",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          className="rounded-circle bg-light d-flex align-items-center justify-content-center mb-3"
                          style={{
                            width: "150px",
                            height: "150px",
                            margin: "0 auto",
                          }}
                        >
                          <i className="ri-store-line display-4 text-muted"></i>
                        </div>
                      )}
                      <h4>{selectedBusiness.businessName}</h4>
                      <div className="mb-2">
                        <Badge
                          color={getStatusBadge(selectedBusiness.status)}
                          className="me-1 fs-6"
                        >
                          {selectedBusiness.status}
                        </Badge>
                        <Badge
                          color={getActiveBadge(selectedBusiness.isActive)}
                          className="fs-6"
                        >
                          {selectedBusiness.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-muted">
                        {selectedBusiness.description}
                      </p>
                    </Col>
                    <Col md={8}>
                      <Row>
                        <Col sm={6}>
                          <h6>Owner Information</h6>
                          <p>
                            <strong>Name:</strong> {selectedBusiness.ownerName}
                          </p>
                          <p>
                            <strong>Email:</strong>{" "}
                            {selectedBusiness.email || "N/A"}
                          </p>
                          <p>
                            <strong>Phone:</strong>{" "}
                            {selectedBusiness.countryCode}{" "}
                            {selectedBusiness.phoneNumber}
                          </p>
                        </Col>
                        <Col sm={6}>
                          <h6>Business Information</h6>
                          <p>
                            <strong>Category:</strong>{" "}
                            {selectedBusiness.categoryName ||
                              selectedBusiness.category ||
                              "N/A"}
                          </p>
                          <p>
                            <strong>Tax ID:</strong>{" "}
                            {selectedBusiness.taxId || "N/A"}
                          </p>
                          <p>
                            <strong>Registration:</strong>{" "}
                            {selectedBusiness.registrationNumber || "N/A"}
                          </p>
                        </Col>
                      </Row>

                      {selectedBusiness.bannerImage && (
                        <div className="mt-4">
                          <h6>Banner Image</h6>
                          <img
                            src={selectedBusiness.bannerImage}
                            alt="Banner"
                            className="img-fluid rounded"
                            style={{
                              maxHeight: "200px",
                              objectFit: "cover",
                              width: "100%",
                            }}
                          />
                        </div>
                      )}

                      <div className="mt-4">
                        <h6>Metadata</h6>
                        <Row>
                          <Col sm={6}>
                            <p>
                              <strong>Created:</strong>{" "}
                              {selectedBusiness.created_at
                                ? new Date(
                                    selectedBusiness.created_at,
                                  ).toLocaleDateString()
                                : "N/A"}
                            </p>
                          </Col>
                          <Col sm={6}>
                            <p>
                              <strong>Last Updated:</strong>{" "}
                              {selectedBusiness.updatedAt
                                ? new Date(
                                    selectedBusiness.updatedAt,
                                  ).toLocaleDateString()
                                : "N/A"}
                            </p>
                          </Col>
                        </Row>
                      </div>
                    </Col>
                  </Row>
                </TabPane>

                {/* Tab 2: Location & Hours */}
                <TabPane tabId="2">
                  <Row>
                    <Col lg={6}>
                      <h5>Address Information</h5>
                      {selectedBusiness.address ? (
                        <div className="mt-3">
                          <p>
                            <strong>Street:</strong>{" "}
                            {selectedBusiness.address.street || "N/A"}
                          </p>
                          <p>
                            <strong>City:</strong>{" "}
                            {selectedBusiness.address.city || "N/A"}
                          </p>
                          <p>
                            <strong>State:</strong>{" "}
                            {selectedBusiness.address.state || "N/A"}
                          </p>
                          <p>
                            <strong>Country:</strong>{" "}
                            {selectedBusiness.address.country}
                          </p>
                          <p>
                            <strong>Postcode:</strong>{" "}
                            {selectedBusiness.address.postcode || "N/A"}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i className="ri-map-pin-line display-4 text-muted"></i>
                          <h5 className="mt-3">No Address Information</h5>
                          <p className="text-muted">
                            Address details have not been added for this
                            business.
                          </p>
                        </div>
                      )}
                    </Col>
                    <Col lg={6}>
                      <h5>Business Hours</h5>
                      <div className="mt-3">
                        {selectedBusiness.openingHours &&
                          Object.keys(selectedBusiness.openingHours).map(
                            (day) => (
                              <div
                                key={day}
                                className="d-flex justify-content-between border-bottom py-2"
                              >
                                <span className="text-capitalize">
                                  {day === "thur"
                                    ? "Thursday"
                                    : day === "tue"
                                      ? "Tuesday"
                                      : day === "wed"
                                        ? "Wednesday"
                                        : day === "fri"
                                          ? "Friday"
                                          : day === "sat"
                                            ? "Saturday"
                                            : day === "sun"
                                              ? "Sunday"
                                              : "Monday"}
                                </span>
                                <span>
                                  {selectedBusiness.openingHours[day].open} -{" "}
                                  {selectedBusiness.openingHours[day].close}
                                </span>
                              </div>
                            ),
                          )}
                      </div>
                    </Col>
                  </Row>
                </TabPane>

                {/* Tab 3: Business Details */}
                <TabPane tabId="3">
                  <Row>
                    <Col lg={6}>
                      <h5>Contract Details</h5>
                      {selectedBusiness.contract ? (
                        <div className="mt-3">
                          <p>
                            <strong>Payout Schedule:</strong>{" "}
                            {selectedBusiness.contract.payoutSchedule}
                          </p>
                          <p>
                            <strong>Commission Rate:</strong>{" "}
                            {selectedBusiness.contract.commissionRate}%
                          </p>
                          <p>
                            <strong>Contract Signed:</strong>{" "}
                            {selectedBusiness.contract.isSigned ? "Yes" : "No"}
                          </p>
                          {selectedBusiness.contract.signedDate && (
                            <p>
                              <strong>Signed Date:</strong>{" "}
                              {new Date(
                                selectedBusiness.contract.signedDate,
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted">
                          No contract details available.
                        </p>
                      )}

                      <h5 className="mt-4">Bank Details</h5>
                      {selectedBusiness.bankAccountDetails ? (
                        <div className="mt-3">
                          <p>
                            <strong>Account Holder:</strong>{" "}
                            {selectedBusiness.bankAccountDetails
                              .accountHolderName || "N/A"}
                          </p>
                          <p>
                            <strong>Sort Code:</strong>{" "}
                            {selectedBusiness.bankAccountDetails.sortCode ||
                              "N/A"}
                          </p>
                          <p>
                            <strong>Account Number:</strong>{" "}
                            {selectedBusiness.bankAccountDetails
                              .accountNumber || "N/A"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-muted">No bank details available.</p>
                      )}
                    </Col>
                    <Col lg={6}>
                      <h5>Locale Settings</h5>
                      <div className="mt-3">
                        <p>
                          <strong>Default Language:</strong>{" "}
                          {selectedBusiness.defaultLanguage}
                        </p>
                        <p>
                          <strong>Currency:</strong> {selectedBusiness.currency}
                        </p>
                        <p>
                          <strong>Time Zone:</strong>{" "}
                          {selectedBusiness.timeZone}
                        </p>
                      </div>

                      {selectedBusiness.licenseDocument && (
                        <div className="mt-4">
                          <h5>License Document</h5>
                          <div className="mt-2">
                            <Button
                              color="outline-primary"
                              onClick={() =>
                                window.open(
                                  selectedBusiness.licenseDocument,
                                  "_blank",
                                )
                              }
                            >
                              <i className="ri-download-line me-1"></i>
                              View License
                            </Button>
                          </div>
                        </div>
                      )}
                    </Col>
                  </Row>
                </TabPane>
              </TabContent>
            </>
          )}
        </ModalBody>
        <ModalFooter className="bg-light">
          <Button color="light" onClick={() => setViewModal(false)}>
            <i className="ri-close-line me-1"></i>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        show={deleteModal}
        onDeleteClick={deleteBusiness}
        onCloseClick={() => setDeleteModal(false)}
        confirmationText={
          selectedBusiness
            ? `Are you sure you want to delete "${selectedBusiness.businessName}"? This action cannot be undone and all associated data will be permanently removed.`
            : ""
        }
      />

      {/* Status Toggle Modal */}
      <Modal isOpen={statusModal} toggle={() => setStatusModal(false)} centered>
        <ModalHeader toggle={() => setStatusModal(false)} className="bg-light">
          <i className="ri-information-line me-2"></i>
          Confirm Status Change
        </ModalHeader>
        <ModalBody>
          {selectedBusiness && (
            <p>
              Are you sure you want to{" "}
              {selectedBusiness.isActive ? "deactivate" : "activate"} the
              business "<strong>{selectedBusiness.businessName}</strong>"?
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={() => setStatusModal(false)}>
            Cancel
          </Button>
          <Button
            color={selectedBusiness?.isActive ? "warning" : "success"}
            onClick={toggleBusinessStatus}
          >
            {selectedBusiness?.isActive ? "Deactivate" : "Activate"}
          </Button>
        </ModalFooter>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default BusinessesPage;
