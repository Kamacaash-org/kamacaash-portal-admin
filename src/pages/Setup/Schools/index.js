import React, { useState, useEffect } from 'react';
import DataTable, { createTheme } from "react-data-table-component";
import Select from "react-select";
import {
    Card, CardHeader, CardBody,
    Col, Container, Row,
    Form, Input, Label, FormGroup,
    Modal, ModalBody, ModalFooter, ModalHeader,
    Button, Badge
} from "reactstrap";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { api } from "../../../config";
import { createSelector } from 'reselect';
import { useSelector } from 'react-redux';

const Schools = () => {
    document.title = "Schools | simad University";

    const selectLayoutState = (state) => state.Layout;
    const selectLayoutProperties = createSelector(
        selectLayoutState,
        (layout) => ({
            layoutThemeType: layout.layoutThemeType,
            layoutModeType: layout.layoutModeType,
        })
    );
    // Inside your component
    const {
        layoutModeType,
        layoutThemeType,
    } = useSelector(selectLayoutProperties);

    createTheme('customDark', {
        text: {
            primary: '#ffffff',
            secondary: '#9e9e9e',
        },
        background: {
            default: '#212529',
        },
        context: {
            background: '#333',
            text: '#FFFFFF',
        },
        divider: {
            default: '#444',
        },
    }, 'dark'); // 'dark' makes it inherit dark base



    // State management
    const [schools, setSchools] = useState([]);
    const [categories, setCategories] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState(null);

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        status: ''
    });

    // Options for selects
    const statusOptions = [
        { value: "", label: "All Statuses" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" }
    ];

    // Validation schema with Yup
    const validationSchema = Yup.object().shape({
        name: Yup.string()
            .required("School name is required")
            .min(3, "School name must be at least 3 characters")
            .max(100, "School name must be less than 100 characters"),
        tagline: Yup.string()
            .max(200, "Tagline must be less than 200 characters"),
        description: Yup.string(),
        shortDescription: Yup.string()
            .max(300, "Short description must be less than 300 characters"),
        logoUrl: Yup.string(),
        // .url("Logo URL must be a valid URL"),
        coverImage: Yup.string(),
        // .url("Cover image URL must be a valid URL"),
        dean: Yup.string(),
        category: Yup.string()
            .required("Category is required"),
        contactInfo: Yup.object().shape({
            phone: Yup.string(),
            email: Yup.string()
                .email("Contact email must be a valid email"),
            location: Yup.string(),
            website: Yup.string(),
            // .url("Website must be a valid URL")
        }),
        mission: Yup.string(),
        vision: Yup.string(),
        isActive: Yup.boolean(),
        order: Yup.number()
            .min(0, "Order must be a positive number")
            .integer("Order must be an integer")
    });

    // Formik setup
    const formik = useFormik({
        initialValues: {
            name: "",
            tagline: "",
            description: "",
            shortDescription: "",
            logoUrl: "",
            coverImage: "",
            dean: "",
            category: "",
            contactInfo: {
                phone: "",
                email: "",
                location: "",
                website: ""
            },
            mission: "",
            vision: "",
            facilities: [],
            isActive: true,
            order: 0
        },
        validationSchema,
        onSubmit: (values) => {
            if (isEdit) {
                updateSchool(values);
            } else {
                createSchool(values);
            }
        }
    });

    // Fetch schools from API
    const fetchSchools = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${api.API_URL}/schools`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setSchools(data.data.schools || data);
        } catch (error) {
            console.error("Error fetching schools:", error);
            toast.error(`Error loading schools: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Fetch categories from API
    const fetchCategories = async () => {
        try {
            const response = await fetch(`${api.API_URL}/program-categories`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setCategories(data.data.categories || data);
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast.error(`Error loading categories: ${error.message}`);
        }
    };

    // Fetch staff from API
    const fetchStaff = async () => {
        try {
            const response = await fetch(`${api.API_URL}/staff`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setStaff(data.data.staff || data);
        } catch (error) {
            console.error("Error fetching staff:", error);
            toast.error(`Error loading staff: ${error.message}`);
        }
    };

    // Create new school
    const createSchool = async (schoolData) => {
        try {
            const authUser = JSON.parse(sessionStorage.getItem("authUser"));
            const dataToSend = {
                ...schoolData,
                createdBy: authUser?.username || "Admin"
            };

            const response = await fetch(`${api.API_URL}/schools`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create school');
            }

            toast.success("School created successfully");
            fetchSchools();
            setModal(false);
            formik.resetForm();
        } catch (error) {
            toast.error(`Error creating school: ${error.message}`);
        }
    };

    // Update school
    const updateSchool = async (schoolData) => {
        if (!selectedSchool) return;

        try {
            const authUser = JSON.parse(sessionStorage.getItem("authUser"));
            const dataToSend = {
                ...schoolData,
                _id: selectedSchool._id,
                updatedBy: authUser?.username || "Admin"
            };

            const response = await fetch(`${api.API_URL}/schools/${selectedSchool._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update school');
            }

            toast.success("School updated successfully");
            fetchSchools();
            setModal(false);
        } catch (error) {
            toast.error(`Error updating school: ${error.message}`);
        }
    };

    // Delete school
    const deleteSchool = async () => {
        if (!selectedSchool) return;

        try {
            const response = await fetch(`${api.API_URL}/schools/${selectedSchool._id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete school');
            }

            toast.success("School deleted successfully");
            setDeleteModal(false);
            fetchSchools();
        } catch (error) {
            toast.error(`Error deleting school: ${error.message}`);
        }
    };

    // Open modal for edit
    const handleEdit = (school) => {
        setSelectedSchool(school);
        formik.setValues({
            name: school.name || "",
            tagline: school.tagline || "",
            description: school.description || "",
            shortDescription: school.shortDescription || "",
            logoUrl: school.logoUrl || "",
            coverImage: school.coverImage || "",
            dean: school.dean?._id || school.dean || "",
            category: school.category?._id || school.category || "",
            contactInfo: {
                phone: school.contactInfo?.phone || "",
                email: school.contactInfo?.email || "",
                location: school.contactInfo?.location || "",
                website: school.contactInfo?.website || ""
            },
            mission: school.mission || "",
            vision: school.vision || "",
            facilities: school.facilities || [],
            isActive: school.isActive || true,
            order: school.order || 0
        });
        setIsEdit(true);
        setModal(true);
    };

    // Open modal for view
    const handleView = (school) => {
        setSelectedSchool(school);
        setViewModal(true);
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedSchool(null);
        formik.resetForm();
        setIsEdit(false);
        setModal(true);
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

    // Filter schools based on filters
    const filteredSchools = schools.filter(school => {
        return (
            (filters.search === '' ||
                school.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                (school.tagline && school.tagline.toLowerCase().includes(filters.search.toLowerCase())) ||
                (school.shortDescription && school.shortDescription.toLowerCase().includes(filters.search.toLowerCase()))) &&
            (filters.status === '' ||
                (filters.status === 'Active' ? school.isActive : !school.isActive))
        );
    });

    // Table columns
    const columns = [
        {
            name: '#',
            cell: (row, index) => index + 1,
            // width: '60px'
        },
        {
            name: 'Name',
            selector: row => row.name,

        },
        {
            name: 'Tagline',
            selector: row => row.tagline || '-',
            wrap: true
        },
        {
            name: 'Category',
            selector: row => row.category?.name || '-',
        },
        {
            name: 'Dean',
            selector: row => row.dean?.name || '-',
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
                    <Button color="soft-info" size="sm" onClick={() => handleView(row)}>
                        <i className="ri-eye-line" />
                    </Button>
                    <Button color="soft-primary" size="sm" onClick={() => handleEdit(row)}>
                        <i className="ri-pencil-line" />
                    </Button>
                    <Button color="soft-danger" size="sm" onClick={() => {
                        setSelectedSchool(row);
                        setDeleteModal(true);
                    }}>
                        <i className="ri-delete-bin-line" />
                    </Button>
                </div>
            ),
            // width: '140px'
        }
    ];

    // Initial data load
    useEffect(() => {
        fetchSchools();
        fetchCategories();
        fetchStaff();
    }, []);

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Schools" pageTitle="Academics" />

                {/* Filter Controls */}
                <Card className="mb-3">
                    <CardBody>
                        <Row>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Search</Label>
                                    <Input
                                        type="text"
                                        name="search"
                                        placeholder="Search by name, tagline or description"
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
                                        value={statusOptions.find(opt => opt.value === filters.status)}
                                        onChange={(opt) => handleSelectFilterChange('status', opt)}
                                        isClearable
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={3} className="d-flex align-items-end mb-3">
                                <Button color="primary" onClick={fetchSchools} disabled={loading}>
                                    {loading ? 'Refreshing...' : 'Refresh Data'}
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Data Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Schools List</h5>
                        <Button color="primary" onClick={handleCreate}>
                            <i className="ri-add-line me-1" /> Add School
                        </Button>
                    </CardHeader>
                    <CardBody className='card-body'>
                        {loading ? (
                            <Loader />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredSchools}
                                pagination
                                responsive
                                noDataComponent="No schools found matching your criteria"
                                theme={layoutModeType == "dark" ? 'customDark' : 'default'}
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Add/Edit Modal */}
            <Modal isOpen={modal} toggle={() => setModal(false)} size="xl" className="border-0">
                <ModalHeader toggle={() => setModal(false)}>
                    {isEdit ? 'Edit School' : 'Add New School'}
                </ModalHeader>
                <Form onSubmit={formik.handleSubmit}>
                    <ModalBody className="modal-body">
                        <Row>

                            <Col md={8}>
                                <FormGroup>
                                    <Label>Name <span className="text-danger">*</span></Label>
                                    <Input
                                        name="name"
                                        className="form-control"
                                        placeholder="school name"

                                        value={formik.values.name}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.name && !!formik.errors.name}
                                    />
                                    {formik.touched.name && formik.errors.name && (
                                        <div className="text-danger small">{formik.errors.name}</div>
                                    )}
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Order</Label>
                                    <Input
                                        type="number"
                                        name="order"
                                        value={formik.values.order}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        min="0"
                                        invalid={formik.touched.order && !!formik.errors.order}
                                    />
                                    {formik.touched.order && formik.errors.order && (
                                        <div className="text-danger small">{formik.errors.order}</div>
                                    )}
                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Tagline</Label>
                                    <Input
                                        name="tagline"
                                        value={formik.values.tagline}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.tagline && !!formik.errors.tagline}
                                    />
                                    {formik.touched.tagline && formik.errors.tagline && (
                                        <div className="text-danger small">{formik.errors.tagline}</div>
                                    )}
                                </FormGroup>
                            </Col>
                            <Col md={12} style={{ display: "none" }}>
                                <FormGroup>
                                    <Label>Short Description</Label>
                                    <Input
                                        type="textarea"
                                        name="shortDescription"
                                        value={formik.values.shortDescription}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        rows="2"
                                        invalid={formik.touched.shortDescription && !!formik.errors.shortDescription}
                                    />
                                    {formik.touched.shortDescription && formik.errors.shortDescription && (
                                        <div className="text-danger small">{formik.errors.shortDescription}</div>
                                    )}
                                </FormGroup>
                            </Col>
                            <Col md={12} style={{ display: "none" }}>
                                <FormGroup>
                                    <Label>Description</Label>
                                    <Input
                                        type="textarea"
                                        name="description"
                                        value={formik.values.description}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        rows="3"
                                        invalid={formik.touched.description && !!formik.errors.description}
                                    />
                                    {formik.touched.description && formik.errors.description && (
                                        <div className="text-danger small">{formik.errors.description}</div>
                                    )}
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Logo URL</Label>
                                    <Input
                                        name="logoUrl"
                                        value={formik.values.logoUrl}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.logoUrl && !!formik.errors.logoUrl}
                                    />
                                    {formik.touched.logoUrl && formik.errors.logoUrl && (
                                        <div className="text-danger small">{formik.errors.logoUrl}</div>
                                    )}
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Cover Image URL</Label>
                                    <Input
                                        name="coverImage"
                                        value={formik.values.coverImage}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.coverImage && !!formik.errors.coverImage}
                                    />
                                    {formik.touched.coverImage && formik.errors.coverImage && (
                                        <div className="text-danger small">{formik.errors.coverImage}</div>
                                    )}
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Category <span className="text-danger">*</span></Label>
                                    <Input
                                        type="select"
                                        name="category"
                                        value={formik.values.category}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.category && !!formik.errors.category}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </Input>
                                    {formik.touched.category && formik.errors.category && (
                                        <div className="text-danger small">{formik.errors.category}</div>
                                    )}
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Dean</Label>
                                    <Input
                                        type="select"
                                        name="dean"
                                        value={formik.values.dean}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.dean && !!formik.errors.dean}
                                    >
                                        <option value="">Select Dean</option>
                                        {staff.map(person => (
                                            <option key={person._id} value={person._id}>{person.name}</option>
                                        ))}
                                    </Input>
                                    {formik.touched.dean && formik.errors.dean && (
                                        <div className="text-danger small">{formik.errors.dean}</div>
                                    )}
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Contact Phone</Label>
                                    <Input
                                        name="contactInfo.phone"
                                        value={formik.values.contactInfo.phone}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.contactInfo?.phone && !!formik.errors.contactInfo?.phone}
                                    />
                                    {formik.touched.contactInfo?.phone && formik.errors.contactInfo?.phone && (
                                        <div className="text-danger small">{formik.errors.contactInfo.phone}</div>
                                    )}
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Contact Email</Label>
                                    <Input
                                        type="email"
                                        name="contactInfo.email"
                                        value={formik.values.contactInfo.email}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.contactInfo?.email && !!formik.errors.contactInfo?.email}
                                    />
                                    {formik.touched.contactInfo?.email && formik.errors.contactInfo?.email && (
                                        <div className="text-danger small">{formik.errors.contactInfo.email}</div>
                                    )}
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Location</Label>
                                    <Input
                                        name="contactInfo.location"
                                        value={formik.values.contactInfo.location}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.contactInfo?.location && !!formik.errors.contactInfo?.location}
                                    />
                                    {formik.touched.contactInfo?.location && formik.errors.contactInfo?.location && (
                                        <div className="text-danger small">{formik.errors.contactInfo.location}</div>
                                    )}
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Website</Label>
                                    <Input
                                        name="contactInfo.website"
                                        value={formik.values.contactInfo.website}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.contactInfo?.website && !!formik.errors.contactInfo?.website}
                                    />
                                    {formik.touched.contactInfo?.website && formik.errors.contactInfo?.website && (
                                        <div className="text-danger small">{formik.errors.contactInfo.website}</div>
                                    )}
                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Mission</Label>
                                    <Input
                                        type="textarea"
                                        name="mission"
                                        value={formik.values.mission}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        rows="2"
                                        invalid={formik.touched.mission && !!formik.errors.mission}
                                    />
                                    {formik.touched.mission && formik.errors.mission && (
                                        <div className="text-danger small">{formik.errors.mission}</div>
                                    )}
                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Vision</Label>
                                    <Input
                                        type="textarea"
                                        name="vision"
                                        value={formik.values.vision}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        rows="2"
                                        invalid={formik.touched.vision && !!formik.errors.vision}
                                    />
                                    {formik.touched.vision && formik.errors.vision && (
                                        <div className="text-danger small">{formik.errors.vision}</div>
                                    )}
                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup check>
                                    <Input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formik.values.isActive}
                                        onChange={formik.handleChange}
                                        id="isActive"
                                    />
                                    <Label for="isActive" check>
                                        Active School
                                    </Label>
                                </FormGroup>
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="light" onClick={() => setModal(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" type="submit">
                            {isEdit ? 'Update School' : 'Add School'}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* View Modal */}
            <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="lg">
                <ModalHeader toggle={() => setViewModal(false)}>
                    School Details
                </ModalHeader>
                <ModalBody>
                    {selectedSchool && (
                        <Row>
                            <Col md={12} className="text-center mb-3">
                                {selectedSchool.logoUrl && (
                                    <img
                                        src={selectedSchool.logoUrl}
                                        alt={`${selectedSchool.name} logo`}
                                        className="img-fluid rounded"
                                        style={{ maxHeight: '150px' }}
                                    />
                                )}
                                <h3 className="mt-3">{selectedSchool.name}</h3>
                                <p className="text-muted">{selectedSchool.tagline}</p>
                            </Col>

                            <Col md={6}>
                                <h5>Basic Information</h5>
                                <p><strong>Category:</strong> {selectedSchool.category?.name || 'N/A'}</p>
                                <p><strong>Dean:</strong> {selectedSchool.dean?.name || 'N/A'}</p>
                                <p><strong>Status:</strong>
                                    <Badge color={selectedSchool.isActive ? 'success' : 'danger'} className="ms-2">
                                        {selectedSchool.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </p>
                                <p><strong>Order:</strong> {selectedSchool.order}</p>
                            </Col>

                            <Col md={6}>
                                <h5>Contact Information</h5>
                                <p><strong>Phone:</strong> {selectedSchool.contactInfo?.phone || 'N/A'}</p>
                                <p><strong>Email:</strong> {selectedSchool.contactInfo?.email || 'N/A'}</p>
                                <p><strong>Location:</strong> {selectedSchool.contactInfo?.location || 'N/A'}</p>
                                <p><strong>Website:</strong> {selectedSchool.contactInfo?.website || 'N/A'}</p>
                            </Col>

                            <Col md={12} className="mt-3">
                                <h5>Description</h5>
                                <p>{selectedSchool.shortDescription || selectedSchool.description || 'No description available'}</p>
                            </Col>

                            {selectedSchool.mission && (
                                <Col md={6} className="mt-3">
                                    <h5>Mission</h5>
                                    <p>{selectedSchool.mission}</p>
                                </Col>
                            )}

                            {selectedSchool.vision && (
                                <Col md={6} className="mt-3">
                                    <h5>Vision</h5>
                                    <p>{selectedSchool.vision}</p>
                                </Col>
                            )}

                            {selectedSchool.facilities && selectedSchool.facilities.length > 0 && (
                                <Col md={12} className="mt-3">
                                    <h5>Facilities</h5>
                                    <ul>
                                        {selectedSchool.facilities.map((facility, index) => (
                                            <li key={index}>
                                                <strong>{facility.title}:</strong> {facility.description}
                                            </li>
                                        ))}
                                    </ul>
                                </Col>
                            )}
                        </Row>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="light" onClick={() => setViewModal(false)}>
                        Close
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteModal
                show={deleteModal}
                onDeleteClick={deleteSchool}
                onCloseClick={() => setDeleteModal(false)}
            />

            <ToastContainer />
        </div>
    );
};

export default Schools;