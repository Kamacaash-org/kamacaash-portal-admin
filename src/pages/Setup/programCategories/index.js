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
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import { api } from "../../../config";

const ProgramCategories = () => {
    document.title = "Program Categories | simad University";

    // State management
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
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
        order: 0,
        isActive: true
    });

    // Options for selects
    const statusOptions = [
        { value: "", label: "All Statuses" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" }
    ];

    // Fetch categories with filters
    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            // Build query params
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.status) params.append('isActive', filters.status === 'Active');

            const response = await fetch(`${api.API_URL}/program-categories?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to fetch categories');

            setCategories(data.data.categories || []);
        } catch (error) {
            setError(error.message);
            toast.error(`Error loading categories: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

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

    // Validate form
    const validateForm = () => {
        const requiredFields = ['name', 'description'];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            toast.warning(`Please fill all required fields: ${missingFields.join(', ')}`);
            return false;
        }

        if (formData.order < 0) {
            toast.warning("Order cannot be negative");
            return false;
        }

        return true;
    };

    // Create new category
    const createCategory = async () => {
        if (!validateForm()) return;

        try {
            const authUser = JSON.parse(sessionStorage.getItem("authUser"));
            const categoryData = {
                ...formData,
                createdBy: authUser?.data?.user?.username || "Admin"
            };

            const response = await fetch(`${api.API_URL}/program-categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(categoryData)
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to create category');

            toast.success("Category created successfully");
            fetchCategories();
            setModal(false);
        } catch (error) {
            toast.error(`Error creating category: ${error.message}`);
        }
    };

    // Update category
    const updateCategory = async () => {
        if (!validateForm() || !selectedCategory) return;

        try {
            const authUser = JSON.parse(sessionStorage.getItem("authUser"));
            const categoryData = {
                ...formData,
                _id: selectedCategory._id,
                updatedBy: authUser?.data?.user?.username || "Admin"
            };

            const response = await fetch(`${api.API_URL}/program-categories/${selectedCategory._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(categoryData)
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to update category');

            toast.success("Category updated successfully");
            fetchCategories();
            setModal(false);
        } catch (error) {
            toast.error(`Error updating category: ${error.message}`);
        }
    };

    // Delete category
    const deleteCategory = async () => {
        if (!selectedCategory) return;

        try {
            const response = await fetch(`${api.API_URL}/program-categories/${selectedCategory._id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to delete category');

            toast.success("Category deleted successfully");
            setDeleteModal(false);
            fetchCategories();
        } catch (error) {
            toast.error(`Error deleting category: ${error.message}`);
        }
    };

    // Open modal for edit
    const handleEdit = (category) => {
        setSelectedCategory(category);
        setFormData({
            name: category.name,
            description: category.description,
            icon: category.icon || "",
            order: category.order || 0,
            isActive: category.isActive
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
            order: 0,
            isActive: true
        });
        setIsEdit(false);
        setModal(true);
    };

    // Table columns
    const columns = [
        {
            name: '#',
            cell: (row, index) => index + 1,
            width: '60px'
        },
        {
            name: 'Name',
            selector: row => row.name,
            width: '300px'

        },
        {
            name: 'Description',
            selector: row => row.description,
            sortable: true,
            wrap: true,
            // style: {
            //     maxWidth: '300px'
            // }
        },
        {
            name: 'Icon',
            cell: row => row.icon ? (
                <i className={row.icon} style={{ fontSize: '20px' }}></i>
            ) : '-',
            // width: '80px'
        },
        {
            name: 'Order',
            selector: row => row.order,
            sortable: true,
            // width: '80px'
        },
        {
            name: 'Status',
            cell: row => (
                <Badge color={row.isActive ? 'success' : 'danger'}>
                    {row.isActive ? 'Active' : 'Inactive'}
                </Badge>
            ),
            sortable: true,
            // width: '100px'
        },
        {
            name: 'Actions',
            cell: row => (
                <div className="d-flex gap-2">
                    <Button color="soft-primary" size="sm" onClick={() => handleEdit(row)}>
                        <i className="ri-pencil-line" />
                    </Button>
                    <Button color="soft-danger" size="sm" onClick={() => {
                        setSelectedCategory(row);
                        setDeleteModal(true);
                    }}>
                        <i className="ri-delete-bin-line" />
                    </Button>
                </div>
            ),
            // width: '120px'
        }
    ];

    // Initial data load
    useEffect(() => {
        fetchCategories();
    }, [filters]);

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Program Categories" pageTitle="Academics" />

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
                                        placeholder="Search by name"
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
                        <h5 className="mb-0">Program Categories List</h5>
                        <Button color="primary" onClick={handleCreate}>
                            <i className="ri-add-line me-1" /> Add Category
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : error ? (
                            <div className="text-danger">{error}</div>
                        ) : (
                            <DataTable
                                columns={columns}
                                data={categories}
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
                    {isEdit ? 'Edit Program Category' : 'Add New Program Category'}
                </ModalHeader>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    isEdit ? updateCategory() : createCategory();
                }}>
                    <ModalBody>
                        <Row>
                            <Col md={8}>
                                <FormGroup>
                                    <Label>Name <span className="text-danger">*</span></Label>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}

                                    />
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Order</Label>
                                    <Input
                                        type="number"
                                        name="order"
                                        value={formData.order}
                                        onChange={handleInputChange}
                                        min="0"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Description <span className="text-danger">*</span></Label>
                                    <Input
                                        type="textarea"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}

                                        rows="3"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Icon Class (e.g., ri-book-line)</Label>
                                    <Input
                                        name="icon"
                                        value={formData.icon}
                                        onChange={handleInputChange}
                                        placeholder="Enter icon class name"
                                    />
                                    <small className="text-muted">
                                        Use Remix Icon classes (e.g., ri-book-line, ri-graduation-cap-line)
                                    </small>
                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup check>
                                    <Input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
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
                onDeleteClick={deleteCategory}
                onCloseClick={() => setDeleteModal(false)}
            />

            <ToastContainer />
        </div>
    );
};

export default ProgramCategories;