import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import Select from "react-select";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Form,
  FormFeedback,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Nav,
  NavItem,
  NavLink,
  Row,
  TabContent,
  TabPane,
} from "reactstrap";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import { useFormik } from "formik";
import * as Yup from "yup";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import NoDataFound from "../../../Components/Common/NoDataFound";
import {
  archiveBusiness as onDeleteBusiness,
  createOrUpdateBusiness as onCreateOrUpdateBusiness,
  getBusinessesData as onGetBusinesses,
  getCategoriesDDL as onGetCategoriesDDL,
  getCities as onGetCities,
  getStaffs as onGetStaffs,
} from "../../../slices/thunks";

const buildInitialValues = () => ({
  legal_name: "",
  display_name: "",
  category_id: "",
  primary_staff_id: "",
  city_id: "",
  address_line: "",
  phone: "",
  secondary_phone: "",
  email: "",
  merchant_accounts: [
    {
      merchantHolderName: "",
      merchantAccountNumber: "",
      merchantBankCode: "",
    },
  ],
  status: "ACTIVE",
});

const normalizeArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const getEntityId = (item) => item?.id || item?._id || item?.uuid || "";

const normalizeOption = (item, labelKeys = ["name"], valueKeys = ["id", "_id", "uuid"]) => {
  if (!item) return null;

  if (item?.value && item?.label) {
    return {
      value: item.value,
      label: item.label,
      raw: item,
    };
  }

  const value = valueKeys.map((key) => item?.[key]).find(Boolean);
  const label = labelKeys.map((key) => item?.[key]).find(Boolean);

  if (!value) return null;

  return {
    value,
    label: label || String(value),
    raw: item,
  };
};

const cleanOptionalString = (value) => {
  const trimmed = value?.trim?.() ?? "";
  return trimmed ? trimmed : undefined;
};

const normalizeBusiness = (business = {}) => {
  const merchantAccounts = Array.isArray(business.merchant_accounts)
    ? business.merchant_accounts
    : Array.isArray(business.merchant_account)
      ? business.merchant_account
      : Array.isArray(business.merchantAccounts)
        ? business.merchantAccounts
        : [];

  return {
    ...business,
    id: getEntityId(business),
    legal_name: business.legal_name || business.legalName || "",
    display_name: business.display_name || business.displayName || "",
    category_id:
      business.category_id || getEntityId(business.category) || business.category || "",
    category_name: business.category?.name || business.category_name || "",
    primary_staff_id:
      business.primary_staff_id ||
      getEntityId(business.primary_staff) ||
      getEntityId(business.primaryStaff) ||
      "",
    primary_staff_name:
      business.primary_staff?.username ||
      business.primary_staff?.firstName ||
      business.primary_staff_name ||
      "",
    city_id: business.city_id || getEntityId(business.city) || "",
    city_name: business.city?.name || business.city_name || "",
    address_line: business.address_line || business.addressLine || "",

    phone: business.phone || "",
    secondary_phone: business.secondary_phone || business.secondaryPhone || "",
    email: business.email || "",
    merchant_accounts: merchantAccounts.length
      ? merchantAccounts.map((account) => ({
        merchantHolderName: account.merchantHolderName || account.merchant_holder_name || "",
        merchantAccountNumber:
          account.merchantAccountNumber ||
          account.merchant_account_number ||
          account.merchantNumber ||
          "",
        merchantBankCode:
          account.merchantBankCode ||
          account.merchant_bank_code ||
          account.merchantProvider ||
          "",
      }))
      : [
        {
          merchantHolderName: "",
          merchantAccountNumber: "",
          merchantBankCode: "",
        },
      ],
    status:
      business.status ||
      business.business_status ||
      (business.is_active === false ? "INACTIVE" : "ACTIVE"),
  };
};

const BusinessesPage = () => {
  document.title = "Businesses | Kamacaash";

  const dispatch = useDispatch();

  const selectPageData = createSelector(
    (state) => state.BusinessManagement,
    (state) => state.UserManagement,
    (state) => state.Settings,
    (businessManagement, userManagement, settings) => ({
      businessesData: businessManagement.businessesData,
      categoriesDDL: businessManagement.categoriesDDL,
      staffData: userManagement.staffData,
      citiesData: settings.citiesData,
    }),
  );

  const { businessesData, categoriesDDL, staffData, citiesData } =
    useSelector(selectPageData);

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [activeTab, setActiveTab] = useState("1");
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  const businessesList = useMemo(
    () => normalizeArray(businessesData, ["rows", "data", "businesses"]).map(normalizeBusiness),
    [businessesData],
  );

  const categoryOptions = useMemo(
    () =>
      normalizeArray(categoriesDDL, ["rows", "data", "items"])
        .map((item) => normalizeOption(item, ["label", "name"], ["value", "id", "_id", "uuid"]))
        .filter(Boolean),
    [categoriesDDL],
  );

  const cityOptions = useMemo(
    () =>
      normalizeArray(citiesData, ["rows", "data", "cities"])
        .map((item) => normalizeOption(item, ["name", "native_name"], ["id", "_id", "uuid"]))
        .filter(Boolean),
    [citiesData],
  );

  const staffOptions = useMemo(
    () =>
      normalizeArray(staffData, ["rows", "data", "staffs"])
        .map((staff) =>
          normalizeOption(
            staff,
            ["username", "firstName", "email"],
            ["id", "_id", "uuid"],
          ),
        )
        .filter(Boolean),
    [staffData],
  );

  const statusOptions = [
    { value: "", label: "All" },
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ];

  const businessStatusOptions = [
    { value: "ACTIVE", label: "ACTIVE" },
    { value: "INACTIVE", label: "INACTIVE" },
    { value: "SUSPENDED", label: "SUSPENDED" },
    { value: "CLOSED", label: "CLOSED" },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        dispatch(onGetBusinesses()),
        dispatch(onGetCategoriesDDL()),
        dispatch(onGetCities()),
        dispatch(onGetStaffs()),
      ]);
    } catch (error) {
      console.error("Error loading businesses page data:", error);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setBusinesses(businessesList);
  }, [businessesList]);

  const filteredBusinesses = businesses.filter((business) => {
    const searchTerm = filters.search.toLowerCase();

    return (
      (filters.search === "" ||
        business.legal_name?.toLowerCase().includes(searchTerm) ||
        business.display_name?.toLowerCase().includes(searchTerm) ||
        business.email?.toLowerCase().includes(searchTerm) ||
        business.phone?.toLowerCase().includes(searchTerm) ||
        business.city_name?.toLowerCase().includes(searchTerm) ||
        business.category_name?.toLowerCase().includes(searchTerm)) &&
      (filters.status === "" ||
        (filters.status === "Active"
          ? business.status === "ACTIVE"
          : business.status !== "ACTIVE"))
    );
  });

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: selectedBusiness
      ? {
        ...buildInitialValues(),
        ...selectedBusiness,
        merchant_accounts:
          selectedBusiness.merchant_accounts?.length > 0
            ? selectedBusiness.merchant_accounts
            : buildInitialValues().merchant_accounts,
      }
      : buildInitialValues(),
    validationSchema: Yup.object({
      legal_name: Yup.string().required("Legal name is required").trim(),
      display_name: Yup.string().required("Display name is required").trim(),
      category_id: Yup.string().required("Category is required").trim(),
      primary_staff_id: Yup.string().required("Primary staff is required").trim(),
      city_id: Yup.string().required("City is required").trim(),
      address_line: Yup.string().required("Address line is required").trim(),

      phone: Yup.string().required("Phone is required").trim(),
      secondary_phone: Yup.string().nullable(),
      email: Yup.string()
        .email("Enter a valid email")
        .required("Email is required")
        .trim(),
      merchant_accounts: Yup.array().of(
        Yup.object({
          merchantHolderName: Yup.string().nullable(),
          merchantAccountNumber: Yup.string().nullable(),
          merchantBankCode: Yup.string().nullable(),
        }),
      ),
      status: Yup.string()
        .oneOf(
          businessStatusOptions.map((option) => option.value),
          "Select a valid status",
        )
        .required("Status is required")
        .trim(),
    }),
    onSubmit: async (values) => {
      setIsSubmitting(true);

      const merchantAccounts = (values.merchant_accounts || []).filter(
        (account) =>
          account.merchantHolderName?.trim() ||
          account.merchantAccountNumber?.trim() ||
          account.merchantBankCode?.trim(),
      );

      const socialLinks = {
        facebook: cleanOptionalString(values.social_links?.facebook),
        instagram: cleanOptionalString(values.social_links?.instagram),
      };

      const payload = {
        legal_name: values.legal_name.trim(),
        display_name: values.display_name.trim(),
        category_id: values.category_id,
        primary_staff_id: values.primary_staff_id,
        city_id: values.city_id,
        address_line: values.address_line.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        status: values.status,
      };


      if (cleanOptionalString(values.secondary_phone)) {
        payload.secondary_phone = values.secondary_phone.trim();
      }

      if (merchantAccounts.length > 0) {
        payload.merchant_accounts = merchantAccounts.map((account) => ({
          merchantHolderName: account.merchantHolderName?.trim() || "",
          merchantAccountNumber: account.merchantAccountNumber?.trim() || "",
          merchantBankCode: account.merchantBankCode?.trim() || "",
        }));
      }

      try {
        await dispatch(
          onCreateOrUpdateBusiness(
            isEdit
              ? { id: selectedBusiness?.id, data: payload }
              : { data: payload },
          ),
        );

        setModal(false);
        setSelectedBusiness(null);
        setActiveTab("1");
        validation.resetForm();
      } catch (error) {
        console.error("Business save error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleCreate = () => {
    setSelectedBusiness(null);
    setIsEdit(false);
    setActiveTab("1");
    setModal(true);
  };

  const handleEdit = (business) => {
    setSelectedBusiness(business);
    setIsEdit(true);
    setActiveTab("1");
    setModal(true);
  };

  const handleView = (business) => {
    setSelectedBusiness(business);
    setActiveTab("1");
    setViewModal(true);
  };

  const handleDeleteClick = (business) => {
    setSelectedBusiness(business);
    setDeleteModal(true);
  };

  const handleDeleteBusiness = async () => {
    const id = selectedBusiness?.id;
    if (!id) return;

    await dispatch(onDeleteBusiness(id));
    setDeleteModal(false);
    setSelectedBusiness(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectFilterChange = (name, selectedOption) => {
    setFilters((prev) => ({
      ...prev,
      [name]: selectedOption?.value || "",
    }));
  };

  const setMerchantAccountField = (index, field, value) => {
    const next = [...validation.values.merchant_accounts];
    next[index] = { ...next[index], [field]: value };
    validation.setFieldValue("merchant_accounts", next);
  };

  const addMerchantAccount = () => {
    validation.setFieldValue("merchant_accounts", [
      ...validation.values.merchant_accounts,
      {
        merchantHolderName: "",
        merchantAccountNumber: "",
        merchantBankCode: "",
      },
    ]);
  };

  const removeMerchantAccount = (index) => {
    const next = validation.values.merchant_accounts.filter((_, i) => i !== index);
    validation.setFieldValue(
      "merchant_accounts",
      next.length
        ? next
        : [
          {
            merchantHolderName: "",
            merchantAccountNumber: "",
            merchantBankCode: "",
          },
        ],
    );
  };

  const columns = [
    {
      name: "#",
      cell: (row, index) => index + 1,
      // width: "70px",
    },
    {
      name: "Display Name",
      selector: (row) => row.display_name,
      wrap: true,
    },
    {
      name: "Legal Name",
      selector: (row) => row.legal_name,
      wrap: true,
    },
    {
      name: "Category",
      selector: (row) => row.category_name || row.category_id || "-",
      wrap: true,
    },
    {
      name: "City",
      selector: (row) => row.city_name || row.city_id || "-",
      wrap: true,
    },
    {
      name: "Phone",
      selector: (row) => row.phone || "-",
      wrap: true,
    },
    {
      name: "Status",
      cell: (row) => (
        <Badge
          color={
            row.status === "ACTIVE"
              ? "success"
              : row.status === "INACTIVE"
                ? "secondary"
                : row.status === "SUSPENDED"
                  ? "warning"
                  : "dark"
          }
        >
          {row.status || "-"}
        </Badge>
      ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2">
          <Button color="soft-info" size="sm" onClick={() => handleView(row)}>
            <i className="ri-eye-line" />
          </Button>
          <Button color="soft-primary" size="sm" onClick={() => handleEdit(row)}>
            <i className="ri-pencil-line" />
          </Button>
          <Button
            color="soft-danger"
            size="sm"
            onClick={() => handleDeleteClick(row)}
          >
            <i className="ri-delete-bin-line" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Businesses" pageTitle="Business" />

        <Card className="mb-3">
          <CardBody>
            <Row>
              <Col md={8}>
                <FormGroup>
                  <Label>Search</Label>
                  <Input
                    type="text"
                    name="search"
                    placeholder="Search by business name, city, category, email, phone"
                    value={filters.search}
                    onChange={handleFilterChange}
                  />
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup>
                  <Label>Status</Label>
                  <Select
                    options={statusOptions}
                    value={statusOptions.find((opt) => opt.value === filters.status)}
                    onChange={(opt) => handleSelectFilterChange("status", opt)}
                    isClearable
                    placeholder="Select status"
                  />
                </FormGroup>
              </Col>
              <Col md={1} className="d-flex align-items-end mb-3">
                <Button color="primary" onClick={fetchData} disabled={loading}>
                  <i className="ri-refresh-line" />
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Businesses List</h5>
            <Button color="primary" onClick={handleCreate}>
              <i className="ri-add-line me-1" /> Add Business
            </Button>
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
                highlightOnHover
                noDataComponent={<NoDataFound message="No businesses found" />}
              />
            )}
          </CardBody>
        </Card>
      </Container>

      <Modal isOpen={modal} toggle={() => setModal(false)} size="xl">
        <ModalHeader toggle={() => setModal(false)}>
          {isEdit ? "Edit Business" : "Add New Business"}
        </ModalHeader>

        <Form
          onSubmit={(e) => {
            e.preventDefault();
            validation.handleSubmit();
          }}
        >
          <ModalBody>
            <Nav pills className="nav nav-pills mb-4">
              <NavItem>
                <NavLink
                  className={activeTab === "1" ? "active" : ""}
                  style={{ cursor: "pointer" }}
                  onClick={() => setActiveTab("1")}
                >
                  Basic Info
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={activeTab === "2" ? "active" : ""}
                  style={{ cursor: "pointer" }}
                  onClick={() => setActiveTab("2")}
                >
                  Contact & Location
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={activeTab === "3" ? "active" : ""}
                  style={{ cursor: "pointer" }}
                  onClick={() => setActiveTab("3")}
                >
                  Optional Details
                </NavLink>
              </NavItem>
            </Nav>

            <TabContent activeTab={activeTab}>
              <TabPane tabId="1">
                <Row>
                  <Col md={4}>
                    <FormGroup>
                      <Label>
                        Legal Name <span className="text-danger">*</span>
                      </Label>
                      <Input
                        name="legal_name"
                        placeholder="Kamacaash Foods Ltd"
                        value={validation.values.legal_name}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        invalid={
                          validation.touched.legal_name &&
                          !!validation.errors.legal_name
                        }
                      />
                      <FormFeedback>{validation.errors.legal_name}</FormFeedback>
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>
                        Display Name <span className="text-danger">*</span>
                      </Label>
                      <Input
                        name="display_name"
                        placeholder="Kamacaash Foods"
                        value={validation.values.display_name}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        invalid={
                          validation.touched.display_name &&
                          !!validation.errors.display_name
                        }
                      />
                      <FormFeedback>{validation.errors.display_name}</FormFeedback>
                    </FormGroup>
                  </Col>

                  <Col md={4}>
                    <FormGroup>
                      <Label>
                        Category <span className="text-danger">*</span>
                      </Label>
                      <Select
                        options={categoryOptions}
                        value={
                          categoryOptions.find(
                            (option) => option.value === validation.values.category_id,
                          ) || null
                        }
                        onChange={(option) =>
                          validation.setFieldValue("category_id", option?.value || "")
                        }
                        onBlur={() => validation.setFieldTouched("category_id", true)}
                        placeholder="Select category"
                      />
                      {validation.touched.category_id &&
                        validation.errors.category_id ? (
                        <div className="text-danger mt-1 small">
                          {validation.errors.category_id}
                        </div>
                      ) : null}
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>
                        City <span className="text-danger">*</span>
                      </Label>
                      <Select
                        options={cityOptions}
                        value={
                          cityOptions.find(
                            (option) => option.value === validation.values.city_id,
                          ) || null
                        }
                        onChange={(option) =>
                          validation.setFieldValue("city_id", option?.value || "")
                        }
                        onBlur={() => validation.setFieldTouched("city_id", true)}
                        placeholder="Select city"
                      />
                      {validation.touched.city_id && validation.errors.city_id ? (
                        <div className="text-danger mt-1 small">
                          {validation.errors.city_id}
                        </div>
                      ) : null}
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>
                        Primary Staff <span className="text-danger">*</span>
                      </Label>
                      <Select
                        options={staffOptions}
                        value={
                          staffOptions.find(
                            (option) =>
                              option.value === validation.values.primary_staff_id,
                          ) || null
                        }
                        onChange={(option) =>
                          validation.setFieldValue(
                            "primary_staff_id",
                            option?.value || "",
                          )
                        }
                        onBlur={() =>
                          validation.setFieldTouched("primary_staff_id", true)
                        }
                        placeholder="Select primary staff"
                      />
                      {validation.touched.primary_staff_id &&
                        validation.errors.primary_staff_id ? (
                        <div className="text-danger mt-1 small">
                          {validation.errors.primary_staff_id}
                        </div>
                      ) : null}
                    </FormGroup>
                  </Col>

                  <Col md={4}>
                    <FormGroup>
                      <Label>
                        Status <span className="text-danger">*</span>
                      </Label>
                      <Select
                        options={businessStatusOptions}
                        value={
                          businessStatusOptions.find(
                            (option) => option.value === validation.values.status,
                          ) || null
                        }
                        onChange={(option) =>
                          validation.setFieldValue("status", option?.value || "")
                        }
                        onBlur={() => validation.setFieldTouched("status", true)}
                        placeholder="Select status"
                      />
                      {validation.touched.status && validation.errors.status ? (
                        <div className="text-danger mt-1 small">
                          {validation.errors.status}
                        </div>
                      ) : null}
                    </FormGroup>
                  </Col>
                </Row>
              </TabPane>

              <TabPane tabId="2">
                <Row>
                  <Col md={3}>
                    <FormGroup>
                      <Label>
                        Address Line <span className="text-danger">*</span>
                      </Label>
                      <Input
                        name="address_line"
                        placeholder="KM4, Hodan District"
                        value={validation.values.address_line}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        invalid={
                          validation.touched.address_line &&
                          !!validation.errors.address_line
                        }
                      />
                      <FormFeedback>{validation.errors.address_line}</FormFeedback>
                    </FormGroup>
                  </Col>

                  <Col md={3}>
                    <FormGroup>
                      <Label>
                        Phone <span className="text-danger">*</span>
                      </Label>
                      <Input
                        name="phone"
                        placeholder="+252612345678"
                        value={validation.values.phone}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        invalid={validation.touched.phone && !!validation.errors.phone}
                      />
                      <FormFeedback>{validation.errors.phone}</FormFeedback>
                    </FormGroup>
                  </Col>
                  <Col md={3}>
                    <FormGroup>
                      <Label>Secondary Phone</Label>
                      <Input
                        name="secondary_phone"
                        placeholder="+252617654321"
                        value={validation.values.secondary_phone}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        invalid={
                          validation.touched.secondary_phone &&
                          !!validation.errors.secondary_phone
                        }
                      />
                      <FormFeedback>
                        {validation.errors.secondary_phone}
                      </FormFeedback>
                    </FormGroup>
                  </Col>
                  <Col md={3}>
                    <FormGroup>
                      <Label>
                        Email <span className="text-danger">*</span>
                      </Label>
                      <Input
                        type="email"
                        name="email"
                        placeholder="info@kamacaash.com"
                        value={validation.values.email}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        invalid={validation.touched.email && !!validation.errors.email}
                      />
                      <FormFeedback>{validation.errors.email}</FormFeedback>
                    </FormGroup>
                  </Col>
                </Row>
              </TabPane>

              <TabPane tabId="3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Merchant Accounts</h6>
                  <Button color="soft-primary" type="button" onClick={addMerchantAccount}>
                    <i className="ri-add-line me-1" />
                    Add Account
                  </Button>
                </div>

                {validation.values.merchant_accounts.map((account, index) => (
                  <Card key={`merchant-${index}`} className="border mb-3 shadow-none">
                    <CardBody>
                      <Row>
                        <Col md={4}>
                          <FormGroup>
                            <Label>Merchant Holder Name</Label>
                            <Input
                              value={account.merchantHolderName}
                              onChange={(e) =>
                                setMerchantAccountField(
                                  index,
                                  "merchantHolderName",
                                  e.target.value,
                                )
                              }
                              placeholder="Kamacaash Foods Ltd"
                            />
                          </FormGroup>
                        </Col>
                        <Col md={4}>
                          <FormGroup>
                            <Label>Merchant Account Number</Label>
                            <Input
                              value={account.merchantAccountNumber}
                              onChange={(e) =>
                                setMerchantAccountField(
                                  index,
                                  "merchantAccountNumber",
                                  e.target.value,
                                )
                              }
                              placeholder="252612345678"
                            />
                          </FormGroup>
                        </Col>
                        <Col md={3}>
                          <FormGroup>
                            <Label>Merchant Bank Code</Label>
                            <Input
                              value={account.merchantBankCode}
                              onChange={(e) =>
                                setMerchantAccountField(
                                  index,
                                  "merchantBankCode",
                                  e.target.value,
                                )
                              }
                              placeholder="WAAFI"
                            />
                          </FormGroup>
                        </Col>
                        <Col md={1} className="d-flex align-items-end">
                          <Button
                            color="soft-danger"
                            type="button"
                            onClick={() => removeMerchantAccount(index)}
                          >
                            <i className="ri-delete-bin-line" />
                          </Button>
                        </Col>
                      </Row>
                    </CardBody>
                  </Card>
                ))}
              </TabPane>
            </TabContent>
          </ModalBody>

          <ModalFooter>
            <Button color="light" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button color="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="xl">
        <ModalHeader toggle={() => setViewModal(false)}>
          Business Details
        </ModalHeader>
        <ModalBody>
          {selectedBusiness ? (
            <>
              <div className="d-flex flex-wrap gap-2 mb-4">
                <Badge color="primary" pill className="px-3 py-2">
                  <i className="ri-store-2-line me-1" />
                  {selectedBusiness.display_name || "-"}
                </Badge>
                <Badge color="dark" pill className="px-3 py-2">
                  <i className="ri-map-pin-2-line me-1" />
                  {selectedBusiness.city_name || selectedBusiness.city_id || "-"}
                </Badge>
                <Badge color="info" pill className="px-3 py-2">
                  <i className="ri-price-tag-3-line me-1" />
                  {selectedBusiness.category_name || selectedBusiness.category_id || "-"}
                </Badge>
                <Badge
                  color={
                    selectedBusiness.status === "ACTIVE"
                      ? "success"
                      : selectedBusiness.status === "INACTIVE"
                        ? "secondary"
                        : selectedBusiness.status === "SUSPENDED"
                          ? "warning"
                          : "dark"
                  }
                  pill
                  className="px-3 py-2"
                >
                  <i className="ri-shield-check-line me-1" />
                  {selectedBusiness.status || "-"}
                </Badge>
              </div>

              <Row className="g-4">
                <Col md={6}>
                  <Card className="border shadow-none h-100 mb-0">
                    <CardHeader>
                      <h6 className="mb-0">
                        <i className="ri-building-line me-2 text-primary" />
                        Business Information
                      </h6>
                    </CardHeader>
                    <CardBody>
                      <p>
                        <strong>Legal Name:</strong> {selectedBusiness.legal_name || "-"}
                      </p>
                      <p>
                        <strong>Display Name:</strong> {selectedBusiness.display_name || "-"}
                      </p>
                      <p>
                        <strong>Category:</strong>{" "}
                        {selectedBusiness.category_name ||
                          selectedBusiness.category_id ||
                          "-"}
                      </p>
                      <p>
                        <strong>City:</strong>{" "}
                        {selectedBusiness.city_name || selectedBusiness.city_id || "-"}
                      </p>
                      <p className="mb-0">
                        <strong>Primary Staff:</strong>{" "}
                        {selectedBusiness.primary_staff_name || "-"}
                      </p>
                    </CardBody>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="border shadow-none h-100 mb-0">
                    <CardHeader>
                      <h6 className="mb-0">
                        <i className="ri-time-line me-2 text-success" />
                        Status & Timeline
                      </h6>
                    </CardHeader>
                    <CardBody>
                      <Row className="g-3">
                        <Col sm={6}>
                          <div className="rounded-3 border bg-success bg-opacity-10 p-3">
                            <small className="text-muted d-block">Current Status</small>
                            <span className="fw-bold text-success">
                              {selectedBusiness.status || "-"}
                            </span>
                          </div>
                        </Col>
                        <Col sm={6}>
                          <div className="rounded-3 border bg-primary bg-opacity-10 p-3">
                            <small className="text-muted d-block">Primary Staff</small>
                            <span className="fw-bold text-primary">
                              {selectedBusiness.primary_staff_name || "-"}
                            </span>
                          </div>
                        </Col>
                        <Col sm={6}>
                          <div className="rounded-3 border bg-light p-3">
                            <small className="text-muted d-block">Created At</small>
                            <span className="fw-semibold">
                              {selectedBusiness.created_at
                                ? new Date(selectedBusiness.created_at).toLocaleString()
                                : "-"}
                            </span>
                          </div>
                        </Col>
                        <Col sm={6}>
                          <div className="rounded-3 border bg-light p-3">
                            <small className="text-muted d-block">Updated At</small>
                            <span className="fw-semibold">
                              {selectedBusiness.updated_at
                                ? new Date(selectedBusiness.updated_at).toLocaleString()
                                : "-"}
                            </span>
                          </div>
                        </Col>
                      </Row>
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              <Row className="g-4 mt-1">
                <Col md={6}>
                  <Card className="border shadow-none h-100 mb-0">
                    <CardHeader>
                      <h6 className="mb-0">
                        <i className="ri-contacts-book-2-line me-2 text-warning" />
                        Contact & Location
                      </h6>
                    </CardHeader>
                    <CardBody>
                      <p>
                        <strong>Address:</strong> {selectedBusiness.address_line || "-"}
                      </p>
                      <p>
                        <strong>Phone:</strong> {selectedBusiness.phone || "-"}
                      </p>
                      <p>
                        <strong>Secondary Phone:</strong>{" "}
                        {selectedBusiness.secondary_phone || "-"}
                      </p>
                      <p>
                        <strong>Email:</strong> {selectedBusiness.email || "-"}
                      </p>
                    </CardBody>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="border shadow-none mb-0">
                    <CardHeader>
                      <h6 className="mb-0">
                        <i className="ri-bank-card-line me-2 text-dark" />
                        Merchant Accounts
                      </h6>
                    </CardHeader>
                    <CardBody>
                      {selectedBusiness.merchant_accounts?.length ? (
                        selectedBusiness.merchant_accounts.map((account, index) => (
                          <Card
                            key={`view-merchant-${index}`}
                            className="border shadow-none mb-3"
                          >
                            <CardBody>
                              <Row>
                                <Col md={4}>
                                  <p className="mb-0">
                                    <strong>Holder Name:</strong>{" "}
                                    {account.merchantHolderName || "-"}
                                  </p>
                                </Col>
                                <Col md={4}>
                                  <p className="mb-0">
                                    <strong>Account Number:</strong>{" "}
                                    {account.merchantAccountNumber || "-"}
                                  </p>
                                </Col>
                                <Col md={4}>
                                  <p className="mb-0">
                                    <strong>Provider:</strong>{" "}
                                    {account.merchantBankCode || "-"}
                                  </p>
                                </Col>
                              </Row>
                            </CardBody>
                          </Card>
                        ))
                      ) : (
                        <p className="text-muted mb-0">No merchant accounts found.</p>
                      )}
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={() => setViewModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteBusiness}
        onCloseClick={() => setDeleteModal(false)}
      />

      <ToastContainer />
    </div>
  );
};

export default BusinessesPage;
