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
    getUsersData as onGetUsersData,
    addUser as onAddNewUser,
    updateUser as onUpdateUser,
    deleteUser as onDeleteUser,
} from "../../../slices/thunks";

// Formik
import * as Yup from "yup";
import { useFormik } from "formik";

//User Images
import userdummyimg from '../../../assets/images/users/user-dummy-img.jpg';

const Users = () => {
    document.title = "Users | simad University";

    const dispatch = useDispatch();

    const selectusersData = createSelector(
        (state) => state.Settings,
        (usersData) => usersData.usersData
    );

    const usersData = useSelector(selectusersData);
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        role: ''
    });

    // Form state
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phone: "",
        title: "",
        isActive: true
    });

    // Options for selects
    const statusOptions = [
        { value: "", label: "All Statuses" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" }
    ];

    const roleOptions = [
        { value: "", label: "All Roles" },
        { value: "Admin", label: "Admin" },
        { value: "User", label: "User" },
        { value: "Editor", label: "Editor" }
    ];

    // Fetch users with filters
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetUsersData());
        } catch (error) {
            console.error("Error loading users:", error);
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    // Update users list when data changes
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        setUsersList(usersData?.users || []);
    }, [usersData]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
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

    // Filter users based on filters
    const filteredUsers = usersList.filter(user => {
        return (
            (filters.search === '' ||
                user.username.toLowerCase().includes(filters.search.toLowerCase()) ||
                user.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
                user.lastName.toLowerCase().includes(filters.search.toLowerCase()) ||
                user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
                user.phone.toLowerCase().includes(filters.search.toLowerCase())) &&
            (filters.status === '' ||
                (filters.status === 'Active' ? user.isActive : !user.isActive)) &&
            (filters.role === '' || user.title === filters.role)
        );
    });

    // Open modal for edit
    const handleEdit = (user) => {
        setSelectedUser(user);
        setFormData({
            username: user.username || "",
            email: user.email || "",
            password: "",
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            phone: user.phone || "",
            title: user.title || "",
            isActive: user.isActive || true
        });
        setIsEdit(true);
        setModal(true);
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedUser(null);
        setFormData({
            username: "",
            email: "",
            password: "",
            firstName: "",
            lastName: "",
            phone: "",
            title: "",
            isActive: true
        });
        setIsEdit(false);
        setModal(true);
    };

    // Delete User
    const onClickDelete = (user) => {
        setSelectedUser(user);
        setDeleteModal(true);
    };

    const handleDeleteUser = () => {
        if (selectedUser) {
            dispatch(onDeleteUser(selectedUser._id));
            setDeleteModal(false);
        }
    };

    // Form validation
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            title: formData.title,
            isActive: formData.isActive
        },
        validationSchema: Yup.object({
            username: Yup.string()
                .required("Username is required")
                .trim()
                .lowercase(),
            email: Yup.string()
                .email("Invalid email format")
                .required("Email is required")
                .trim()
                .lowercase(),
            password: Yup.string()
                .when('isEdit', (isEdit, schema) => {
                    return isEdit ? schema.notRequired() : schema.min(8, "Password must be at least 8 characters").required("Password is required")
                }),
            firstName: Yup.string().required("First name is required").trim(),
            lastName: Yup.string().required("Last name is required").trim(),
            phone: Yup.string().trim(),
            title: Yup.string().trim(),
            isActive: Yup.boolean()
        }),
        onSubmit: (values) => {
            if (isEdit) {
                const updateUserData = {
                    id: selectedUser ? selectedUser._id : 0,
                    ...values,
                    // Don't update password if not changed
                    password: values.password || undefined
                };
                dispatch(onUpdateUser(updateUserData));
            } else {
                const newUserData = {
                    id: (Math.floor(Math.random() * (30 - 20)) + 20).toString(),
                    ...values,
                    avatar: 'user-dummy-img.jpg',
                    bg_url: 'user-dummy-img.jpg'
                };
                dispatch(onAddNewUser(newUserData));
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
            name: 'Username',
            selector: row => row.username,
            sortable: true
        },
        {
            name: 'Full Name',
            selector: row => `${row.firstName} ${row.lastName}`,
            sortable: true
        },
        {
            name: 'Email',
            selector: row => row.email,
            sortable: true
        },
        {
            name: 'Phone',
            selector: row => row.phone || '-',
            sortable: true
        },
        {
            name: 'Title/Role',
            selector: row => row.title || 'User',
            sortable: true
        },
        {
            name: 'Status',
            cell: row => (
                <Badge color={row.isActive ? 'success' : 'danger'}>
                    {row.isActive ? 'Active' : 'Inactive'}
                </Badge>
            ),
            sortable: true
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
            width: '120px'
        }
    ];

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Users" pageTitle="Pages" />

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
                                        placeholder="Search by username, name, email or phone"
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
                            <Col md={3}>
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
                            <Col md={2} className="d-flex align-items-end mb-3">
                                <Button color="primary" onClick={fetchUsers} disabled={loading}>
                                    {loading ? 'Filtering...' : 'Apply Filters'}
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Data Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Users List</h5>
                        <Button color="primary" onClick={handleCreate}>
                            <i className="ri-add-line me-1" /> Add User
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredUsers}
                                pagination
                                highlightOnHover
                                responsive
                                noDataComponent="No users found matching your criteria"
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Add/Edit Modal */}
            <Modal isOpen={modal} toggle={() => setModal(false)} size="lg">
                <ModalHeader toggle={() => setModal(false)}>
                    {isEdit ? 'Edit User' : 'Add New User'}
                </ModalHeader>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    validation.handleSubmit();
                }}>
                    <ModalBody>
                        <Row>
                            <Col lg={12}>
                                <div className="text-center mb-4">
                                    <div className="avatar-lg mx-auto">
                                        <div className="avatar-title bg-light rounded-circle">
                                            <img src={userdummyimg} alt="user" className="avatar-md rounded-circle h-auto" />
                                        </div>
                                    </div>
                                </div>

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
                                            />
                                            <FormFeedback>{validation.errors.lastName}</FormFeedback>
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
                                            />
                                            <FormFeedback>{validation.errors.username}</FormFeedback>
                                        </FormGroup>
                                    </Col>
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
                                            />
                                            <FormFeedback>{validation.errors.email}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                </Row>

                                {!isEdit && (
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
                                )}

                                <Row>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Phone</Label>
                                            <Input
                                                name="phone"
                                                value={validation.values.phone}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.phone && !!validation.errors.phone}
                                            />
                                            <FormFeedback>{validation.errors.phone}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Title/Role</Label>
                                            <Input
                                                name="title"
                                                value={validation.values.title}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.title && !!validation.errors.title}
                                            />
                                            <FormFeedback>{validation.errors.title}</FormFeedback>
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
                                        Active User
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
                onDeleteClick={handleDeleteUser}
                onCloseClick={() => setDeleteModal(false)}
            />

            <ToastContainer />
        </div>
    );
};

export default Users;