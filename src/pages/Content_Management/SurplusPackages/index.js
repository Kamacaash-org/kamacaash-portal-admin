import React, { useState, useEffect, useMemo, useCallback } from "react";
import DataTable from "react-data-table-component";
import Select from "react-select";
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
  FormFeedback,
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import NoDataFound from "../../../Components/Common/NoDataFound";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";

import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginImageExifOrientation from "filepond-plugin-image-exif-orientation";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";

import {
  getOffers as onGetOffersData,
  createOffer as onCreateOffer,
  updateOffer as onUpdateOffer,
  deleteOffer as onDeleteOffer,
} from "../../../slices/thunks";

import * as Yup from "yup";
import { useFormik } from "formik";
import useAuthUser from "../../../Components/Hooks/useAuthUser";
import {
  getStaffProfile,
  SurPlusCategoryAPI,
} from "../../../helpers/backend_helper";

registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

const DEFAULT_CATEGORY_ID = "c949f4f4-6da5-41c8-8a20-5d6baedb622c";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/i;

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.categories)) return value.categories;
  return [];
};

const splitCsv = (input) =>
  (input || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const toCsv = (value) => (Array.isArray(value) ? value.join(", ") : "");

const getOfferId = (offer) =>
  offer?.id || offer?._id || offer?.uuid || offer?.offer_id || "";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const resolveEntityId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    return (
      value.id ||
      value._id ||
      value.uuid ||
      value.businessId ||
      value.business_id ||
      ""
    );
  }
  return "";
};

const resolveBusinessIdFromObject = (value) =>
  resolveEntityId(value) ||
  resolveEntityId(value?.businessId) ||
  resolveEntityId(value?.business_id) ||
  resolveEntityId(value?.business) ||
  "";

const isValidBusinessId = (value) => {
  const normalized = resolveEntityId(value);
  if (!normalized) return false;
  return UUID_REGEX.test(normalized) || OBJECT_ID_REGEX.test(normalized);
};

const formatForDateTimeLocal = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const resolveStatus = (offer) => {
  if (typeof offer?.is_active === "boolean") return offer.is_active;
  if (typeof offer?.isActive === "boolean") return offer.isActive;
  if (typeof offer?.status === "string") {
    return offer.status.toLowerCase() === "active";
  }
  return true;
};

const Offers = () => {
  document.title = "Offers | Kamacash";

  const dispatch = useDispatch();
  const authUser = useAuthUser();
  const [resolvedBusinessId, setResolvedBusinessId] = useState(
    resolveBusinessIdFromObject(authUser || {}),
  );
  const selectOffersData = createSelector(
    (state) => state.ContentManagement,
    (contentState) => contentState.offersData,
  );

  const offersData = useSelector(selectOffersData);
  const [offersList, setOffersList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);

  const [mainImageFile, setMainImageFile] = useState(null);
  const [galleryImageFiles, setGalleryImageFiles] = useState([]);

  const [categoryOptions, setCategoryOptions] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  const statusOptions = [
    { value: "", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      await dispatch(onGetOffersData());
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await SurPlusCategoryAPI.list();
      const categories = toArray(res?.data);

      const options = categories
        .map((category) => ({
          value:
            category?.id ||
            category?._id ||
            category?.uuid ||
            category?.category_id,
          label:
            category?.name ||
            category?.title ||
            category?.categoryName ||
            "Unnamed",
        }))
        .filter((item) => item.value && item.label);

      setCategoryOptions(options);
    } catch (error) {
      setCategoryOptions([]);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    setOffersList(toArray(offersData));
  }, [offersData]);

  useEffect(() => {
    let isMounted = true;

    const resolveBusinessId = async () => {
      const directBusinessId = resolveBusinessIdFromObject(authUser || {});
      if (directBusinessId) {
        if (isMounted) {
          setResolvedBusinessId(directBusinessId);
        }
        return;
      }

      if (!authUser?.staffId) {
        if (isMounted) {
          setResolvedBusinessId("");
        }
        return;
      }

      try {
        const staffResponse = await getStaffProfile(authUser.staffId);
        const staffData = staffResponse?.data || {};
        const staffBusinessId =
          resolveBusinessIdFromObject(staffData) ||
          resolveBusinessIdFromObject(staffData?.staff || {}) ||
          resolveBusinessIdFromObject(staffData?.user || {}) ||
          resolveBusinessIdFromObject(staffData?.data || {});

        if (isMounted) {
          setResolvedBusinessId(staffBusinessId || "");
        }
      } catch (error) {
        if (isMounted) {
          setResolvedBusinessId("");
        }
      }
    };

    resolveBusinessId();

    return () => {
      isMounted = false;
    };
  }, [authUser]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      category_id: selectedOffer?.category_id || DEFAULT_CATEGORY_ID,
      title: selectedOffer?.title || "",
      short_description: selectedOffer?.short_description || "",
      description: selectedOffer?.description || "",
      currency_code: selectedOffer?.currency_code || "USD",
      original_price_minor:
        selectedOffer?.original_price_minor ??
        selectedOffer?.originalPrice ??
        "",
      offer_price_minor:
        selectedOffer?.offer_price_minor ?? selectedOffer?.offerPrice ?? "",
      quantity_total:
        selectedOffer?.quantity_total ?? selectedOffer?.quantityAvailable ?? "",
      max_per_user: selectedOffer?.max_per_user ?? 1,
      pickup_start: formatForDateTimeLocal(
        selectedOffer?.pickup_start || selectedOffer?.pickupStart,
      ),
      pickup_end: formatForDateTimeLocal(
        selectedOffer?.pickup_end || selectedOffer?.pickupEnd,
      ),
      pickup_instructions:
        selectedOffer?.pickup_instructions ||
        selectedOffer?.pickupInstructions ||
        "",
      pickup_window_start: formatForDateTimeLocal(
        selectedOffer?.pickup_windows?.[0]?.starts_at ||
          selectedOffer?.pickup_window_start ||
          selectedOffer?.pickup_start ||
          selectedOffer?.pickupStart,
      ),
      pickup_window_end: formatForDateTimeLocal(
        selectedOffer?.pickup_windows?.[0]?.ends_at ||
          selectedOffer?.pickup_window_end ||
          selectedOffer?.pickup_end ||
          selectedOffer?.pickupEnd,
      ),
      pickup_window_max:
        selectedOffer?.pickup_windows?.[0]?.max_pickups_per_window ||
        selectedOffer?.pickup_window_max ||
        1,
      tags: toCsv(selectedOffer?.tags),
      dietary_info: toCsv(selectedOffer?.dietary_info),
      allergen_info: toCsv(selectedOffer?.allergen_info),
      main_image_existing: selectedOffer?.main_image_url || "",
    },
    validationSchema: Yup.object({
      category_id: Yup.string().required("Category is required"),
      title: Yup.string()
        .required("Title is required")
        .min(3, "Title must be at least 3 characters")
        .max(150, "Title must not exceed 150 characters"),
      short_description: Yup.string()
        .required("Short description is required")
        .max(250, "Short description must not exceed 250 characters"),
      description: Yup.string()
        .required("Description is required")
        .min(10, "Description must be at least 10 characters")
        .max(1000, "Description must not exceed 1000 characters"),
      currency_code: Yup.string().required("Currency code is required"),
      original_price_minor: Yup.number()
        .required("Original price is required")
        .min(0, "Original price must be >= 0"),
      offer_price_minor: Yup.number()
        .required("Offer price is required")
        .min(0, "Offer price must be >= 0")
        .test(
          "less-than-original",
          "Offer price must be less than original price",
          function (value) {
            return (
              toNumber(value) < toNumber(this.parent.original_price_minor, 0)
            );
          },
        ),
      quantity_total: Yup.number()
        .required("Quantity is required")
        .integer("Quantity must be whole number")
        .min(0, "Quantity must be >= 0"),
      max_per_user: Yup.number()
        .required("Max per user is required")
        .integer("Max per user must be whole number")
        .min(1, "Max per user must be >= 1"),
      pickup_start: Yup.string().required("Pickup start is required"),
      pickup_end: Yup.string()
        .required("Pickup end is required")
        .test(
          "after-start",
          "Pickup end must be after pickup start",
          function (value) {
            const { pickup_start } = this.parent;
            return new Date(value) > new Date(pickup_start);
          },
        ),
      pickup_window_start: Yup.string().required(
        "Pickup window start is required",
      ),
      pickup_window_end: Yup.string()
        .required("Pickup window end is required")
        .test(
          "window-after-start",
          "Pickup window end must be after pickup window start",
          function (value) {
            const { pickup_window_start } = this.parent;
            return new Date(value) > new Date(pickup_window_start);
          },
        ),
      pickup_window_max: Yup.number()
        .required("Pickup window capacity is required")
        .integer("Pickup window capacity must be whole number")
        .min(1, "Pickup window capacity must be >= 1"),
      pickup_instructions: Yup.string()
        .required("Pickup instructions are required")
        .min(5, "Pickup instructions must be at least 5 characters")
        .max(1000, "Pickup instructions must not exceed 1000 characters"),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const normalizedBusinessId = resolveEntityId(resolvedBusinessId);

        const payload = new FormData();

        if (!isEdit && normalizedBusinessId) {
          payload.append("business_id", normalizedBusinessId);
        }

        payload.append("category_id", values.category_id);
        payload.append("title", values.title);
        payload.append("description", values.description);
        payload.append("short_description", values.short_description);
        payload.append("currency_code", values.currency_code);
        payload.append(
          "original_price_minor",
          String(values.original_price_minor),
        );
        payload.append("offer_price_minor", String(values.offer_price_minor));
        payload.append("quantity_total", String(values.quantity_total));
        payload.append("max_per_user", String(values.max_per_user));
        payload.append(
          "pickup_start",
          new Date(values.pickup_start).toISOString(),
        );
        payload.append("pickup_end", new Date(values.pickup_end).toISOString());
        payload.append("pickup_instructions", values.pickup_instructions);
        payload.append(
          "pickup_windows[0][starts_at]",
          new Date(values.pickup_window_start).toISOString(),
        );
        payload.append(
          "pickup_windows[0][ends_at]",
          new Date(values.pickup_window_end).toISOString(),
        );
        payload.append(
          "pickup_windows[0][max_pickups_per_window]",
          String(values.pickup_window_max),
        );

        splitCsv(values.tags).forEach((item, index) => {
          payload.append(`tags[${index}]`, item);
        });
        splitCsv(values.dietary_info).forEach((item, index) => {
          payload.append(`dietary_info[${index}]`, item);
        });
        splitCsv(values.allergen_info).forEach((item, index) => {
          payload.append(`allergen_info[${index}]`, item);
        });

        if (mainImageFile) {
          payload.append("main_image_url", mainImageFile);
        }

        galleryImageFiles.forEach((file) => {
          payload.append("gallery_images", file);
        });

        if (isEdit) {
          await dispatch(
            onUpdateOffer({
              id: getOfferId(selectedOffer),
              payload,
            }),
          );
        } else {
          await dispatch(onCreateOffer({ payload }));
        }

        setModal(false);
        setMainImageFile(null);
        setGalleryImageFiles([]);
        resetForm();
      } finally {
        setSubmitting(false);
      }
    },
  });

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

  const filteredOffers = useMemo(() => {
    return offersList.filter((offer) => {
      const searchText = filters.search.toLowerCase();
      const active = resolveStatus(offer);

      return (
        (!searchText ||
          offer?.title?.toLowerCase().includes(searchText) ||
          offer?.short_description?.toLowerCase().includes(searchText) ||
          offer?.description?.toLowerCase().includes(searchText)) &&
        (!filters.status ||
          (filters.status === "active" && active) ||
          (filters.status === "inactive" && !active))
      );
    });
  }, [offersList, filters]);

  const handleCreate = () => {
    setSelectedOffer(null);
    setIsEdit(false);
    setModal(true);
    setMainImageFile(null);
    setGalleryImageFiles([]);
  };

  const handleEdit = (offer) => {
    setSelectedOffer(offer);
    setIsEdit(true);
    setModal(true);
    setMainImageFile(null);
    setGalleryImageFiles([]);
  };

  const handleView = (offer) => {
    setSelectedOffer(offer);
    setViewModal(true);
  };

  const onClickDelete = (offer) => {
    setSelectedOffer(offer);
    setDeleteModal(true);
  };

  const handleDeleteOffer = () => {
    const id = getOfferId(selectedOffer);
    if (!id) return;

    dispatch(onDeleteOffer(id));
    setDeleteModal(false);
  };

  const handleCloseModal = () => {
    setModal(false);
    setMainImageFile(null);
    setGalleryImageFiles([]);
  };

  const calculateDiscount = (original, offer) => {
    const originalNumber = toNumber(original, 0);
    const offerNumber = toNumber(offer, 0);

    if (!originalNumber || offerNumber >= originalNumber) return 0;
    return Math.round(((originalNumber - offerNumber) / originalNumber) * 100);
  };

  const columns = [
    {
      name: "#",
      width: "70px",
      cell: (row, index) => index + 1,
    },
    {
      name: "Image",
      cell: (row) => {
        const image = row?.main_image_url;
        return image ? (
          <img
            src={image}
            alt={row?.title}
            style={{
              width: "50px",
              height: "50px",
              objectFit: "cover",
              borderRadius: "8px",
              border: "2px solid #f8f9fa",
            }}
          />
        ) : (
          <div
            style={{
              width: "50px",
              height: "50px",
              backgroundColor: "#f8f9fa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              border: "2px dashed #dee2e6",
            }}
          >
            <i className="ri-image-line" style={{ color: "#6c757d" }}></i>
          </div>
        );
      },
    },
    {
      name: "Offer Details",
      grow: 2,
      wrap: true,
      cell: (row) => (
        <div>
          <div className="fw-semibold">{row?.title || "-"}</div>
          <small className="text-muted d-block">
            {row?.short_description || "-"}
          </small>
          <small className="text-muted d-block">
            {row?.description || "-"}
          </small>
        </div>
      ),
    },
    {
      name: "Pricing",
      cell: (row) => {
        const original = toNumber(
          row?.original_price_minor ?? row?.originalPrice,
          0,
        );
        const offer = toNumber(row?.offer_price_minor ?? row?.offerPrice, 0);
        const currency = row?.currency_code || "USD";

        return (
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="text-decoration-line-through text-muted small">
                {currency} {original.toFixed(2)}
              </span>
              <span className="text-success fw-bold fs-6">
                {currency} {offer.toFixed(2)}
              </span>
            </div>
            <Badge color="warning" className="mt-1">
              {calculateDiscount(original, offer)}% OFF
            </Badge>
          </div>
        );
      },
    },
    {
      name: "Qty",
      center: true,
      selector: (row) => row?.quantity_total ?? row?.quantityAvailable ?? 0,
    },
    {
      name: "Pickup",
      wrap: true,
      cell: (row) => (
        <div className="small">
          <div className="fw-medium">
            {formatDateTime(row?.pickup_start || row?.pickupStart)}
          </div>
          <div className="text-muted">
            to {formatDateTime(row?.pickup_end || row?.pickupEnd)}
          </div>
        </div>
      ),
    },
    {
      name: "Status",
      center: true,
      cell: (row) => {
        const active = resolveStatus(row);
        return (
          <Badge
            color={active ? "success" : "danger"}
            className="px-3 py-2"
            style={{
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: "600",
            }}
          >
            <i
              className={`ri-${active ? "check" : "close"}-circle-fill me-1`}
            ></i>
            {active ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-1">
          <Button
            color="outline-info"
            size="sm"
            onClick={() => handleView(row)}
          >
            <i className="ri-eye-line" />
          </Button>
          <Button
            color="outline-primary"
            size="sm"
            onClick={() => handleEdit(row)}
          >
            <i className="ri-pencil-line" />
          </Button>
          <Button
            color="outline-danger"
            size="sm"
            onClick={() => onClickDelete(row)}
          >
            <i className="ri-delete-bin-line" />
          </Button>
        </div>
      ),
    },
  ];

  const activeCount = offersList.filter((item) => resolveStatus(item)).length;
  const lowStockCount = offersList.filter(
    (item) =>
      toNumber(item?.quantity_total ?? item?.quantityAvailable, 0) > 0 &&
      toNumber(item?.quantity_total ?? item?.quantityAvailable, 0) < 5,
  ).length;
  const outOfStockCount = offersList.filter(
    (item) =>
      toNumber(item?.quantity_total ?? item?.quantityAvailable, 0) === 0,
  ).length;

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Offers" pageTitle="Offers" />

        <Row className="mb-4">
          <Col xl={3} md={6}>
            <Card className="card-animate">
              <CardBody>
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <p className="text-uppercase fw-medium text-muted mb-0">
                      Total Offers
                    </p>
                    <h4 className="mb-0">{offersList.length}</h4>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="avatar-sm">
                      <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-2">
                        <i className="ri-price-tag-3-line"></i>
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
                      Active Offers
                    </p>
                    <h4 className="mb-0">{activeCount}</h4>
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
                      Low Stock
                    </p>
                    <h4 className="mb-0">{lowStockCount}</h4>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="avatar-sm">
                      <span className="avatar-title bg-warning-subtle text-warning rounded-circle fs-2">
                        <i className="ri-alert-line"></i>
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
                      Out Of Stock
                    </p>
                    <h4 className="mb-0">{outOfStockCount}</h4>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="avatar-sm">
                      <span className="avatar-title bg-danger-subtle text-danger rounded-circle fs-2">
                        <i className="ri-close-circle-line"></i>
                      </span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Card className="mb-4">
          <CardBody className="p-3">
            <Row className="g-3 align-items-end">
              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Search Offers</Label>
                  <Input
                    type="text"
                    name="search"
                    placeholder="Search by title or description..."
                    value={filters.search}
                    onChange={handleFilterChange}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Status</Label>
                  <Select
                    options={statusOptions}
                    value={statusOptions.find(
                      (opt) => opt.value === filters.status,
                    )}
                    onChange={(opt) => handleSelectFilterChange("status", opt)}
                    isClearable
                    placeholder="Select status"
                  />
                </FormGroup>
              </Col>
              <Col md={2}>
                <Button
                  color="primary"
                  className="w-100 mb-3"
                  onClick={() => setFilters({ search: "", status: "" })}
                >
                  <i className="ri-refresh-line me-1"></i>
                  Reset
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center bg-light">
            <h5 className="card-title mb-0 flex-grow-1">
              <i className="ri-price-tag-3-line align-middle me-2"></i>
              Offers List
              <Badge color="primary" className="ms-2">
                {filteredOffers.length}
              </Badge>
            </h5>
            <Button
              color="primary"
              onClick={handleCreate}
              className="shadow-sm"
            >
              <i className="ri-add-line me-1 align-middle"></i>
              Offer
            </Button>
          </CardHeader>

          <CardBody>
            {loading ? (
              <Loader />
            ) : (
              <DataTable
                columns={columns}
                data={filteredOffers}
                pagination
                responsive
                noDataComponent={
                  <NoDataFound message="Try adjusting your search criteria or add a new offer." />
                }
                customStyles={{
                  headCells: {
                    style: {
                      fontWeight: "600",
                      fontSize: "0.875rem",
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

      <Modal isOpen={modal} toggle={handleCloseModal} size="xl" centered>
        <ModalHeader toggle={handleCloseModal} className="bg-light">
          <i className={`ri-${isEdit ? "pencil" : "add"}-line me-2`}></i>
          {isEdit ? "Edit Offer" : "Create New Offer"}
        </ModalHeader>

        <Form onSubmit={validation.handleSubmit}>
          <ModalBody style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <Row>
              <Col lg={6}>
                <Card className="border">
                  <CardHeader className="bg-light">
                    <h6 className="mb-0">Offer Information</h6>
                  </CardHeader>
                  <CardBody>
                    <FormGroup>
                      <Label className="form-label">Main Image</Label>
                      <FilePond
                        files={mainImageFile ? [mainImageFile] : []}
                        onupdatefiles={(fileItems) => {
                          setMainImageFile(
                            fileItems.length > 0 ? fileItems[0].file : null,
                          );
                        }}
                        allowMultiple={false}
                        allowPaste
                        name="main_image_url"
                        acceptedFileTypes={["image/*"]}
                        maxFileSize="5MB"
                        labelIdle='<div class="text-center"><i class="ri-upload-cloud-2-line display-4 text-muted"></i><p class="mt-2">Drag & Drop main image or <span class="filepond--label-action">Browse</span></p></div>'
                      />
                      {validation.values.main_image_existing &&
                      !mainImageFile ? (
                        <div className="mt-2">
                          <small className="text-muted d-block">
                            Current image
                          </small>
                          <img
                            src={validation.values.main_image_existing}
                            alt="Current offer"
                            className="img-thumbnail"
                            style={{ maxHeight: "120px" }}
                          />
                        </div>
                      ) : null}
                    </FormGroup>

                    <FormGroup>
                      <Label className="form-label">
                        Title <span className="text-danger">*</span>
                      </Label>
                      <Input
                        name="title"
                        value={validation.values.title}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        invalid={
                          validation.touched.title && !!validation.errors.title
                        }
                        placeholder="Enter offer title"
                      />
                      <FormFeedback>{validation.errors.title}</FormFeedback>
                    </FormGroup>

                    <FormGroup>
                      <Label className="form-label">
                        Short Description <span className="text-danger">*</span>
                      </Label>
                      <Input
                        name="short_description"
                        value={validation.values.short_description}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        invalid={
                          validation.touched.short_description &&
                          !!validation.errors.short_description
                        }
                        placeholder="Save food, save money"
                      />
                      <FormFeedback>
                        {validation.errors.short_description}
                      </FormFeedback>
                    </FormGroup>

                    <FormGroup>
                      <Label className="form-label">
                        Description <span className="text-danger">*</span>
                      </Label>
                      <Input
                        type="textarea"
                        rows="4"
                        name="description"
                        value={validation.values.description}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        invalid={
                          validation.touched.description &&
                          !!validation.errors.description
                        }
                        placeholder="Describe what this offer includes"
                      />
                      <FormFeedback>
                        {validation.errors.description}
                      </FormFeedback>
                    </FormGroup>

                    <FormGroup>
                      <Label className="form-label">Gallery Images</Label>
                      <FilePond
                        files={galleryImageFiles}
                        onupdatefiles={(fileItems) => {
                          setGalleryImageFiles(
                            fileItems.map((item) => item.file),
                          );
                        }}
                        allowMultiple
                        allowReorder
                        allowPaste
                        name="gallery_images"
                        acceptedFileTypes={["image/*"]}
                        maxFileSize="5MB"
                        labelIdle='<div class="text-center"><i class="ri-gallery-line display-4 text-muted"></i><p class="mt-2">Drag & Drop gallery images or <span class="filepond--label-action">Browse</span></p></div>'
                      />
                    </FormGroup>
                  </CardBody>
                </Card>
              </Col>

              <Col lg={6}>
                <Card className="border">
                  <CardHeader className="bg-light">
                    <h6 className="mb-0">Pricing, Category & Pickup</h6>
                  </CardHeader>
                  <CardBody>
                    <Row>
                      <Col md={6}>
                        <FormGroup>
                          <Label className="form-label">
                            Category <span className="text-danger">*</span>
                          </Label>
                          <Select
                            options={categoryOptions}
                            value={
                              categoryOptions.find(
                                (option) =>
                                  option.value ===
                                  validation.values.category_id,
                              ) || null
                            }
                            onChange={(selected) =>
                              validation.setFieldValue(
                                "category_id",
                                selected?.value || "",
                              )
                            }
                            placeholder="Select category"
                          />
                          {validation.touched.category_id &&
                          validation.errors.category_id ? (
                            <div className="text-danger small mt-1">
                              {validation.errors.category_id}
                            </div>
                          ) : null}
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label className="form-label">
                            Currency <span className="text-danger">*</span>
                          </Label>
                          <Input
                            name="currency_code"
                            value={validation.values.currency_code}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={
                              validation.touched.currency_code &&
                              !!validation.errors.currency_code
                            }
                            placeholder="USD"
                          />
                          <FormFeedback>
                            {validation.errors.currency_code}
                          </FormFeedback>
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <FormGroup>
                          <Label className="form-label">
                            Original Price{" "}
                            <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="number"
                            name="original_price_minor"
                            min="0"
                            value={validation.values.original_price_minor}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={
                              validation.touched.original_price_minor &&
                              !!validation.errors.original_price_minor
                            }
                            placeholder="25"
                          />
                          <FormFeedback>
                            {validation.errors.original_price_minor}
                          </FormFeedback>
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label className="form-label">
                            Offer Price <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="number"
                            name="offer_price_minor"
                            min="0"
                            value={validation.values.offer_price_minor}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={
                              validation.touched.offer_price_minor &&
                              !!validation.errors.offer_price_minor
                            }
                            placeholder="10"
                          />
                          <FormFeedback>
                            {validation.errors.offer_price_minor}
                          </FormFeedback>
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <FormGroup>
                          <Label className="form-label">
                            Quantity Total{" "}
                            <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="number"
                            name="quantity_total"
                            min="0"
                            value={validation.values.quantity_total}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={
                              validation.touched.quantity_total &&
                              !!validation.errors.quantity_total
                            }
                            placeholder="15"
                          />
                          <FormFeedback>
                            {validation.errors.quantity_total}
                          </FormFeedback>
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label className="form-label">
                            Max Per User <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="number"
                            name="max_per_user"
                            min="1"
                            value={validation.values.max_per_user}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={
                              validation.touched.max_per_user &&
                              !!validation.errors.max_per_user
                            }
                            placeholder="3"
                          />
                          <FormFeedback>
                            {validation.errors.max_per_user}
                          </FormFeedback>
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <FormGroup>
                          <Label className="form-label">
                            Pickup Start <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="datetime-local"
                            name="pickup_start"
                            value={validation.values.pickup_start}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={
                              validation.touched.pickup_start &&
                              !!validation.errors.pickup_start
                            }
                          />
                          <FormFeedback>
                            {validation.errors.pickup_start}
                          </FormFeedback>
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label className="form-label">
                            Pickup End <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="datetime-local"
                            name="pickup_end"
                            value={validation.values.pickup_end}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={
                              validation.touched.pickup_end &&
                              !!validation.errors.pickup_end
                            }
                          />
                          <FormFeedback>
                            {validation.errors.pickup_end}
                          </FormFeedback>
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <FormGroup>
                          <Label className="form-label">
                            Pickup Window Start{" "}
                            <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="datetime-local"
                            name="pickup_window_start"
                            value={validation.values.pickup_window_start}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={
                              validation.touched.pickup_window_start &&
                              !!validation.errors.pickup_window_start
                            }
                          />
                          <FormFeedback>
                            {validation.errors.pickup_window_start}
                          </FormFeedback>
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label className="form-label">
                            Pickup Window End{" "}
                            <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="datetime-local"
                            name="pickup_window_end"
                            value={validation.values.pickup_window_end}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={
                              validation.touched.pickup_window_end &&
                              !!validation.errors.pickup_window_end
                            }
                          />
                          <FormFeedback>
                            {validation.errors.pickup_window_end}
                          </FormFeedback>
                        </FormGroup>
                      </Col>
                    </Row>

                    <FormGroup>
                      <Label className="form-label">
                        Pickup Window Capacity{" "}
                        <span className="text-danger">*</span>
                      </Label>
                      <Input
                        type="number"
                        name="pickup_window_max"
                        min="1"
                        value={validation.values.pickup_window_max}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        invalid={
                          validation.touched.pickup_window_max &&
                          !!validation.errors.pickup_window_max
                        }
                        placeholder="3"
                      />
                      <FormFeedback>
                        {validation.errors.pickup_window_max}
                      </FormFeedback>
                    </FormGroup>

                    <FormGroup>
                      <Label className="form-label">
                        Pickup Instructions{" "}
                        <span className="text-danger">*</span>
                      </Label>
                      <Input
                        type="textarea"
                        rows="3"
                        name="pickup_instructions"
                        value={validation.values.pickup_instructions}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        invalid={
                          validation.touched.pickup_instructions &&
                          !!validation.errors.pickup_instructions
                        }
                        placeholder="Come to back door and show QR code"
                      />
                      <FormFeedback>
                        {validation.errors.pickup_instructions}
                      </FormFeedback>
                    </FormGroup>

                    <Row>
                      <Col md={4}>
                        <FormGroup>
                          <Label className="form-label">Tags</Label>
                          <Input
                            name="tags"
                            value={validation.values.tags}
                            onChange={validation.handleChange}
                            placeholder="food, surprise, eco"
                          />
                        </FormGroup>
                      </Col>
                      <Col md={4}>
                        <FormGroup>
                          <Label className="form-label">Dietary Info</Label>
                          <Input
                            name="dietary_info"
                            value={validation.values.dietary_info}
                            onChange={validation.handleChange}
                            placeholder="vegan, halal"
                          />
                        </FormGroup>
                      </Col>
                      <Col md={4}>
                        <FormGroup>
                          <Label className="form-label">Allergen Info</Label>
                          <Input
                            name="allergen_info"
                            value={validation.values.allergen_info}
                            onChange={validation.handleChange}
                            placeholder="nuts, gluten"
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </ModalBody>

          <ModalFooter className="bg-light">
            <Button color="light" onClick={handleCloseModal} className="me-2">
              <i className="ri-close-line me-1"></i>
              Cancel
            </Button>
            <Button
              color="primary"
              type="submit"
              disabled={validation.isSubmitting}
            >
              {validation.isSubmitting ? (
                <>
                  <i className="ri-loader-4-line spin me-1"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="ri-save-line me-1"></i>
                  {isEdit ? "Update Offer" : "Create Offer"}
                </>
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <Modal
        isOpen={viewModal}
        toggle={() => setViewModal(false)}
        size="lg"
        centered
      >
        <ModalHeader toggle={() => setViewModal(false)} className="bg-light">
          <i className="ri-eye-line me-2"></i>
          Offer Details
        </ModalHeader>
        <ModalBody>
          {selectedOffer ? (
            <Row>
              <Col md={4} className="mb-3">
                {selectedOffer?.main_image_url ? (
                  <img
                    src={selectedOffer.main_image_url}
                    alt={selectedOffer.title}
                    style={{
                      width: "100%",
                      borderRadius: "12px",
                      border: "3px solid #f8f9fa",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "200px",
                      backgroundColor: "#f8f9fa",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "12px",
                      border: "3px dashed #dee2e6",
                    }}
                  >
                    <i
                      className="ri-image-line"
                      style={{ fontSize: "48px", color: "#6c757d" }}
                    ></i>
                  </div>
                )}
              </Col>

              <Col md={8}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h4 className="mb-0">{selectedOffer?.title || "-"}</h4>
                  <Badge
                    color={resolveStatus(selectedOffer) ? "success" : "danger"}
                    className="px-3 py-2"
                  >
                    {resolveStatus(selectedOffer) ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <p className="text-muted mb-2">
                  {selectedOffer?.short_description || "-"}
                </p>
                <p className="text-muted mb-4">
                  {selectedOffer?.description || "-"}
                </p>

                <Row className="gy-3">
                  <Col sm={6}>
                    <div className="border rounded p-3 bg-light">
                      <small className="text-muted d-block">
                        Original Price
                      </small>
                      <span className="text-decoration-line-through h5 text-muted">
                        {selectedOffer?.currency_code || "USD"}{" "}
                        {toNumber(
                          selectedOffer?.original_price_minor ??
                            selectedOffer?.originalPrice,
                          0,
                        ).toFixed(2)}
                      </span>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="border rounded p-3 bg-success bg-opacity-10">
                      <small className="text-muted d-block">Offer Price</small>
                      <span className="h5 text-success fw-bold">
                        {selectedOffer?.currency_code || "USD"}{" "}
                        {toNumber(
                          selectedOffer?.offer_price_minor ??
                            selectedOffer?.offerPrice,
                          0,
                        ).toFixed(2)}
                      </span>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="border rounded p-3 bg-info bg-opacity-10">
                      <small className="text-muted d-block">Discount</small>
                      <span className="h6 text-info fw-bold">
                        {calculateDiscount(
                          selectedOffer?.original_price_minor ??
                            selectedOffer?.originalPrice,
                          selectedOffer?.offer_price_minor ??
                            selectedOffer?.offerPrice,
                        )}
                        % OFF
                      </span>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="border rounded p-3 bg-light">
                      <small className="text-muted d-block">
                        Quantity Total
                      </small>
                      <span className="h5 text-dark fw-bold">
                        {toNumber(
                          selectedOffer?.quantity_total ??
                            selectedOffer?.quantityAvailable,
                          0,
                        )}
                      </span>
                    </div>
                  </Col>
                </Row>

                <hr className="my-4" />

                <h6 className="mb-3">Pickup Schedule</h6>
                <Row className="mb-3">
                  <Col sm={6}>
                    <strong>Start:</strong>
                    <div className="text-muted">
                      {formatDateTime(
                        selectedOffer?.pickup_start ||
                          selectedOffer?.pickupStart,
                      )}
                    </div>
                  </Col>
                  <Col sm={6}>
                    <strong>End:</strong>
                    <div className="text-muted">
                      {formatDateTime(
                        selectedOffer?.pickup_end || selectedOffer?.pickupEnd,
                      )}
                    </div>
                  </Col>
                </Row>

                <h6 className="mb-2">Pickup Instructions</h6>
                <div className="border rounded p-3 bg-light">
                  {selectedOffer?.pickup_instructions ||
                    selectedOffer?.pickupInstructions ||
                    "-"}
                </div>
              </Col>
            </Row>
          ) : null}
        </ModalBody>
        <ModalFooter className="bg-light">
          <Button color="light" onClick={() => setViewModal(false)}>
            <i className="ri-close-line me-1"></i>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteOffer}
        onCloseClick={() => setDeleteModal(false)}
        confirmationText={
          selectedOffer
            ? `Are you sure you want to delete "${selectedOffer.title}"? This action cannot be undone.`
            : ""
        }
      />

      <ToastContainer />
    </div>
  );
};

export default Offers;
