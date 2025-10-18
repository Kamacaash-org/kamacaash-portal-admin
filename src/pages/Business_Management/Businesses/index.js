import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, CardHeader, CardBody,
    Col, Container, Row,
    Form, Input, Label, FormGroup,
    Modal, ModalBody, ModalFooter, ModalHeader,
    Button, Badge, Nav, NavItem, NavLink, TabContent, TabPane, Alert
} from "reactstrap";
import DataTable from "react-data-table-component";
import Select from "react-select";

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";

// Import FilePond for file uploads
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

// Register the plugins
registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';

// Redux thunks
import {
    getBusinessesData as onGetBusinesses,
    archiveBusiness as onDeleteBusiness,
    createOrUpdateBusiness as onCreateOrUpdateBusiness,
    toggleStatusBusiness as onToggleBusinessActiveStatus
} from "../../../slices/thunks";

// Selectors
const selectBusinessesData = createSelector(
    (state) => state.BusinessManagement,
    (businessesData) => businessesData.businessesData.businesses || []
);

const resizeObserverErr = window.ResizeObserver;
window.ResizeObserver = class extends resizeObserverErr {
    constructor(callback) {
        super((...args) => {
            try {
                callback(...args);
            } catch (e) {
                // ignore ResizeObserver errors
            }
        });
    }
};

const BusinessesPage = () => {
    document.title = "Businesses | simad University";

    const dispatch = useDispatch();
    const businessesData = useSelector(selectBusinessesData);

    // State management
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [statusModal, setStatusModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [filteredBusinesses, setFilteredBusinesses] = useState([]);
    const [activeTab, setActiveTab] = useState('1');
    const [formAlert, setFormAlert] = useState({ show: false, message: '', type: '' });

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        category: 'all'
    });

    // Categories for dropdown
    const [categories, setCategories] = useState([]);

    // Form state
    const [formData, setFormData] = useState({
        ownerName: "",
        businessName: "",
        category: "",
        primaryStaffAccount: "",
        countryCode: "+252",
        phoneNumber: "",
        email: "",
        description: "",
        logo: "",
        bannerImage: "",
        licenseDocument: "",
        address: {
            street: "",
            city: "",
            state: "",
            country: "Somalia",
            postcode: "",
            coordinates: {
                type: "Point",
                coordinates: [0, 0]
            }
        },
        openingHours: {
            mon: { open: "08:00", close: "20:00" },
            tue: { open: "08:00", close: "20:00" },
            wed: { open: "08:00", close: "20:00" },
            thur: { open: "08:00", close: "20:00" },
            fri: { open: "14:00", close: "20:00" },
            sat: { open: "08:00", close: "20:00" },
            sun: { open: "08:00", close: "18:00" }
        },
        defaultLanguage: "en",
        currency: "USD",
        timeZone: "Africa/Mogadishu",
        contract: {
            payoutSchedule: "WEEKLY",
            commissionRate: 10
        },
        bankAccountDetails: {
            accountHolderName: "",
            sortCode: "",
            accountNumber: ""
        },
        taxId: "",
        registrationNumber: ""
    });

    const [logoFiles, setLogoFiles] = useState([]);
    const [bannerFiles, setBannerFiles] = useState([]);
    const [licenseFiles, setLicenseFiles] = useState([]);

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetBusinesses());
            // In a real app, you would fetch categories from API
            setCategories([
                { value: '1', label: 'Supermarket' },
                { value: '2', label: 'Restaurant' },
                { value: '3', label: 'Retail Store' },
                { value: '4', label: 'Service Provider' },
                { value: '5', label: 'Manufacturer' }
            ]);
        } catch (error) {
            console.error("Error loading businesses:", error);
            toast.error("Failed to load businesses");
            setFormAlert({
                show: true,
                message: 'Failed to load businesses. Please try again.',
                type: 'danger'
            });
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    // Load data
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Update lists when data changes
    useEffect(() => {
        const initialBusinesses = Array.isArray(businessesData) ? businessesData : [];
        setBusinesses(initialBusinesses);
        setFilteredBusinesses(initialBusinesses);
    }, [businessesData]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));

        const filtered = businesses.filter(business => {
            const matchesSearch = !value ||
                business.businessName?.toLowerCase().includes(value.toLowerCase()) ||
                business.ownerName?.toLowerCase().includes(value.toLowerCase()) ||
                business.email?.toLowerCase().includes(value.toLowerCase());

            const matchesStatus = filters.status === 'all' || business.status === filters.status;
            const matchesCategory = filters.category === 'all' || business.category === filters.category;

            return matchesSearch && matchesStatus && matchesCategory;
        });
        setFilteredBusinesses(filtered);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle nested object changes
    const handleNestedChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    // Handle address changes
    const handleAddressChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            address: {
                ...prev.address,
                [field]: value
            }
        }));
    };

    // Handle opening hours changes
    const handleOpeningHoursChange = (day, field, value) => {
        setFormData(prev => ({
            ...prev,
            openingHours: {
                ...prev.openingHours,
                [day]: {
                    ...prev.openingHours[day],
                    [field]: value
                }
            }
        }));
    };

    // Handle file upload for logo
    const handleLogoFileUpdate = (fileItems) => {
        setLogoFiles(fileItems);
        if (fileItems.length > 0) {
            setFormData(prev => ({
                ...prev,
                logo: fileItems[0].file
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                logo: ""
            }));
        }
    };

    // Handle file upload for banner
    const handleBannerFileUpdate = (fileItems) => {
        setBannerFiles(fileItems);
        if (fileItems.length > 0) {
            setFormData(prev => ({
                ...prev,
                bannerImage: fileItems[0].file
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                bannerImage: ""
            }));
        }
    };

    // Handle file upload for license
    const handleLicenseFileUpdate = (fileItems) => {
        setLicenseFiles(fileItems);
        if (fileItems.length > 0) {
            setFormData(prev => ({
                ...prev,
                licenseDocument: fileItems[0].file
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                licenseDocument: ""
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const requiredFields = ['ownerName', 'businessName', 'category', 'phoneNumber'];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            toast.warning(`Please fill all required fields: ${missingFields.join(', ')}`);
            return false;
        }

        // Validate email format
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            toast.warning('Please enter a valid email address');
            return false;
        }

        return true;
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            ownerName: "",
            businessName: "",
            category: "",
            primaryStaffAccount: "",
            countryCode: "+252",
            phoneNumber: "",
            email: "",
            description: "",
            logo: "",
            bannerImage: "",
            licenseDocument: "",
            address: {
                street: "",
                city: "",
                state: "",
                country: "Somalia",
                postcode: "",
                coordinates: {
                    type: "Point",
                    coordinates: [0, 0]
                }
            },
            openingHours: {
                mon: { open: "08:00", close: "20:00" },
                tue: { open: "08:00", close: "20:00" },
                wed: { open: "08:00", close: "20:00" },
                thur: { open: "08:00", close: "20:00" },
                fri: { open: "14:00", close: "20:00" },
                sat: { open: "08:00", close: "20:00" },
                sun: { open: "08:00", close: "18:00" }
            },
            defaultLanguage: "en",
            currency: "USD",
            timeZone: "Africa/Mogadishu",
            contract: {
                payoutSchedule: "WEEKLY",
                commissionRate: 10
            },
            bankAccountDetails: {
                accountHolderName: "",
                sortCode: "",
                accountNumber: ""
            },
            taxId: "",
            registrationNumber: ""
        });
        setLogoFiles([]);
        setBannerFiles([]);
        setLicenseFiles([]);
        setSelectedBusiness(null);
        setActiveTab('1');
        setFormAlert({ show: false, message: '', type: '' });
    };

    // Handle modal close
    const handleModalClose = () => {
        setLogoFiles([]);
        setBannerFiles([]);
        setLicenseFiles([]);
        setModal(false);
        resetForm();
    };

    // Create new business
    const createBusiness = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const submitData = new FormData();

            // Append basic fields
            const basicFields = [
                'ownerName', 'businessName', 'category', 'primaryStaffAccount',
                'countryCode', 'phoneNumber', 'email', 'description',
                'taxId', 'registrationNumber', 'defaultLanguage', 'currency', 'timeZone'
            ];

            basicFields.forEach(field => {
                if (formData[field] !== undefined && formData[field] !== null) {
                    submitData.append(field, formData[field]);
                }
            });

            // Append address
            Object.keys(formData.address).forEach(key => {
                if (key === 'coordinates') {
                    submitData.append(`address[coordinates][type]`, formData.address.coordinates.type);
                    submitData.append(`address[coordinates][coordinates][0]`, formData.address.coordinates.coordinates[0]);
                    submitData.append(`address[coordinates][coordinates][1]`, formData.address.coordinates.coordinates[1]);
                } else {
                    submitData.append(`address[${key}]`, formData.address[key]);
                }
            });

            // Append opening hours
            Object.keys(formData.openingHours).forEach(day => {
                submitData.append(`openingHours[${day}][open]`, formData.openingHours[day].open);
                submitData.append(`openingHours[${day}][close]`, formData.openingHours[day].close);
            });

            // Append contract
            submitData.append('contract[payoutSchedule]', formData.contract.payoutSchedule);
            submitData.append('contract[commissionRate]', formData.contract.commissionRate);

            // Append bank details
            Object.keys(formData.bankAccountDetails).forEach(key => {
                submitData.append(`bankAccountDetails[${key}]`, formData.bankAccountDetails[key]);
            });

            // Append files
            if (formData.logo instanceof File) {
                submitData.append('logo', formData.logo);
            }
            if (formData.bannerImage instanceof File) {
                submitData.append('bannerImage', formData.bannerImage);
            }
            if (formData.licenseDocument instanceof File) {
                submitData.append('licenseDocument', formData.licenseDocument);
            }

            await dispatch(onCreateOrUpdateBusiness(submitData));
            handleModalClose();
            fetchData();
            toast.success("Business created successfully!");
        } catch (error) {
            console.error("Error creating business:", error);
            toast.error("Failed to create business");
        }
    };

    // Update business
    const updateBusiness = async (e) => {
        e.preventDefault();
        if (!validateForm() || !selectedBusiness) return;

        try {
            const submitData = new FormData();

            // Append basic fields
            const basicFields = [
                'ownerName', 'businessName', 'category', 'primaryStaffAccount',
                'countryCode', 'phoneNumber', 'email', 'description',
                'taxId', 'registrationNumber', 'defaultLanguage', 'currency', 'timeZone'
            ];

            basicFields.forEach(field => {
                if (formData[field] !== undefined && formData[field] !== null) {
                    submitData.append(field, formData[field]);
                }
            });

            // Append address
            Object.keys(formData.address).forEach(key => {
                if (key === 'coordinates') {
                    submitData.append(`address[coordinates][type]`, formData.address.coordinates.type);
                    submitData.append(`address[coordinates][coordinates][0]`, formData.address.coordinates.coordinates[0]);
                    submitData.append(`address[coordinates][coordinates][1]`, formData.address.coordinates.coordinates[1]);
                } else {
                    submitData.append(`address[${key}]`, formData.address[key]);
                }
            });

            // Append opening hours
            Object.keys(formData.openingHours).forEach(day => {
                submitData.append(`openingHours[${day}][open]`, formData.openingHours[day].open);
                submitData.append(`openingHours[${day}][close]`, formData.openingHours[day].close);
            });

            // Append contract
            submitData.append('contract[payoutSchedule]', formData.contract.payoutSchedule);
            submitData.append('contract[commissionRate]', formData.contract.commissionRate);

            // Append bank details
            Object.keys(formData.bankAccountDetails).forEach(key => {
                submitData.append(`bankAccountDetails[${key}]`, formData.bankAccountDetails[key]);
            });

            // Append files
            if (formData.logo instanceof File) {
                submitData.append('logo', formData.logo);
            }
            if (formData.bannerImage instanceof File) {
                submitData.append('bannerImage', formData.bannerImage);
            }
            if (formData.licenseDocument instanceof File) {
                submitData.append('licenseDocument', formData.licenseDocument);
            }

            // Append ID for update
            submitData.append('_id', selectedBusiness._id);

            await dispatch(onCreateOrUpdateBusiness(submitData));
            handleModalClose();
            fetchData();
            toast.success("Business updated successfully!");
        } catch (error) {
            console.error("Error updating business:", error);
            toast.error("Failed to update business");
        }
    };

    // Delete business
    const deleteBusiness = async () => {
        if (!selectedBusiness) return;

        try {
            await dispatch(onDeleteBusiness(selectedBusiness._id));
            setDeleteModal(false);
            fetchData();
            toast.success("Business deleted successfully!");
        } catch (error) {
            console.error("Error deleting business:", error);
            toast.error("Failed to delete business");
        }
    };

    // Toggle business status
    const toggleBusinessStatus = async () => {
        if (!selectedBusiness) return;

        try {
            await dispatch(onToggleBusinessActiveStatus({
                id: selectedBusiness._id,
                isActive: !selectedBusiness.isActive
            }));
            setStatusModal(false);
            fetchData();
            toast.success(`Business ${!selectedBusiness.isActive ? 'activated' : 'deactivated'} successfully!`);
        } catch (error) {
            console.error("Error toggling business status:", error);
            toast.error("Failed to update business status");
        }
    };

    // Open modal for edit
    const handleEdit = (business) => {
        setSelectedBusiness(business);
        setFormData({
            ownerName: business.ownerName || "",
            businessName: business.businessName || "",
            category: business.category || "",
            primaryStaffAccount: business.primaryStaffAccount || "",
            countryCode: business.countryCode || "+252",
            phoneNumber: business.phoneNumber || "",
            email: business.email || "",
            description: business.description || "",
            logo: business.logo || "",
            bannerImage: business.bannerImage || "",
            licenseDocument: business.licenseDocument || "",
            address: business.address || {
                street: "",
                city: "",
                state: "",
                country: "Somalia",
                postcode: "",
                coordinates: {
                    type: "Point",
                    coordinates: [0, 0]
                }
            },
            openingHours: business.openingHours || {
                mon: { open: "08:00", close: "20:00" },
                tue: { open: "08:00", close: "20:00" },
                wed: { open: "08:00", close: "20:00" },
                thur: { open: "08:00", close: "20:00" },
                fri: { open: "14:00", close: "20:00" },
                sat: { open: "08:00", close: "20:00" },
                sun: { open: "08:00", close: "18:00" }
            },
            defaultLanguage: business.defaultLanguage || "en",
            currency: business.currency || "USD",
            timeZone: business.timeZone || "Africa/Mogadishu",
            contract: business.contract || {
                payoutSchedule: "WEEKLY",
                commissionRate: 10
            },
            bankAccountDetails: business.bankAccountDetails || {
                accountHolderName: "",
                sortCode: "",
                accountNumber: ""
            },
            taxId: business.taxId || "",
            registrationNumber: business.registrationNumber || ""
        });
        setIsEdit(true);
        setModal(true);
        setActiveTab('1');
    };

    // Open modal for view
    const handleView = (business) => {
        setSelectedBusiness(business);
        setViewModal(true);
        setActiveTab('1');
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedBusiness(null);
        resetForm();
        setIsEdit(false);
        setModal(true);
    };

    // Get status badge color
    const getStatusBadge = (status) => {
        switch (status) {
            case 'APPROVED': return 'success';
            case 'PENDING': return 'warning';
            case 'REJECTED': return 'danger';
            default: return 'secondary';
        }
    };

    // Get active status badge
    const getActiveBadge = (isActive) => {
        return isActive ? 'success' : 'danger';
    };

    // Table columns
    const columns = [
        {
            name: '#',
            cell: (row, index) => index + 1,
            width: '60px'
        },
        {
            name: 'Logo',
            cell: (row) => (
                <div className="avatar-xs">
                    {row.logo ? (
                        <img
                            src={row.logo}
                            alt={row.businessName}
                            className="avatar-title bg-light rounded-circle"
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        />
                    ) : (
                        <div className="avatar-title bg-light text-secondary rounded-circle">
                            <i className="ri-store-line" />
                        </div>
                    )}
                </div>
            ),
            width: '70px'
        },
        {
            name: 'Business Name',
            selector: row => row.businessName,
            wrap: true,
            sortable: true,
        },
        {
            name: 'Owner',
            selector: row => row.ownerName,
            sortable: true,
        },
        {
            name: 'Contact',
            cell: row => (
                <div>
                    <div>{row.phoneNumber}</div>
                    {row.email && <small className="text-muted">{row.email}</small>}
                </div>
            ),
        },
        {
            name: 'Status',
            cell: row => (
                <div>
                    <Badge color={getStatusBadge(row.status)} className="me-1">
                        {row.status}
                    </Badge>
                    <Badge color={getActiveBadge(row.isActive)}>
                        {row.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                </div>
            ),
        },
        {
            name: 'Location',
            cell: row => row.address?.city || 'N/A',
        },
        {
            name: 'Created',
            cell: row => new Date(row.createdAt).toLocaleDateString(),
            width: '120px'
        },
        {
            name: 'Actions',
            cell: row => (
                <div className="d-flex gap-1">
                    <Button
                        color="outline-info"
                        size="sm"
                        onClick={() => handleView(row)}
                        title="View Details"
                        className="btn-icon"
                    >
                        <i className="ri-eye-line" />
                    </Button>
                    <Button
                        color="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(row)}
                        title="Edit"
                        className="btn-icon"
                    >
                        <i className="ri-pencil-line" />
                    </Button>
                    <Button
                        color={row.isActive ? "outline-warning" : "outline-success"}
                        size="sm"
                        onClick={() => {
                            setSelectedBusiness(row);
                            setStatusModal(true);
                        }}
                        title={row.isActive ? "Deactivate" : "Activate"}
                        className="btn-icon"
                    >
                        <i className={row.isActive ? "ri-pause-line" : "ri-play-line"} />
                    </Button>
                    <Button
                        color="outline-danger"
                        size="sm"
                        onClick={() => {
                            setSelectedBusiness(row);
                            setDeleteModal(true);
                        }}
                        title="Delete"
                        className="btn-icon"
                    >
                        <i className="ri-delete-bin-line" />
                    </Button>
                </div>
            ),
            width: '200px'
        }
    ];

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Businesses" pageTitle="Management" />

                {/* Stats Cards */}
                <Row className="mb-4">
                    <Col xl={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <p className="text-uppercase fw-medium text-muted mb-0">Total Businesses</p>
                                        <h4 className="mb-0">{businesses.length}</h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-2">
                                                <i className="ri-store-line"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col xl={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <p className="text-uppercase fw-medium text-muted mb-0">Active Businesses</p>
                                        <h4 className="mb-0">
                                            {businesses.filter(b => b.isActive).length}
                                        </h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-success-subtle text-success rounded-circle fs-2">
                                                <i className="ri-checkbox-circle-line"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col xl={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <p className="text-uppercase fw-medium text-muted mb-0">Pending Approval</p>
                                        <h4 className="mb-0">
                                            {businesses.filter(b => b.status === 'PENDING').length}
                                        </h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-warning-subtle text-warning rounded-circle fs-2">
                                                <i className="ri-time-line"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col xl={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <p className="text-uppercase fw-medium text-muted mb-0">Approved</p>
                                        <h4 className="mb-0">
                                            {businesses.filter(b => b.status === 'APPROVED').length}
                                        </h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-info-subtle text-info rounded-circle fs-2">
                                                <i className="ri-shield-check-line"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Filter Controls */}
                <Card className="mb-4">
                    <CardBody className="p-3">
                        <Row className="g-3 align-items-end">
                            <Col md={4}>
                                <FormGroup className="mb-0">
                                    <Label className="form-label">Search Businesses</Label>
                                    <Input
                                        type="text"
                                        name="search"
                                        placeholder="Search by name, owner, or email..."
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                        className="form-control"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={3}>
                                <FormGroup className="mb-0">
                                    <Label className="form-label">Status</Label>
                                    <Select
                                        options={[
                                            { value: 'all', label: 'All Status' },
                                            { value: 'PENDING', label: 'Pending' },
                                            { value: 'APPROVED', label: 'Approved' },
                                            { value: 'REJECTED', label: 'Rejected' }
                                        ]}
                                        value={{
                                            value: filters.status,
                                            label: filters.status === 'all' ? 'All Status' : filters.status
                                        }}
                                        onChange={(opt) => setFilters(prev => ({ ...prev, status: opt.value }))}
                                        className="react-select"
                                        classNamePrefix="select"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={3}>
                                <FormGroup className="mb-0">
                                    <Label className="form-label">Category</Label>
                                    <Select
                                        options={[
                                            { value: 'all', label: 'All Categories' },
                                            ...categories
                                        ]}
                                        value={{
                                            value: filters.category,
                                            label: filters.category === 'all' ? 'All Categories' : 
                                                categories.find(cat => cat.value === filters.category)?.label || 'All Categories'
                                        }}
                                        onChange={(opt) => setFilters(prev => ({ ...prev, category: opt.value }))}
                                        className="react-select"
                                        classNamePrefix="select"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={2}>
                                <Button
                                    color="primary"
                                    className="w-100 mb-3"
                                    onClick={handleCreate}
                                >
                                    <i className="ri-add-line me-1"></i>
                                    Add Business
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Businesses Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center bg-light">
                        <h5 className="card-title mb-0 flex-grow-1">
                            <i className="ri-store-line align-middle me-2"></i>
                            Businesses List
                            <Badge color="primary" className="ms-2">{filteredBusinesses.length}</Badge>
                        </h5>
                        <Button color="primary" onClick={handleCreate} className="shadow-sm">
                            <i className="ri-add-line me-1 align-middle"></i>
                            Add Business
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredBusinesses}
                                pagination
                                responsive
                                highlightOnHover
                                noDataComponent={
                                    <div className="text-center py-5">
                                        <i className="ri-inbox-line display-4 text-muted"></i>
                                        <h5 className="mt-3">No businesses found</h5>
                                        <p className="text-muted">Try adjusting your search criteria or add a new business.</p>
                                    </div>
                                }
                                customStyles={{
                                    headCells: {
                                        style: {
                                            fontWeight: '600',
                                            fontSize: '0.875rem',
                                            backgroundColor: '#f8f9fa',
                                        },
                                    },
                                    cells: {
                                        style: {
                                            fontSize: '0.875rem',
                                            padding: '12px 8px',
                                        },
                                    },
                                }}
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Add/Edit Modal */}
            <Modal isOpen={modal} toggle={handleModalClose} size="xl" centered scrollable>
                <ModalHeader toggle={handleModalClose} className="bg-light">
                    <i className={`ri-${isEdit ? 'pencil' : 'add'}-line me-2`}></i>
                    {isEdit ? 'Edit Business' : 'Create New Business'}
                </ModalHeader>
                <Form noValidate onSubmit={isEdit ? updateBusiness : createBusiness}>
                    <ModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        {/* Step Navigation */}
                        <div className="step-arrow-nav mb-4">
                            <Nav className="nav-pills custom-nav nav-justified" role="tablist">
                                <NavItem>
                                    <NavLink
                                        className={activeTab === '1' ? 'active' : ''}
                                        onClick={() => setActiveTab('1')}
                                    >
                                        <i className="ri-user-line me-1" /> Basic Info
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={activeTab === '2' ? 'active' : ''}
                                        onClick={() => setActiveTab('2')}
                                    >
                                        <i className="ri-map-pin-line me-1" /> Location & Hours
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={activeTab === '3' ? 'active' : ''}
                                        onClick={() => setActiveTab('3')}
                                    >
                                        <i className="ri-bank-card-line me-1" /> Business Details
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={activeTab === '4' ? 'active' : ''}
                                        onClick={() => setActiveTab('4')}
                                    >
                                        <i className="ri-image-line me-1" /> Media & Documents
                                    </NavLink>
                                </NavItem>
                            </Nav>
                        </div>

                        <TabContent activeTab={activeTab}>
                            {/* Tab 1: Basic Information */}
                            <TabPane tabId="1">
                                <Row>
                                    <Col lg={6}>
                                        <Card className="border">
                                            <CardHeader className="bg-light">
                                                <h6 className="mb-0">Owner Information</h6>
                                            </CardHeader>
                                            <CardBody>
                                                <FormGroup>
                                                    <Label className="form-label">
                                                        Owner Name <span className="text-danger">*</span>
                                                    </Label>
                                                    <Input
                                                        name="ownerName"
                                                        value={formData.ownerName}
                                                        onChange={handleInputChange}
                                                        placeholder="Enter owner's full name"
                                                        className="form-control-lg"
                                                        required
                                                    />
                                                </FormGroup>

                                                <FormGroup>
                                                    <Label className="form-label">Email Address</Label>
                                                    <Input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        placeholder="owner@example.com"
                                                        className="form-control-lg"
                                                    />
                                                </FormGroup>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    <Col lg={6}>
                                        <Card className="border">
                                            <CardHeader className="bg-light">
                                                <h6 className="mb-0">Business Information</h6>
                                            </CardHeader>
                                            <CardBody>
                                                <FormGroup>
                                                    <Label className="form-label">
                                                        Business Name <span className="text-danger">*</span>
                                                    </Label>
                                                    <Input
                                                        name="businessName"
                                                        value={formData.businessName}
                                                        onChange={handleInputChange}
                                                        placeholder="Enter business name"
                                                        className="form-control-lg"
                                                        required
                                                    />
                                                </FormGroup>

                                                <FormGroup>
                                                    <Label className="form-label">
                                                        Category <span className="text-danger">*</span>
                                                    </Label>
                                                    <Select
                                                        options={categories}
                                                        value={categories.find(cat => cat.value === formData.category)}
                                                        onChange={(opt) => setFormData(prev => ({ ...prev, category: opt.value }))}
                                                        placeholder="Select category"
                                                        className="react-select"
                                                        classNamePrefix="select"
                                                    />
                                                </FormGroup>

                                                <FormGroup>
                                                    <Label className="form-label">Description</Label>
                                                    <Input
                                                        type="textarea"
                                                        name="description"
                                                        value={formData.description}
                                                        onChange={handleInputChange}
                                                        placeholder="Brief description of the business"
                                                        rows="3"
                                                        className="form-control-lg"
                                                    />
                                                </FormGroup>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>

                                <Row className="mt-3">
                                    <Col lg={6}>
                                        <Card className="border">
                                            <CardHeader className="bg-light">
                                                <h6 className="mb-0">Contact Information</h6>
                                            </CardHeader>
                                            <CardBody>
                                                <Row>
                                                    <Col sm={4}>
                                                        <FormGroup>
                                                            <Label className="form-label">Country Code</Label>
                                                            <Input
                                                                name="countryCode"
                                                                value={formData.countryCode}
                                                                onChange={handleInputChange}
                                                                className="form-control-lg"
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                    <Col sm={8}>
                                                        <FormGroup>
                                                            <Label className="form-label">
                                                                Phone Number <span className="text-danger">*</span>
                                                            </Label>
                                                            <Input
                                                                name="phoneNumber"
                                                                value={formData.phoneNumber}
                                                                onChange={handleInputChange}
                                                                placeholder="612345678"
                                                                className="form-control-lg"
                                                                required
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                </Row>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    <Col lg={6}>
                                        <Card className="border">
                                            <CardHeader className="bg-light">
                                                <h6 className="mb-0">Legal Information</h6>
                                            </CardHeader>
                                            <CardBody>
                                                <FormGroup>
                                                    <Label className="form-label">Tax ID</Label>
                                                    <Input
                                                        name="taxId"
                                                        value={formData.taxId}
                                                        onChange={handleInputChange}
                                                        placeholder="TAX1234567"
                                                        className="form-control-lg"
                                                    />
                                                </FormGroup>

                                                <FormGroup>
                                                    <Label className="form-label">Registration Number</Label>
                                                    <Input
                                                        name="registrationNumber"
                                                        value={formData.registrationNumber}
                                                        onChange={handleInputChange}
                                                        placeholder="REG9876543"
                                                        className="form-control-lg"
                                                    />
                                                </FormGroup>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>
                            </TabPane>

                            {/* Tab 2: Location & Hours */}
                            <TabPane tabId="2">
                                <Row>
                                    <Col lg={6}>
                                        <Card className="border">
                                            <CardHeader className="bg-light">
                                                <h6 className="mb-0">Address Information</h6>
                                            </CardHeader>
                                            <CardBody>
                                                <FormGroup>
                                                    <Label className="form-label">Street Address</Label>
                                                    <Input
                                                        value={formData.address.street}
                                                        onChange={(e) => handleAddressChange('street', e.target.value)}
                                                        placeholder="Hamarweyne Market Rd"
                                                        className="form-control-lg"
                                                    />
                                                </FormGroup>

                                                <Row>
                                                    <Col sm={6}>
                                                        <FormGroup>
                                                            <Label className="form-label">City</Label>
                                                            <Input
                                                                value={formData.address.city}
                                                                onChange={(e) => handleAddressChange('city', e.target.value)}
                                                                placeholder="Mogadishu"
                                                                className="form-control-lg"
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                    <Col sm={6}>
                                                        <FormGroup>
                                                            <Label className="form-label">State</Label>
                                                            <Input
                                                                value={formData.address.state}
                                                                onChange={(e) => handleAddressChange('state', e.target.value)}
                                                                placeholder="Banaadir"
                                                                className="form-control-lg"
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col sm={6}>
                                                        <FormGroup>
                                                            <Label className="form-label">Country</Label>
                                                            <Input
                                                                value={formData.address.country}
                                                                onChange={(e) => handleAddressChange('country', e.target.value)}
                                                                className="form-control-lg"
                                                                disabled
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                    <Col sm={6}>
                                                        <FormGroup>
                                                            <Label className="form-label">Postcode</Label>
                                                            <Input
                                                                value={formData.address.postcode}
                                                                onChange={(e) => handleAddressChange('postcode', e.target.value)}
                                                                placeholder="25210"
                                                                className="form-control-lg"
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                </Row>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    <Col lg={6}>
                                        <Card className="border">
                                            <CardHeader className="bg-light">
                                                <h6 className="mb-0">Business Hours</h6>
                                            </CardHeader>
                                            <CardBody>
                                                {['mon', 'tue', 'wed', 'thur', 'fri', 'sat', 'sun'].map(day => (
                                                    <Row key={day} className="mb-2">
                                                        <Col sm={3}>
                                                            <Label className="form-label text-capitalize">
                                                                {day === 'thur' ? 'Thursday' : 
                                                                 day === 'tue' ? 'Tuesday' :
                                                                 day === 'wed' ? 'Wednesday' :
                                                                 day === 'fri' ? 'Friday' :
                                                                 day === 'sat' ? 'Saturday' :
                                                                 day === 'sun' ? 'Sunday' : 'Monday'}
                                                            </Label>
                                                        </Col>
                                                        <Col sm={4}>
                                                            <Input
                                                                type="time"
                                                                value={formData.openingHours[day].open}
                                                                onChange={(e) => handleOpeningHoursChange(day, 'open', e.target.value)}
                                                                className="form-control"
                                                            />
                                                        </Col>
                                                        <Col sm={1} className="text-center pt-2">
                                                            <span className="text-muted">to</span>
                                                        </Col>
                                                        <Col sm={4}>
                                                            <Input
                                                                type="time"
                                                                value={formData.openingHours[day].close}
                                                                onChange={(e) => handleOpeningHoursChange(day, 'close', e.target.value)}
                                                                className="form-control"
                                                            />
                                                        </Col>
                                                    </Row>
                                                ))}
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>
                            </TabPane>

                            {/* Tab 3: Business Details */}
                            <TabPane tabId="3">
                                <Row>
                                    <Col lg={6}>
                                        <Card className="border">
                                            <CardHeader className="bg-light">
                                                <h6 className="mb-0">Contract Details</h6>
                                            </CardHeader>
                                            <CardBody>
                                                <FormGroup>
                                                    <Label className="form-label">Payout Schedule</Label>
                                                    <Select
                                                        options={[
                                                            { value: 'DAILY', label: 'Daily' },
                                                            { value: 'WEEKLY', label: 'Weekly' },
                                                            { value: 'MONTHLY', label: 'Monthly' },
                                                            { value: 'QUARTERLY', label: 'Quarterly' },
                                                            { value: 'YEARLY', label: 'Yearly' }
                                                        ]}
                                                        value={{
                                                            value: formData.contract.payoutSchedule,
                                                            label: formData.contract.payoutSchedule
                                                        }}
                                                        onChange={(opt) => handleNestedChange('contract', 'payoutSchedule', opt.value)}
                                                        className="react-select"
                                                        classNamePrefix="select"
                                                    />
                                                </FormGroup>

                                                <FormGroup>
                                                    <Label className="form-label">Commission Rate (%)</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={formData.contract.commissionRate}
                                                        onChange={(e) => handleNestedChange('contract', 'commissionRate', parseInt(e.target.value))}
                                                        className="form-control-lg"
                                                    />
                                                </FormGroup>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    <Col lg={6}>
                                        <Card className="border">
                                            <CardHeader className="bg-light">
                                                <h6 className="mb-0">Bank Account Details</h6>
                                            </CardHeader>
                                            <CardBody>
                                                <FormGroup>
                                                    <Label className="form-label">Account Holder Name</Label>
                                                    <Input
                                                        value={formData.bankAccountDetails.accountHolderName}
                                                        onChange={(e) => handleNestedChange('bankAccountDetails', 'accountHolderName', e.target.value)}
                                                        placeholder="Ahmed Ali"
                                                        className="form-control-lg"
                                                    />
                                                </FormGroup>

                                                <FormGroup>
                                                    <Label className="form-label">Sort Code</Label>
                                                    <Input
                                                        value={formData.bankAccountDetails.sortCode}
                                                        onChange={(e) => handleNestedChange('bankAccountDetails', 'sortCode', e.target.value)}
                                                        placeholder="12-34-56"
                                                        className="form-control-lg"
                                                    />
                                                </FormGroup>

                                                <FormGroup>
                                                    <Label className="form-label">Account Number</Label>
                                                    <Input
                                                        value={formData.bankAccountDetails.accountNumber}
                                                        onChange={(e) => handleNestedChange('bankAccountDetails', 'accountNumber', e.target.value)}
                                                        placeholder="12345678"
                                                        className="form-control-lg"
                                                    />
                                                </FormGroup>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>

                                <Row className="mt-3">
                                    <Col lg={6}>
                                        <Card className="border">
                                            <CardHeader className="bg-light">
                                                <h6 className="mb-0">Locale Settings</h6>
                                            </CardHeader>
                                            <CardBody>
                                                <FormGroup>
                                                    <Label className="form-label">Default Language</Label>
                                                    <Select
                                                        options={[
                                                            { value: 'en', label: 'English' },
                                                            { value: 'so', label: 'Somali' },
                                                            { value: 'ar', label: 'Arabic' }
                                                        ]}
                                                        value={{
                                                            value: formData.defaultLanguage,
                                                            label: formData.defaultLanguage === 'en' ? 'English' : 
                                                                   formData.defaultLanguage === 'so' ? 'Somali' : 'Arabic'
                                                        }}
                                                        onChange={(opt) => setFormData(prev => ({ ...prev, defaultLanguage: opt.value }))}
                                                        className="react-select"
                                                        classNamePrefix="select"
                                                    />
                                                </FormGroup>

                                                <FormGroup>
                                                    <Label className="form-label">Currency</Label>
                                                    <Select
                                                        options={[
                                                            { value: 'USD', label: 'USD' },
                                                            { value: 'SOS', label: 'SOS' }
                                                        ]}
                                                        value={{
                                                            value: formData.currency,
                                                            label: formData.currency
                                                        }}
                                                        onChange={(opt) => setFormData(prev => ({ ...prev, currency: opt.value }))}
                                                        className="react-select"
                                                        classNamePrefix="select"
                                                    />
                                                </FormGroup>

                                                <FormGroup>
                                                    <Label className="form-label">Time Zone</Label>
                                                    <Input
                                                        value={formData.timeZone}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, timeZone: e.target.value }))}
                                                        className="form-control-lg"
                                                        disabled
                                                    />
                                                </FormGroup>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>
                            </TabPane>

                            {/* Tab 4: Media & Documents */}
                            <TabPane tabId="4">
                                <Row>
                                    <Col lg={6}>
                                        <Card className="border">
                                            <CardHeader className="bg-light">
                                                <h6 className="mb-0">Business Media</h6>
                                            </CardHeader>
                                            <CardBody>
                                                <FormGroup>
                                                    <Label className="form-label">Business Logo</Label>
                                                    <FilePond
                                                        files={logoFiles}
                                                        onupdatefiles={handleLogoFileUpdate}
                                                        allowMultiple={false}
                                                        maxFiles={1}
                                                        name="logo"
                                                        labelIdle='<div class="text-center"><i class="ri-image-line display-4 text-muted"></i><p class="mt-2">Drag & Drop logo or <span class="filepond--label-action">Browse</span></p></div>'
                                                        acceptedFileTypes={['image/*']}
                                                        imagePreviewHeight={100}
                                                        credits={false}
                                                        className="filepond-border"
                                                    />
                                                    <small className="text-muted">
                                                        Recommended size: 300x300px
                                                    </small>
                                                </FormGroup>

                                                <FormGroup className="mt-3">
                                                    <Label className="form-label">Banner Image</Label>
                                                    <FilePond
                                                        files={bannerFiles}
                                                        onupdatefiles={handleBannerFileUpdate}
                                                        allowMultiple={false}
                                                        maxFiles={1}
                                                        name="bannerImage"
                                                        labelIdle='<div class="text-center"><i class="ri-landscape-line display-4 text-muted"></i><p class="mt-2">Drag & Drop banner or <span class="filepond--label-action">Browse</span></p></div>'
                                                        acceptedFileTypes={['image/*']}
                                                        imagePreviewHeight={150}
                                                        credits={false}
                                                        className="filepond-border"
                                                    />
                                                    <small className="text-muted">
                                                        Recommended size: 1200x400px
                                                    </small>
                                                </FormGroup>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    <Col lg={6}>
                                        <Card className="border">
                                            <CardHeader className="bg-light">
                                                <h6 className="mb-0">Legal Documents</h6>
                                            </CardHeader>
                                            <CardBody>
                                                <FormGroup>
                                                    <Label className="form-label">License Document</Label>
                                                    <FilePond
                                                        files={licenseFiles}
                                                        onupdatefiles={handleLicenseFileUpdate}
                                                        allowMultiple={false}
                                                        maxFiles={1}
                                                        name="licenseDocument"
                                                        labelIdle='<div class="text-center"><i class="ri-file-text-line display-4 text-muted"></i><p class="mt-2">Drag & Drop license file or <span class="filepond--label-action">Browse</span></p></div>'
                                                        acceptedFileTypes={['application/pdf', 'image/*']}
                                                        credits={false}
                                                        className="filepond-border"
                                                    />
                                                    <small className="text-muted">
                                                        Accepted formats: PDF, Images
                                                    </small>
                                                </FormGroup>

                                                {/* Image Previews */}
                                                {formData.logo && !logoFiles.length && (
                                                    <div className="mt-3">
                                                        <Label>Current Logo:</Label>
                                                        <img
                                                            src={formData.logo}
                                                            alt="Logo preview"
                                                            className="img-thumbnail mt-1"
                                                            style={{ maxHeight: '100px' }}
                                                        />
                                                    </div>
                                                )}

                                                {formData.bannerImage && !bannerFiles.length && (
                                                    <div className="mt-3">
                                                        <Label>Current Banner:</Label>
                                                        <img
                                                            src={formData.bannerImage}
                                                            alt="Banner preview"
                                                            className="img-thumbnail mt-1"
                                                            style={{ maxHeight: '150px' }}
                                                        />
                                                    </div>
                                                )}
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>
                            </TabPane>
                        </TabContent>
                    </ModalBody>
                    <ModalFooter className="bg-light">
                        <div className="w-100 d-flex justify-content-between">
                            <div>
                                {activeTab !== '1' && (
                                    <Button color="light" onClick={() => setActiveTab((parseInt(activeTab) - 1).toString())}>
                                        <i className="ri-arrow-left-line me-1" /> Previous
                                    </Button>
                                )}
                            </div>
                            <div>
                                {activeTab !== '4' ? (
                                    <Button color="primary" onClick={() => setActiveTab((parseInt(activeTab) + 1).toString())}>
                                        Next <i className="ri-arrow-right-line ms-1" />
                                    </Button>
                                ) : (
                                    <Button color="success" type="submit" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <i className="ri-loader-4-line spin me-1"></i>
                                                {isEdit ? 'Updating...' : 'Creating...'}
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri-save-line me-1"></i>
                                                {isEdit ? 'Update Business' : 'Create Business'}
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* View Modal */}
            <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="xl" centered scrollable>
                <ModalHeader toggle={() => setViewModal(false)} className="bg-light">
                    <i className="ri-store-line me-2"></i>
                    Business Details - {selectedBusiness?.businessName}
                </ModalHeader>
                <ModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {selectedBusiness && (
                        <>
                            {/* Step Navigation for View */}
                            <div className="step-arrow-nav mb-4">
                                <Nav className="nav-pills custom-nav nav-justified" role="tablist">
                                    <NavItem>
                                        <NavLink
                                            className={activeTab === '1' ? 'active' : ''}
                                            onClick={() => setActiveTab('1')}
                                        >
                                            <i className="ri-user-line me-1" /> Basic Info
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={activeTab === '2' ? 'active' : ''}
                                            onClick={() => setActiveTab('2')}
                                        >
                                            <i className="ri-map-pin-line me-1" /> Location
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={activeTab === '3' ? 'active' : ''}
                                            onClick={() => setActiveTab('3')}
                                        >
                                            <i className="ri-bank-card-line me-1" /> Details
                                        </NavLink>
                                    </NavItem>
                                </Nav>
                            </div>

                            <TabContent activeTab={activeTab}>
                                {/* Tab 1: Basic Information */}
                                <TabPane tabId="1">
                                    <Row>
                                        <Col md={4} className="text-center mb-4">
                                            {selectedBusiness.logo ? (
                                                <img
                                                    src={selectedBusiness.logo}
                                                    alt={selectedBusiness.businessName}
                                                    className="rounded-circle img-thumbnail mb-3"
                                                    style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div className="rounded-circle bg-light d-flex align-items-center justify-content-center mb-3"
                                                    style={{ width: '150px', height: '150px', margin: '0 auto' }}>
                                                    <i className="ri-store-line display-4 text-muted"></i>
                                                </div>
                                            )}
                                            <h4>{selectedBusiness.businessName}</h4>
                                            <div className="mb-2">
                                                <Badge color={getStatusBadge(selectedBusiness.status)} className="me-1 fs-6">
                                                    {selectedBusiness.status}
                                                </Badge>
                                                <Badge color={getActiveBadge(selectedBusiness.isActive)} className="fs-6">
                                                    {selectedBusiness.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                            <p className="text-muted">{selectedBusiness.description}</p>
                                        </Col>
                                        <Col md={8}>
                                            <Row>
                                                <Col sm={6}>
                                                    <h6>Owner Information</h6>
                                                    <p><strong>Name:</strong> {selectedBusiness.ownerName}</p>
                                                    <p><strong>Email:</strong> {selectedBusiness.email || 'N/A'}</p>
                                                    <p><strong>Phone:</strong> {selectedBusiness.countryCode} {selectedBusiness.phoneNumber}</p>
                                                </Col>
                                                <Col sm={6}>
                                                    <h6>Business Information</h6>
                                                    <p><strong>Category:</strong> {selectedBusiness.category}</p>
                                                    <p><strong>Tax ID:</strong> {selectedBusiness.taxId || 'N/A'}</p>
                                                    <p><strong>Registration:</strong> {selectedBusiness.registrationNumber || 'N/A'}</p>
                                                </Col>
                                            </Row>

                                            {selectedBusiness.bannerImage && (
                                                <div className="mt-4">
                                                    <h6>Banner Image</h6>
                                                    <img
                                                        src={selectedBusiness.bannerImage}
                                                        alt="Banner"
                                                        className="img-fluid rounded"
                                                        style={{ maxHeight: '200px', objectFit: 'cover', width: '100%' }}
                                                    />
                                                </div>
                                            )}

                                            <div className="mt-4">
                                                <h6>Metadata</h6>
                                                <Row>
                                                    <Col sm={6}>
                                                        <p><strong>Created:</strong> {new Date(selectedBusiness.createdAt).toLocaleDateString()}</p>
                                                    </Col>
                                                    <Col sm={6}>
                                                        <p><strong>Last Updated:</strong> {new Date(selectedBusiness.updatedAt).toLocaleDateString()}</p>
                                                    </Col>
                                                </Row>
                                            </div>
                                        </Col>
                                    </Row>
                                </TabPane>

                                {/* Tab 2: Location & Hours */}
                                <TabPane tabId="2">
                                    <Row>
                                        <Col lg={6}>
                                            <h5>Address Information</h5>
                                            {selectedBusiness.address ? (
                                                <div className="mt-3">
                                                    <p><strong>Street:</strong> {selectedBusiness.address.street || 'N/A'}</p>
                                                    <p><strong>City:</strong> {selectedBusiness.address.city || 'N/A'}</p>
                                                    <p><strong>State:</strong> {selectedBusiness.address.state || 'N/A'}</p>
                                                    <p><strong>Country:</strong> {selectedBusiness.address.country}</p>
                                                    <p><strong>Postcode:</strong> {selectedBusiness.address.postcode || 'N/A'}</p>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <i className="ri-map-pin-line display-4 text-muted"></i>
                                                    <h5 className="mt-3">No Address Information</h5>
                                                    <p className="text-muted">Address details have not been added for this business.</p>
                                                </div>
                                            )}
                                        </Col>
                                        <Col lg={6}>
                                            <h5>Business Hours</h5>
                                            <div className="mt-3">
                                                {selectedBusiness.openingHours && Object.keys(selectedBusiness.openingHours).map(day => (
                                                    <div key={day} className="d-flex justify-content-between border-bottom py-2">
                                                        <span className="text-capitalize">
                                                            {day === 'thur' ? 'Thursday' : 
                                                             day === 'tue' ? 'Tuesday' :
                                                             day === 'wed' ? 'Wednesday' :
                                                             day === 'fri' ? 'Friday' :
                                                             day === 'sat' ? 'Saturday' :
                                                             day === 'sun' ? 'Sunday' : 'Monday'}
                                                        </span>
                                                        <span>
                                                            {selectedBusiness.openingHours[day].open} - {selectedBusiness.openingHours[day].close}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </Col>
                                    </Row>
                                </TabPane>

                                {/* Tab 3: Business Details */}
                                <TabPane tabId="3">
                                    <Row>
                                        <Col lg={6}>
                                            <h5>Contract Details</h5>
                                            {selectedBusiness.contract ? (
                                                <div className="mt-3">
                                                    <p><strong>Payout Schedule:</strong> {selectedBusiness.contract.payoutSchedule}</p>
                                                    <p><strong>Commission Rate:</strong> {selectedBusiness.contract.commissionRate}%</p>
                                                    <p><strong>Contract Signed:</strong> {selectedBusiness.contract.isSigned ? 'Yes' : 'No'}</p>
                                                    {selectedBusiness.contract.signedDate && (
                                                        <p><strong>Signed Date:</strong> {new Date(selectedBusiness.contract.signedDate).toLocaleDateString()}</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-muted">No contract details available.</p>
                                            )}

                                            <h5 className="mt-4">Bank Details</h5>
                                            {selectedBusiness.bankAccountDetails ? (
                                                <div className="mt-3">
                                                    <p><strong>Account Holder:</strong> {selectedBusiness.bankAccountDetails.accountHolderName || 'N/A'}</p>
                                                    <p><strong>Sort Code:</strong> {selectedBusiness.bankAccountDetails.sortCode || 'N/A'}</p>
                                                    <p><strong>Account Number:</strong> {selectedBusiness.bankAccountDetails.accountNumber || 'N/A'}</p>
                                                </div>
                                            ) : (
                                                <p className="text-muted">No bank details available.</p>
                                            )}
                                        </Col>
                                        <Col lg={6}>
                                            <h5>Locale Settings</h5>
                                            <div className="mt-3">
                                                <p><strong>Default Language:</strong> {selectedBusiness.defaultLanguage}</p>
                                                <p><strong>Currency:</strong> {selectedBusiness.currency}</p>
                                                <p><strong>Time Zone:</strong> {selectedBusiness.timeZone}</p>
                                            </div>

                                            {selectedBusiness.licenseDocument && (
                                                <div className="mt-4">
                                                    <h5>License Document</h5>
                                                    <div className="mt-2">
                                                        <Button
                                                            color="outline-primary"
                                                            onClick={() => window.open(selectedBusiness.licenseDocument, '_blank')}
                                                        >
                                                            <i className="ri-download-line me-1"></i>
                                                            View License
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                </TabPane>
                            </TabContent>
                        </>
                    )}
                </ModalBody>
                <ModalFooter className="bg-light">
                    <Button color="light" onClick={() => setViewModal(false)}>
                        <i className="ri-close-line me-1"></i>
                        Close
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteModal
                show={deleteModal}
                onDeleteClick={deleteBusiness}
                onCloseClick={() => setDeleteModal(false)}
                confirmationText={
                    selectedBusiness ?
                        `Are you sure you want to delete "${selectedBusiness.businessName}"? This action cannot be undone and all associated data will be permanently removed.`
                        : ""
                }
            />

            {/* Status Toggle Modal */}
            <Modal isOpen={statusModal} toggle={() => setStatusModal(false)} centered>
                <ModalHeader toggle={() => setStatusModal(false)} className="bg-light">
                    <i className="ri-information-line me-2"></i>
                    Confirm Status Change
                </ModalHeader>
                <ModalBody>
                    {selectedBusiness && (
                        <p>
                            Are you sure you want to {selectedBusiness.isActive ? 'deactivate' : 'activate'} the business 
                            "<strong>{selectedBusiness.businessName}</strong>"?
                        </p>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="light" onClick={() => setStatusModal(false)}>
                        Cancel
                    </Button>
                    <Button 
                        color={selectedBusiness?.isActive ? "warning" : "success"} 
                        onClick={toggleBusinessStatus}
                    >
                        {selectedBusiness?.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                </ModalFooter>
            </Modal>

            <ToastContainer />
        </div>
    );
};

export default BusinessesPage;
// import React, { useState, useEffect, useCallback } from 'react';
// import DataTable from "react-data-table-component";
// import Select from "react-select";
// import {
//     Card, CardHeader, CardBody,
//     Col, Container, Row,
//     Form, Input, Label, FormGroup,
//     Modal, ModalBody, ModalFooter, ModalHeader,
//     Button, Badge, FormFeedback, TabContent, TabPane, Nav, NavItem, NavLink
// } from "reactstrap";
// import classnames from 'classnames';
// import { ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import BreadCrumb from "../../../Components/Common/BreadCrumb";
// import DeleteModal from "../../../Components/Common/DeleteModal";
// import Loader from "../../../Components/Common/Loader";
// import { useDispatch, useSelector } from 'react-redux';
// import { createSelector } from 'reselect';

// //redux
// import {
//     getBusinessesData as onGetBusinessesData,
//     addBusiness as onAddNewBusiness,
//     updateBusiness as onUpdateBusiness,
//     deleteBusiness as onDeleteBusiness,
//     activateBusiness as onActivateBusiness,
//     signContract as onSignContract,
//     getStaffs as onGetStaffData
// } from "../../../slices/thunks";

// // Formik
// import * as Yup from "yup";
// import { useFormik } from "formik";

// const Businesses = () => {
//     document.title = "Businesses | Kamacash";

//     const dispatch = useDispatch();

//     const selectBusinessesData = createSelector(
//         (state) => state.BusinessManagement,
//         (businessesData) => businessesData.businessesData
//     );

//     const selectStaffData = createSelector(
//         (state) => state.UserManagement,
//         (staffData) => staffData.staffData
//     );

//     const businessesData = useSelector(selectBusinessesData);
//     const staffData = useSelector(selectStaffData);
//     const [businessesList, setBusinessesList] = useState([]);
//     const [staffList, setStaffList] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [modal, setModal] = useState(false);
//     const [contractModal, setContractModal] = useState(false);
//     const [viewModal, setViewModal] = useState(false);
//     const [deleteModal, setDeleteModal] = useState(false);
//     const [isEdit, setIsEdit] = useState(false);
//     const [selectedBusiness, setSelectedBusiness] = useState(null);
//     const [activeTab, setActiveTab] = useState('1');
//     const [uploading, setUploading] = useState(false);
//     const [fileUploadError, setFileUploadError] = useState(null);

//     // Filters state
//     const [filters, setFilters] = useState({
//         search: '',
//         status: '',
//         contractStatus: ''
//     });

//     // Contract form state
//     const [contractFormData, setContractFormData] = useState({
//         isSigned: false,
//         signedDate: new Date().toISOString().split('T')[0],
//         agreementPdf: "",
//         payoutSchedule: "WEEKLY",
//         commissionRate: 10
//     });

//     // File state (separate from Formik)
//     const [selectedFile, setSelectedFile] = useState(null);

//     // Options for selects
//     const statusOptions = [
//         { value: "", label: "All Statuses" },
//         { value: "Active", label: "Active" },
//         { value: "Inactive", label: "Inactive" }
//     ];

//     const contractStatusOptions = [
//         { value: "", label: "All Contract Statuses" },
//         { value: "Signed", label: "Contract Signed" },
//         { value: "Unsigned", label: "Contract Unsigned" }
//     ];

//     const payoutOptions = [
//         { value: "DAILY", label: "Daily" },
//         { value: "WEEKLY", label: "Weekly" },
//         { value: "MONTHLY", label: "Monthly" },
//         { value: "YEARLY", label: "Yearly" }
//     ];

//     // Fetch businesses with filters
//     const fetchBusinesses = useCallback(async () => {
//         setLoading(true);
//         try {
//             await dispatch(onGetBusinessesData());
//         } catch (error) {
//             console.error("Error loading businesses:", error);
//         } finally {
//             setLoading(false);
//         }
//     }, [dispatch]);

//     // Fetch staff data
//     const fetchStaff = useCallback(async () => {
//         try {
//             await dispatch(onGetStaffData());
//         } catch (error) {
//             console.error("Error loading staff:", error);
//         }
//     }, [dispatch]);

//     // Update businesses list when data changes
//     useEffect(() => {
//         fetchBusinesses();
//         fetchStaff();
//     }, [fetchBusinesses, fetchStaff]);

//     useEffect(() => {
//         setBusinessesList(businessesData?.businesses || []);
//     }, [businessesData]);

//     useEffect(() => {
//         setStaffList(staffData?.staff || []);
//     }, [staffData]);

//     // Prepare staff options for dropdown
//     const staffOptions = staffList
//         .filter(staff => staff.isActive)
//         .map(staff => ({
//             value: staff._id,
//             label: `${staff.firstName} ${staff.lastName} (${staff.email})`
//         }));

//     // Handle contract form changes
//     const handleContractInputChange = (e) => {
//         const { name, value, type, checked } = e.target;
//         setContractFormData(prev => ({
//             ...prev,
//             [name]: type === 'checkbox' ? checked : value
//         }));
//     };

//     // Handle file selection
//     const handleFileSelect = (e) => {
//         const file = e.target.files[0];
//         setSelectedFile(file);
//         setFileUploadError(null);

//         // Validate file
//         if (file) {
//             if (file.type !== 'application/pdf') {
//                 setFileUploadError('Only PDF files are allowed');
//                 return;
//             }
//             if (file.size > 10 * 1024 * 1024) {
//                 setFileUploadError('File size must be less than 10MB');
//                 return;
//             }
//         }
//     };

//     // Handle contract select changes
//     const handleContractSelectChange = (name, selectedOption) => {
//         setContractFormData(prev => ({
//             ...prev,
//             [name]: selectedOption?.value || ""
//         }));
//     };

//     // Handle filter changes
//     const handleFilterChange = (e) => {
//         const { name, value } = e.target;
//         setFilters(prev => ({ ...prev, [name]: value }));
//     };

//     // Handle select filter changes
//     const handleSelectFilterChange = (name, selectedOption) => {
//         setFilters(prev => ({
//             ...prev,
//             [name]: selectedOption?.value || ""
//         }));
//     };

//     // Filter businesses based on filters
//     const filteredBusinesses = businessesList.filter(business => {
//         return (
//             (filters.search === '' ||
//                 business.businessName.toLowerCase().includes(filters.search.toLowerCase()) ||
//                 business.ownerName.toLowerCase().includes(filters.search.toLowerCase()) ||
//                 business.email.toLowerCase().includes(filters.search.toLowerCase()) ||
//                 business.phoneNumber.toLowerCase().includes(filters.search.toLowerCase())) &&
//             (filters.status === '' ||
//                 (filters.status === 'Active' ? business.isActive : !business.isActive)) &&
//             (filters.contractStatus === '' ||
//                 (filters.contractStatus === 'Signed' ? business.contract?.isSigned : !business.contract?.isSigned))
//         );
//     });

//     // Open modal for edit
//     const handleEdit = (business) => {
//         setSelectedBusiness(business);
//         setIsEdit(true);
//         setModal(true);
//     };

//     // Open modal for create
//     const handleCreate = () => {
//         setSelectedBusiness(null);
//         setIsEdit(false);
//         setModal(true);
//     };

//     // Open view modal
//     const handleView = (business) => {
//         setSelectedBusiness(business);
//         setViewModal(true);
//     };

//     // Open contract modal
//     const handleContract = (business) => {
//         setSelectedBusiness(business);
//         setContractFormData({
//             isSigned: business.contract?.isSigned || false,
//             signedDate: business.contract?.signedDate ?
//                 new Date(business.contract.signedDate).toISOString().split('T')[0] :
//                 new Date().toISOString().split('T')[0],
//             agreementPdf: business.contract?.agreementPdf || "",
//             payoutSchedule: business.contract?.payoutSchedule || "WEEKLY",
//             commissionRate: business.contract?.commissionRate || 10
//         });
//         setSelectedFile(null);
//         setFileUploadError(null);
//         setContractModal(true);
//     };

//     // Handle PDF upload
//     const handlePdfUpload = async (file) => {
//         setUploading(true);
//         setFileUploadError(null);
//         try {
//             const formData = new FormData();
//             formData.append('contract', file);

//             const response = await fetch('http://localhost:4000/api/v1/upload/upload-contract', {
//                 method: 'POST',
//                 body: formData,
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Upload failed');
//             }

//             const data = await response.json();

//             if (!data.success) {
//                 throw new Error(data.message || 'Upload failed');
//             }

//             return data.data?.file?.filePath;

//         } catch (error) {
//             console.error('Upload failed:', error);
//             setFileUploadError(error.message);
//             throw error;
//         } finally {
//             setUploading(false);
//         }
//     };

//     // Delete Business
//     const onClickDelete = (business) => {
//         setSelectedBusiness(business);
//         setDeleteModal(true);
//     };

//     const handleDeleteBusiness = () => {
//         if (selectedBusiness) {
//             dispatch(onDeleteBusiness(selectedBusiness._id));
//             setDeleteModal(false);
//         }
//     };

//     // Activate Business
//     const handleActivateBusiness = (business) => {
//         dispatch(onActivateBusiness(business._id));
//     };

//     // Form validation
//     const validation = useFormik({
//         enableReinitialize: true,
//         initialValues: {
//             ownerName: selectedBusiness?.ownerName || "",
//             businessName: selectedBusiness?.businessName || "",
//             phoneNumber: selectedBusiness?.phoneNumber || "",
//             email: selectedBusiness?.email || "",
//             address: selectedBusiness?.address || {
//                 street: "",
//                 city: "",
//                 state: "",
//                 country: "SOMALIA",
//                 postcode: ""
//             },
//             description: selectedBusiness?.description || "",
//             logo: selectedBusiness?.logo || "",
//             bannerImage: selectedBusiness?.bannerImage || "",
//             primaryStaffAccount: selectedBusiness?.primaryStaffAccount?._id || "",
//             isActive: selectedBusiness?.isActive ?? true
//         },
//         validationSchema: Yup.object({
//             ownerName: Yup.string()
//                 .required("Owner name is required")
//                 .trim(),
//             businessName: Yup.string()
//                 .required("Business name is required")
//                 .trim(),
//             phoneNumber: Yup.string()
//                 .required("Phone number is required")
//                 .trim(),
//             email: Yup.string()
//                 .email("Invalid email format")
//                 .required("Email is required")
//                 .trim()
//                 .lowercase(),
//             'address.street': Yup.string().trim(),
//             'address.city': Yup.string().trim(),
//             'address.state': Yup.string().trim(),
//             'address.country': Yup.string().trim(),
//             'address.postcode': Yup.string().trim(),
//             description: Yup.string().trim(),
//             logo: Yup.string().trim(),
//             bannerImage: Yup.string().trim(),
//             primaryStaffAccount: Yup.string().required("Primary staff account is required"),
//             isActive: Yup.boolean()
//         }),
//         onSubmit: (values) => {
//             if (isEdit) {
//                 const updateBusinessData = {
//                     _id: selectedBusiness ? selectedBusiness._id : 0,
//                     ...values
//                 };
//                 dispatch(onUpdateBusiness(updateBusinessData));
//             } else {
//                 const newBusinessData = {
//                     ...values
//                 };
//                 dispatch(onAddNewBusiness(newBusinessData));
//             }
//             setModal(false);
//         },
//     });

//     // Contract form validation
//     const contractValidation = useFormik({
//         enableReinitialize: true,
//         initialValues: contractFormData,
//         validationSchema: Yup.object({
//             signedDate: Yup.date().required("Signed date is required"),
//             payoutSchedule: Yup.string().required("Payout schedule is required"),
//             commissionRate: Yup.number()
//                 .min(0, "Commission rate must be at least 0%")
//                 .max(100, "Commission rate cannot exceed 100%")
//                 .required("Commission rate is required"),
//         }),
//         onSubmit: async (values) => {
//             try {
//                 let agreementPdfPath = values.agreementPdf;

//                 // Upload new file if provided
//                 if (selectedFile) {
//                     agreementPdfPath = await handlePdfUpload(selectedFile);
//                 }

//                 if (!agreementPdfPath && values.isSigned) {
//                     throw new Error("Agreement PDF is required when signing contract");
//                 }

//                 if (selectedBusiness) {
//                     const contractData = {
//                         id: selectedBusiness._id,
//                         ...values,
//                         agreementPdf: agreementPdfPath,
//                         isSigned: true,
//                         signedDate: new Date(values.signedDate).toISOString()
//                     };

//                     dispatch(onSignContract(contractData));
//                 }
//                 setContractModal(false);
//             } catch (error) {
//                 console.error('Failed to save contract:', error);
//                 alert(`Failed to save contract: ${error.message}`);
//             }
//         },
//     });

//     // Table columns
//     const columns = [
//         {
//             name: '#',
//             cell: (row, index) => index + 1
//         },
//         {
//             name: 'Business Name',
//             selector: row => row.businessName,
//         },
//         {
//             name: 'Owner',
//             selector: row => row.ownerName,
//         },
//         {
//             name: 'Email',
//             selector: row => row.email,
//         },
//         {
//             name: 'Phone',
//             selector: row => row.phoneNumber,
//         },
//         {
//             name: 'Contract Status',
//             cell: row => (
//                 <Badge color={row.contract?.isSigned ? 'success' : 'warning'}>
//                     {row.contract?.isSigned ? 'Signed' : 'Unsigned'}
//                 </Badge>
//             ),
//         },
//         {
//             name: 'Status',
//             cell: row => (
//                 <Badge color={row.isActive ? 'success' : 'danger'}>
//                     {row.isActive ? 'Active' : 'Inactive'}
//                 </Badge>
//             ),
//         },
//         {
//             name: 'Actions',
//             cell: row => (
//                 <div className="d-flex gap-2">
//                     <Button color="soft-info" size="sm" onClick={() => handleView(row)}>
//                         <i className="ri-eye-line" />
//                     </Button>
//                     <Button color="soft-primary" size="sm" onClick={() => handleContract(row)}>
//                         <i className="ri-file-text-line" />
//                     </Button>
//                     <Button color="soft-primary" size="sm" onClick={() => handleEdit(row)}>
//                         <i className="ri-pencil-line" />
//                     </Button>
//                     {row.isActive ? (
//                         <Button color="soft-warning" size="sm" onClick={() => handleActivateBusiness(row)}>
//                             <i className="ri-close-circle-line" />
//                         </Button>
//                     ) : (
//                         <Button color="soft-success" size="sm" onClick={() => handleActivateBusiness(row)}>
//                             <i className="ri-checkbox-circle-line" />
//                         </Button>
//                     )}
//                     <Button color="soft-danger" size="sm" onClick={() => onClickDelete(row)}>
//                         <i className="ri-delete-bin-line" />
//                     </Button>
//                 </div>
//             ),
//             width: '230px'
//         }
//     ];

//     const toggleTab = (tab) => {
//         if (activeTab !== tab) {
//             setActiveTab(tab);
//         }
//     };

//     return (
//         <div className="page-content">
//             <Container fluid>
//                 <BreadCrumb title="Businesses" pageTitle="Partners" />

//                 {/* Filter Controls */}
//                 <Card className="mb-3">
//                     <CardBody>
//                         <Row>
//                             <Col md={4}>
//                                 <FormGroup>
//                                     <Label>Search</Label>
//                                     <Input
//                                         type="text"
//                                         name="search"
//                                         placeholder="Search by business name, owner, email or phone"
//                                         value={filters.search}
//                                         onChange={handleFilterChange}
//                                     />
//                                 </FormGroup>
//                             </Col>
//                             <Col md={3}>
//                                 <FormGroup>
//                                     <Label>Status</Label>
//                                     <Select
//                                         options={statusOptions}
//                                         value={statusOptions.find(opt => opt.value === filters.status)}
//                                         onChange={(opt) => handleSelectFilterChange('status', opt)}
//                                         isClearable
//                                     />
//                                 </FormGroup>
//                             </Col>
//                             <Col md={3}>
//                                 <FormGroup>
//                                     <Label>Contract Status</Label>
//                                     <Select
//                                         options={contractStatusOptions}
//                                         value={contractStatusOptions.find(opt => opt.value === filters.contractStatus)}
//                                         onChange={(opt) => handleSelectFilterChange('contractStatus', opt)}
//                                         isClearable
//                                     />
//                                 </FormGroup>
//                             </Col>
//                             <Col md={2} className="d-flex align-items-end mb-3">
//                                 <Button color="primary" onClick={fetchBusinesses} disabled={loading}>
//                                     {loading ? 'Filtering...' : 'Apply Filters'}
//                                 </Button>
//                             </Col>
//                         </Row>
//                     </CardBody>
//                 </Card>

//                 {/* Data Table */}
//                 <Card>
//                     <CardHeader className="d-flex justify-content-between align-items-center">
//                         <h5 className="mb-0">Businesses List</h5>
//                         <Button color="primary" onClick={handleCreate}>
//                             <i className="ri-add-line me-1" /> Add Business
//                         </Button>
//                     </CardHeader>
//                     <CardBody>
//                         {loading ? (
//                             <Loader />
//                         ) : (
//                             <DataTable
//                                 columns={columns}
//                                 data={filteredBusinesses}
//                                 pagination
//                                 highlightOnHover
//                                 responsive
//                                 noDataComponent="No businesses found matching your criteria"
//                             />
//                         )}
//                     </CardBody>
//                 </Card>
//             </Container>

//             {/* Add/Edit Business Modal */}
//             <Modal isOpen={modal} toggle={() => setModal(false)} size="xl">
//                 <ModalHeader toggle={() => setModal(false)}>
//                     {isEdit ? 'Edit Business' : 'Add New Business'}
//                 </ModalHeader>
//                 <Form onSubmit={validation.handleSubmit}>
//                     <ModalBody>
//                         <Row>
//                             <Col lg={12}>
//                                 <Row>
//                                     <Col md={6}>
//                                         <FormGroup>
//                                             <Label>Business Name <span className="text-danger">*</span></Label>
//                                             <Input
//                                                 name="businessName"
//                                                 value={validation.values.businessName}
//                                                 onChange={validation.handleChange}
//                                                 onBlur={validation.handleBlur}
//                                                 invalid={validation.touched.businessName && !!validation.errors.businessName}
//                                             />
//                                             <FormFeedback>{validation.errors.businessName}</FormFeedback>
//                                         </FormGroup>
//                                     </Col>
//                                     <Col md={6}>
//                                         <FormGroup>
//                                             <Label>Owner Name <span className="text-danger">*</span></Label>
//                                             <Input
//                                                 name="ownerName"
//                                                 value={validation.values.ownerName}
//                                                 onChange={validation.handleChange}
//                                                 onBlur={validation.handleBlur}
//                                                 invalid={validation.touched.ownerName && !!validation.errors.ownerName}
//                                             />
//                                             <FormFeedback>{validation.errors.ownerName}</FormFeedback>
//                                         </FormGroup>
//                                     </Col>
//                                 </Row>

//                                 <Row>
//                                     <Col md={4}>
//                                         <FormGroup>
//                                             <Label>Email <span className="text-danger">*</span></Label>
//                                             <Input
//                                                 type="email"
//                                                 name="email"
//                                                 value={validation.values.email}
//                                                 onChange={validation.handleChange}
//                                                 onBlur={validation.handleBlur}
//                                                 invalid={validation.touched.email && !!validation.errors.email}
//                                             />
//                                             <FormFeedback>{validation.errors.email}</FormFeedback>
//                                         </FormGroup>
//                                     </Col>
//                                     <Col md={4}>
//                                         <FormGroup>
//                                             <Label>Phone Number <span className="text-danger">*</span></Label>
//                                             <Input
//                                                 name="phoneNumber"
//                                                 value={validation.values.phoneNumber}
//                                                 onChange={validation.handleChange}
//                                                 onBlur={validation.handleBlur}
//                                                 invalid={validation.touched.phoneNumber && !!validation.errors.phoneNumber}
//                                             />
//                                             <FormFeedback>{validation.errors.phoneNumber}</FormFeedback>
//                                         </FormGroup>
//                                     </Col>

//                                     <Col md={4}>
//                                        <Label>Primary Staff Account <span className="text-danger">*</span></Label>
//                                     <Select
//                                         options={staffOptions}
//                                         value={staffOptions.find(opt => opt.value === validation.values.primaryStaffAccount)}
//                                         onChange={(opt) => validation.setFieldValue('primaryStaffAccount', opt?.value || "")}
//                                         isClearable
//                                         placeholder="Select staff member"
//                                     />
//                                     {validation.touched.primaryStaffAccount && validation.errors.primaryStaffAccount && (
//                                         <div className="text-danger" style={{ fontSize: '0.875em', marginTop: '0.25rem' }}>
//                                             {validation.errors.primaryStaffAccount}
//                                         </div>
//                                     )}
                                    
//                                     </Col>
//                                 </Row>
 

//                                 <FormGroup>
//                                     <Label>Description</Label>
//                                     <Input
//                                         type="textarea"
//                                         name="description"
//                                         rows="3"
//                                         value={validation.values.description}
//                                         onChange={validation.handleChange}
//                                         onBlur={validation.handleBlur}
//                                         invalid={validation.touched.description && !!validation.errors.description}
//                                     />
//                                     <FormFeedback>{validation.errors.description}</FormFeedback>
//                                 </FormGroup>

//                                 <h6 className="mb-3">Address Information</h6>
//                                 <Row>
//                                     <Col md={6}>
//                                         <FormGroup>
//                                             <Label>Street</Label>
//                                             <Input
//                                                 name="address.street"
//                                                 value={validation.values.address.street}
//                                                 onChange={validation.handleChange}
//                                                 onBlur={validation.handleBlur}
//                                             />
//                                         </FormGroup>
//                                     </Col>
//                                     <Col md={6}>
//                                         <FormGroup>
//                                             <Label>City</Label>
//                                             <Input
//                                                 name="address.city"
//                                                 value={validation.values.address.city}
//                                                 onChange={validation.handleChange}
//                                                 onBlur={validation.handleBlur}
//                                             />
//                                         </FormGroup>
//                                     </Col>
//                                 </Row>

//                                 <Row>
//                                     <Col md={4}>
//                                         <FormGroup>
//                                             <Label>State</Label>
//                                             <Input
//                                                 name="address.state"
//                                                 value={validation.values.address.state}
//                                                 onChange={validation.handleChange}
//                                                 onBlur={validation.handleBlur}
//                                             />
//                                         </FormGroup>
//                                     </Col>
//                                     <Col md={4}>
//                                         <FormGroup>
//                                             <Label>Country</Label>
//                                             <Input
//                                                 name="address.country"
//                                                 value={validation.values.address.country}
//                                                 onChange={validation.handleChange}
//                                                 onBlur={validation.handleBlur}
//                                             />
//                                         </FormGroup>
//                                     </Col>
//                                     <Col md={4}>
//                                         <FormGroup>
//                                             <Label>Postcode</Label>
//                                             <Input
//                                                 name="address.postcode"
//                                                 value={validation.values.address.postcode}
//                                                 onChange={validation.handleChange}
//                                                 onBlur={validation.handleBlur}
//                                             />
//                                         </FormGroup>
//                                     </Col>
//                                 </Row>

//                                 <FormGroup check className="mt-3">
//                                     <Input
//                                         type="checkbox"
//                                         name="isActive"
//                                         checked={validation.values.isActive}
//                                         onChange={validation.handleChange}
//                                         id="isActive"
//                                     />
//                                     <Label for="isActive" check>
//                                         Active Business
//                                     </Label>
//                                 </FormGroup>
//                             </Col>
//                         </Row>
//                     </ModalBody>
//                     <ModalFooter>
//                         <Button color="light" onClick={() => setModal(false)}>
//                             Cancel
//                         </Button>
//                         <Button color="primary" type="submit" disabled={loading}>
//                             {loading ? 'Saving...' : 'Save Changes'}
//                         </Button>
//                     </ModalFooter>
//                 </Form>
//             </Modal>

//             {/* Contract Modal */}
//             <Modal isOpen={contractModal} toggle={() => setContractModal(false)} size="lg">
//                 <ModalHeader toggle={() => setContractModal(false)}>
//                     Manage Contract - {selectedBusiness?.businessName}
//                 </ModalHeader>
//                 <Form onSubmit={(e) => {
//                     e.preventDefault();
//                     contractValidation.handleSubmit();
//                 }}>
//                     <ModalBody>
//                         <Row>
//                             <Col lg={12}>
//                                 <Row>
//                                     <Col md={6}>
//                                         <FormGroup>
//                                             <Label>Payout Schedule <span className="text-danger">*</span></Label>
//                                             <Select
//                                                 options={payoutOptions}
//                                                 value={payoutOptions.find(opt => opt.value === contractValidation.values.payoutSchedule)}
//                                                 onChange={(opt) => handleContractSelectChange('payoutSchedule', opt)}
//                                                 isClearable
//                                             />
//                                         </FormGroup>
//                                     </Col>
//                                     <Col md={6}>
//                                         <FormGroup>
//                                             <Label>Commission Rate (%) <span className="text-danger">*</span></Label>
//                                             <Input
//                                                 type="number"
//                                                 name="commissionRate"
//                                                 min="0"
//                                                 max="100"
//                                                 step="0.1"
//                                                 value={contractValidation.values.commissionRate}
//                                                 onChange={contractValidation.handleChange}
//                                                 onBlur={contractValidation.handleBlur}
//                                                 invalid={contractValidation.touched.commissionRate && !!contractValidation.errors.commissionRate}
//                                             />
//                                             <FormFeedback>{contractValidation.errors.commissionRate}</FormFeedback>
//                                         </FormGroup>
//                                     </Col>
//                                 </Row>

//                                 <Row>
//                                     <Col md={6}>
//                                         <FormGroup>
//                                             <Label>Signed Date <span className="text-danger">*</span></Label>
//                                             <Input
//                                                 type="date"
//                                                 name="signedDate"
//                                                 value={contractValidation.values.signedDate}
//                                                 onChange={contractValidation.handleChange}
//                                                 onBlur={contractValidation.handleBlur}
//                                                 invalid={contractValidation.touched.signedDate && !!contractValidation.errors.signedDate}
//                                             />
//                                             <FormFeedback>{contractValidation.errors.signedDate}</FormFeedback>
//                                         </FormGroup>
//                                     </Col>
//                                 </Row>

//                                 <FormGroup>
//                                     <Label>Agreement PDF <span className="text-danger">*</span></Label>
//                                     <Input
//                                         type="file"
//                                         name="agreementFile"
//                                         accept=".pdf"
//                                         onChange={handleFileSelect}
//                                     />
//                                     <small className="form-text text-muted">
//                                         Upload a PDF contract document (Max: 10MB)
//                                     </small>

//                                     {fileUploadError && (
//                                         <div className="text-danger mt-1">
//                                             <small>{fileUploadError}</small>
//                                         </div>
//                                     )}

//                                     {uploading && (
//                                         <div className="text-info mt-1">
//                                             <small>Uploading file...</small>
//                                         </div>
//                                     )}

//                                     {contractValidation.values.agreementPdf && (
//                                         <div className="mt-2">
//                                             <Label>Current Contract:</Label>
//                                             <div>
//                                                 <Button
//                                                     color="link"
//                                                     size="sm"
//                                                     onClick={() => window.open(contractValidation.values.agreementPdf, '_blank')}
//                                                 >
//                                                     <i className="ri-file-pdf-line me-1" />
//                                                     View Current Contract
//                                                 </Button>
//                                             </div>
//                                         </div>
//                                     )}
//                                 </FormGroup>

//                                 <FormGroup check className="mt-3">
//                                     <Input
//                                         type="checkbox"
//                                         name="isSigned"
//                                         checked={contractValidation.values.isSigned}
//                                         onChange={contractValidation.handleChange}
//                                         id="isSigned"
//                                     />
//                                     <Label for="isSigned" check>
//                                         Contract Signed
//                                     </Label>
//                                 </FormGroup>
//                             </Col>
//                         </Row>
//                     </ModalBody>
//                     <ModalFooter>
//                         <Button color="light" onClick={() => setContractModal(false)}>
//                             Cancel
//                         </Button>
//                         <Button color="primary" type="submit" disabled={uploading || loading}>
//                             {uploading ? 'Uploading...' : loading ? 'Saving...' : 'Save Contract'}
//                         </Button>
//                     </ModalFooter>
//                 </Form>
//             </Modal>

//             {/* View Business Modal */}
//             <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="xl">
//                 <ModalHeader toggle={() => setViewModal(false)}>
//                     Business Details - {selectedBusiness?.businessName}
//                 </ModalHeader>
//                 <ModalBody>
//                     {selectedBusiness && (
//                         <>
//                             <Nav tabs>
//                                 <NavItem>
//                                     <NavLink
//                                         className={classnames({ active: activeTab === '1' })}
//                                         onClick={() => toggleTab('1')}
//                                     >
//                                         Business Info
//                                     </NavLink>
//                                 </NavItem>
//                                 <NavItem>
//                                     <NavLink
//                                         className={classnames({ active: activeTab === '2' })}
//                                         onClick={() => toggleTab('2')}
//                                     >
//                                         Contract Details
//                                     </NavLink>
//                                 </NavItem>
//                                 <NavItem>
//                                     <NavLink
//                                         className={classnames({ active: activeTab === '3' })}
//                                         onClick={() => toggleTab('3')}
//                                     >
//                                         Analytics
//                                     </NavLink>
//                                 </NavItem>
//                             </Nav>

//                             <TabContent activeTab={activeTab} className="p-3">
//                                 <TabPane tabId="1">
//                                     <Row>
//                                         <Col md={6}>
//                                             <h6>Basic Information</h6>
//                                             <p><strong>Business Name:</strong> {selectedBusiness.businessName}</p>
//                                             <p><strong>Owner:</strong> {selectedBusiness.ownerName}</p>
//                                             <p><strong>Email:</strong> {selectedBusiness.email}</p>
//                                             <p><strong>Phone:</strong> {selectedBusiness.phoneNumber}</p>
//                                             <p><strong>Primary Staff Name:</strong> {selectedBusiness?.primaryStaffAccount?.firstName + ' ' + selectedBusiness?.primaryStaffAccount?.lastName}</p>

//                                             <p><strong>Status:</strong>
//                                                 <Badge color={selectedBusiness.isActive ? 'success' : 'danger'} className="ms-2">
//                                                     {selectedBusiness.isActive ? 'Active' : 'Inactive'}
//                                                 </Badge>
//                                             </p>
//                                         </Col>
//                                         <Col md={6}>
//                                             <h6>Address</h6>
//                                             <p>
//                                                 {selectedBusiness.address?.street}<br />
//                                                 {selectedBusiness.address?.city}, {selectedBusiness.address?.state}<br />
//                                                 {selectedBusiness.address?.country} {selectedBusiness.address?.postcode}
//                                             </p>
//                                         </Col>
//                                     </Row>
//                                     {selectedBusiness.description && (
//                                         <>
//                                             <h6>Description</h6>
//                                             <p>{selectedBusiness.description}</p>
//                                         </>
//                                     )}
//                                 </TabPane>

//                                 <TabPane tabId="2">
//                                     {selectedBusiness.contract ? (
//                                         <>
//                                             <Row>
//                                                 <Col md={6}>
//                                                     <p><strong>Contract Status:</strong>
//                                                         <Badge color={selectedBusiness.contract.isSigned ? 'success' : 'warning'} className="ms-2">
//                                                             {selectedBusiness.contract.isSigned ? 'Signed' : 'Unsigned'}
//                                                         </Badge>
//                                                     </p>
//                                                     {selectedBusiness.contract.signedDate && (
//                                                         <p><strong>Signed Date:</strong> {new Date(selectedBusiness.contract.signedDate).toLocaleDateString()}</p>
//                                                     )}
//                                                     <p><strong>Payout Schedule:</strong> {selectedBusiness.contract.payoutSchedule}</p>
//                                                     <p><strong>Commission Rate:</strong> {selectedBusiness.contract.commissionRate}%</p>
//                                                 </Col>
//                                                 <Col md={6}>
//                                                     {selectedBusiness.contract.agreementPdf && (
//                                                         <>
//                                                             <h6>Contract Document</h6>
//                                                             <Button
//                                                                 color="primary"
//                                                                 onClick={() => window.open(selectedBusiness.contract.agreementPdf, '_blank')}
//                                                             >
//                                                                 <i className="ri-file-pdf-line me-1" />
//                                                                 View Contract PDF
//                                                             </Button>
//                                                         </>
//                                                     )}
//                                                 </Col>
//                                             </Row>
//                                         </>
//                                     ) : (
//                                         <p>No contract information available.</p>
//                                     )}
//                                 </TabPane>

//                                 <TabPane tabId="3">
//                                     {selectedBusiness.analytics ? (
//                                         <Row>
//                                             <Col md={3}>
//                                                 <Card className="text-center">
//                                                     <CardBody>
//                                                         <h3>{selectedBusiness.analytics.totalOrders || 0}</h3>
//                                                         <p className="text-muted mb-0">Total Orders</p>
//                                                     </CardBody>
//                                                 </Card>
//                                             </Col>
//                                             <Col md={3}>
//                                                 <Card className="text-center">
//                                                     <CardBody>
//                                                         <h3>${selectedBusiness.analytics.totalEarnings || 0}</h3>
//                                                         <p className="text-muted mb-0">Total Earnings</p>
//                                                     </CardBody>
//                                                 </Card>
//                                             </Col>
//                                             <Col md={3}>
//                                                 <Card className="text-center">
//                                                     <CardBody>
//                                                         <h3>${selectedBusiness.analytics.totalPayout || 0}</h3>
//                                                         <p className="text-muted mb-0">Total Payout</p>
//                                                     </CardBody>
//                                                 </Card>
//                                             </Col>
//                                             <Col md={3}>
//                                                 <Card className="text-center">
//                                                     <CardBody>
//                                                         <h3>{selectedBusiness.analytics.totalFoodSaved || 0}</h3>
//                                                         <p className="text-muted mb-0">Food Saved (kg)</p>
//                                                     </CardBody>
//                                                 </Card>
//                                             </Col>
//                                         </Row>
//                                     ) : (
//                                         <p>No analytics data available.</p>
//                                     )}
//                                 </TabPane>
//                             </TabContent>
//                         </>
//                     )}
//                 </ModalBody>
//                 <ModalFooter>
//                     <Button color="light" onClick={() => setViewModal(false)}>
//                         Close
//                     </Button>
//                 </ModalFooter>
//             </Modal>

//             {/* Delete Confirmation Modal */}
//             <DeleteModal
//                 show={deleteModal}
//                 onDeleteClick={handleDeleteBusiness}
//                 onCloseClick={() => setDeleteModal(false)}
//                 confirmationText="Are you sure you want to delete this business? This action cannot be undone."
//             />

//             <ToastContainer />
//         </div>
//     );
// };

// export default Businesses;