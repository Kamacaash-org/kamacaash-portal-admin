import React, { useState, useEffect, useCallback } from 'react';
import DataTable from "react-data-table-component";
import Select from "react-select";
import {
    Card, CardHeader, CardBody,
    Col, Container, Row,
    Form, Input, Label, FormGroup,
    Modal, ModalBody, ModalFooter, ModalHeader,
    Button, Badge, FormFeedback
} from "reactstrap";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';

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
    document.title = "Surplus Categories | Test Web";

    const dispatch = useDispatch();

    const selectCategoriesData = createSelector(
        (state) => state.BusinessManagement,
        (categoriesData) => categoriesData.categoriesData
    );

    const categoriesData = useSelector(selectCategoriesData);
    const [categoriesList, setCategoriesList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        status: ''
    });

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        icon: "",
        sortOrder: 0,
        isActive: true
    });

    // Options for selects
    const statusOptions = [
        { value: "", label: "All Statuses" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" }
    ];

    // Fetch categories with filters
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

    // Update categories list when data changes
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        setCategoriesList(categoriesData?.categories || []);
    }, [categoriesData]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Handle select filter changes
    const handleSelectFilterChange = (name, selectedOption) => {
        setFilters(prev => ({
            ...prev,
            [name]: selectedOption?.value || ""
        }));
    };

    // Filter categories based on filters
    const filteredCategories = categoriesList.filter(category => {
        return (
            (filters.search === '' ||
                category.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                category.description.toLowerCase().includes(filters.search.toLowerCase())) &&
            (filters.status === '' ||
                (filters.status === 'Active' ? category.isActive : !category.isActive))
        );
    });

    // Open modal for edit
    const handleEdit = (category) => {
        setSelectedCategory(category);
        setFormData({
            name: category.name || "",
            description: category.description || "",
            icon: category.icon || "",
            sortOrder: category.sortOrder || 0,
            isActive: category.isActive || true
        });
        setIsEdit(true);
        setModal(true);
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedCategory(null);
        setFormData({
            name: "",
            description: "",
            icon: "",
            sortOrder: 0,
            isActive: true
        });
        setIsEdit(false);
        setModal(true);
    };

    // Delete Category
    const onClickDelete = (category) => {
        setSelectedCategory(category);
        setDeleteModal(true);
    };

    const handleDeleteCategory = () => {
        if (selectedCategory) {
            dispatch(onDeleteCategory(selectedCategory._id));
            setDeleteModal(false);
        }
    };

    // Form validation
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            sortOrder: formData.sortOrder,
            isActive: formData.isActive
        },
        validationSchema: Yup.object({
            name: Yup.string()
                .required("Category name is required")
                .trim(),
            description: Yup.string()
                .trim(),
            icon: Yup.string()
                .trim(),
            sortOrder: Yup.number()
                .min(0, "Sort order must be a positive number")
                .required("Sort order is required"),
            isActive: Yup.boolean()
        }),
        onSubmit: (values) => {
            if (isEdit) {
                const updateCategoryData = {
                    _id: selectedCategory ? selectedCategory._id : 0,
                    ...values
                };
                dispatch(onUpdateCategory(updateCategoryData));
            } else {
                const newCategoryData = {
                    ...values
                };
                dispatch(onAddNewCategory(newCategoryData));
            }
            setModal(false);
        },
    });

    // Table columns
    const columns = [
        {
            name: '#',
            cell: (row, index) => index + 1,

        },
        {
            name: 'Name',
            selector: row => row.name,

        },
        {
            name: 'Description',
            selector: row => row.description || '-',

            wrap: true
        },
        {
            name: 'Icon',
            cell: row => row.icon ? (
                <i className={row.icon} style={{ fontSize: '20px' }}></i>
            ) : '-'
        },
        {
            name: 'Sort Order',
            selector: row => row.sortOrder,
        },
        {
            name: 'Status',
            cell: row => (
                <Badge color={row.isActive ? 'success' : 'danger'}>
                    {row.isActive ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            name: 'Actions',
            cell: row => (
                <div className="d-flex gap-2">
                    <Button color="soft-primary" size="sm" onClick={() => handleEdit(row)}>
                        <i className="ri-pencil-line" />
                    </Button>
                    <Button color="soft-danger" size="sm" onClick={() => onClickDelete(row)}>
                        <i className="ri-delete-bin-line" />
                    </Button>
                </div>
            ),
        }
    ];

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Surplus Categories" pageTitle="Surplus Management" />

                {/* Filter Controls */}
                <Card className="mb-3">
                    <CardBody>
                        <Row>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Search</Label>
                                    <Input
                                        type="text"
                                        name="search"
                                        placeholder="Search by name or description"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Status</Label>
                                    <Select
                                        options={statusOptions}
                                        value={statusOptions.find(opt => opt.value === filters.status)}
                                        onChange={(opt) => handleSelectFilterChange('status', opt)}
                                        isClearable
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={2} className="d-flex align-items-end mb-3">
                                <Button color="primary" onClick={fetchCategories} disabled={loading}>
                                    {loading ? 'Filtering...' : 'Apply Filters'}
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Data Table */}
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
                                noDataComponent="No categories found matching your criteria"
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Add/Edit Modal */}
            <Modal isOpen={modal} toggle={() => setModal(false)} size="lg">
                <ModalHeader toggle={() => setModal(false)}>
                    {isEdit ? 'Edit Category' : 'Add New Category'}
                </ModalHeader>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    validation.handleSubmit();
                }}>
                    <ModalBody>
                        <Row>
                            <Col lg={12}>
                                <Row>
                                    <Col md={8}>
                                        <FormGroup>
                                            <Label>Category Name <span className="text-danger">*</span></Label>
                                            <Input
                                                name="name"
                                                value={validation.values.name}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.name && !!validation.errors.name}
                                            />
                                            <FormFeedback>{validation.errors.name}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Sort Order <span className="text-danger">*</span></Label>
                                            <Input
                                                type="number"
                                                name="sortOrder"
                                                min="0"
                                                value={validation.values.sortOrder}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.sortOrder && !!validation.errors.sortOrder}
                                            />
                                            <FormFeedback>{validation.errors.sortOrder}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <FormGroup>
                                    <Label>Description</Label>
                                    <Input
                                        type="textarea"
                                        name="description"
                                        rows="3"
                                        value={validation.values.description}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        invalid={validation.touched.description && !!validation.errors.description}
                                    />
                                    <FormFeedback>{validation.errors.description}</FormFeedback>
                                </FormGroup>

                                <FormGroup>
                                    <Label>Icon Class (e.g., ri-restaurant-line)</Label>
                                    <Input
                                        name="icon"
                                        placeholder="Enter icon class name"
                                        value={validation.values.icon}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        invalid={validation.touched.icon && !!validation.errors.icon}
                                    />
                                    <small className="form-text text-muted">
                                        Use Remix Icon classes (e.g., ri-restaurant-line, ri-fruit-bowl-line)
                                    </small>
                                    <FormFeedback>{validation.errors.icon}</FormFeedback>
                                </FormGroup>

                                {validation.values.icon && (
                                    <div className="mb-3">
                                        <Label>Icon Preview:</Label>
                                        <div className="mt-1">
                                            <i className={validation.values.icon} style={{ fontSize: '24px' }}></i>
                                        </div>
                                    </div>
                                )}

                                <FormGroup check className="mt-3">
                                    <Input
                                        type="checkbox"
                                        name="isActive"
                                        checked={validation.values.isActive}
                                        onChange={validation.handleChange}
                                        id="isActive"
                                    />
                                    <Label for="isActive" check>
                                        Active Category
                                    </Label>
                                </FormGroup>
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="light" onClick={() => setModal(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteModal
                show={deleteModal}
                onDeleteClick={handleDeleteCategory}
                onCloseClick={() => setDeleteModal(false)}
                confirmationText="Are you sure you want to delete this category? This action cannot be undone."
            />

            <ToastContainer />
        </div>
    );
};

export default SurplusCategories;