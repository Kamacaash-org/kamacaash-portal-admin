import React, { useState, useEffect, useCallback } from "react";
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
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import { useFormik } from "formik";
import * as Yup from "yup";

import {
  getCountries as onGetCountries,
  addCountry as onAddCountry,
  updateCountry as onUpdateCountry,
  deleteCountry as onDeleteCountry,
} from "../../../slices/thunks";

const Country = () => {
  document.title = "Country | Kamacaash";

  const dispatch = useDispatch();

  const selectCountriesData = createSelector(
    (state) => state.Settings,
    (settings) => settings.countriesData,
  );

  const countriesData = useSelector(selectCountriesData);

  const [countriesList, setCountriesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  const statusOptions = [
    { value: "", label: "All" },
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ];

  const parseCsvToArray = (value) => {
    if (!value) return [];
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const arrayToCsv = (value) => {
    if (!Array.isArray(value)) return "";
    return value.join(", ");
  };

  const resolveCountryId = (country) => country?.id || country?._id;

  const normalizeCountries = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.countries)) return payload.countries;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const fetchCountries = useCallback(async () => {
    setLoading(true);
    try {
      await dispatch(onGetCountries());
    } catch (error) {
      console.error("Error loading countries:", error);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  useEffect(() => {
    setCountriesList(normalizeCountries(countriesData));
  }, [countriesData]);

  const filteredCountries = countriesList.filter((country) => {
    const searchTerm = filters.search.toLowerCase();
    return (
      (filters.search === "" ||
        country?.name?.toLowerCase().includes(searchTerm) ||
        country?.native_name?.toLowerCase().includes(searchTerm) ||
        country?.iso_code_3166?.toLowerCase().includes(searchTerm) ||
        country?.iso_code_3166_3?.toLowerCase().includes(searchTerm) ||
        country?.currency_code?.toLowerCase().includes(searchTerm) ||
        country?.phone_code?.toLowerCase().includes(searchTerm)) &&
      (filters.status === "" ||
        (filters.status === "Active"
          ? country?.is_active
          : !country?.is_active))
    );
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

  const handleCreate = () => {
    setSelectedCountry(null);
    setIsEdit(false);
    setModal(true);
  };

  const handleEdit = (country) => {
    setSelectedCountry(country);
    setIsEdit(true);
    setModal(true);
  };

  const onClickDelete = (country) => {
    setSelectedCountry(country);
    setDeleteModal(true);
  };

  const handleDeleteCountry = async () => {
    const id = resolveCountryId(selectedCountry);
    if (!id) return;

    await dispatch(onDeleteCountry(id));
    setDeleteModal(false);
    setSelectedCountry(null);
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      iso_code_3166: selectedCountry?.iso_code_3166 || "",
      iso_code_3166_3: selectedCountry?.iso_code_3166_3 || "",
      name: selectedCountry?.name || "",
      native_name: selectedCountry?.native_name || "",
      phone_code: selectedCountry?.phone_code || "",
      phone_number_length: selectedCountry?.phone_number_length ?? 10,
      currency_code: selectedCountry?.currency_code || "",
      currency_symbol: selectedCountry?.currency_symbol || "",
      currency_name: selectedCountry?.currency_name || "",
      default_timezone: selectedCountry?.default_timezone || "",
      supported_timezones: arrayToCsv(selectedCountry?.supported_timezones),
      default_language: selectedCountry?.default_language || "",
      supported_languages: arrayToCsv(selectedCountry?.supported_languages),
      postal_code_format: selectedCountry?.postal_code_format || "",
      is_active: selectedCountry?.is_active ?? true,
    },
    validationSchema: Yup.object({
      iso_code_3166: Yup.string()
        .required("ISO code (2 chars) is required")
        .length(2, "Must be exactly 2 characters")
        .uppercase()
        .trim(),
      iso_code_3166_3: Yup.string()
        .required("ISO code (3 chars) is required")
        .length(3, "Must be exactly 3 characters")
        .uppercase()
        .trim(),
      name: Yup.string().required("Country name is required").trim(),
      native_name: Yup.string().required("Native name is required").trim(),
      phone_code: Yup.string().required("Phone code is required").trim(),
      phone_number_length: Yup.number()
        .required("Phone number length is required")
        .integer("Must be an integer")
        .min(1, "Must be greater than 0"),
      currency_code: Yup.string()
        .required("Currency code is required")
        .trim()
        .uppercase(),
      currency_symbol: Yup.string()
        .required("Currency symbol is required")
        .trim(),
      currency_name: Yup.string().required("Currency name is required").trim(),
      default_timezone: Yup.string()
        .required("Default timezone is required")
        .trim(),
      supported_timezones: Yup.string()
        .required("At least one supported timezone is required")
        .trim(),
      default_language: Yup.string()
        .required("Default language is required")
        .trim(),
      supported_languages: Yup.string()
        .required("At least one supported language is required")
        .trim(),
      postal_code_format: Yup.string()
        .required("Postal code format is required")
        .trim(),
      is_active: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      setIsSubmitting(true);

      const payload = {
        ...values,
        iso_code_3166: values.iso_code_3166?.toUpperCase(),
        iso_code_3166_3: values.iso_code_3166_3?.toUpperCase(),
        currency_code: values.currency_code?.toUpperCase(),
        supported_timezones: parseCsvToArray(values.supported_timezones),
        supported_languages: parseCsvToArray(values.supported_languages),
        phone_number_length: Number(values.phone_number_length),
      };

      try {
        if (isEdit) {
          const id = resolveCountryId(selectedCountry);
          if (!id) return;

          await dispatch(
            onUpdateCountry({
              id,
              ...payload,
            }),
          );
        } else {
          await dispatch(onAddCountry(payload));
        }

        setModal(false);
        setSelectedCountry(null);
        validation.resetForm();
      } catch (error) {
        console.error("Country save error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const columns = [
    {
      name: "#",
      cell: (row, index) => index + 1,
    },
    {
      name: "Name",
      selector: (row) => row.name,
      wrap: true,
    },
    {
      name: "ISO",
      selector: (row) => row.iso_code_3166,
    },
    {
      name: "ISO-3",
      selector: (row) => row.iso_code_3166_3,
    },
    {
      name: "Phone Code",
      selector: (row) => row.phone_code || "-",
    },
    {
      name: "Currency",
      selector: (row) =>
        `${row.currency_code || ""} ${row.currency_symbol || ""}`.trim() || "-",
      wrap: true,
    },
    {
      name: "Default Language",
      selector: (row) => row.default_language || "-",
    },
    {
      name: "Status",
      cell: (row) => (
        <Badge color={row.is_active ? "success" : "danger"}>
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2">
          <Button
            color="soft-primary"
            size="sm"
            onClick={() => handleEdit(row)}
          >
            <i className="ri-pencil-line" />
          </Button>
          <Button
            color="soft-danger"
            size="sm"
            onClick={() => onClickDelete(row)}
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
        <BreadCrumb title="Country" pageTitle="Settings" />

        <Card className="mb-3">
          <CardBody>
            <Row>
              <Col md={8}>
                <FormGroup>
                  <Label>Search</Label>
                  <Input
                    type="text"
                    name="search"
                    placeholder="Search by name, native name, ISO, currency, phone code"
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
                    value={statusOptions.find(
                      (opt) => opt.value === filters.status,
                    )}
                    onChange={(opt) => handleSelectFilterChange("status", opt)}
                    isClearable
                  />
                </FormGroup>
              </Col>
              <Col md={1} className="d-flex align-items-end mb-3">
                <Button
                  color="primary"
                  onClick={fetchCountries}
                  disabled={loading}
                >
                  <i className="ri-refresh-line" />
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Countries List</h5>
            <Button color="primary" onClick={handleCreate}>
              <i className="ri-add-line me-1" /> Add Country
            </Button>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Loader />
            ) : (
              <DataTable
                columns={columns}
                data={filteredCountries}
                pagination
                highlightOnHover
                responsive
                noDataComponent="No countries found"
              />
            )}
          </CardBody>
        </Card>
      </Container>

      <Modal isOpen={modal} toggle={() => setModal(false)} size="xl">
        <ModalHeader toggle={() => setModal(false)}>
          {isEdit ? "Edit Country" : "Add New Country"}
        </ModalHeader>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            validation.handleSubmit();
          }}
        >
          <ModalBody>
            <Row>
              <Col md={3}>
                <FormGroup>
                  <Label>
                    ISO Code 3166 <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="iso_code_3166"
                    value={validation.values.iso_code_3166}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.iso_code_3166 &&
                      !!validation.errors.iso_code_3166
                    }
                  />
                  <FormFeedback>{validation.errors.iso_code_3166}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup>
                  <Label>
                    ISO Code 3166-3 <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="iso_code_3166_3"
                    value={validation.values.iso_code_3166_3}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.iso_code_3166_3 &&
                      !!validation.errors.iso_code_3166_3
                    }
                  />
                  <FormFeedback>
                    {validation.errors.iso_code_3166_3}
                  </FormFeedback>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>
                    Country Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="name"
                    value={validation.values.name}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.name && !!validation.errors.name
                    }
                  />
                  <FormFeedback>{validation.errors.name}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>
                    Native Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="native_name"
                    value={validation.values.native_name}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.native_name &&
                      !!validation.errors.native_name
                    }
                  />
                  <FormFeedback>{validation.errors.native_name}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup>
                  <Label>
                    Phone Code <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="phone_code"
                    value={validation.values.phone_code}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.phone_code &&
                      !!validation.errors.phone_code
                    }
                  />
                  <FormFeedback>{validation.errors.phone_code}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup>
                  <Label>
                    Phone Number Length <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="number"
                    name="phone_number_length"
                    min="1"
                    value={validation.values.phone_number_length}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.phone_number_length &&
                      !!validation.errors.phone_number_length
                    }
                  />
                  <FormFeedback>
                    {validation.errors.phone_number_length}
                  </FormFeedback>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={3}>
                <FormGroup>
                  <Label>
                    Currency Code <span className="text-danger">*</span>
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
                  />
                  <FormFeedback>{validation.errors.currency_code}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup>
                  <Label>
                    Currency Symbol <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="currency_symbol"
                    value={validation.values.currency_symbol}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.currency_symbol &&
                      !!validation.errors.currency_symbol
                    }
                  />
                  <FormFeedback>
                    {validation.errors.currency_symbol}
                  </FormFeedback>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>
                    Currency Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="currency_name"
                    value={validation.values.currency_name}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.currency_name &&
                      !!validation.errors.currency_name
                    }
                  />
                  <FormFeedback>{validation.errors.currency_name}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>
                    Default Timezone <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="default_timezone"
                    value={validation.values.default_timezone}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.default_timezone &&
                      !!validation.errors.default_timezone
                    }
                  />
                  <FormFeedback>
                    {validation.errors.default_timezone}
                  </FormFeedback>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>
                    Supported Timezones (comma separated){" "}
                    <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="supported_timezones"
                    value={validation.values.supported_timezones}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.supported_timezones &&
                      !!validation.errors.supported_timezones
                    }
                  />
                  <FormFeedback>
                    {validation.errors.supported_timezones}
                  </FormFeedback>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <FormGroup>
                  <Label>
                    Default Language <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="default_language"
                    value={validation.values.default_language}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.default_language &&
                      !!validation.errors.default_language
                    }
                  />
                  <FormFeedback>
                    {validation.errors.default_language}
                  </FormFeedback>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label>
                    Supported Languages (comma separated){" "}
                    <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="supported_languages"
                    value={validation.values.supported_languages}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.supported_languages &&
                      !!validation.errors.supported_languages
                    }
                  />
                  <FormFeedback>
                    {validation.errors.supported_languages}
                  </FormFeedback>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label>
                    Postal Code Format <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="postal_code_format"
                    value={validation.values.postal_code_format}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.postal_code_format &&
                      !!validation.errors.postal_code_format
                    }
                  />
                  <FormFeedback>
                    {validation.errors.postal_code_format}
                  </FormFeedback>
                </FormGroup>
              </Col>
            </Row>

            <FormGroup check className="mt-2">
              <Input
                type="checkbox"
                name="is_active"
                id="is_active"
                checked={validation.values.is_active}
                onChange={validation.handleChange}
              />
              <Label for="is_active" check>
                Active Country
              </Label>
            </FormGroup>
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

      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteCountry}
        onCloseClick={() => setDeleteModal(false)}
      />

      <ToastContainer />
    </div>
  );
};

export default Country;
