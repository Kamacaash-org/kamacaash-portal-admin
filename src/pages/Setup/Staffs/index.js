import React, { useState, useEffect } from 'react';
import DataTable from "react-data-table-component";
import Select from "react-select";
import {
    Card, CardHeader, CardBody,
    Col, Container, Row,
    Form, Input, Label, FormGroup,
    Modal, ModalBody, ModalFooter, ModalHeader,
    Button, Badge, FormFeedback,
    Nav, NavItem, NavLink,
    TabContent, TabPane
} from "reactstrap";
import classnames from 'classnames';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import { api } from "../../../config";

const Staffs = () => {
    document.title = "Staff | simad University";

    // State management
    const [staffs, setStaffs] = useState([]);
    const [schools, setSchools] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modal, setModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [activeStep, setActiveStep] = useState(1); // Wizard step state

    const [activeViewTab, setActiveViewTab] = useState('1');


    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        role: '',
        department: '',
        status: ''
    });

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        title: "",
        bio: "",
        message: "",
        photoUrl: "",
        email: "",
        phone: "",
        officeLocation: "",
        role: "Professor",
        school: "",
        department: "",
        isResearchContributor: false,
        researchInterests: [],
        professionalExperience: [],
        publications: [],
        education: [],
        awards: [],
        isActive: true,
        order: 0
    });

    // Item states for nested arrays
    const [experienceItem, setExperienceItem] = useState({
        position: "",
        organization: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        description: "",
        achievements: []
    });

    const [publicationItem, setPublicationItem] = useState({
        title: "",
        journalOrConference: "",
        publicationDate: "",
        authors: [],
        link: "",
        isSelected: false
    });

    const [educationItem, setEducationItem] = useState({
        degree: "",
        fieldOfStudy: "",
        institution: "",
        graduationYear: "",
        country: "",
        thesisTitle: ""
    });

    const [awardItem, setAwardItem] = useState({
        title: "",
        awardingBody: "",
        year: "",
        description: ""
    });

    const [achievementInput, setAchievementInput] = useState("");
    const [authorInput, setAuthorInput] = useState("");
    const [researchInterestInput, setResearchInterestInput] = useState("");

    // Options for selects
    const statusOptions = [
        { value: "", label: "All Statuses" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" }
    ];

    const roleOptions = [
        { value: "", label: "All Roles" },
        { value: "Dean", label: "Dean" },
        { value: "Department Head", label: "Department Head" },
        { value: "Professor", label: "Professor" },
        { value: "Lecturer", label: "Lecturer" },
        { value: "Administrator", label: "Administrator" },
        { value: "Coordinator", label: "Coordinator" },
        { value: "Other", label: "Other" }
    ];

    // Fetch staff with filters
    const fetchStaffs = async () => {
        setLoading(true);
        setError(null);
        try {
            // Build query params
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.role) params.append('role', filters.role);
            if (filters.department) params.append('department', filters.department);
            if (filters.status) params.append('isActive', filters.status === 'Active');

            const response = await fetch(`${api.API_URL}/staff?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to fetch staff');

            setStaffs(data.data.staff || []);
        } catch (error) {
            setError(error.message);
            toast.error(`Error loading staff: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Fetch schools and departments for dropdowns
    const fetchSchoolsAndDepartments = async () => {
        try {
            // Fetch schools
            const schoolsResponse = await fetch(`${api.API_URL}/schools?isActive=true`);
            const schoolsData = await schoolsResponse.json();

            if (schoolsResponse.ok) {
                setSchools(schoolsData.data.schools || []);
            }

            // Fetch departments
            const deptsResponse = await fetch(`${api.API_URL}/departments?isActive=true`);
            const deptsData = await deptsResponse.json();

            if (deptsResponse.ok) {
                setDepartments(deptsData.data.departments || []);
            }
        } catch (error) {
            console.error("Error fetching schools/departments:", error);
            toast.error(`Error loading schools/departments: ${error.message}`);
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

    // Add research interest
    const addResearchInterest = () => {
        if (!researchInterestInput.trim()) return;

        setFormData(prev => ({
            ...prev,
            researchInterests: [...prev.researchInterests, researchInterestInput.trim()]
        }));

        setResearchInterestInput("");
    };

    // Remove research interest
    const removeResearchInterest = (index) => {
        setFormData(prev => ({
            ...prev,
            researchInterests: prev.researchInterests.filter((_, i) => i !== index)
        }));
    };

    // Add professional experience
    const addExperience = () => {
        if (!experienceItem.position || !experienceItem.organization || !experienceItem.startDate) {
            toast.warning("Please fill in position, organization, and start date");
            return;
        }

        setFormData(prev => ({
            ...prev,
            professionalExperience: [...prev.professionalExperience, { ...experienceItem }]
        }));

        setExperienceItem({
            position: "",
            organization: "",
            startDate: "",
            endDate: "",
            isCurrent: false,
            description: "",
            achievements: []
        });
    };

    // Remove professional experience
    const removeExperience = (index) => {
        setFormData(prev => ({
            ...prev,
            professionalExperience: prev.professionalExperience.filter((_, i) => i !== index)
        }));
    };

    // Add achievement to current experience item
    const addAchievement = () => {
        if (!achievementInput.trim()) return;

        setExperienceItem(prev => ({
            ...prev,
            achievements: [...prev.achievements, achievementInput.trim()]
        }));

        setAchievementInput("");
    };

    // Remove achievement from current experience item
    const removeAchievement = (index) => {
        setExperienceItem(prev => ({
            ...prev,
            achievements: prev.achievements.filter((_, i) => i !== index)
        }));
    };

    // Add publication
    const addPublication = () => {
        if (!publicationItem.title || !publicationItem.journalOrConference || !publicationItem.publicationDate) {
            toast.warning("Please fill in title, journal/conference, and publication date");
            return;
        }

        setFormData(prev => ({
            ...prev,
            publications: [...prev.publications, { ...publicationItem }]
        }));

        setPublicationItem({
            title: "",
            journalOrConference: "",
            publicationDate: "",
            authors: [],
            link: "",
            isSelected: false
        });
    };

    // Remove publication
    const removePublication = (index) => {
        setFormData(prev => ({
            ...prev,
            publications: prev.publications.filter((_, i) => i !== index)
        }));
    };

    // Add author to current publication item
    const addAuthor = () => {
        if (!authorInput.trim()) return;

        setPublicationItem(prev => ({
            ...prev,
            authors: [...prev.authors, authorInput.trim()]
        }));

        setAuthorInput("");
    };

    // Remove author from current publication item
    const removeAuthor = (index) => {
        setPublicationItem(prev => ({
            ...prev,
            authors: prev.authors.filter((_, i) => i !== index)
        }));
    };

    // Add education
    const addEducation = () => {
        if (!educationItem.degree || !educationItem.fieldOfStudy || !educationItem.institution || !educationItem.graduationYear) {
            toast.warning("Please fill in degree, field of study, institution, and graduation year");
            return;
        }

        setFormData(prev => ({
            ...prev,
            education: [...prev.education, { ...educationItem }]
        }));

        setEducationItem({
            degree: "",
            fieldOfStudy: "",
            institution: "",
            graduationYear: "",
            country: "",
            thesisTitle: ""
        });
    };

    // Remove education
    const removeEducation = (index) => {
        setFormData(prev => ({
            ...prev,
            education: prev.education.filter((_, i) => i !== index)
        }));
    };

    // Add award
    const addAward = () => {
        if (!awardItem.title || !awardItem.awardingBody || !awardItem.year) {
            toast.warning("Please fill in title, awarding body, and year");
            return;
        }

        setFormData(prev => ({
            ...prev,
            awards: [...prev.awards, { ...awardItem }]
        }));

        setAwardItem({
            title: "",
            awardingBody: "",
            year: "",
            description: ""
        });
    };

    // Remove award
    const removeAward = (index) => {
        setFormData(prev => ({
            ...prev,
            awards: prev.awards.filter((_, i) => i !== index)
        }));
    };

    // Validate form
    const validateForm = () => {
        const requiredFields = ['name', 'title', 'email', 'role'];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            toast.warning(`Please fill all required fields: ${missingFields.join(', ')}`);
            return false;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.warning("Please enter a valid email address");
            return false;
        }

        if (formData.order < 0) {
            toast.warning("Order cannot be negative");
            return false;
        }

        return true;
    };

    // Create new staff
    const createStaff = async () => {
        if (!validateForm()) return;

        try {
            const authUser = JSON.parse(sessionStorage.getItem("authUser"));
            const staffData = {
                ...formData,
                createdBy: authUser?.data?.user?.username || "Admin"
            };

            const response = await fetch(`${api.API_URL}/staff`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(staffData)
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to create staff');

            toast.success("Staff created successfully");
            fetchStaffs();
            setModal(false);
        } catch (error) {
            toast.error(`Error creating staff: ${error.message}`);
        }
    };

    // Update staff
    const updateStaff = async () => {
        if (!validateForm() || !selectedStaff) return;

        try {
            const authUser = JSON.parse(sessionStorage.getItem("authUser"));
            const staffData = {
                ...formData,
                _id: selectedStaff._id,
                updatedBy: authUser?.data?.user?.username || "Admin"
            };

            const response = await fetch(`${api.API_URL}/staff/${selectedStaff._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(staffData)
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to update staff');

            toast.success("Staff updated successfully");
            fetchStaffs();
            setModal(false);
        } catch (error) {
            toast.error(`Error updating staff: ${error.message}`);
        }
    };

    // Delete staff
    const deleteStaff = async () => {
        if (!selectedStaff) return;

        try {
            const response = await fetch(`${api.API_URL}/staff/${selectedStaff._id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to delete staff');

            toast.success("Staff deleted successfully");
            setDeleteModal(false);
            fetchStaffs();
        } catch (error) {
            toast.error(`Error deleting staff: ${error.message}`);
        }
    };

    // Open modal for edit
    const handleEdit = (staff) => {
        setSelectedStaff(staff);
        setFormData({
            name: staff.name,
            title: staff.title,
            bio: staff.bio || "",
            message: staff.message || "",
            photoUrl: staff.photoUrl || "",
            email: staff.email,
            phone: staff.phone || "",
            officeLocation: staff.officeLocation || "",
            role: staff.role,
            school: staff.school?._id || staff.school || "",
            department: staff.department?._id || staff.department || "",
            isResearchContributor: staff.isResearchContributor || false,
            researchInterests: staff.researchInterests || [],
            professionalExperience: staff.professionalExperience || [],
            publications: staff.publications || [],
            education: staff.education || [],
            awards: staff.awards || [],
            isActive: staff.isActive,
            order: staff.order || 0
        });
        setIsEdit(true);
        setModal(true);
        setActiveStep(1);
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedStaff(null);
        setFormData({
            name: "",
            title: "",
            bio: "",
            message: "",
            photoUrl: "",
            email: "",
            phone: "",
            officeLocation: "",
            role: "Professor",
            school: "",
            department: "",
            isResearchContributor: false,
            researchInterests: [],
            professionalExperience: [],
            publications: [],
            education: [],
            awards: [],
            isActive: true,
            order: 0
        });
        setExperienceItem({
            position: "",
            organization: "",
            startDate: "",
            endDate: "",
            isCurrent: false,
            description: "",
            achievements: []
        });
        setPublicationItem({
            title: "",
            journalOrConference: "",
            publicationDate: "",
            authors: [],
            link: "",
            isSelected: false
        });
        setEducationItem({
            degree: "",
            fieldOfStudy: "",
            institution: "",
            graduationYear: "",
            country: "",
            thesisTitle: ""
        });
        setAwardItem({
            title: "",
            awardingBody: "",
            year: "",
            description: ""
        });
        setAchievementInput("");
        setAuthorInput("");
        setResearchInterestInput("");
        setIsEdit(false);
        setModal(true);
        setActiveStep(1);
    };

    // Open view modal
    const handleView = (staff) => {
        setSelectedStaff(staff);
        setViewModal(true);
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
            name: 'Title',
            selector: row => row.title,
            sortable: true,
        },
        {
            name: 'Email',
            selector: row => row.email,
            sortable: true,
        },
        {
            name: 'Role',
            selector: row => row.role,
            sortable: true,
        },
        {
            name: 'Department',
            selector: row => row.department?.name || '-',
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
                    <Button color="soft-info" size="sm" onClick={() => handleView(row)}>
                        <i className="ri-eye-line" />
                    </Button>
                    <Button color="soft-primary" size="sm" onClick={() => handleEdit(row)}>
                        <i className="ri-pencil-line" />
                    </Button>
                    <Button color="soft-danger" size="sm" onClick={() => {
                        setSelectedStaff(row);
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
        fetchStaffs();
        fetchSchoolsAndDepartments();
    }, [filters]);

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Staff Members" pageTitle="Academics" />

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
                            <Col md={2} className="d-flex align-items-end mb-3">
                                <Button color="primary" onClick={fetchStaffs} disabled={loading}>
                                    {loading ? 'Filtering...' : 'Apply Filters'}
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Data Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Staff Members List</h5>
                        <Button color="primary" onClick={handleCreate}>
                            <i className="ri-add-line me-1" /> Add Staff
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
                                data={staffs}
                                pagination
                                highlightOnHover
                                responsive
                                noDataComponent="No staff members found matching your criteria"
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Add/Edit Modal */}
            <Modal isOpen={modal} toggle={() => setModal(false)} size="xl" style={{ maxWidth: '1200px', width: '90%' }}>
                <ModalHeader toggle={() => setModal(false)}>
                    {isEdit ? 'Edit Staff Member' : 'Add New Staff Member'}
                </ModalHeader>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    isEdit ? updateStaff() : createStaff();
                }}>
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
                                        <i className="ri-user-line me-1"></i> Basic Info
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        href="#"
                                        className={classnames({ active: activeStep === 2 })}
                                        onClick={() => setActiveStep(2)}
                                    >
                                        <i className="ri-search-line me-1"></i> Research
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        href="#"
                                        className={classnames({ active: activeStep === 3 })}
                                        onClick={() => setActiveStep(3)}
                                    >
                                        <i className="ri-briefcase-line me-1"></i> Experience
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        href="#"
                                        className={classnames({ active: activeStep === 4 })}
                                        onClick={() => setActiveStep(4)}
                                    >
                                        <i className="ri-graduation-cap-line me-1"></i> Education
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        href="#"
                                        className={classnames({ active: activeStep === 5 })}
                                        onClick={() => setActiveStep(5)}
                                    >
                                        <i className="ri-article-line me-1"></i> Publications
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        href="#"
                                        className={classnames({ active: activeStep === 6 })}
                                        onClick={() => setActiveStep(6)}
                                    >
                                        <i className="ri-trophy-line me-1"></i> Awards
                                    </NavLink>
                                </NavItem>
                            </Nav>
                        </div>

                        <TabContent activeTab={activeStep}>
                            {/* Step 1: Basic Information */}
                            <TabPane tabId={1}>
                                <div className="card border">
                                    <div className="card-header bg-light">
                                        <h6 className="card-title mb-0">Basic Information</h6>
                                    </div>
                                    <div className="card-body">
                                        <Row>
                                            <Col md={8}>
                                                <FormGroup>
                                                    <Label>Full Name <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>Title <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="title"
                                                        value={formData.title}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>Email <span className="text-danger">*</span></Label>
                                                    <Input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>Phone</Label>
                                                    <Input
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>Role <span className="text-danger">*</span></Label>
                                                    <Select
                                                        options={roleOptions.filter(opt => opt.value !== "")}
                                                        value={roleOptions.find(opt => opt.value === formData.role)}
                                                        onChange={(opt) => handleSelectChange('role', opt)}
                                                        required
                                                        className="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>Office Location</Label>
                                                    <Input
                                                        name="officeLocation"
                                                        value={formData.officeLocation}
                                                        onChange={handleInputChange}
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>School</Label>
                                                    <Select
                                                        options={schools.map(school => ({ value: school._id, label: school.name }))}
                                                        value={schools.find(school => school._id === formData.school) ?
                                                            { value: formData.school, label: schools.find(school => school._id === formData.school).name } : null}
                                                        onChange={(opt) => handleSelectChange('school', opt)}
                                                        isClearable
                                                        className="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>Department</Label>
                                                    <Select
                                                        options={departments.map(dept => ({ value: dept._id, label: dept.name }))}
                                                        value={departments.find(dept => dept._id === formData.department) ?
                                                            { value: formData.department, label: departments.find(dept => dept._id === formData.department).name } : null}
                                                        onChange={(opt) => handleSelectChange('department', opt)}
                                                        isClearable
                                                        className="react-select"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={12}>
                                                <FormGroup>
                                                    <Label>Bio</Label>
                                                    <Input
                                                        type="textarea"
                                                        name="bio"
                                                        value={formData.bio}
                                                        onChange={handleInputChange}
                                                        rows="3"
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={12}>
                                                <FormGroup>
                                                    <Label>Message</Label>
                                                    <Input
                                                        type="textarea"
                                                        name="message"
                                                        value={formData.message}
                                                        onChange={handleInputChange}
                                                        rows="2"
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={12}>
                                                <FormGroup>
                                                    <Label>Photo URL</Label>
                                                    <Input
                                                        name="photoUrl"
                                                        value={formData.photoUrl}
                                                        onChange={handleInputChange}
                                                        placeholder="URL to staff photo"
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </div>
                                </div>
                            </TabPane>

                            {/* Step 2: Research Information */}
                            <TabPane tabId={2}>
                                <div className="card border">
                                    <div className="card-header bg-light">
                                        <h6 className="card-title mb-0">Research Information</h6>
                                    </div>
                                    <div className="card-body">
                                        <Row>
                                            <Col md={12}>
                                                <FormGroup check className="mb-4">
                                                    <Input
                                                        type="checkbox"
                                                        name="isResearchContributor"
                                                        checked={formData.isResearchContributor}
                                                        onChange={handleInputChange}
                                                        id="isResearchContributor"
                                                    />
                                                    <Label for="isResearchContributor" check className="fs-5">
                                                        Research Contributor
                                                    </Label>
                                                </FormGroup>
                                            </Col>
                                            <Col md={12}>
                                                <FormGroup>
                                                    <Label className="fw-semibold">Research Interests</Label>
                                                    <div className="d-flex mb-2">
                                                        <Input
                                                            value={researchInterestInput}
                                                            onChange={(e) => setResearchInterestInput(e.target.value)}
                                                            placeholder="Add research interest"
                                                            className="form-control"
                                                        />
                                                        <Button color="primary" onClick={addResearchInterest} className="ms-2">
                                                            <i className="ri-add-line" />
                                                        </Button>
                                                    </div>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {formData.researchInterests.map((interest, index) => (
                                                            <Badge key={index} color="primary" className="p-2 d-flex align-items-center fs-6">
                                                                {interest}
                                                                <Button color="link" size="sm" className="p-0 ms-1 text-light" onClick={() => removeResearchInterest(index)}>
                                                                    <i className="ri-close-line" />
                                                                </Button>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </div>
                                </div>
                            </TabPane>

                            {/* Step 3: Professional Experience */}
                            <TabPane tabId={3}>
                                <div className="card border">
                                    <div className="card-header bg-light">
                                        <h6 className="card-title mb-0">Professional Experience</h6>
                                    </div>
                                    <div className="card-body">
                                        <Row className="mb-4">
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>Position</Label>
                                                    <Input
                                                        placeholder="Position"
                                                        value={experienceItem.position}
                                                        onChange={(e) => setExperienceItem({ ...experienceItem, position: e.target.value })}
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>Organization</Label>
                                                    <Input
                                                        placeholder="Organization"
                                                        value={experienceItem.organization}
                                                        onChange={(e) => setExperienceItem({ ...experienceItem, organization: e.target.value })}
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>Start Date</Label>
                                                    <Input
                                                        type="date"
                                                        placeholder="Start Date"
                                                        value={experienceItem.startDate}
                                                        onChange={(e) => setExperienceItem({ ...experienceItem, startDate: e.target.value })}
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>End Date</Label>
                                                    <Input
                                                        type="date"
                                                        placeholder="End Date"
                                                        value={experienceItem.endDate}
                                                        onChange={(e) => setExperienceItem({ ...experienceItem, endDate: e.target.value })}
                                                        disabled={experienceItem.isCurrent}
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup check className="mt-4 pt-2">
                                                    <Input
                                                        type="checkbox"
                                                        checked={experienceItem.isCurrent}
                                                        onChange={(e) => setExperienceItem({ ...experienceItem, isCurrent: e.target.checked, endDate: "" })}
                                                        id="isCurrent"
                                                    />
                                                    <Label for="isCurrent" check>
                                                        Current Position
                                                    </Label>
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>Description</Label>
                                                    <Input
                                                        placeholder="Description"
                                                        value={experienceItem.description}
                                                        onChange={(e) => setExperienceItem({ ...experienceItem, description: e.target.value })}
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={12}>
                                                <FormGroup>
                                                    <Label>Achievements</Label>
                                                    <div className="d-flex mb-2">
                                                        <Input
                                                            value={achievementInput}
                                                            onChange={(e) => setAchievementInput(e.target.value)}
                                                            placeholder="Add achievement"
                                                            className="form-control"
                                                        />
                                                        <Button color="primary" onClick={addAchievement} className="ms-2">
                                                            <i className="ri-add-line" />
                                                        </Button>
                                                    </div>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {experienceItem.achievements.map((achievement, index) => (
                                                            <Badge key={index} color="info" className="p-2 d-flex align-items-center">
                                                                {achievement}
                                                                <Button color="link" size="sm" className="p-0 ms-1 text-light" onClick={() => removeAchievement(index)}>
                                                                    <i className="ri-close-line" />
                                                                </Button>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </FormGroup>
                                            </Col>
                                            <Col md={12} className="mt-2">
                                                <Button color="primary" onClick={addExperience} className="btn-lg">
                                                    <i className="ri-add-line me-1" /> Add Experience
                                                </Button>
                                            </Col>
                                        </Row>

                                        {formData.professionalExperience.length > 0 && (
                                            <div className="mt-4">
                                                <h6 className="mb-3">Added Experiences</h6>
                                                {formData.professionalExperience.map((exp, index) => (
                                                    <div key={index} className="mb-3 p-3 border rounded bg-light">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <h6 className="mb-1">{exp.position} at {exp.organization}</h6>
                                                            <Button color="danger" size="sm" onClick={() => removeExperience(index)}>
                                                                <i className="ri-delete-bin-line" />
                                                            </Button>
                                                        </div>
                                                        <p className="mb-1">
                                                            {new Date(exp.startDate).toLocaleDateString()} -
                                                            {exp.isCurrent ? ' Present' : ` ${new Date(exp.endDate).toLocaleDateString()}`}
                                                        </p>
                                                        <p className="mb-1">{exp.description}</p>
                                                        {exp.achievements && exp.achievements.length > 0 && (
                                                            <div>
                                                                <strong>Achievements:</strong>
                                                                <ul className="mb-0">
                                                                    {exp.achievements.map((achievement, i) => (
                                                                        <li key={i}>{achievement}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabPane>

                            {/* Step 4: Education */}
                            <TabPane tabId={4}>
                                <div className="card border">
                                    <div className="card-header bg-light">
                                        <h6 className="card-title mb-0">Education Background</h6>
                                    </div>
                                    <div className="card-body">
                                        <Row className="mb-4">
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>Degree</Label>
                                                    <Input
                                                        placeholder="Degree"
                                                        value={educationItem.degree}
                                                        onChange={(e) => setEducationItem({ ...educationItem, degree: e.target.value })}
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>Field of Study</Label>
                                                    <Input
                                                        placeholder="Field of Study"
                                                        value={educationItem.fieldOfStudy}
                                                        onChange={(e) => setEducationItem({ ...educationItem, fieldOfStudy: e.target.value })}
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>Institution</Label>
                                                    <Input
                                                        placeholder="Institution"
                                                        value={educationItem.institution}
                                                        onChange={(e) => setEducationItem({ ...educationItem, institution: e.target.value })}
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>Graduation Year</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="Graduation Year"
                                                        value={educationItem.graduationYear}
                                                        onChange={(e) => setEducationItem({ ...educationItem, graduationYear: e.target.value })}
                                                        min="1900"
                                                        max="2100"
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>Country</Label>
                                                    <Input
                                                        placeholder="Country"
                                                        value={educationItem.country}
                                                        onChange={(e) => setEducationItem({ ...educationItem, country: e.target.value })}
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>Thesis Title</Label>
                                                    <Input
                                                        placeholder="Thesis Title"
                                                        value={educationItem.thesisTitle}
                                                        onChange={(e) => setEducationItem({ ...educationItem, thesisTitle: e.target.value })}
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={12} className="mt-2">
                                                <Button color="primary" onClick={addEducation} className="btn-lg">
                                                    <i className="ri-add-line me-1" /> Add Education
                                                </Button>
                                            </Col>
                                        </Row>

                                        {formData.education.length > 0 && (
                                            <div className="mt-4">
                                                <h6 className="mb-3">Added Education</h6>
                                                {formData.education.map((edu, index) => (
                                                    <div key={index} className="mb-3 p-3 border rounded bg-light">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <h6 className="mb-1">{edu.degree} in {edu.fieldOfStudy}</h6>
                                                            <Button color="danger" size="sm" onClick={() => removeEducation(index)}>
                                                                <i className="ri-delete-bin-line" />
                                                            </Button>
                                                        </div>
                                                        <p className="mb-1">{edu.institution}, {edu.graduationYear}</p>
                                                        {edu.country && <p className="mb-1">Country: {edu.country}</p>}
                                                        {edu.thesisTitle && <p className="mb-0">Thesis: {edu.thesisTitle}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabPane>

                            {/* Step 5: Publications */}
                            <TabPane tabId={5}>
                                <div className="card border">
                                    <div className="card-header bg-light">
                                        <h6 className="card-title mb-0">Publications</h6>
                                    </div>
                                    <div className="card-body">
                                        <Row className="mb-4">
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>Title</Label>
                                                    <Input
                                                        placeholder="Title"
                                                        value={publicationItem.title}
                                                        onChange={(e) => setPublicationItem({ ...publicationItem, title: e.target.value })}
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>Journal/Conference</Label>
                                                    <Input
                                                        placeholder="Journal/Conference"
                                                        value={publicationItem.journalOrConference}
                                                        onChange={(e) => setPublicationItem({ ...publicationItem, journalOrConference: e.target.value })}
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>Publication Date</Label>
                                                    <Input
                                                        type="date"
                                                        placeholder="Publication Date"
                                                        value={publicationItem.publicationDate}
                                                        onChange={(e) => setPublicationItem({ ...publicationItem, publicationDate: e.target.value })}
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>Link</Label>
                                                    <Input
                                                        placeholder="Link"
                                                        value={publicationItem.link}
                                                        onChange={(e) => setPublicationItem({ ...publicationItem, link: e.target.value })}
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={12}>
                                                <FormGroup>
                                                    <Label>Authors</Label>
                                                    <div className="d-flex mb-2">
                                                        <Input
                                                            value={authorInput}
                                                            onChange={(e) => setAuthorInput(e.target.value)}
                                                            placeholder="Add author"
                                                            className="form-control"
                                                        />
                                                        <Button color="primary" onClick={addAuthor} className="ms-2">
                                                            <i className="ri-add-line" />
                                                        </Button>
                                                    </div>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {publicationItem.authors.map((author, index) => (
                                                            <Badge key={index} color="warning" className="p-2 d-flex align-items-center text-dark">
                                                                {author}
                                                                <Button color="link" size="sm" className="p-0 ms-1 text-dark" onClick={() => removeAuthor(index)}>
                                                                    <i className="ri-close-line" />
                                                                </Button>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </FormGroup>
                                            </Col>
                                            <Col md={12} className="mt-2">
                                                <FormGroup check>
                                                    <Input
                                                        type="checkbox"
                                                        checked={publicationItem.isSelected}
                                                        onChange={(e) => setPublicationItem({ ...publicationItem, isSelected: e.target.checked })}
                                                        id="isSelected"
                                                    />
                                                    <Label for="isSelected" check>
                                                        Selected Publication
                                                    </Label>
                                                </FormGroup>
                                            </Col>
                                            <Col md={12} className="mt-2">
                                                <Button color="primary" onClick={addPublication} className="btn-lg">
                                                    <i className="ri-add-line me-1" /> Add Publication
                                                </Button>
                                            </Col>
                                        </Row>

                                        {formData.publications.length > 0 && (
                                            <div className="mt-4">
                                                <h6 className="mb-3">Added Publications</h6>
                                                {formData.publications.map((pub, index) => (
                                                    <div key={index} className="mb-3 p-3 border rounded bg-light">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <h6 className="mb-1">{pub.title}</h6>
                                                            <Button color="danger" size="sm" onClick={() => removePublication(index)}>
                                                                <i className="ri-delete-bin-line" />
                                                            </Button>
                                                        </div>
                                                        <p className="mb-1">{pub.journalOrConference}, {new Date(pub.publicationDate).toLocaleDateString()}</p>
                                                        <p className="mb-1">Authors: {pub.authors.join(', ')}</p>
                                                        {pub.link && (
                                                            <p className="mb-0">
                                                                <a href={pub.link} target="_blank" rel="noopener noreferrer">
                                                                    View Publication
                                                                </a>
                                                            </p>
                                                        )}
                                                        {pub.isSelected && <Badge color="success" className="mt-1">Selected</Badge>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabPane>

                            {/* Step 6: Awards & Honors */}
                            <TabPane tabId={6}>
                                <div className="card border">
                                    <div className="card-header bg-light">
                                        <h6 className="card-title mb-0">Awards & Honors</h6>
                                    </div>
                                    <div className="card-body">
                                        <Row className="mb-4">
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>Title</Label>
                                                    <Input
                                                        placeholder="Title"
                                                        value={awardItem.title}
                                                        onChange={(e) => setAwardItem({ ...awardItem, title: e.target.value })}
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>Awarding Body</Label>
                                                    <Input
                                                        placeholder="Awarding Body"
                                                        value={awardItem.awardingBody}
                                                        onChange={(e) => setAwardItem({ ...awardItem, awardingBody: e.target.value })}
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label>Year</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="Year"
                                                        value={awardItem.year}
                                                        onChange={(e) => setAwardItem({ ...awardItem, year: e.target.value })}
                                                        min="1900"
                                                        max="2100"
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={12}>
                                                <FormGroup>
                                                    <Label>Description</Label>
                                                    <Input
                                                        placeholder="Description"
                                                        value={awardItem.description}
                                                        onChange={(e) => setAwardItem({ ...awardItem, description: e.target.value })}
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={12} className="mt-2">
                                                <Button color="primary" onClick={addAward} className="btn-lg">
                                                    <i className="ri-add-line me-1" /> Add Award
                                                </Button>
                                            </Col>
                                        </Row>

                                        {formData.awards.length > 0 && (
                                            <div className="mt-4">
                                                <h6 className="mb-3">Added Awards</h6>
                                                {formData.awards.map((award, index) => (
                                                    <div key={index} className="mb-3 p-3 border rounded bg-light">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <h6 className="mb-1">{award.title}</h6>
                                                            <Button color="danger" size="sm" onClick={() => removeAward(index)}>
                                                                <i className="ri-delete-bin-line" />
                                                            </Button>
                                                        </div>
                                                        <p className="mb-1">Awarded by: {award.awardingBody}, {award.year}</p>
                                                        {award.description && <p className="mb-0">{award.description}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Additional Information */}
                                <div className="card border mt-4">
                                    <div className="card-header bg-light">
                                        <h6 className="card-title mb-0">Additional Information</h6>
                                    </div>
                                    <div className="card-body">
                                        <Row>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>Order</Label>
                                                    <Input
                                                        type="number"
                                                        name="order"
                                                        value={formData.order}
                                                        onChange={handleInputChange}
                                                        min="0"
                                                        className="form-control"
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={6}>
                                                <FormGroup check className="mt-4 pt-2">
                                                    <Input
                                                        type="checkbox"
                                                        name="isActive"
                                                        checked={formData.isActive}
                                                        onChange={handleInputChange}
                                                        id="isActive"
                                                    />
                                                    <Label for="isActive" check className="fs-5">
                                                        Active Staff
                                                    </Label>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </div>
                                </div>
                            </TabPane>
                        </TabContent>

                        {/* Navigation Buttons */}
                        <div className="d-flex justify-content-between mt-4">
                            <Button
                                color="light"
                                onClick={() => setActiveStep(activeStep - 1)}
                                disabled={activeStep === 1}
                            >
                                <i className="ri-arrow-left-line me-1"></i> Previous
                            </Button>

                            {activeStep < 6 ? (
                                <Button
                                    color="primary"
                                    onClick={() => setActiveStep(activeStep + 1)}
                                >
                                    Next <i className="ri-arrow-right-line ms-1"></i>
                                </Button>
                            ) : (
                                <Button color="success" type="submit" disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            )}
                        </div>
                    </ModalBody>
                </Form>
            </Modal>

            {/* View Details Modal */}
            <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="xl">
                <ModalHeader toggle={() => setViewModal(false)}>
                    Staff Details: {selectedStaff?.name}
                </ModalHeader>
                <ModalBody>
                    {selectedStaff && (
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
                                            Professional
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={activeViewTab === '3' ? 'active' : ''}
                                            onClick={() => setActiveViewTab('3')}
                                        >
                                            Education
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={activeViewTab === '4' ? 'active' : ''}
                                            onClick={() => setActiveViewTab('4')}
                                        >
                                            Research
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={activeViewTab === '5' ? 'active' : ''}
                                            onClick={() => setActiveViewTab('5')}
                                        >
                                            Publications
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={activeViewTab === '6' ? 'active' : ''}
                                            onClick={() => setActiveViewTab('6')}
                                        >
                                            Awards
                                        </NavLink>
                                    </NavItem>
                                </Nav>
                            </div>

                            {/* Tab Content */}
                            <TabContent activeTab={activeViewTab}>
                                {/* Basic Information Tab */}
                                <TabPane tabId="1">
                                    <Row>
                                        <Col md={8}>
                                            <FormGroup>
                                                <Label><strong>Name</strong></Label>
                                                <p>{selectedStaff.name}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label><strong>Title</strong></Label>
                                                <p>{selectedStaff.title}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label><strong>Email</strong></Label>
                                                <p>{selectedStaff.email}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label><strong>Phone</strong></Label>
                                                <p>{selectedStaff.phone || '-'}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label><strong>Role</strong></Label>
                                                <p>{selectedStaff.role}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label><strong>Office Location</strong></Label>
                                                <p>{selectedStaff.officeLocation || '-'}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label><strong>School</strong></Label>
                                                <p>{selectedStaff.school?.name || '-'}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label><strong>Department</strong></Label>
                                                <p>{selectedStaff.department?.name || '-'}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md={12}>
                                            <FormGroup>
                                                <Label><strong>Bio</strong></Label>
                                                <p>{selectedStaff.bio || '-'}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md={12}>
                                            <FormGroup>
                                                <Label><strong>Message</strong></Label>
                                                <p>{selectedStaff.message || '-'}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label><strong>Status</strong></Label>
                                                <p>
                                                    <Badge color={selectedStaff.isActive ? 'success' : 'danger'}>
                                                        {selectedStaff.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </p>
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label><strong>Order</strong></Label>
                                                <p>{selectedStaff.order || 0}</p>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </TabPane>

                                {/* Professional Experience Tab */}
                                <TabPane tabId="2">
                                    <Row>
                                        <Col md={12}>
                                            {selectedStaff.professionalExperience && selectedStaff.professionalExperience.length > 0 ? (
                                                <>
                                                    <h6 className="mb-3">Professional Experience</h6>
                                                    <div className="experience-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                        {selectedStaff.professionalExperience.map((exp, index) => (
                                                            <div key={index} className="mb-3 p-2 border rounded">
                                                                <h6 className="mb-1">{exp.position} at {exp.organization}</h6>
                                                                <p className="mb-1">
                                                                    {new Date(exp.startDate).toLocaleDateString()} -
                                                                    {exp.isCurrent ? ' Present' : ` ${new Date(exp.endDate).toLocaleDateString()}`}
                                                                </p>
                                                                <p className="mb-1">{exp.description}</p>
                                                                {exp.achievements && exp.achievements.length > 0 && (
                                                                    <div>
                                                                        <strong>Achievements:</strong>
                                                                        <ul className="mb-0">
                                                                            {exp.achievements.map((achievement, i) => (
                                                                                <li key={i}>{achievement}</li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p>No professional experience available</p>
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                </TabPane>

                                {/* Education Tab */}
                                <TabPane tabId="3">
                                    <Row>
                                        <Col md={12}>
                                            {selectedStaff.education && selectedStaff.education.length > 0 ? (
                                                <>
                                                    <h6 className="mb-3">Education</h6>
                                                    <div className="education-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                        {selectedStaff.education.map((edu, index) => (
                                                            <div key={index} className="mb-3 p-2 border rounded">
                                                                <h6 className="mb-1">{edu.degree} in {edu.fieldOfStudy}</h6>
                                                                <p className="mb-1">{edu.institution}, {edu.graduationYear}</p>
                                                                {edu.country && <p className="mb-1">Country: {edu.country}</p>}
                                                                {edu.thesisTitle && <p className="mb-0">Thesis: {edu.thesisTitle}</p>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p>No education information available</p>
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                </TabPane>

                                {/* Research Interests Tab */}
                                <TabPane tabId="4">
                                    <Row>
                                        <Col md={12}>
                                            {selectedStaff.researchInterests && selectedStaff.researchInterests.length > 0 ? (
                                                <>
                                                    <h6 className="mb-3">Research Interests</h6>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {selectedStaff.researchInterests.map((interest, index) => (
                                                            <Badge key={index} color="primary" className="p-2">
                                                                {interest}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p>No research interests available</p>
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                </TabPane>

                                {/* Publications Tab */}
                                <TabPane tabId="5">
                                    <Row>
                                        <Col md={12}>
                                            {selectedStaff.publications && selectedStaff.publications.length > 0 ? (
                                                <>
                                                    <h6 className="mb-3">Publications</h6>
                                                    <div className="publications-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                        {selectedStaff.publications.map((pub, index) => (
                                                            <div key={index} className="mb-3 p-2 border rounded">
                                                                <h6 className="mb-1">{pub.title}</h6>
                                                                <p className="mb-1">{pub.journalOrConference}, {new Date(pub.publicationDate).toLocaleDateString()}</p>
                                                                <p className="mb-1">Authors: {pub.authors.join(', ')}</p>
                                                                {pub.link && (
                                                                    <p className="mb-0">
                                                                        <a href={pub.link} target="_blank" rel="noopener noreferrer">
                                                                            View Publication
                                                                        </a>
                                                                    </p>
                                                                )}
                                                                {pub.isSelected && <Badge color="success" className="mt-1">Selected</Badge>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p>No publications available</p>
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                </TabPane>

                                {/* Awards Tab */}
                                <TabPane tabId="6">
                                    <Row>
                                        <Col md={12}>
                                            {selectedStaff.awards && selectedStaff.awards.length > 0 ? (
                                                <>
                                                    <h6 className="mb-3">Awards & Honors</h6>
                                                    <div className="awards-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                        {selectedStaff.awards.map((award, index) => (
                                                            <div key={index} className="mb-3 p-2 border rounded">
                                                                <h6 className="mb-1">{award.title}</h6>
                                                                <p className="mb-1">Awarded by: {award.awardingBody}, {award.year}</p>
                                                                {award.description && <p className="mb-0">{award.description}</p>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p>No awards available</p>
                                                </div>
                                            )}
                                        </Col>
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

            {/* Delete Confirmation Modal */}
            <DeleteModal
                show={deleteModal}
                onDeleteClick={deleteStaff}
                onCloseClick={() => setDeleteModal(false)}
            />

            <ToastContainer />
        </div>
    );
};

export default Staffs;