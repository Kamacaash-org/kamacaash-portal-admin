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

//redux
import {
  getCategories as onGetCategoriesData,
  addCategory as onAddNewCategory,
  updateCategory as onUpdateCategory,
  deleteCategory as onDeleteCategory,
} from "../../../slices/thunks";

// Formik
import * as Yup from "yup";
import { useFormik } from "formik";

const SurplusCategories = () => {
  document.title = "Categories | Kamacaash";

  const dispatch = useDispatch();

  const selectCategoriesData = createSelector(
    (state) => state.BusinessManagement,
    (categoriesData) => categoriesData.categoriesData,
  );

  const categoriesData = useSelector(selectCategoriesData);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [iconFile, setIconFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [iconPreview, setIconPreview] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  const statusOptions = [
    { value: "", label: "All" },
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ];

  const resolveCategoryId = (category) => category?.id || category?._id;

  const normalizeCategories = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.categories)) return payload.categories;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      await dispatch(onGetCategoriesData());
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    setCategoriesList(normalizeCategories(categoriesData));
  }, [categoriesData]);

  const filteredCategories = categoriesList.filter((category) => {
    const searchTerm = filters.search.toLowerCase();
    return (
      (filters.search === "" ||
        category?.name?.toLowerCase().includes(searchTerm) ||
        category?.slug?.toLowerCase().includes(searchTerm) ||
        category?.description?.toLowerCase().includes(searchTerm)) &&
      (filters.status === "" ||
        (filters.status === "Active"
          ? category?.is_active
          : !category?.is_active))
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
    setSelectedCategory(null);
    setIsEdit(false);
    setIconFile(null);
    setImageFile(null);
    setIconPreview("");
    setImagePreview("");
    setModal(true);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setIsEdit(true);
    setIconFile(null);
    setImageFile(null);
    setIconPreview(category?.icon_url || "");
    setImagePreview(category?.image_url || "");
    setModal(true);
  };

  const handleFileChange = (event, type) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === "icon") {
      setIconFile(file);
      setIconPreview(URL.createObjectURL(file));
      validation.setFieldValue("icon_url", "");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    validation.setFieldValue("image_url", "");
  };

  const onClickDelete = (category) => {
    setSelectedCategory(category);
    setDeleteModal(true);
  };

  const handleDeleteCategory = async () => {
    const id = resolveCategoryId(selectedCategory);
    if (!id) return;

    await dispatch(onDeleteCategory(id));
    setDeleteModal(false);
    setSelectedCategory(null);
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: selectedCategory?.name || "",
      slug: selectedCategory?.slug || "",
      description: selectedCategory?.description || "",
      icon_url: selectedCategory?.icon_url || "",
      image_url: selectedCategory?.image_url || "",
      parent_id: selectedCategory?.parent_id || "",
      sort_order: selectedCategory?.sort_order ?? 0,
      is_active: selectedCategory?.is_active ?? true,
      is_featured: selectedCategory?.is_featured ?? false,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Category name is required").trim(),
      slug: Yup.string().required("Slug is required").trim(),
      description: Yup.string().trim(),
      icon_url: Yup.string().nullable().notRequired(),
      image_url: Yup.string().nullable().notRequired(),
      parent_id: Yup.string().trim(),
      sort_order: Yup.number()
        .required("Sort order is required")
        .integer("Must be an integer")
        .min(0, "Must be 0 or greater"),
      is_active: Yup.boolean(),
      is_featured: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("slug", values.slug);
      formData.append("description", values.description || "");
      formData.append(
        "parent_id",
        values.parent_id?.trim() ? values.parent_id.trim() : "",
      );
      formData.append("sort_order", Number(values.sort_order));
      formData.append("is_active", values.is_active);
      formData.append("is_featured", values.is_featured);

      if (iconFile) {
        formData.append("icon_url", iconFile);
      } else if (values.icon_url) {
        formData.append("icon_url", values.icon_url);
      }

      if (imageFile) {
        formData.append("image_url", imageFile);
      } else if (values.image_url) {
        formData.append("image_url", values.image_url);
      }

      try {
        if (isEdit) {
          const id = resolveCategoryId(selectedCategory);
          if (!id) return;
          await dispatch(onUpdateCategory({ id, formData }));
        } else {
          await dispatch(onAddNewCategory(formData));
        }

        setModal(false);
        setSelectedCategory(null);
        setIconFile(null);
        setImageFile(null);
        setIconPreview("");
        setImagePreview("");
        validation.resetForm();
      } catch (error) {
        console.error("Category save error:", error);
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
      name: "Slug",
      selector: (row) => row.slug,
      wrap: true,
    },
    {
      name: "Icon",
      cell: (row) =>
        row.icon_url ? (
          <img
            src={row.icon_url}
            alt={row.name || "Icon"}
            style={{
              width: "36px",
              height: "36px",
              objectFit: "cover",
              borderRadius: "6px",
            }}
          />
        ) : (
          "-"
        ),
    },
    {
      name: "Image",
      cell: (row) =>
        row.image_url ? (
          <img
            src={row.image_url}
            alt={row.name || "Image"}
            style={{
              width: "52px",
              height: "36px",
              objectFit: "cover",
              borderRadius: "6px",
            }}
          />
        ) : (
          "-"
        ),
    },
    // {
    //   name: "Parent ID",
    //   selector: (row) => row.parent_id || "-",
    //   wrap: true,
    // },
    {
      name: "Sort",
      selector: (row) => row.sort_order ?? 0,
    },
    {
      name: "Featured",
      cell: (row) => (
        <Badge color={row.is_featured ? "warning" : "secondary"}>
          {row.is_featured ? "Yes" : "No"}
        </Badge>
      ),
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
        <BreadCrumb title="Categories" pageTitle="Business" />

        <Card className="mb-3">
          <CardBody>
            <Row>
              <Col md={8}>
                <FormGroup>
                  <Label>Search</Label>
                  <Input
                    type="text"
                    name="search"
                    placeholder="Search by name, slug, description"
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
                  onClick={fetchCategories}
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
            <h5 className="mb-0">Categories List</h5>
            <Button color="primary" onClick={handleCreate}>
              <i className="ri-add-line me-1" /> Add Category
            </Button>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Loader />
            ) : (
              <DataTable
                columns={columns}
                data={filteredCategories}
                pagination
                highlightOnHover
                responsive
                noDataComponent="No categories found"
              />
            )}
          </CardBody>
        </Card>
      </Container>

      <Modal isOpen={modal} toggle={() => setModal(false)} size="lg">
        <ModalHeader toggle={() => setModal(false)}>
          {isEdit ? "Edit Category" : "Add New Category"}
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
                    Name <span className="text-danger">*</span>
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
              <Col md={6}>
                <FormGroup>
                  <Label>
                    Slug <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="slug"
                    value={validation.values.slug}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.slug && !!validation.errors.slug
                    }
                  />
                  <FormFeedback>{validation.errors.slug}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label>Description</Label>
                  <Input
                    type="textarea"
                    rows="3"
                    name="description"
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
            </Row>

            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>Icon Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "icon")}
                  />
                  {(iconPreview || validation.values.icon_url) && (
                    <img
                      src={iconPreview || validation.values.icon_url}
                      alt="Icon preview"
                      style={{
                        marginTop: "8px",
                        width: "72px",
                        height: "72px",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Category Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "image")}
                  />
                  {(imagePreview || validation.values.image_url) && (
                    <img
                      src={imagePreview || validation.values.image_url}
                      alt="Category preview"
                      style={{
                        marginTop: "8px",
                        width: "140px",
                        height: "72px",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  )}
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={6} style={{ display: "none" }}>
                <FormGroup>
                  <Label>Parent ID</Label>
                  <Input
                    name="parent_id"
                    value={validation.values.parent_id}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.parent_id &&
                      !!validation.errors.parent_id
                    }
                  />
                  <FormFeedback>{validation.errors.parent_id}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>
                    Sort Order <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    name="sort_order"
                    value={validation.values.sort_order}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.sort_order &&
                      !!validation.errors.sort_order
                    }
                  />
                  <FormFeedback>{validation.errors.sort_order}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <FormGroup check>
                  <Input
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    checked={validation.values.is_active}
                    onChange={validation.handleChange}
                  />
                  <Label for="is_active" check>
                    Active Category
                  </Label>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup check>
                  <Input
                    type="checkbox"
                    name="is_featured"
                    id="is_featured"
                    checked={validation.values.is_featured}
                    onChange={validation.handleChange}
                  />
                  <Label for="is_featured" check>
                    Featured Category
                  </Label>
                </FormGroup>
              </Col>
            </Row>
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
        onDeleteClick={handleDeleteCategory}
        onCloseClick={() => setDeleteModal(false)}
      />

      <ToastContainer />
    </div>
  );
};

export default SurplusCategories;
