import React, {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  Row,
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
  createOffer as onCreateOffer,
  deleteOffer as onDeleteOffer,
  getBusinessesData as onGetBusinesses,
  getOffers as onGetOffers,
  publishOffer as onPublishOffer,
  updateOffer as onUpdateOffer,
} from "../../../slices/thunks";

const normalizeArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const toCsv = (value) => (Array.isArray(value) ? value.join(", ") : "");

const fromCsv = (value) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const getEntityId = (item) => item?.id || item?._id || item?.uuid || "";

const normalizeOption = (
  item,
  labelKeys = ["name"],
  valueKeys = ["id", "_id", "uuid"],
) => {
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

const formatForDateTimeLocal = (date) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString();
};

const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";
  return `$${amount.toFixed(2)}`;
};

const getCutoffBadge = (isLimited) =>
  isLimited
    ? { color: "warning", label: "Time Limited", icon: "ri-timer-line" }
    : { color: "success", label: "Open Order", icon: "ri-time-line" };

const buildInitialValues = () => ({
  business_id: "",
  title: "",
  description: "",
  short_description: "",
  tags: "",
  contents: "",
  is_order_time_limited: true,
  order_cutoff_at: "",
  original_price_minor: "",
  offer_price_minor: "",
  quantity_total: "",
  max_per_user: 1,
  pickup_start: "",
  pickup_end: "",
  pickup_instructions: "",
});

const normalizeOffer = (offer = {}) => ({
  ...offer,
  id: getEntityId(offer),
  business_id: offer.business_id || getEntityId(offer.business) || "",
  business_name:
    offer.business?.display_name ||
    offer.business_name ||
    offer.display_name ||
    "-",
  title: offer.title || "",
  description: offer.description || "",
  short_description: offer.short_description || "",
  tags: Array.isArray(offer.tags) ? offer.tags : [],
  contents: Array.isArray(offer.contents) ? offer.contents : [],
  main_image_url: offer.main_image_url || "",
  gallery_images: Array.isArray(offer.gallery_images) ? offer.gallery_images : [],
  is_order_time_limited: offer.is_order_time_limited ?? false,
  order_cutoff_at: offer.order_cutoff_at || "",
  original_price_minor: offer.original_price_minor ?? "",
  offer_price_minor: offer.offer_price_minor ?? "",
  quantity_total: offer.quantity_total ?? "",
  max_per_user: offer.max_per_user ?? 1,
  pickup_start: offer.pickup_start || "",
  pickup_end: offer.pickup_end || "",
  pickup_instructions: offer.pickup_instructions || "",
  status: (offer.status || offer.offer_status || "DRAFT").toUpperCase(),
});

const getOfferStatusBadge = (status) => {
  switch ((status || "").toUpperCase()) {
    case "PUBLISHED":
    case "PUBLISH":
      return { color: "success", label: "PUBLISHED", icon: "ri-rocket-line" };
    case "EXPIRED":
      return { color: "warning", label: "EXPIRED", icon: "ri-time-line" };
    case "CANCELLED":
      return { color: "danger", label: "CANCELLED", icon: "ri-close-circle-line" };
    case "DRAFT":
    default:
      return { color: "secondary", label: "DRAFT", icon: "ri-draft-line" };
  }
};

const isOfferPublished = (status) => {
  const normalized = (status || "").toUpperCase();
  return normalized === "PUBLISHED" || normalized === "PUBLISH";
};

const Offers = () => {
  document.title = "Offers | Kamacaash";

  const dispatch = useDispatch();

  const selectPageData = createSelector(
    (state) => state.ContentManagement,
    (state) => state.BusinessManagement,
    (contentManagement, businessManagement) => ({
      offersData: contentManagement.offersData,
      businessesData: businessManagement.businessesData
    }),
  );

  const { offersData, businessesData } = useSelector(selectPageData);

  const [offersList, setOffersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [publishModal, setPublishModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [mainImageFile, setMainImageFile] = useState(null);
  const [galleryImageFiles, setGalleryImageFiles] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    limited: "",
  });
  const deferredSelectedOffer = useDeferredValue(selectedOffer);

  const businessOptions = useMemo(
    () =>
      normalizeArray(businessesData, ["rows", "data", "businesses"])
        .map((item) =>
          normalizeOption(item, ["display_name", "legal_name", "name"], [
            "id",
            "_id",
            "uuid",
          ]),
        )
        .filter(Boolean),
    [businessesData],
  );


  const limitedOptions = [
    { value: "", label: "All" },
    { value: "limited", label: "Order Time Limited" },
    { value: "open", label: "No Cutoff" },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        dispatch(onGetOffers()),
        dispatch(onGetBusinesses()),
      ]);
    } catch (error) {
      console.error("Error loading offers page data:", error);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setOffersList(
      normalizeArray(offersData, ["rows", "data", "offers"]).map(normalizeOffer),
    );
  }, [offersData]);

  const filteredOffers = useMemo(() => {
    const searchTerm = filters.search.toLowerCase();

    return offersList.filter((offer) => {
      return (
        (filters.search === "" ||
          offer.title?.toLowerCase().includes(searchTerm) ||
          offer.short_description?.toLowerCase().includes(searchTerm) ||
          offer.business_name?.toLowerCase().includes(searchTerm)) &&
        (filters.limited === "" ||
          (filters.limited === "limited" && offer.is_order_time_limited) ||
          (filters.limited === "open" && !offer.is_order_time_limited))
      );
    });
  }, [offersList, filters]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: selectedOffer
      ? {
        business_id: selectedOffer.business_id || "",
        title: selectedOffer.title || "",
        description: selectedOffer.description || "",
        short_description: selectedOffer.short_description || "",
        tags: toCsv(selectedOffer.tags),
        contents: toCsv(selectedOffer.contents),
        is_order_time_limited: selectedOffer.is_order_time_limited ?? true,
        order_cutoff_at: formatForDateTimeLocal(selectedOffer.order_cutoff_at),
        original_price_minor: selectedOffer.original_price_minor ?? "",
        offer_price_minor: selectedOffer.offer_price_minor ?? "",
        quantity_total: selectedOffer.quantity_total ?? "",
        max_per_user: selectedOffer.max_per_user ?? 1,
        pickup_start: formatForDateTimeLocal(selectedOffer.pickup_start),
        pickup_end: formatForDateTimeLocal(selectedOffer.pickup_end),
        pickup_instructions: selectedOffer.pickup_instructions || "",
      }
      : buildInitialValues(),
    validationSchema: Yup.object({
      business_id: Yup.string().required("Business is required"),
      title: Yup.string().required("Title is required").trim(),
      description: Yup.string().required("Description is required").trim(),
      short_description: Yup.string()
        .required("Short description is required")
        .trim(),
      tags: Yup.string().required("Tags are required"),
      contents: Yup.string().required("Contents are required"),
      is_order_time_limited: Yup.boolean(),
      order_cutoff_at: Yup.string().when("is_order_time_limited", {
        is: true,
        then: (schema) => schema.required("Order cutoff is required"),
        otherwise: (schema) => schema.nullable(),
      }),
      original_price_minor: Yup.number()
        .typeError("Original price must be a number")
        .required("Original price is required")
        .min(0, "Original price must be 0 or greater"),
      offer_price_minor: Yup.number()
        .typeError("Offer price must be a number")
        .required("Offer price is required")
        .min(0, "Offer price must be 0 or greater"),
      quantity_total: Yup.number()
        .typeError("Quantity must be a number")
        .required("Quantity is required")
        .integer("Quantity must be whole number")
        .min(0, "Quantity must be 0 or greater"),
      max_per_user: Yup.number()
        .typeError("Max per user must be a number")
        .required("Max per user is required")
        .integer("Max per user must be whole number")
        .min(1, "Max per user must be at least 1"),
      pickup_start: Yup.string().required("Pickup start is required"),
      pickup_end: Yup.string()
        .required("Pickup end is required")
        .test(
          "pickup-end-after-start",
          "Pickup end must be after pickup start",
          function (value) {
            return new Date(value) > new Date(this.parent.pickup_start);
          },
        ),
      pickup_instructions: Yup.string()
        .required("Pickup instructions are required")
        .trim(),
    }),
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const payload = new FormData();
        payload.append("business_id", values.business_id);
        payload.append("title", values.title.trim());
        payload.append("description", values.description.trim());
        payload.append("short_description", values.short_description.trim());
        payload.append("is_order_time_limited", String(values.is_order_time_limited));
        payload.append("original_price_minor", String(values.original_price_minor));
        payload.append("offer_price_minor", String(values.offer_price_minor));
        payload.append("quantity_total", String(values.quantity_total));
        payload.append("max_per_user", String(values.max_per_user));
        payload.append("pickup_start", new Date(values.pickup_start).toISOString());
        payload.append("pickup_end", new Date(values.pickup_end).toISOString());
        payload.append(
          "pickup_instructions",
          values.pickup_instructions.trim(),
        );

        if (values.is_order_time_limited && values.order_cutoff_at) {
          payload.append(
            "order_cutoff_at",
            new Date(values.order_cutoff_at).toISOString(),
          );
        }

        fromCsv(values.tags).forEach((tag, index) => {
          payload.append(`tags[${index}]`, tag);
        });

        fromCsv(values.contents).forEach((item, index) => {
          payload.append(`contents[${index}]`, item);
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
              id: selectedOffer?.id,
              payload,
            }),
          );
        } else {
          await dispatch(onCreateOffer({ payload }));
        }

        setModal(false);
        setSelectedOffer(null);
        setMainImageFile(null);
        setGalleryImageFiles([]);
        validation.resetForm();
      } catch (error) {
        console.error("Offer save error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleCreate = () => {
    setSelectedOffer(null);
    setIsEdit(false);
    setMainImageFile(null);
    setGalleryImageFiles([]);
    setModal(true);
  };

  const handleEdit = (offer) => {
    setSelectedOffer(offer);
    setIsEdit(true);
    setMainImageFile(null);
    setGalleryImageFiles([]);
    setModal(true);
  };

  const handleView = (offer) => {
    setViewModal(true);
    startTransition(() => {
      setSelectedOffer(offer);
    });
  };

  const handleDeleteClick = (offer) => {
    setSelectedOffer(offer);
    setDeleteModal(true);
  };

  const handleDeleteOffer = async () => {
    const id = selectedOffer?.id;
    if (!id) return;
    await dispatch(onDeleteOffer(id));
    setDeleteModal(false);
    setSelectedOffer(null);
  };

  const handlePublishOffer = async () => {
    const id = selectedOffer?.id;
    if (!id) return;
    await dispatch(onPublishOffer(id));
    setPublishModal(false);
    setSelectedOffer(null);
  };

  const openPublishModal = (offer) => {
    setSelectedOffer(offer);
    setPublishModal(true);
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

  const columns = [
    {
      name: "#",
      cell: (row, index) => index + 1,
      width: "70px",
    },
    {
      name: "Title",
      cell: (row) => (
        <div>
          <div className="fw-semibold">{row.title || "-"}</div>
          <small className="text-muted">{row.short_description || "-"}</small>
        </div>
      ),
    },
    {
      name: "Business",
      cell: (row) => (
        <div className="d-flex align-items-center gap-2">
          <span
            className="d-inline-flex align-items-center justify-content-center rounded-circle bg-soft-primary text-primary"
            style={{ width: "32px", height: "32px" }}
          >
            <i className="ri-store-2-line" />
          </span>
          <span className="fw-medium">{row.business_name || "-"}</span>
        </div>
      ),
    },
    {
      name: "Offer Price",
      cell: (row) => (
        <div>
          <div className="fw-semibold text-success">
            {formatMoney(row.offer_price_minor)}
          </div>
          <small className="text-muted text-decoration-line-through">
            {formatMoney(row.original_price_minor)}
          </small>
        </div>
      ),
    },
    {
      name: "Quantity",
      cell: (row) => (
        <Badge color="info" pill>
          <i className="ri-inbox-archive-line me-1" />
          {row.quantity_total ?? 0}
        </Badge>
      ),
    },
    {
      name: "Cutoff",
      cell: (row) => {
        const badge = getCutoffBadge(row.is_order_time_limited);
        return (
          <Badge color={badge.color}>
            <i className={`${badge.icon} me-1`} />
            {badge.label}
          </Badge>
        );
      },
    },
    {
      name: "Status",
      cell: (row) => {
        const badge = getOfferStatusBadge(row.status);
        return (
          <Badge color={badge.color}>
            <i className={`${badge.icon} me-1`} />
            {badge.label}
          </Badge>
        );
      },
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2">
          <Button color="soft-info" size="sm" onClick={() => handleView(row)}>
            <i className="ri-eye-line" />
          </Button>
          {!isOfferPublished(row.status) ? (
            <Button
              color="soft-success"
              size="sm"
              onClick={() => openPublishModal(row)}
              title="Publish offer"
            >
              <i className="ri-megaphone-line" />
            </Button>
          ) : (
            <Button color="soft-secondary" size="sm" disabled title="Already published">
              <i className="ri-check-double-line" />
            </Button>
          )}
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
        <BreadCrumb title="Offers" pageTitle="Content" />

        <Card className="mb-3">
          <CardBody>
            <Row>
              <Col md={8}>
                <FormGroup>
                  <Label>Search</Label>
                  <Input
                    type="text"
                    name="search"
                    placeholder="Search by title, business, or short description"
                    value={filters.search}
                    onChange={handleFilterChange}
                  />
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup>
                  <Label>Order Cutoff</Label>
                  <Select
                    options={limitedOptions}
                    value={limitedOptions.find(
                      (option) => option.value === filters.limited,
                    )}
                    onChange={(option) =>
                      handleSelectFilterChange("limited", option)
                    }
                    isClearable
                    placeholder="Select type"
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
            <h5 className="mb-0">Offers List</h5>
            <Button color="primary" onClick={handleCreate}>
              <i className="ri-add-line me-1" /> Add Offer
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
                highlightOnHover
                noDataComponent={<NoDataFound message="No offers found" />}
              />
            )}
          </CardBody>
        </Card>
      </Container>

      <Modal isOpen={modal} toggle={() => setModal(false)} size="xl">
        <ModalHeader toggle={() => setModal(false)}>
          {isEdit ? "Edit Offer" : "Add New Offer"}
        </ModalHeader>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            validation.handleSubmit();
          }}
        >
          <ModalBody>
            <Row>
              <Col md={4}>
                <FormGroup>
                  <Label>
                    Business <span className="text-danger">*</span>
                  </Label>
                  <Select
                    options={businessOptions}
                    value={
                      businessOptions.find(
                        (option) => option.value === validation.values.business_id,
                      ) || null
                    }
                    onChange={(option) =>
                      validation.setFieldValue("business_id", option?.value || "")
                    }
                    onBlur={() => validation.setFieldTouched("business_id", true)}
                    placeholder="Select business"
                  />
                  {validation.touched.business_id &&
                    validation.errors.business_id ? (
                    <div className="text-danger mt-1 small">
                      {validation.errors.business_id}
                    </div>
                  ) : null}
                </FormGroup>
              </Col>

              <Col md={4}>
                <FormGroup>
                  <Label>
                    Title <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="title"
                    placeholder="Family Lunch Combo"
                    value={validation.values.title}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={validation.touched.title && !!validation.errors.title}
                  />
                  <FormFeedback>{validation.errors.title}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>
                    Short Description <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="short_description"
                    placeholder="Lunch combo for 2"
                    value={validation.values.short_description}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.short_description &&
                      !!validation.errors.short_description
                    }
                  />
                  <FormFeedback>
                    {validation.errors.short_description}
                  </FormFeedback>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>
                    Tags (comma separated) <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="tags"
                    placeholder="lunch, combo, family"
                    value={validation.values.tags}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={validation.touched.tags && !!validation.errors.tags}
                  />
                  <FormFeedback>{validation.errors.tags}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>
                    Description <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="textarea"
                    rows="4"
                    name="description"
                    placeholder="Rice, chicken, salad and juice for two people."
                    value={validation.values.description}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.description &&
                      !!validation.errors.description
                    }
                  />
                  <FormFeedback>{validation.errors.description}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>
                    Contents (comma separated) <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="textarea"
                    rows="4"
                    name="contents"
                    placeholder="Rice, Chicken, Salad, Juice"
                    value={validation.values.contents}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.contents && !!validation.errors.contents
                    }
                  />
                  <FormFeedback>{validation.errors.contents}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>Main Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setMainImageFile(e.currentTarget.files?.[0] || null)
                    }
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Gallery Images</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) =>
                      setGalleryImageFiles(Array.from(e.currentTarget.files || []))
                    }
                  />
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <FormGroup check className="mt-2">
                  <Input
                    type="checkbox"
                    id="is_order_time_limited"
                    name="is_order_time_limited"
                    checked={validation.values.is_order_time_limited}
                    onChange={validation.handleChange}
                  />
                  <Label check for="is_order_time_limited">
                    Order Time Limited
                  </Label>
                </FormGroup>
              </Col>
              <Col md={8}>
                <FormGroup>
                  <Label>
                    Order Cutoff At
                    {validation.values.is_order_time_limited ? (
                      <span className="text-danger"> *</span>
                    ) : null}
                  </Label>
                  <Input
                    type="datetime-local"
                    name="order_cutoff_at"
                    value={validation.values.order_cutoff_at}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    disabled={!validation.values.is_order_time_limited}
                    invalid={
                      validation.touched.order_cutoff_at &&
                      !!validation.errors.order_cutoff_at
                    }
                  />
                  <FormFeedback>{validation.errors.order_cutoff_at}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={3}>
                <FormGroup>
                  <Label>
                    Original Price <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    name="original_price_minor"
                    value={validation.values.original_price_minor}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.original_price_minor &&
                      !!validation.errors.original_price_minor
                    }
                  />
                  <FormFeedback>
                    {validation.errors.original_price_minor}
                  </FormFeedback>
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup>
                  <Label>
                    Offer Price <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    name="offer_price_minor"
                    value={validation.values.offer_price_minor}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.offer_price_minor &&
                      !!validation.errors.offer_price_minor
                    }
                  />
                  <FormFeedback>
                    {validation.errors.offer_price_minor}
                  </FormFeedback>
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup>
                  <Label>
                    Quantity Total <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="number"
                    name="quantity_total"
                    value={validation.values.quantity_total}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.quantity_total &&
                      !!validation.errors.quantity_total
                    }
                  />
                  <FormFeedback>{validation.errors.quantity_total}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup>
                  <Label>
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
                  />
                  <FormFeedback>{validation.errors.max_per_user}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>
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
                  <FormFeedback>{validation.errors.pickup_start}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>
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
                  <FormFeedback>{validation.errors.pickup_end}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>

            <FormGroup>
              <Label>
                Pickup Instructions <span className="text-danger">*</span>
              </Label>
              <Input
                type="textarea"
                rows="3"
                name="pickup_instructions"
                placeholder="Show order code at pickup desk"
                value={validation.values.pickup_instructions}
                onChange={validation.handleChange}
                onBlur={validation.handleBlur}
                invalid={
                  validation.touched.pickup_instructions &&
                  !!validation.errors.pickup_instructions
                }
              />
              <FormFeedback>{validation.errors.pickup_instructions}</FormFeedback>
            </FormGroup>
          </ModalBody>

          <ModalFooter>
            <Button color="light" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button color="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Update Offer" : "Create Offer"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="xl">
        <ModalHeader toggle={() => setViewModal(false)}>Offer Details</ModalHeader>
        <ModalBody>
          {deferredSelectedOffer ? (
            <>
              <div className="d-flex flex-wrap gap-2 mb-4">
                <Badge color="primary" pill className="px-3 py-2">
                  <i className="ri-store-2-line me-1" />
                  {deferredSelectedOffer.business_name || "-"}
                </Badge>
                <Badge color="dark" pill className="px-3 py-2">
                  <i className="ri-price-tag-3-line me-1" />
                  {deferredSelectedOffer.category_name || "Offer"}
                </Badge>
                <Badge
                  color={getCutoffBadge(deferredSelectedOffer.is_order_time_limited).color}
                  pill
                  className="px-3 py-2"
                >
                  <i
                    className={`${getCutoffBadge(deferredSelectedOffer.is_order_time_limited).icon} me-1`}
                  />
                  {getCutoffBadge(deferredSelectedOffer.is_order_time_limited).label}
                </Badge>
              </div>

              <Row className="g-4">
                <Col md={6}>
                  <Card className="border shadow-none h-100 mb-0">
                    <CardHeader>
                      <h6 className="mb-0">
                        <i className="ri-file-list-3-line me-2 text-primary" />
                        Offer Information
                      </h6>
                    </CardHeader>
                    <CardBody>
                      <p><strong>Title:</strong> {deferredSelectedOffer.title || "-"}</p>
                      <p>
                        <strong>Business:</strong> {deferredSelectedOffer.business_name || "-"}
                      </p>
                      <p>
                        <strong>Short Description:</strong>{" "}
                        {deferredSelectedOffer.short_description || "-"}
                      </p>
                      <p className="mb-0">
                        <strong>Description:</strong>{" "}
                        {deferredSelectedOffer.description || "-"}
                      </p>
                    </CardBody>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="border shadow-none h-100 mb-0">
                    <CardHeader>
                      <h6 className="mb-0">
                        <i className="ri-coins-line me-2 text-success" />
                        Pricing & Quantity
                      </h6>
                    </CardHeader>
                    <CardBody>
                      <Row className="g-3">
                        <Col sm={6}>
                          <div className="rounded-3 border bg-light p-3">
                            <small className="text-muted d-block">Original Price</small>
                            <span className="fw-semibold text-muted text-decoration-line-through">
                              {formatMoney(deferredSelectedOffer.original_price_minor)}
                            </span>
                          </div>
                        </Col>
                        <Col sm={6}>
                          <div className="rounded-3 border bg-success bg-opacity-10 p-3">
                            <small className="text-muted d-block">Offer Price</small>
                            <span className="fw-bold text-success">
                              {formatMoney(deferredSelectedOffer.offer_price_minor)}
                            </span>
                          </div>
                        </Col>
                        <Col sm={6}>
                          <div className="rounded-3 border bg-info bg-opacity-10 p-3">
                            <small className="text-muted d-block">Quantity</small>
                            <span className="fw-bold text-info">
                              {deferredSelectedOffer.quantity_total ?? "-"}
                            </span>
                          </div>
                        </Col>
                        <Col sm={6}>
                          <div className="rounded-3 border bg-warning bg-opacity-10 p-3">
                            <small className="text-muted d-block">Max Per User</small>
                            <span className="fw-bold text-warning">
                              {deferredSelectedOffer.max_per_user ?? "-"}
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
                        <i className="ri-calendar-schedule-line me-2 text-warning" />
                        Schedule
                      </h6>
                    </CardHeader>
                    <CardBody>
                      <p>
                        <strong>Order Cutoff:</strong>{" "}
                        {formatDateTime(deferredSelectedOffer.order_cutoff_at)}
                      </p>
                      <p>
                        <strong>Pickup Start:</strong>{" "}
                        {formatDateTime(deferredSelectedOffer.pickup_start)}
                      </p>
                      <p>
                        <strong>Pickup End:</strong>{" "}
                        {formatDateTime(deferredSelectedOffer.pickup_end)}
                      </p>
                      <p className="mb-0">
                        <strong>Pickup Instructions:</strong>{" "}
                        {deferredSelectedOffer.pickup_instructions || "-"}
                      </p>
                    </CardBody>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="border shadow-none h-100 mb-0">
                    <CardHeader>
                      <h6 className="mb-0">
                        <i className="ri-price-tag-3-line me-2 text-dark" />
                        Tags & Contents
                      </h6>
                    </CardHeader>
                    <CardBody>
                      <div className="mb-3">
                        <strong className="d-block mb-2">Tags</strong>
                        {deferredSelectedOffer.tags?.length ? (
                          <div className="d-flex flex-wrap gap-2">
                            {deferredSelectedOffer.tags.map((tag, index) => (
                              <Badge color="primary" pill key={`tag-${index}`}>
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted mb-0">-</p>
                        )}
                      </div>
                      <div>
                        <strong className="d-block mb-2">Contents</strong>
                        {deferredSelectedOffer.contents?.length ? (
                          <div className="d-flex flex-wrap gap-2">
                            {deferredSelectedOffer.contents.map((item, index) => (
                              <Badge color="light" className="text-dark border" key={`content-${index}`}>
                                <i className="ri-check-line me-1 text-success" />
                                {item}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted mb-0">-</p>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              <Row className="g-4 mt-1">
                <Col md={12}>
                  <Card className="border shadow-none mb-0">
                    <CardHeader>
                      <h6 className="mb-0">
                        <i className="ri-image-2-line me-2 text-info" />
                        Images
                      </h6>
                    </CardHeader>
                    <CardBody>
                      <Row>
                        <Col md={4}>
                          <p className="fw-semibold">Main Image</p>
                          {deferredSelectedOffer.main_image_url ? (
                            <img
                              src={deferredSelectedOffer.main_image_url}
                              alt={deferredSelectedOffer.title}
                              loading="lazy"
                              style={{
                                width: "100%",
                                height: "220px",
                                objectFit: "cover",
                                borderRadius: "12px",
                              }}
                            />
                          ) : (
                            <p className="text-muted mb-0">No main image</p>
                          )}
                        </Col>
                        <Col md={8}>
                          <p className="fw-semibold">Gallery Images</p>
                          {deferredSelectedOffer.gallery_images?.length ? (
                            <Row className="g-3">
                              {deferredSelectedOffer.gallery_images.map((image, index) => (
                                <Col md={4} key={`gallery-${index}`}>
                                  <img
                                    src={image}
                                    alt={`Gallery ${index + 1}`}
                                    loading="lazy"
                                    style={{
                                      width: "100%",
                                      height: "140px",
                                      objectFit: "cover",
                                      borderRadius: "12px",
                                    }}
                                  />
                                </Col>
                              ))}
                            </Row>
                          ) : (
                            <p className="text-muted mb-0">No gallery images</p>
                          )}
                        </Col>
                      </Row>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </>
          ) : (
            <div className="py-4 text-center text-muted">
              <i className="ri-loader-4-line spin me-2" />
              Loading offer details...
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={() => setViewModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteOffer}
        onCloseClick={() => setDeleteModal(false)}
      />

      <Modal isOpen={publishModal} toggle={() => setPublishModal(false)} centered>
        <ModalHeader toggle={() => setPublishModal(false)}>
          Publish Offer
        </ModalHeader>
        <ModalBody>
          <p className="mb-2">
            Haddii aad publish gareyso
            <span className="fw-semibold">
              {` ${selectedOffer?.title || "offer-kan"}`}
            </span>
            , si toos ah ayuu App-ka uga soo muuqan doonaa.
          </p>
          <p className="mb-0 text-muted">
            Marka la publish gareeyo, users-ku way arki doonaan waana laga dalban
            doonaa.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={() => setPublishModal(false)}>
            Cancel
          </Button>
          <Button color="success" onClick={handlePublishOffer}>
            Yes, Publish
          </Button>
        </ModalFooter>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default Offers;
