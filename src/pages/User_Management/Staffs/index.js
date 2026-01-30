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
    getStaffs as onGetStaffsData,
    addStaff as onAddNewStaff,
    updateStaff as onUpdateStaff,
    deleteStaff as onDeleteStaff,
} from "../../../slices/thunks";

// Formik
import * as Yup from "yup";
import { useFormik } from "formik";
import { passiveEventSupported } from '@tanstack/react-table';

const Staff = () => {
    document.title = "Staff | Kamacash";

    const dispatch = useDispatch();

    const selectStaffData = createSelector(
        (state) => state.UserManagement,
        (staffData) => staffData.staffData
    );

    const staffData = useSelector(selectStaffData);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        role: '',
        sex: ''
    });

    // Options for selects
    const statusOptions = [
        { value: "", label: "All Statuses" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" }
    ];

    const roleOptions = [
        { value: "", label: "All Roles" },
        { value: "SUPER_ADMIN", label: "Admin" },
        { value: "BUSINESS_OWNER", label: "Business Owner" }
    ];

    const sexOptions = [
        { value: "", label: "All Sexes" },
        { value: "MALE", label: "Male" },
        { value: "FEMALE", label: "Female" }

    ];

    const formSexOptions = [
        { value: "MALE", label: "Male" },
        { value: "FEMALE", label: "Female" }

    ];

    // Fetch staff with filters
    const fetchStaff = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetStaffsData());
        } catch (error) {
            console.error("Error loading staff:", error);
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    // Update staff list when data changes
    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    useEffect(() => {
        setStaffList(staffData || []);
    }, [staffData]);

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

    // Filter staff based on filters
    const filteredStaff = staffList.filter(staff => {
        return (
            (filters.search === '' ||
                staff.username.toLowerCase().includes(filters.search.toLowerCase()) ||
                staff.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
                staff.lastName.toLowerCase().includes(filters.search.toLowerCase()) ||
                staff.email.toLowerCase().includes(filters.search.toLowerCase()) ||
                staff.phone?.toLowerCase().includes(filters.search.toLowerCase())) &&
            (filters.status === '' ||
                (filters.status === 'Active' ? staff.isActive : !staff.isActive)) &&
            (filters.role === '' || staff.role === filters.role) &&
            (filters.sex === '' || staff.sex === filters.sex)
        );
    });

    // Open modal for edit
    const handleEdit = (staff) => {
        setSelectedStaff(staff);
        setIsEdit(true);
        setModal(true);
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedStaff(null);
        setIsEdit(false);
        setModal(true);
    };

    // Delete Staff
    const onClickDelete = (staff) => {
        // console.log("Selected staff for deletion:", staff);
        setSelectedStaff(staff);
        setDeleteModal(true);
    };

    const handleDeleteStaff = () => {
        if (selectedStaff) {
            // console.log("Deleting staff with id:", selectedStaff);
            dispatch(onDeleteStaff(selectedStaff._id));
            setDeleteModal(false);
        }
    };

    // Form validation
    // Form validation
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            firstName: selectedStaff?.firstName || "",
            lastName: selectedStaff?.lastName || "",
            email: selectedStaff?.email || "",
            phone: selectedStaff?.phone || "",
            username: selectedStaff?.username || "",
            // password: "",
            title: selectedStaff?.title || "",
            sex: selectedStaff?.sex || "",
            role: selectedStaff?.role || "STAFF",
            isActive: selectedStaff?.isActive ?? true
        },
        validationSchema: Yup.object({
            firstName: Yup.string()
                .required("First name is required")
                .trim(),
            lastName: Yup.string()
                .required("Last name is required")
                .trim(),
            email: Yup.string()
                .email("Invalid email format")
                .required("Email is required")
                .trim()
                .lowercase(),
            phone: Yup.string()
                .required("Phone number is required")
                .trim(),
            username: Yup.string()
                .required("Username is required")
                .trim()
                .lowercase(),
            // password: Yup.string()
            //     .test(
            //         'password-required',
            //         'Password is required',
            //         (value) => {
            //             // For new staff, password is required
            //             if (!isEdit) {
            //                 return !!value && value.length >= 6;
            //             }
            //             // For editing, password is optional but if provided must be at least 6 chars
            //             return !value || value.length >= 6;
            //         }
            //     )
            //     .test(
            //         'password-length',
            //         'Password must be at least 6 characters',
            //         (value) => {
            //             // Only validate length if password is provided
            //             return !value || value.length >= 6;
            //         }
            //     ),
            title: Yup.string().trim(),
            sex: Yup.string().required("Sex is required").trim(),
            role: Yup.string().required("Role is required"),
            isActive: Yup.boolean()
        }),
        onSubmit: async (values) => {
            setIsSubmitting(true);
            try {
                if (isEdit) {
                    const updateStaffData = {
                        _id: selectedStaff ? selectedStaff._id : 0,
                        ...values,
                        // Don't update password if not changed
                        // password: values.password || undefined
                    };
                    await dispatch(onUpdateStaff(updateStaffData));
                } else {
                    const newStaffData = {
                        ...values,
                        password: process.env.REACT_APP_DEFAULT_STAFF_PASS,
                    };
                    await dispatch(onAddNewStaff(newStaffData));
                }
                setModal(false);
                validation.resetForm();
            } catch (error) {
                // Error is already handled by the thunk with toast notifications
                // Keep modal open on error
                console.error("Form submission error:", error);
            } finally {
                setIsSubmitting(false);
            }
        },
    });

    // Table columns
    const columns = [
        {
            name: '#',
            cell: (row, index) => index + 1,
        },
        {
            name: 'Username',
            selector: row => row.username,
        },
        {
            name: 'Full Name',
            selector: row => `${row.firstName} ${row.lastName}`,
            wrap: true,
        },
        {
            name: 'Email',
            selector: row => row.email,
            wrap: true,
        },
        {
            name: 'Phone',
            selector: row => row.phone || '-',
        },
        {
            name: 'Sex',
            selector: row => row.sex,
            cell: row => (
                <Badge
                    color={
                        row.sex === 'MALE' ? 'primary' :
                            row.sex === 'FEMALE' ? 'success' : 'secondary'
                    }
                >
                    {row.sex || 'Not specified'}
                </Badge>
            )
        },
        {
            name: 'Role',
            selector: row => row.role,
            cell: row => (
                <Badge
                    color={
                        row.role === 'SUPER_ADMIN' ? 'info' :
                            row.role === 'BUSINESS_OWNER' ? 'warning' : 'secondary'
                    }
                >
                    {row.role}
                </Badge>
            )
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
                <BreadCrumb title="Staff" pageTitle="User Management" />

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
                                        placeholder="Search by username, name, email or phone"
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
                            <Col md={2}>
                                <FormGroup>
                                    <Label>Role</Label>
                                    <Select
                                        options={roleOptions}
                                        value={roleOptions.find(opt => opt.value === filters.role)}
                                        onChange={(opt) => handleSelectFilterChange('role', opt)}
                                        isClearable
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={2}>
                                <FormGroup>
                                    <Label>Sex</Label>
                                    <Select
                                        options={sexOptions}
                                        value={sexOptions.find(opt => opt.value === filters.sex)}
                                        onChange={(opt) => handleSelectFilterChange('sex', opt)}
                                        isClearable
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={3} className="d-flex align-items-end mb-3">
                                <Button color="primary" onClick={fetchStaff} disabled={loading}>
                                    {loading ? 'Filtering...' : 'Apply Filters'}
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Data Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Staff List</h5>
                        <Button color="primary" onClick={handleCreate}>
                            <i className="ri-add-line me-1" /> Add Staff
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredStaff}
                                pagination
                                // highlightOnHover
                                responsive
                                noDataComponent="No staff members found matching your criteria"
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Add/Edit Modal */}
            <Modal isOpen={modal} toggle={() => setModal(false)} size="lg">
                <ModalHeader toggle={() => setModal(false)}>
                    {isEdit ? 'Edit Staff Member' : 'Add New Staff Member'}
                </ModalHeader>
                <Form onSubmit={validation.handleSubmit}>
                    <ModalBody>
                        <Row>
                            <Col lg={12}>
                                <Row>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>First Name <span className="text-danger">*</span></Label>
                                            <Input
                                                name="firstName"
                                                value={validation.values.firstName}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.firstName && !!validation.errors.firstName}
                                                placeholder="Enter first name"
                                            />
                                            <FormFeedback>{validation.errors.firstName}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Last Name <span className="text-danger">*</span></Label>
                                            <Input
                                                name="lastName"
                                                value={validation.values.lastName}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.lastName && !!validation.errors.lastName}
                                                placeholder="Enter last name"
                                            />
                                            <FormFeedback>{validation.errors.lastName}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Email <span className="text-danger">*</span></Label>
                                            <Input
                                                type="email"
                                                name="email"
                                                value={validation.values.email}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.email && !!validation.errors.email}
                                                placeholder="Enter email address"
                                            />
                                            <FormFeedback>{validation.errors.email}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Phone Number <span className="text-danger">*</span></Label>
                                            <Input
                                                name="phone"
                                                value={validation.values.phone}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.phone && !!validation.errors.phone}
                                                placeholder="Enter phone number"
                                            />
                                            <FormFeedback>{validation.errors.phone}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Username <span className="text-danger">*</span></Label>
                                            <Input
                                                name="username"
                                                value={validation.values.username}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.username && !!validation.errors.username}
                                                placeholder="Enter username"
                                            />
                                            <FormFeedback>{validation.errors.username}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Role <span className="text-danger">*</span></Label>
                                            <Select
                                                options={roleOptions.filter(opt => opt.value !== "")}
                                                value={roleOptions.find(opt => opt.value === validation.values.role)}
                                                onChange={(opt) => validation.setFieldValue('role', opt?.value || "")}
                                                isClearable
                                                placeholder="Select role"
                                            />
                                            {validation.touched.role && validation.errors.role && (
                                                <div className="text-danger" style={{ fontSize: '0.875em', marginTop: '0.25rem' }}>
                                                    {validation.errors.role}
                                                </div>
                                            )}
                                        </FormGroup>
                                    </Col>
                                </Row>

                                {/* {!isEdit && (
                                    <Row>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>Password <span className="text-danger">*</span></Label>
                                                <Input
                                                    type="password"
                                                    name="password"
                                                    value={validation.values.password}
                                                    onChange={validation.handleChange}
                                                    onBlur={validation.handleBlur}
                                                    invalid={validation.touched.password && !!validation.errors.password}
                                                />
                                                <FormFeedback>{validation.errors.password}</FormFeedback>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                )} */}

                                {/* {isEdit && (
                                    <Row>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>Password (Leave blank to keep current)</Label>
                                                <Input
                                                    type="password"
                                                    name="password"
                                                    value={validation.values.password}
                                                    onChange={validation.handleChange}
                                                    onBlur={validation.handleBlur}
                                                    invalid={validation.touched.password && !!validation.errors.password}
                                                    placeholder="Enter new password to change"
                                                />
                                                <FormFeedback>{validation.errors.password}</FormFeedback>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                )} */}

                                <Row>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Title/Position</Label>
                                            <Input
                                                name="title"
                                                value={validation.values.title}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.title && !!validation.errors.title}
                                                placeholder="e.g., Manager, Developer"
                                            />
                                            <FormFeedback>{validation.errors.title}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Sex <span className="text-danger">*</span></Label>
                                            <Select
                                                options={formSexOptions}
                                                value={formSexOptions.find(opt => opt.value === validation.values.sex)}
                                                onChange={(opt) => validation.setFieldValue('sex', opt?.value || "")}
                                                placeholder="Select sex"
                                            />
                                            {validation.touched.sex && validation.errors.sex && (
                                                <div className="text-danger" style={{ fontSize: '0.875em', marginTop: '0.25rem' }}>
                                                    {validation.errors.sex}
                                                </div>
                                            )}
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
                                        Active Staff Member
                                    </Label>
                                </FormGroup>
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="light" onClick={() => setModal(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button color="primary" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteModal
                show={deleteModal}
                onDeleteClick={handleDeleteStaff}
                onCloseClick={() => setDeleteModal(false)}
                confirmationText="Are you sure you want to delete this staff member? This action cannot be undone."
            />

            <ToastContainer />
        </div>
    );
};

export default Staff;