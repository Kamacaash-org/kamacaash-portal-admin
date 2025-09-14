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
    getSurplusPackages as onGetSurplusPackagesData,
    addSurplusPackage as onAddNewSurplusPackage,
    updateSurplusPackage as onUpdateSurplusPackage,
    deleteSurplusPackage as onDeleteSurplusPackage,
    activateSurplusPackage as onActivateSurplusPackage,
    getBusinessesData as onGetBusinessesData,
    getSurplusCategories as onGetCategoriesData
} from "../../../slices/thunks";

// Formik
import * as Yup from "yup";
import { useFormik } from "formik";

const SurplusPackages = () => {
    document.title = "Surplus Packages | Test 001";

    const dispatch = useDispatch();

    const selectPackagesData = createSelector(
        (state) => state.Surplus,
        (packagesData) => packagesData.packagesData
    );

    const selectBusinessesData = createSelector(
        (state) => state.BusinessManagement,
        (businessesData) => businessesData.businessesData
    );

    const selectCategoriesData = createSelector(
        (state) => state.Surplus,
        (categoriesData) => categoriesData.categoriesData
    );

    const packagesData = useSelector(selectPackagesData);
    const businessesData = useSelector(selectBusinessesData);
    const categoriesData = useSelector(selectCategoriesData);
    const [packagesList, setPackagesList] = useState([]);
    const [businessesList, setBusinessesList] = useState([]);
    const [categoriesList, setCategoriesList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        businessId: '',
        categoryId: ''
    });

    // Form state
    const [formData, setFormData] = useState({
        businessId: "",
        categoryId: "",
        title: "",
        description: "",
        items: [""],
        originalPrice: 0,
        offerPrice: 0,
        quantityAvailable: 0,
        pickupStart: "",
        pickupEnd: "",
        isActive: true
    });

    // Options for selects
    const statusOptions = [
        { value: "", label: "All Statuses" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" }
    ];

    // Fetch packages with filters
    const fetchPackages = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetSurplusPackagesData());
        } catch (error) {
            console.error("Error loading packages:", error);
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    // Fetch businesses and categories
    const fetchBusinessesAndCategories = useCallback(async () => {
        try {
            await Promise.all([
                dispatch(onGetBusinessesData()),
                dispatch(onGetCategoriesData())
            ]);
        } catch (error) {
            console.error("Error loading data:", error);
        }
    }, [dispatch]);

    // Update data when changes
    useEffect(() => {
        fetchPackages();
        fetchBusinessesAndCategories();
    }, [fetchPackages, fetchBusinessesAndCategories]);

    useEffect(() => {
        setPackagesList(packagesData?.packages || []);
    }, [packagesData]);

    useEffect(() => {
        setBusinessesList(businessesData?.businesses || []);
    }, [businessesData]);

    useEffect(() => {
        setCategoriesList(categoriesData?.categories || []);
    }, [categoriesData]);

    // Prepare business options for dropdown
    const businessOptions = businessesList
        .filter(business => business.isActive)
        .map(business => ({
            value: business._id,
            label: business.businessName
        }));

    // Prepare category options for dropdown
    const categoryOptions = categoriesList
        .filter(category => category.isActive)
        .map(category => ({
            value: category._id,
            label: category.name
        }));

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle array input changes (items)
    const handleItemChange = (index, value) => {
        const newItems = [...formData.items];
        newItems[index] = value;
        setFormData(prev => ({
            ...prev,
            items: newItems
        }));
    };

    // Add new item field
    const addItemField = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, ""]
        }));
    };

    // Remove item field
    const removeItemField = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({
            ...prev,
            items: newItems
        }));
    };

    // Handle select changes
    const handleSelectChange = (name, selectedOption) => {
        setFormData(prev => ({
            ...prev,
            [name]: selectedOption?.value || ""
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

    // Filter packages based on filters
    const filteredPackages = packagesList.filter(pkg => {
        return (
            (filters.search === '' ||
                pkg.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                pkg.description?.toLowerCase().includes(filters.search.toLowerCase())) &&
            (filters.status === '' ||
                (filters.status === 'Active' ? pkg.isActive : !pkg.isActive)) &&
            (filters.businessId === '' || pkg.businessId === filters.businessId) &&
            (filters.categoryId === '' || pkg.categoryId === filters.categoryId)
        );
    });

    // Open modal for edit
    const handleEdit = (pkg) => {
        setSelectedPackage(pkg);
        setFormData({
            businessId: pkg.businessId || "",
            categoryId: pkg.categoryId || "",
            title: pkg.title || "",
            description: pkg.description || "",
            items: pkg.items && pkg.items.length > 0 ? pkg.items : [""],
            originalPrice: pkg.originalPrice || 0,
            offerPrice: pkg.offerPrice || 0,
            quantityAvailable: pkg.quantityAvailable || 0,
            pickupStart: pkg.pickupStart ? new Date(pkg.pickupStart).toISOString().split('T')[0] : "",
            pickupEnd: pkg.pickupEnd ? new Date(pkg.pickupEnd).toISOString().split('T')[0] : "",
            isActive: pkg.isActive || true
        });
        setIsEdit(true);
        setModal(true);
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedPackage(null);
        setFormData({
            businessId: "",
            categoryId: "",
            title: "",
            description: "",
            items: [""],
            originalPrice: 0,
            offerPrice: 0,
            quantityAvailable: 0,
            pickupStart: "",
            pickupEnd: "",
            isActive: true
        });
        setIsEdit(false);
        setModal(true);
    };

    // Delete Package
    const onClickDelete = (pkg) => {
        setSelectedPackage(pkg);
        setDeleteModal(true);
    };

    const handleDeletePackage = () => {
        if (selectedPackage) {
            dispatch(onDeleteSurplusPackage(selectedPackage._id));
            setDeleteModal(false);
        }
    };

    // Activate Package
    const handleActivatePackage = (pkg) => {
        dispatch(onActivateSurplusPackage(pkg._id));
    };

    // Form validation
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            businessId: formData.businessId,
            categoryId: formData.categoryId,
            title: formData.title,
            description: formData.description,
            items: formData.items,
            originalPrice: formData.originalPrice,
            offerPrice: formData.offerPrice,
            quantityAvailable: formData.quantityAvailable,
            pickupStart: formData.pickupStart,
            pickupEnd: formData.pickupEnd,
            isActive: formData.isActive
        },
        validationSchema: Yup.object({
            businessId: Yup.string().required("Business is required"),
            categoryId: Yup.string().required("Category is required"),
            title: Yup.string().required("Title is required").trim(),
            description: Yup.string().trim(),
            items: Yup.array().of(Yup.string().trim()),
            originalPrice: Yup.number()
                .required("Original price is required")
                .min(0, "Price must be positive"),
            offerPrice: Yup.number()
                .required("Offer price is required")
                .min(0, "Price must be positive")
                .test('offer-less-than-original', 'Offer price must be less than original price', function (value) {
                    const { originalPrice } = this.parent;
                    return value <= originalPrice;
                }),
            quantityAvailable: Yup.number()
                .required("Quantity is required")
                .min(0, "Quantity must be positive"),
            pickupStart: Yup.date()
                .required("Pickup start date is required")
                .min(new Date(), "Pickup start must be in the future"),
            pickupEnd: Yup.date()
                .required("Pickup end date is required")
                .min(Yup.ref('pickupStart'), "Pickup end must be after pickup start"),
            isActive: Yup.boolean()
        }),
        onSubmit: (values) => {
            if (isEdit) {
                const updatePackageData = {
                    id: selectedPackage ? selectedPackage._id : 0,
                    ...values
                };
                dispatch(onUpdateSurplusPackage(updatePackageData));
            } else {
                const newPackageData = {
                    ...values
                };
                dispatch(onAddNewSurplusPackage(newPackageData));
            }
            setModal(false);
        },
    });

    // Table columns
    const columns = [
        {
            name: '#',
            cell: (row, index) => index + 1,
            width: '60px'
        },
        {
            name: 'Title',
            selector: row => row.title,
            sortable: true,
            wrap: true
        },
        {
            name: 'Business',
            selector: row => row.businessId?.businessName || 'N/A',
            sortable: true
        },
        {
            name: 'Category',
            selector: row => row.categoryId?.name || 'N/A',
            sortable: true
        },
        {
            name: 'Price',
            cell: row => (
                <div>
                    <span className="text-decoration-line-through text-muted me-2">
                        ${row.originalPrice}
                    </span>
                    <span className="text-success fw-bold">
                        ${row.offerPrice}
                    </span>
                </div>
            ),
            sortable: true
        },
        {
            name: 'Quantity',
            selector: row => row.quantityAvailable,
            sortable: true,
            width: '100px'
        },
        {
            name: 'Pickup Date',
            cell: row => (
                <div>
                    {new Date(row.pickupStart).toLocaleDateString()} - {new Date(row.pickupEnd).toLocaleDateString()}
                </div>
            ),
            sortable: true
        },
        {
            name: 'Status',
            cell: row => (
                <Badge color={row.isActive ? 'success' : 'danger'}>
                    {row.isActive ? 'Active' : 'Inactive'}
                </Badge>
            ),
            sortable: true,
            width: '100px'
        },
        {
            name: 'Actions',
            cell: row => (
                <div className="d-flex gap-2">
                    <Button color="soft-primary" size="sm" onClick={() => handleEdit(row)}>
                        <i className="ri-pencil-line" />
                    </Button>
                    {row.isActive ? (
                        <Button color="soft-warning" size="sm" onClick={() => handleActivatePackage(row)}>
                            <i className="ri-close-circle-line" />
                        </Button>
                    ) : (
                        <Button color="soft-success" size="sm" onClick={() => handleActivatePackage(row)}>
                            <i className="ri-checkbox-circle-line" />
                        </Button>
                    )}
                    <Button color="soft-danger" size="sm" onClick={() => onClickDelete(row)}>
                        <i className="ri-delete-bin-line" />
                    </Button>
                </div>
            ),
            width: '180px'
        }
    ];

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Surplus Packages" pageTitle="Food Surplus" />

                {/* Filter Controls */}
                <Card className="mb-3">
                    <CardBody>
                        <Row>
                            <Col md={3}>
                                <FormGroup>
                                    <Label>Search</Label>
                                    <Input
                                        type="text"
                                        name="search"
                                        placeholder="Search by title or description"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={2}>
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
                            <Col md={3}>
                                <FormGroup>
                                    <Label>Business</Label>
                                    <Select
                                        options={businessOptions}
                                        value={businessOptions.find(opt => opt.value === filters.businessId)}
                                        onChange={(opt) => handleSelectFilterChange('businessId', opt)}
                                        isClearable
                                        placeholder="Filter by business"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={2}>
                                <FormGroup>
                                    <Label>Category</Label>
                                    <Select
                                        options={categoryOptions}
                                        value={categoryOptions.find(opt => opt.value === filters.categoryId)}
                                        onChange={(opt) => handleSelectFilterChange('categoryId', opt)}
                                        isClearable
                                        placeholder="Filter by category"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={2} className="d-flex align-items-end mb-3">
                                <Button color="primary" onClick={fetchPackages} disabled={loading}>
                                    {loading ? 'Filtering...' : 'Apply Filters'}
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Data Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Surplus Packages List</h5>
                        <Button color="primary" onClick={handleCreate}>
                            <i className="ri-add-line me-1" /> Add Package
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredPackages}
                                pagination
                                highlightOnHover
                                responsive
                                noDataComponent="No packages found matching your criteria"
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Add/Edit Modal */}
            <Modal isOpen={modal} toggle={() => setModal(false)} size="lg">
                <ModalHeader toggle={() => setModal(false)}>
                    {isEdit ? 'Edit Surplus Package' : 'Add New Surplus Package'}
                </ModalHeader>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    validation.handleSubmit();
                }}>
                    <ModalBody>
                        <Row>
                            <Col lg={12}>
                                <Row>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Business <span className="text-danger">*</span></Label>
                                            <Select
                                                options={businessOptions}
                                                value={businessOptions.find(opt => opt.value === validation.values.businessId)}
                                                onChange={(opt) => handleSelectChange('businessId', opt)}
                                                isClearable
                                                placeholder="Select business"
                                            />
                                            <FormFeedback>
                                                {validation.touched.businessId && validation.errors.businessId}
                                            </FormFeedback>
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Category <span className="text-danger">*</span></Label>
                                            <Select
                                                options={categoryOptions}
                                                value={categoryOptions.find(opt => opt.value === validation.values.categoryId)}
                                                onChange={(opt) => handleSelectChange('categoryId', opt)}
                                                isClearable
                                                placeholder="Select category"
                                            />
                                            <FormFeedback>
                                                {validation.touched.categoryId && validation.errors.categoryId}
                                            </FormFeedback>
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <FormGroup>
                                    <Label>Title <span className="text-danger">*</span></Label>
                                    <Input
                                        name="title"
                                        value={validation.values.title}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        invalid={validation.touched.title && !!validation.errors.title}
                                    />
                                    <FormFeedback>{validation.errors.title}</FormFeedback>
                                </FormGroup>

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
                                    <Label>Items</Label>
                                    {validation.values.items.map((item, index) => (
                                        <div key={index} className="mb-2 d-flex align-items-center">
                                            <Input
                                                value={item}
                                                onChange={(e) => handleItemChange(index, e.target.value)}
                                                placeholder={`Item ${index + 1}`}
                                            />
                                            {validation.values.items.length > 1 && (
                                                <Button
                                                    color="danger"
                                                    size="sm"
                                                    className="ms-2"
                                                    onClick={() => removeItemField(index)}
                                                >
                                                    <i className="ri-delete-bin-line" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button color="outline-primary" size="sm" onClick={addItemField}>
                                        <i className="ri-add-line me-1" /> Add Item
                                    </Button>
                                </FormGroup>

                                <Row>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Original Price ($) <span className="text-danger">*</span></Label>
                                            <Input
                                                type="number"
                                                name="originalPrice"
                                                min="0"
                                                step="0.01"
                                                value={validation.values.originalPrice}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.originalPrice && !!validation.errors.originalPrice}
                                            />
                                            <FormFeedback>{validation.errors.originalPrice}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Offer Price ($) <span className="text-danger">*</span></Label>
                                            <Input
                                                type="number"
                                                name="offerPrice"
                                                min="0"
                                                step="0.01"
                                                value={validation.values.offerPrice}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.offerPrice && !!validation.errors.offerPrice}
                                            />
                                            <FormFeedback>{validation.errors.offerPrice}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Quantity Available <span className="text-danger">*</span></Label>
                                            <Input
                                                type="number"
                                                name="quantityAvailable"
                                                min="0"
                                                value={validation.values.quantityAvailable}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.quantityAvailable && !!validation.errors.quantityAvailable}
                                            />
                                            <FormFeedback>{validation.errors.quantityAvailable}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Pickup Start <span className="text-danger">*</span></Label>
                                            <Input
                                                type="datetime-local"
                                                name="pickupStart"
                                                value={validation.values.pickupStart}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.pickupStart && !!validation.errors.pickupStart}
                                            />
                                            <FormFeedback>{validation.errors.pickupStart}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Pickup End <span className="text-danger">*</span></Label>
                                            <Input
                                                type="datetime-local"
                                                name="pickupEnd"
                                                value={validation.values.pickupEnd}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.pickupEnd && !!validation.errors.pickupEnd}
                                            />
                                            <FormFeedback>{validation.errors.pickupEnd}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <FormGroup check className="mt-3">
                                    <Input
                                        type="checkbox"
                                        name="isActive"
                                        checked={validation.values.isActive}
                                        onChange={validation.handleChange}
                                        id="isActive"
                                    />
                                    <Label for="isActive" check>
                                        Active Package
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
                onDeleteClick={handleDeletePackage}
                onCloseClick={() => setDeleteModal(false)}
                confirmationText="Are you sure you want to delete this package? This action cannot be undone."
            />

            <ToastContainer />
        </div>
    );
};

export default SurplusPackages;