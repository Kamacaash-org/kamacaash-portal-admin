import React, { useState, useEffect } from 'react';
import DataTable from "react-data-table-component";
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
import { api } from '../../../config'
const Departments = () => {
    document.title = "Departments | simad University";

    // State management
    const [departments, setDepartments] = useState([]);
    const [schools, setSchools] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState(null);

    // API base URL
    const API_BASE = api.API_URL;

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        school: ''
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
            .required("Department name is required")
            .min(2, "Department name must be at least 3 characters")
            .max(100, "Department name must be less than 100 characters"),
        description: Yup.string()
            .max(500, "Description must be less than 500 characters"),
        school: Yup.string()
            .required("School is required"),
        head: Yup.string(),
        contactInfo: Yup.object().shape({
            phone: Yup.string(),
            email: Yup.string()
                .email("Contact email must be a valid email"),
            location: Yup.string()
        }),
        isActive: Yup.boolean(),
        order: Yup.number()
            .min(0, "Order must be a positive number")
            .integer("Order must be an integer")
    });

    // Formik setup
    const formik = useFormik({
        initialValues: {
            name: "",
            description: "",
            school: "",
            head: "",
            contactInfo: {
                phone: "",
                email: "",
                location: ""
            },
            specializations: [],
            isActive: true,
            order: 0
        },
        validationSchema,
        onSubmit: (values) => {
            if (isEdit) {
                updateDepartment(values);
            } else {
                createDepartment(values);
            }
        }
    });

    // Fetch departments from API
    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/departments`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setDepartments(data.data.departments || data);
        } catch (error) {
            console.error("Error fetching departments:", error);
            toast.error(`Error loading departments: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Fetch schools from API
    const fetchSchools = async () => {
        try {
            const response = await fetch(`${API_BASE}/schools`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setSchools(data.data.schools || data);
        } catch (error) {
            console.error("Error fetching schools:", error);
            toast.error(`Error loading schools: ${error.message}`);
        }
    };

    // Fetch staff from API
    const fetchStaff = async () => {
        try {
            const response = await fetch(`${API_BASE}/staff`);
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

    // Create new department
    const createDepartment = async (departmentData) => {
        try {
            const authUser = JSON.parse(sessionStorage.getItem("authUser"));
            const dataToSend = {
                ...departmentData,
                head: '68ac8c3bdc6c16847c8a1fd9',
                createdBy: authUser?.username || "Admin"
            };

            const response = await fetch(`${API_BASE}/departments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create department');
            }

            toast.success("Department created successfully");
            fetchDepartments();
            setModal(false);
            formik.resetForm();
        } catch (error) {
            toast.error(`Error creating department: ${error.message}`);
        }
    };

    // Update department
    const updateDepartment = async (departmentData) => {
        if (!selectedDepartment) return;

        try {
            const authUser = JSON.parse(sessionStorage.getItem("authUser"));
            const dataToSend = {
                ...departmentData,
                _id: selectedDepartment._id,
                updatedBy: authUser?.username || "Admin"
            };

            const response = await fetch(`${API_BASE}/departments/${selectedDepartment._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update department');
            }

            toast.success("Department updated successfully");
            fetchDepartments();
            setModal(false);
        } catch (error) {
            toast.error(`Error updating department: ${error.message}`);
        }
    };

    // Delete department
    const deleteDepartment = async () => {
        if (!selectedDepartment) return;

        try {
            const response = await fetch(`${API_BASE}/departments/${selectedDepartment._id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete department');
            }

            toast.success("Department deleted successfully");
            setDeleteModal(false);
            fetchDepartments();
        } catch (error) {
            toast.error(`Error deleting department: ${error.message}`);
        }
    };

    // Open modal for edit
    const handleEdit = (department) => {
        setSelectedDepartment(department);
        formik.setValues({
            name: department.name || "",
            description: department.description || "",
            school: department.school?._id || department.school || "",
            head: department.head?._id || department.head || "",
            contactInfo: {
                phone: department.contactInfo?.phone || "",
                email: department.contactInfo?.email || "",
                location: department.contactInfo?.location || ""
            },
            specializations: department.specializations || [],
            isActive: department.isActive || true,
            order: department.order || 0
        });
        setIsEdit(true);
        setModal(true);
    };

    // Open modal for view
    const handleView = (department) => {
        setSelectedDepartment(department);
        setViewModal(true);
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedDepartment(null);
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

    // Handle school filter change
    const handleSchoolFilterChange = (selectedOption) => {
        setFilters(prev => ({
            ...prev,
            school: selectedOption?.value || ""
        }));
    };
    // console.log("ddd", departments)

    // Filter departments based on filters
    const filteredDepartments = departments?.filter(department => {
        return (
            (filters.search === '' ||
                department.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                (department.description && department.description.toLowerCase().includes(filters.search.toLowerCase())) ||
                (department.contactInfo?.location && department.contactInfo.location.toLowerCase().includes(filters.search.toLowerCase()))) &&
            (filters.status === '' ||
                (filters.status === 'Active' ? department.isActive : !department.isActive)) &&
            (filters.school === '' ||
                department.school?._id === filters.school || department.school === filters.school)
        );
    });

    // Add specialization to form
    const addSpecialization = () => {
        const newSpecialization = prompt("Enter a new specialization:");
        if (newSpecialization && newSpecialization.trim() !== "") {
            formik.setFieldValue('specializations', [
                ...formik.values.specializations,
                newSpecialization.trim()
            ]);
        }
    };

    // Remove specialization from form
    const removeSpecialization = (index) => {
        const updatedSpecializations = [...formik.values.specializations];
        updatedSpecializations.splice(index, 1);
        formik.setFieldValue('specializations', updatedSpecializations);
    };

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
            sortable: true
        },
        {
            name: 'School',
            selector: row => row.school?.name || '-',
            sortable: true
        },
        {
            name: 'Head',
            selector: row => row.head?.name || '-',
            sortable: true
        },
        {
            name: 'Location',
            selector: row => row.contactInfo?.location || '-',
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
                        setSelectedDepartment(row);
                        setDeleteModal(true);
                    }}>
                        <i className="ri-delete-bin-line" />
                    </Button>
                </div>
            ),

        }
    ];

    // Initial data load
    useEffect(() => {
        fetchDepartments();
        fetchSchools();
        fetchStaff();
    }, []);

    // Prepare school options for filter
    const schoolOptions = [
        { value: "", label: "All Schools" },
        ...schools.map(school => ({
            value: school._id,
            label: school.name
        }))
    ];

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Departments" pageTitle="Academics" />

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
                                        placeholder="Search by name, description or location"
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
                                    <Label>School</Label>
                                    <Select
                                        options={schoolOptions}
                                        value={schoolOptions.find(opt => opt.value === filters.school)}
                                        onChange={handleSchoolFilterChange}
                                        isClearable
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={2} className="d-flex align-items-end mb-3">
                                <Button color="primary" onClick={fetchDepartments} disabled={loading}>
                                    {loading ? 'Refreshing...' : 'Refresh Data'}
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Data Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Departments List</h5>
                        <Button color="primary" onClick={handleCreate}>
                            <i className="ri-add-line me-1" /> Add Department
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredDepartments || []}
                                pagination
                                highlightOnHover
                                responsive
                                noDataComponent="No departments found matching your criteria"
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Add/Edit Modal */}
            <Modal isOpen={modal} toggle={() => setModal(false)} size="lg">
                <ModalHeader toggle={() => setModal(false)}>
                    {isEdit ? 'Edit Department' : 'Add New Department'}
                </ModalHeader>
                <Form onSubmit={formik.handleSubmit}>
                    <ModalBody>
                        <Row>
                            <Col md={8}>
                                <FormGroup>
                                    <Label>Name <span className="text-danger">*</span></Label>
                                    <Input
                                        name="name"
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
                                    <Label>School <span className="text-danger">*</span></Label>
                                    <Input
                                        type="select"
                                        name="school"
                                        value={formik.values.school}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.school && !!formik.errors.school}
                                    >
                                        <option value="">Select School</option>
                                        {schools.map(school => (
                                            <option key={school._id} value={school._id}>{school.name}</option>
                                        ))}
                                    </Input>
                                    {formik.touched.school && formik.errors.school && (
                                        <div className="text-danger small">{formik.errors.school}</div>
                                    )}
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Department Head</Label>
                                    <Input
                                        type="select"
                                        name="head"
                                        value={formik.values.head}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.head && !!formik.errors.head}
                                    >
                                        <option value="">Select Department Head</option>
                                        {staff.map(person => (
                                            <option key={person._id} value={person._id}>{person.name}</option>
                                        ))}
                                    </Input>
                                    {formik.touched.head && formik.errors.head && (
                                        <div className="text-danger small">{formik.errors.head}</div>
                                    )}
                                </FormGroup>
                            </Col>
                            <Col md={4}>
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
                            <Col md={4}>
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
                            <Col md={4}>
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
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Specializations</Label>
                                    <div className="border p-2 rounded">
                                        {formik.values.specializations.length > 0 ? (
                                            <ul className="list-group">
                                                {formik.values.specializations.map((spec, index) => (
                                                    <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                                        {spec}
                                                        <Button
                                                            color="danger"
                                                            size="sm"
                                                            onClick={() => removeSpecialization(index)}
                                                        >
                                                            <i className="ri-close-line" />
                                                        </Button>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-muted mb-0">No specializations added</p>
                                        )}
                                        <Button
                                            color="outline-primary"
                                            size="sm"
                                            className="mt-2"
                                            onClick={addSpecialization}
                                        >
                                            <i className="ri-add-line me-1" /> Add Specialization
                                        </Button>
                                    </div>
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
                                        Active Department
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
                            {isEdit ? 'Update Department' : 'Add Department'}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* View Modal */}
            <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="lg">
                <ModalHeader toggle={() => setViewModal(false)}>
                    Department Details
                </ModalHeader>
                <ModalBody>
                    {selectedDepartment && (
                        <Row>
                            <Col md={12}>
                                <h3>{selectedDepartment.name}</h3>
                                <p className="text-muted">{selectedDepartment.description}</p>
                            </Col>

                            <Col md={6}>
                                <h5>Basic Information</h5>
                                <p><strong>School:</strong> {selectedDepartment.school?.name || 'N/A'}</p>
                                <p><strong>Department Head:</strong> {selectedDepartment.head?.name || 'N/A'}</p>
                                <p><strong>Status:</strong>
                                    <Badge color={selectedDepartment.isActive ? 'success' : 'danger'} className="ms-2">
                                        {selectedDepartment.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </p>
                                <p><strong>Order:</strong> {selectedDepartment.order}</p>
                            </Col>

                            <Col md={6}>
                                <h5>Contact Information</h5>
                                <p><strong>Phone:</strong> {selectedDepartment.contactInfo?.phone || 'N/A'}</p>
                                <p><strong>Email:</strong> {selectedDepartment.contactInfo?.email || 'N/A'}</p>
                                <p><strong>Location:</strong> {selectedDepartment.contactInfo?.location || 'N/A'}</p>
                            </Col>

                            {selectedDepartment.specializations && selectedDepartment.specializations.length > 0 && (
                                <Col md={12} className="mt-3">
                                    <h5>Specializations</h5>
                                    <ul>
                                        {selectedDepartment.specializations.map((spec, index) => (
                                            <li key={index}>{spec}</li>
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
                onDeleteClick={deleteDepartment}
                onCloseClick={() => setDeleteModal(false)}
            />

            <ToastContainer />
        </div>
    );
};

export default Departments;