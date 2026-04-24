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
  Row,
} from "reactstrap";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createSelector } from "reselect";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import NoDataFound from "../../../Components/Common/NoDataFound";
import {
  addCity as onAddCity,
  deleteCity as onDeleteCity,
  getCities as onGetCities,
  getCountries as onGetCountries,
  updateCity as onUpdateCity,
} from "../../../slices/thunks";

const Cities = () => {
  document.title = "Cities | Kamacaash";

  const dispatch = useDispatch();

  const selectSettingsData = createSelector(
    (state) => state.Settings,
    (settings) => ({
      citiesData: settings.citiesData,
      countriesData: settings.countriesData,
    }),
  );

  const { citiesData, countriesData } = useSelector(selectSettingsData);

  const [citiesList, setCitiesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  const statusOptions = [
    { value: "", label: "All" },
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ];

  const resolveEntityId = (item) => item?.id || item?._id || item?.uuid;

  const normalizeCities = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.cities)) return payload.cities;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const normalizeCountries = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.countries)) return payload.countries;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const getCountryIdFromCity = (city) =>
    city?.country_id ||
    city?.country?.id ||
    city?.country?._id ||
    city?.country?.uuid ||
    "";

  const getCountryLabelFromCity = (city) =>
    city?.country?.name || city?.country_name || "-";

  const countryOptions = useMemo(
    () =>
      normalizeCountries(countriesData)
        .map((country) => ({
          value: resolveEntityId(country),
          label: country?.name || country?.native_name || "Unnamed Country",
        }))
        .filter((option) => option.value),
    [countriesData],
  );

  const fetchCities = useCallback(async () => {
    setLoading(true);
    try {
      await dispatch(onGetCities());
    } catch (error) {
      console.error("Error loading cities:", error);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const fetchCountries = useCallback(async () => {
    try {
      await dispatch(onGetCountries());
    } catch (error) {
      console.error("Error loading countries:", error);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchCities();
    fetchCountries();
  }, [fetchCities, fetchCountries]);

  useEffect(() => {
    setCitiesList(normalizeCities(citiesData));
  }, [citiesData]);

  const filteredCities = citiesList.filter((city) => {
    const searchTerm = filters.search.toLowerCase();

    return (
      (filters.search === "" ||
        city?.name?.toLowerCase().includes(searchTerm) ||
        city?.native_name?.toLowerCase().includes(searchTerm) ||
        city?.timezone?.toLowerCase().includes(searchTerm) ||
        getCountryLabelFromCity(city)?.toLowerCase().includes(searchTerm)) &&
      (filters.status === "" ||
        (filters.status === "Active" ? city?.is_active : !city?.is_active))
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
    setSelectedCity(null);
    setIsEdit(false);
    setModal(true);
  };

  const handleEdit = (city) => {
    setSelectedCity(city);
    setIsEdit(true);
    setModal(true);
  };

  const onClickDelete = (city) => {
    setSelectedCity(city);
    setDeleteModal(true);
  };

  const handleDeleteCity = async () => {
    const id = resolveEntityId(selectedCity);
    if (!id) return;

    await dispatch(onDeleteCity(id));
    setDeleteModal(false);
    setSelectedCity(null);
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: selectedCity?.name || "",
      native_name: selectedCity?.native_name || "",
      country_id: getCountryIdFromCity(selectedCity),
      latitude: selectedCity?.location?.latitude ?? "",
      longitude: selectedCity?.location?.longitude ?? "",
      timezone: selectedCity?.timezone || "",
      is_active: selectedCity?.is_active ?? true,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("City name is required").trim(),
      native_name: Yup.string().required("Native name is required").trim(),
      country_id: Yup.string().required("Country is required").trim(),
      latitude: Yup.number()
        .typeError("Latitude must be a number")
        .required("Latitude is required")
        .min(-90, "Latitude must be between -90 and 90")
        .max(90, "Latitude must be between -90 and 90"),
      longitude: Yup.number()
        .typeError("Longitude must be a number")
        .required("Longitude is required")
        .min(-180, "Longitude must be between -180 and 180")
        .max(180, "Longitude must be between -180 and 180"),
      timezone: Yup.string().required("Timezone is required").trim(),
      is_active: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      setIsSubmitting(true);

      const payload = {
        name: values.name,
        native_name: values.native_name,
        country_id: values.country_id,
        location: {
          latitude: Number(values.latitude),
          longitude: Number(values.longitude),
        },
        timezone: values.timezone,
        is_active: values.is_active,
      };

      try {
        if (isEdit) {
          const id = resolveEntityId(selectedCity);
          if (!id) return;

          await dispatch(
            onUpdateCity({
              id,
              ...payload,
            }),
          );
        } else {
          await dispatch(onAddCity(payload));
        }

        setModal(false);
        setSelectedCity(null);
        validation.resetForm();
      } catch (error) {
        console.error("City save error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const columns = [
    {
      name: "#",
      cell: (row, index) => index + 1,
      width: "70px",
    },
    {
      name: "Name",
      selector: (row) => row.name,
      wrap: true,
    },
    {
      name: "Native Name",
      selector: (row) => row.native_name || "-",
      wrap: true,
    },
    {
      name: "Country",
      selector: (row) => getCountryLabelFromCity(row),
      wrap: true,
    },
    {
      name: "Timezone",
      selector: (row) => row.timezone || "-",
      wrap: true,
    },
    {
      name: "Coordinates",
      cell: (row) =>
        row?.location?.latitude !== undefined &&
        row?.location?.longitude !== undefined
          ? `${row.location.latitude}, ${row.location.longitude}`
          : "-",
      wrap: true,
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
          <Button color="soft-primary" size="sm" onClick={() => handleEdit(row)}>
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
        <BreadCrumb title="Cities" pageTitle="Settings" />

        <Card className="mb-3">
          <CardBody>
            <Row>
              <Col md={8}>
                <FormGroup>
                  <Label>Search</Label>
                  <Input
                    type="text"
                    name="search"
                    placeholder="Search by city name, native name, country, timezone"
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
                      (option) => option.value === filters.status,
                    )}
                    onChange={(option) =>
                      handleSelectFilterChange("status", option)
                    }
                    isClearable
                    placeholder="Select status"
                  />
                </FormGroup>
              </Col>
              <Col md={1} className="d-flex align-items-end mb-3">
                <Button color="primary" onClick={fetchCities} disabled={loading}>
                  <i className="ri-refresh-line" />
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Cities List</h5>
            <Button color="primary" onClick={handleCreate}>
              <i className="ri-add-line me-1" /> Add City
            </Button>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Loader />
            ) : (
              <DataTable
                columns={columns}
                data={filteredCities}
                pagination
                highlightOnHover
                responsive
                noDataComponent={<NoDataFound message="No cities found" />}
              />
            )}
          </CardBody>
        </Card>
      </Container>

      <Modal isOpen={modal} toggle={() => setModal(false)} size="lg">
        <ModalHeader toggle={() => setModal(false)}>
          {isEdit ? "Edit City" : "Add New City"}
        </ModalHeader>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            validation.handleSubmit();
          }}
        >
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>
                    City Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="name"
                    placeholder="Mogadishu"
                    value={validation.values.name}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={validation.touched.name && !!validation.errors.name}
                  />
                  <FormFeedback>{validation.errors.name}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>
                    Native Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="native_name"
                    placeholder="Muqdisho"
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
            </Row>

            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label>
                    Country <span className="text-danger">*</span>
                  </Label>
                  <Select
                    options={countryOptions}
                    value={
                      countryOptions.find(
                        (option) => option.value === validation.values.country_id,
                      ) || null
                    }
                    onChange={(option) =>
                      validation.setFieldValue("country_id", option?.value || "")
                    }
                    onBlur={() => validation.setFieldTouched("country_id", true)}
                    placeholder="Select country"
                  />
                  {validation.touched.country_id && validation.errors.country_id ? (
                    <div className="text-danger mt-1 small">
                      {validation.errors.country_id}
                    </div>
                  ) : null}
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>
                    Latitude <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    name="latitude"
                    placeholder="2.0469"
                    value={validation.values.latitude}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.latitude && !!validation.errors.latitude
                    }
                  />
                  <FormFeedback>{validation.errors.latitude}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>
                    Longitude <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    name="longitude"
                    placeholder="45.3182"
                    value={validation.values.longitude}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.longitude && !!validation.errors.longitude
                    }
                  />
                  <FormFeedback>{validation.errors.longitude}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label>
                    Timezone <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="timezone"
                    placeholder="Africa/Mogadishu"
                    value={validation.values.timezone}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.timezone && !!validation.errors.timezone
                    }
                  />
                  <FormFeedback>{validation.errors.timezone}</FormFeedback>
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
                Active City
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
        onDeleteClick={handleDeleteCity}
        onCloseClick={() => setDeleteModal(false)}
      />

      <ToastContainer />
    </div>
  );
};

export default Cities;
