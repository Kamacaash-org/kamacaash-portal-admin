import React, { useState, useEffect, useCallback } from 'react';
import DataTable from "react-data-table-component";
import Select from "react-select";
import {
    Card, CardHeader, CardBody,
    Col, Container, Row,
    Form, Input, Label, FormGroup,
    Modal, ModalBody, ModalFooter, ModalHeader,
    Button, Badge, FormFeedback,
    Nav,
    NavItem,
    NavLink,
    TabContent,
    TabPane
} from "reactstrap";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import { api } from "../../../config";
import classnames from "classnames";
const Programs = () => {
    document.title = "Programs | simad University";

    // State management
    const [programs, setPrograms] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modal, setModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [activeStep, setActiveStep] = useState(1);
    const [viewModal, setViewModal] = useState(false);
    const [activeViewTab, setActiveViewTab] = useState('1');
    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        department: '',
        status: ''
    });

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        shortName: "",
        description: "",
        shortDescription: "",
        department: "",
        duration: "",
        credits: 0,
        tuition: {
            domestic: "",
            international: "",
            currency: "USD"
        },
        intakePeriods: [],
        applicationDeadline: "",
        curriculum: [],
        admissionRequirements: [],
        careerPaths: [],
        provider: "SIMAD University",
        iconUrl: "",
        coverImage: "",
        externalLink: "",
        isActive: true,
        order: 0
    });

    // Curriculum item state for modal
    const [curriculumItem, setCurriculumItem] = useState({
        title: "",
        description: "",
        icon: "",
        order: 0
    });

    // Career path item state for modal
    const [careerPathItem, setCareerPathItem] = useState({
        title: "",
        description: "",
        icon: "",
        order: 0
    });

    // Options for selects
    const statusOptions = [
        { value: "", label: "All Statuses" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" }
    ];

    const currencyOptions = [
        { value: "USD", label: "USD" },
    ];

    const intakePeriodOptions = [
        { value: "Summer", label: "Summer" },
        { value: "Winter", label: "Winter" }
    ];



    // Fetch programs with filters
    const fetchPrograms = async () => {
        setLoading(true);
        setError(null);
        try {
            // Build query params
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.department) params.append('department', filters.department);
            if (filters.status) params.append('isActive', filters.status === 'Active');

            const response = await fetch(`${api.API_URL}/programs?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to fetch programs');

            setPrograms(data.data.programs || []);
        } catch (error) {
            setError(error.message);
            toast.error(`Error loading programs: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Fetch departments for dropdown
    const fetchDepartments = async () => {
        try {
            const response = await fetch(`${api.API_URL}/departments?isActive=true`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to fetch departments');

            setDepartments(data.data.departments || []);
        } catch (error) {
            console.error("Error fetching departments:", error);
            toast.error(`Error loading departments: ${error.message}`);
        }
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.startsWith("tuition.")) {
            const tuitionField = name.split(".")[1];
            setFormData(prev => ({
                ...prev,
                tuition: {
                    ...prev.tuition,
                    [tuitionField]: type === 'number' ? parseFloat(value) || 0 : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked :
                    type === 'number' ? parseFloat(value) || 0 : value
            }));
        }
    };

    // Handle select changes
    const handleSelectChange = (name, selectedOption) => {
        setFormData(prev => ({
            ...prev,
            [name]: selectedOption?.value || ""
        }));
    };

    // Handle multi-select changes
    const handleMultiSelectChange = (name, selectedOptions) => {
        setFormData(prev => ({
            ...prev,
            [name]: selectedOptions ? selectedOptions.map(opt => opt.value) : []
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

    // Add curriculum item
    const addCurriculumItem = () => {
        if (!curriculumItem.title || !curriculumItem.description) {
            toast.warning("Please fill in title and description for curriculum item");
            return;
        }

        setFormData(prev => ({
            ...prev,
            curriculum: [...prev.curriculum, { ...curriculumItem }]
        }));

        setCurriculumItem({
            title: "",
            description: "",
            icon: "",
            order: 0
        });
    };

    // Remove curriculum item
    const removeCurriculumItem = (index) => {
        setFormData(prev => ({
            ...prev,
            curriculum: prev.curriculum.filter((_, i) => i !== index)
        }));
    };

    // Add career path item
    const addCareerPathItem = () => {
        if (!careerPathItem.title || !careerPathItem.description) {
            toast.warning("Please fill in title and description for career path item");
            return;
        }

        setFormData(prev => ({
            ...prev,
            careerPaths: [...prev.careerPaths, { ...careerPathItem }]
        }));

        setCareerPathItem({
            title: "",
            description: "",
            icon: "",
            order: 0
        });
    };

    // Remove career path item
    const removeCareerPathItem = (index) => {
        setFormData(prev => ({
            ...prev,
            careerPaths: prev.careerPaths.filter((_, i) => i !== index)
        }));
    };

    // Validate form
    const validateForm = () => {
        const requiredFields = ['name', 'description', 'department'];
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

    // Create new program
    const createProgram = async () => {
        if (!validateForm()) return;

        try {
            const authUser = JSON.parse(sessionStorage.getItem("authUser"));
            const programData = {
                ...formData,
                createdBy: authUser?.data?.user?.username || "Admin"
            };

            const response = await fetch(`${api.API_URL}/programs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(programData)
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to create program');

            toast.success("Program created successfully");
            fetchPrograms();
            setModal(false);
        } catch (error) {
            toast.error(`Error creating program: ${error.message}`);
        }
    };

    // Update program
    const updateProgram = async () => {
        if (!validateForm() || !selectedProgram) return;

        try {
            const authUser = JSON.parse(sessionStorage.getItem("authUser"));
            const programData = {
                ...formData,
                _id: selectedProgram._id,
                updatedBy: authUser?.data?.user?.username || "Admin"
            };

            const response = await fetch(`${api.API_URL}/programs/${selectedProgram._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(programData)
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to update program');

            toast.success("Program updated successfully");
            fetchPrograms();
            setModal(false);
        } catch (error) {
            toast.error(`Error updating program: ${error.message}`);
        }
    };

    // Delete program
    const deleteProgram = async () => {
        if (!selectedProgram) return;

        try {
            const response = await fetch(`${api.API_URL}/programs/${selectedProgram._id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to delete program');

            toast.success("Program deleted successfully");
            setDeleteModal(false);
            fetchPrograms();
        } catch (error) {
            toast.error(`Error deleting program: ${error.message}`);
        }
    };

    // Open modal for edit
    const handleEdit = (program) => {
        setSelectedProgram(program);
        setFormData({
            name: program.name,
            shortName: program.shortName || "",
            description: program.description,
            shortDescription: program.shortDescription || "",
            department: program.department?._id || program.department || "",
            duration: program.duration || "",
            credits: program.credits || 0,
            tuition: program.tuition || {
                domestic: 0,
                international: 0,
                currency: "USD"
            },
            intakePeriods: program.intakePeriods || [],
            applicationDeadline: program.applicationDeadline ?
                new Date(program.applicationDeadline).toISOString().split('T')[0] : "",
            curriculum: program.curriculum || [],
            admissionRequirements: program.admissionRequirements || [],
            careerPaths: program.careerPaths || [],
            provider: program.provider || "SIMAD University",
            iconUrl: program.iconUrl || "",
            coverImage: program.coverImage || "",
            externalLink: program.externalLink || "",
            isActive: program.isActive,
            order: program.order || 0
        });
        setIsEdit(true);
        setModal(true);
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedProgram(null);
        setFormData({
            name: "",
            shortName: "",
            description: "",
            shortDescription: "",
            department: "",
            duration: "",
            credits: 0,
            tuition: {
                domestic: "",
                international: "",
                currency: "USD"
            },
            intakePeriods: [],
            applicationDeadline: "",
            curriculum: [],
            admissionRequirements: [],
            careerPaths: [],
            provider: "SIMAD University",
            iconUrl: "",
            coverImage: "",
            externalLink: "",
            isActive: true,
            order: 0
        });
        setCurriculumItem({
            title: "",
            description: "",
            icon: "",
            order: 0
        });
        setCareerPathItem({
            title: "",
            description: "",
            icon: "",
            order: 0
        });
        setIsEdit(false);
        setModal(true);
    };

    // Table columns
    const columns = [
        {
            name: '#',
            cell: (row, index) => index + 1,

        },
        {
            name: 'Name',
            selector: row => row.name,
            sortable: true,

        },
        {
            name: 'Short Name',
            selector: row => row.shortName || '-',
            sortable: true,

        },
        {
            name: 'Department',
            selector: row => row.department?.name || '-',
            sortable: true,

        },
        {
            name: 'Duration',
            selector: row => row.duration || '-',
            width: '100px'
        },
        {
            name: 'Credits',
            selector: row => row.credits || 0,
            sortable: true,

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

                    {/* View Button */}
                    <Button color="soft-info" size="sm" onClick={() => {
                        setSelectedProgram(row);
                        setViewModal(true);
                    }}>
                        <i className="ri-eye-line" />
                    </Button>
                    <Button color="soft-primary" size="sm" onClick={() => handleEdit(row)}>
                        <i className="ri-pencil-line" />
                    </Button>
                    <Button color="soft-danger" size="sm" onClick={() => {
                        setSelectedProgram(row);
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
        fetchPrograms();
        fetchDepartments();
    }, [filters]);

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Programs" pageTitle="Academics" />

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
                                        placeholder="Search by name"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={3}>
                                <FormGroup>
                                    <Label>Department</Label>
                                    <Select
                                        options={departments.map(dept => ({ value: dept._id, label: dept.name }))}
                                        value={departments.find(dept => dept._id === filters.department) ?
                                            { value: filters.department, label: departments.find(dept => dept._id === filters.department).name } : null}
                                        onChange={(opt) => handleSelectFilterChange('department', opt)}
                                        isClearable
                                        placeholder="Select department"
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
                                <Button color="primary" onClick={fetchPrograms} disabled={loading}>
                                    {loading ? 'Filtering...' : 'Apply Filters'}
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Data Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Programs List</h5>
                        <Button color="primary" onClick={handleCreate}>
                            <i className="ri-add-line me-1" /> Add Program
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
                                data={programs}
                                pagination
                                highlightOnHover
                                responsive
                                noDataComponent="No programs found matching your criteria"
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={modal}
                toggle={() => setModal(false)}
                size="xl"
                style={{ maxWidth: '1200px', width: '90%' }}
            >
                <ModalHeader toggle={() => setModal(false)}>
                    {isEdit ? 'Edit Program' : 'Add New Program'}
                </ModalHeader>

                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        isEdit ? updateProgram() : createProgram();
                    }}
                >
                    <ModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>

                        {/* Step Navigation */}
                        <div className="step-arrow-nav mb-4">
                            <Nav className="nav-pills custom-nav nav-justified" role="tablist">
                                <NavItem>
                                    <NavLink
                                        href="#"
                                        className={classnames({ active: activeStep === 1 })}
                                        onClick={() => setActiveStep(1)}
                                    >
                                        General Info
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        href="#"
                                        className={classnames({ active: activeStep === 2 })}
                                        onClick={() => setActiveStep(2)}
                                    >
                                        Tuition & Intake
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        href="#"
                                        className={classnames({ active: activeStep === 3 })}
                                        onClick={() => setActiveStep(3)}
                                    >
                                        Curriculum & Careers
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        href="#"
                                        className={classnames({ active: activeStep === 4 })}
                                        onClick={() => setActiveStep(4)}
                                    >
                                        Additional Info
                                    </NavLink>
                                </NavItem>
                            </Nav>
                        </div>

                        {/* Step Content */}
                        <TabContent activeTab={activeStep}>

                            {/* STEP 1: General Info */}
                            <TabPane tabId={1}>
                                <Row>
                                    <Col md={8}>
                                        <FormGroup>
                                            <Label>Program Name <span className="text-danger">*</span></Label>
                                            <Input name="name" value={formData.name} onChange={handleInputChange} required />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Short Name</Label>
                                            <Input name="shortName" value={formData.shortName} onChange={handleInputChange} />
                                        </FormGroup>
                                    </Col>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label>Description <span className="text-danger">*</span></Label>
                                            <Input type="textarea" name="description" value={formData.description} onChange={handleInputChange} required rows="3" />
                                        </FormGroup>
                                    </Col>
                                    <Col md={12} style={{ display: "none" }}>
                                        <FormGroup>
                                            <Label>Short Description</Label>
                                            <Input
                                                type="textarea"
                                                name="shortDescription"
                                                value={formData.shortDescription}
                                                onChange={handleInputChange}
                                                rows="2"
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </TabPane>

                            {/* STEP 2: Tuition & Intake */}
                            <TabPane tabId={2}>
                                <Row>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Department</Label>
                                            <Select
                                                options={departments.map(d => ({ value: d._id, label: d.name }))}
                                                value={departments.find(d => d._id === formData.department) ?
                                                    { value: formData.department, label: departments.find(d => d._id === formData.department).name } : null}
                                                onChange={(opt) => handleSelectChange('department', opt)}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="programDuration">
                                                Duration <span className="text-muted">(in years)</span>
                                            </Label>
                                            <Input
                                                id="programDuration"
                                                type="text"
                                                name="duration"
                                                value={formData.duration}
                                                onChange={handleInputChange}
                                                min="1"
                                                step="1"
                                                placeholder="e.g., 4"
                                                required
                                            />

                                        </FormGroup>

                                    </Col>
                                    <Col md={12}><h6 className="mt-3 mb-3">Tuition Info</h6></Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Sem Tution Fee</Label>
                                            <Input type="text" name="tuition.domestic" value={formData.tuition.domestic} onChange={handleInputChange} placeholder="Semester Tuition" />

                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Tution Per Month</Label>
                                            <Input type="text" name="tuition.international" value={formData.tuition.international} onChange={handleInputChange} placeholder="Tuition Per Month" />
                                        </FormGroup>
                                    </Col>
                                    <Col md={3} style={{ display: "none" }}>
                                        <FormGroup>
                                            <Label>Credits</Label>
                                            <Input
                                                type="number"
                                                name="credits"
                                                value={formData.credits}
                                                onChange={handleInputChange}
                                                min="0"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Currency</Label>
                                            <Select
                                                options={currencyOptions}
                                                value={currencyOptions.find(opt => opt.value === formData.tuition.currency)}
                                                onChange={(opt) => setFormData(prev => ({
                                                    ...prev,
                                                    tuition: { ...prev.tuition, currency: opt?.value || "USD" }
                                                }))}

                                            />
                                        </FormGroup>
                                    </Col>
                                    {/* Intake Information */}
                                    <Col md={12}>
                                        <h6 className="mt-3 mb-3">Intake Information</h6>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Intake Periods</Label>
                                            <Select
                                                isMulti
                                                options={intakePeriodOptions}
                                                value={intakePeriodOptions.filter(opt =>
                                                    formData.intakePeriods.includes(opt.value)
                                                )}
                                                onChange={(opts) => handleMultiSelectChange('intakePeriods', opts)}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Application Deadline</Label>
                                            <Input
                                                type="date"
                                                name="applicationDeadline"
                                                value={formData.applicationDeadline}
                                                onChange={handleInputChange}
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </TabPane>

                            {/* STEP 3: Curriculum & Careers */}
                            <TabPane tabId={3}>
                                {/* Curriculum */}
                                <Col md={12}>
                                    <h6 className="mb-3">Curriculum</h6>
                                    <Row className="mb-2 align-items-end">
                                        <Col md={4}>
                                            <Input
                                                placeholder="Title"
                                                value={curriculumItem.title}
                                                onChange={(e) => setCurriculumItem({ ...curriculumItem, title: e.target.value })}
                                            />
                                        </Col>
                                        <Col md={5}>
                                            <Input
                                                placeholder="Description"
                                                value={curriculumItem.description}
                                                onChange={(e) => setCurriculumItem({ ...curriculumItem, description: e.target.value })}
                                            />
                                        </Col>
                                        <Col md={2}>
                                            <Input
                                                type="number"
                                                placeholder="Order"
                                                value={curriculumItem.order}
                                                onChange={(e) => setCurriculumItem({ ...curriculumItem, order: parseInt(e.target.value) || 0 })}
                                                min="0"
                                            />
                                        </Col>
                                        <Col md={1} className="d-flex justify-content-end align-items-end">
                                            <Button color="primary" onClick={addCurriculumItem}>
                                                <i className="ri-add-line" />
                                            </Button>
                                        </Col>

                                    </Row>
                                    {formData.curriculum.map((item, index) => (
                                        <div key={index} className="d-flex align-items-center mb-2 p-2 border rounded">
                                            <Badge color="primary" className="me-2">{index + 1}</Badge>
                                            <div className="flex-grow-1">
                                                <strong>{item.title}</strong>: {item.description} (Order: {item.order})
                                            </div>
                                            <Button color="danger" size="sm" onClick={() => removeCurriculumItem(index)}>
                                                <i className="ri-delete-bin-line" />
                                            </Button>
                                        </div>
                                    ))}
                                </Col>

                                {/* Career Paths */}
                                <Col md={12}>
                                    <h6 className="mb-3 mt-3">Career Paths</h6>
                                    <Row className="mb-2 align-items-end">
                                        <Col md={4}>
                                            <Input
                                                placeholder="Title"
                                                value={careerPathItem.title}
                                                onChange={(e) => setCareerPathItem({ ...careerPathItem, title: e.target.value })}
                                            />
                                        </Col>
                                        <Col md={5}>
                                            <Input
                                                placeholder="Description"
                                                value={careerPathItem.description}
                                                onChange={(e) => setCareerPathItem({ ...careerPathItem, description: e.target.value })}
                                            />
                                        </Col>
                                        <Col md={2}>
                                            <Input
                                                type="number"
                                                placeholder="Order"
                                                value={careerPathItem.order}
                                                onChange={(e) => setCareerPathItem({ ...careerPathItem, order: parseInt(e.target.value) || 0 })}
                                                min="0"
                                            />
                                        </Col>
                                        <Col md={1} className="d-flex justify-content-end align-items-end">
                                            <Button color="primary" onClick={addCareerPathItem}>
                                                <i className="ri-add-line" />
                                            </Button>
                                        </Col>
                                    </Row>
                                    {formData.careerPaths.map((item, index) => (
                                        <div key={index} className="d-flex align-items-center mb-2 p-2 border rounded">
                                            <Badge color="primary" className="me-2">{index + 1}</Badge>
                                            <div className="flex-grow-1">
                                                <strong>{item.title}</strong>: {item.description} (Order: {item.order})
                                            </div>
                                            <Button color="danger" size="sm" onClick={() => removeCareerPathItem(index)}>
                                                <i className="ri-delete-bin-line" />
                                            </Button>
                                        </div>
                                    ))}
                                </Col>
                            </TabPane>

                            {/* STEP 4: Additional Info */}
                            <TabPane tabId={4}>
                                <Row>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Icon URL</Label>
                                            <Input name="iconUrl" value={formData.iconUrl} onChange={handleInputChange} />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Cover Image URL</Label>
                                            <Input name="coverImage" value={formData.coverImage} onChange={handleInputChange} />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>External Link</Label>
                                            <Input
                                                name="externalLink"
                                                value={formData.externalLink}
                                                onChange={handleInputChange}
                                                placeholder="External program page URL"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={3}>
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
                                    <Col md={3}>
                                        <FormGroup check className="mt-4 pt-2">
                                            <Input
                                                type="checkbox"
                                                name="isActive"
                                                checked={formData.isActive}
                                                onChange={handleInputChange}
                                                id="isActive"
                                            />
                                            <Label for="isActive" check>
                                                Active Program
                                            </Label>
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </TabPane>

                        </TabContent>

                        {/* Step Navigation Buttons */}
                        <div className="d-flex justify-content-between mt-4">
                            {activeStep > 1 && (
                                <Button color="light" onClick={() => setActiveStep(activeStep - 1)}>
                                    <i className="ri-arrow-left-line me-2"></i> Previous
                                </Button>
                            )}
                            {activeStep < 4 ? (
                                <Button color="success" onClick={() => setActiveStep(activeStep + 1)}>
                                    Next <i className="ri-arrow-right-line ms-2"></i>
                                </Button>
                            ) : (
                                <Button color="primary" type="submit" disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            )}
                        </div>

                    </ModalBody>
                </Form>
            </Modal>


            {/* Delete Confirmation Modal */}
            <DeleteModal
                show={deleteModal}
                onDeleteClick={deleteProgram}
                onCloseClick={() => setDeleteModal(false)}
            />
            {/* View Details Modal */}
            <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="xl" style={{ maxWidth: '1200px', width: '90%' }}>
                <ModalHeader toggle={() => setViewModal(false)}>
                    Program Details: {selectedProgram?.name}
                </ModalHeader>
                <ModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {selectedProgram && (
                        <div>
                            {/* Wizard Navigation */}
                            <div className="step-arrow-nav mb-4">
                                <Nav tabs className="nav-pills custom-nav nav-justified" role="tablist">
                                    <NavItem>
                                        <NavLink
                                            className={activeViewTab === '1' ? 'active' : ''}
                                            onClick={() => setActiveViewTab('1')}
                                        >
                                            Basic Info
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={activeViewTab === '2' ? 'active' : ''}
                                            onClick={() => setActiveViewTab('2')}
                                        >
                                            Tuition & Dates
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={activeViewTab === '3' ? 'active' : ''}
                                            onClick={() => setActiveViewTab('3')}
                                        >
                                            Curriculum
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={activeViewTab === '4' ? 'active' : ''}
                                            onClick={() => setActiveViewTab('4')}
                                        >
                                            Career Paths
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={activeViewTab === '5' ? 'active' : ''}
                                            onClick={() => setActiveViewTab('5')}
                                        >
                                            Additional Info
                                        </NavLink>
                                    </NavItem>
                                </Nav>
                            </div>

                            {/* Tab Content */}
                            <TabContent activeTab={activeViewTab}>
                                {/* Basic Information Tab */}
                                <TabPane tabId="1">
                                    <Row>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label><strong>Name</strong></Label>
                                                <p>{selectedProgram.name}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label><strong>Short Name</strong></Label>
                                                <p>{selectedProgram.shortName || '-'}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md={12}>
                                            <FormGroup>
                                                <Label><strong>Description</strong></Label>
                                                <p>{selectedProgram.description}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md={12}>
                                            <FormGroup>
                                                <Label><strong>Short Description</strong></Label>
                                                <p>{selectedProgram.shortDescription || '-'}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label><strong>Department</strong></Label>
                                                <p>{selectedProgram.department?.name || '-'}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label><strong>Duration</strong></Label>
                                                <p>{selectedProgram.duration || '-'}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label><strong>Credits</strong></Label>
                                                <p>{selectedProgram.credits || 0}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label><strong>Status</strong></Label>
                                                <p>
                                                    <Badge color={selectedProgram.isActive ? 'success' : 'danger'}>
                                                        {selectedProgram.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </p>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </TabPane>

                                {/* Tuition & Dates Tab */}
                                <TabPane tabId="2">
                                    <Row>
                                        <Col md={12}>
                                            <h6 className="mb-3">Tuition Information</h6>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label><strong>Domestic Tuition</strong></Label>
                                                <p>{selectedProgram.tuition?.domestic ? `${selectedProgram.tuition.domestic} ${selectedProgram.tuition.currency || 'USD'}` : '-'}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label><strong>International Tuition</strong></Label>
                                                <p>{selectedProgram.tuition?.international ? `${selectedProgram.tuition.international} ${selectedProgram.tuition.currency || 'USD'}` : '-'}</p>
                                            </FormGroup>
                                        </Col>

                                        <Col md={12}>
                                            <h6 className="mb-3 mt-4">Intake Information</h6>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label><strong>Intake Periods</strong></Label>
                                                <p>
                                                    {selectedProgram.intakePeriods && selectedProgram.intakePeriods.length > 0
                                                        ? selectedProgram.intakePeriods.join(', ')
                                                        : '-'
                                                    }
                                                </p>
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label><strong>Application Deadline</strong></Label>
                                                <p>
                                                    {selectedProgram.applicationDeadline
                                                        ? new Date(selectedProgram.applicationDeadline).toLocaleDateString()
                                                        : '-'
                                                    }
                                                </p>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </TabPane>

                                {/* Curriculum Tab */}
                                <TabPane tabId="3">
                                    <Row>
                                        <Col md={12}>
                                            {selectedProgram.curriculum && selectedProgram.curriculum.length > 0 ? (
                                                <>
                                                    <h6 className="mb-3">Curriculum</h6>
                                                    <div className="curriculum-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                        {selectedProgram.curriculum.map((item, index) => (
                                                            <div key={index} className="mb-2 p-2 border rounded">
                                                                <strong>{item.title}</strong>
                                                                <p className="mb-1">{item.description}</p>
                                                                <small className="text-muted">Order: {item.order || 0}</small>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p>No curriculum information available</p>
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                </TabPane>

                                {/* Career Paths Tab */}
                                <TabPane tabId="4">
                                    <Row>
                                        <Col md={12}>
                                            {selectedProgram.careerPaths && selectedProgram.careerPaths.length > 0 ? (
                                                <>
                                                    <h6 className="mb-3">Career Paths</h6>
                                                    <div className="career-paths-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                        {selectedProgram.careerPaths.map((item, index) => (
                                                            <div key={index} className="mb-2 p-2 border rounded">
                                                                <strong>{item.title}</strong>
                                                                <p className="mb-1">{item.description}</p>
                                                                <small className="text-muted">Order: {item.order || 0}</small>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p>No career paths information available</p>
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                </TabPane>

                                {/* Additional Information Tab */}
                                <TabPane tabId="5">
                                    <Row>
                                        <Col md={12}>
                                            <h6 className="mb-3">Additional Information</h6>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label><strong>Provider</strong></Label>
                                                <p>{selectedProgram.provider || 'SIMAD University'}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label><strong>Order</strong></Label>
                                                <p>{selectedProgram.order || 0}</p>
                                            </FormGroup>
                                        </Col>
                                        {selectedProgram.iconUrl && (
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label><strong>Icon URL</strong></Label>
                                                    <p>
                                                        <a href={selectedProgram.iconUrl} target="_blank" rel="noopener noreferrer">
                                                            View Icon
                                                        </a>
                                                    </p>
                                                </FormGroup>
                                            </Col>
                                        )}
                                        {selectedProgram.coverImage && (
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label><strong>Cover Image URL</strong></Label>
                                                    <p>
                                                        <a href={selectedProgram.coverImage} target="_blank" rel="noopener noreferrer">
                                                            View Cover Image
                                                        </a>
                                                    </p>
                                                </FormGroup>
                                            </Col>
                                        )}
                                        {selectedProgram.externalLink && (
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label><strong>External Link</strong></Label>
                                                    <p>
                                                        <a href={selectedProgram.externalLink} target="_blank" rel="noopener noreferrer">
                                                            Visit External Page
                                                        </a>
                                                    </p>
                                                </FormGroup>
                                            </Col>
                                        )}
                                    </Row>
                                </TabPane>
                            </TabContent>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>

                    <Button color="light" onClick={() => setViewModal(false)}>
                        Close
                    </Button>
                </ModalFooter>
            </Modal>
            <ToastContainer />
        </div>
    );
};

export default Programs;