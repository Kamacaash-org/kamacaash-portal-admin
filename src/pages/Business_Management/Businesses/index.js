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
import { PDFDownloadLink } from '@react-pdf/renderer';
import AgreementPdf from '../../../Components/Common/AgreementPdf';

// Register the plugins
registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';

// Redux thunks
import {
    getBusinessesData as onGetBusinesses,
    archiveBusiness as onDeleteBusiness,
    createOrUpdateBusiness as onCreateOrUpdateBusiness,
    toggleStatusBusiness as onToggleBusinessActiveStatus,
    getCategories as onGetCategories,
    getStaffs as onGetStaffData
} from "../../../slices/thunks";

// Selectors
const selectBusinessesData = createSelector(
    (state) => state.BusinessManagement,
    (businessesData) => businessesData.businessesData || []
);
const selectCategoriesData = createSelector(
    (state) => state.BusinessManagement,
    (categoriesData) => categoriesData.categoriesData.categories || []
);

const selectStaffData = createSelector(
    (state) => state.UserManagement,
    (staffData) => staffData.staffData || []
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
    document.title = "Businesses | Kamacaash";

    const dispatch = useDispatch();
    const businessesData = useSelector(selectBusinessesData);
    const categoriesData = useSelector(selectCategoriesData);
    const staffData = useSelector(selectStaffData);

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
    const [staffList, setStaffList] = useState([]);
    const [activeTab, setActiveTab] = useState('1');
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
        contract: {
            payoutSchedule: "WEEKLY"
        },
        bankAccountDetails: {
            accountHolderName: "",
            sortCode: "",
            accountNumber: ""
        },
        taxId: "",
        registrationNumber: "",
        defaultLanguage: "en",
        currency: "USD",
        timeZone: "Africa/Mogadishu"
    });

    const [logoFiles, setLogoFiles] = useState([]);
    const [bannerFiles, setBannerFiles] = useState([]);
    const [licenseFiles, setLicenseFiles] = useState([]);




    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetBusinesses());
            await dispatch(onGetCategories());
            await dispatch(onGetStaffData());
        } catch (error) {
            console.error("Error loading businesses:", error);

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


    useEffect(() => {
        const initialStaffsData = Array.isArray(staffData) ? staffData : [];
        setStaffList(initialStaffsData);
    }, [staffData]);

    useEffect(() => {
        const initialCategories = Array.isArray(categoriesData) ? categoriesData : [];
        setCategories([
            // { value: '', label: 'Select Category' },
            ...(initialCategories || []).map(cat => ({
                value: cat._id,
                label: cat.name
            }))
        ]);

    }, [categoriesData]);



    // Prepare staff options for dropdown
    const staffOptions = [
        { value: '', label: 'Select Staff' },
        ...staffList
            .filter(staff => staff.isActive)
            .map(staff => ({
                value: staff._id,
                label: `${staff.firstName} ${staff.lastName} (${staff.phone})`
            }))
    ];



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
        const requiredFields = ['ownerName', 'businessName', 'primaryStaffAccount', 'category', 'phoneNumber'];
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
            contract: {
                payoutSchedule: "WEEKLY"
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
                    submitData.append(`address[type]`, formData.address.coordinates.type);
                    submitData.append(`address[coordinates][0]`, formData.address.coordinates.coordinates[0]);
                    submitData.append(`address[coordinates][1]`, formData.address.coordinates.coordinates[1]);
                } else {
                    submitData.append(`address[${key}]`, formData.address[key]);
                }
            });

            // Append opening hours
            Object.keys(formData.openingHours).forEach(day => {
                const openTime = formData.openingHours[day]?.open || "08:00";
                const closeTime = formData.openingHours[day]?.close || "20:00";
                submitData.append(`openingHours[${day}][open]`, openTime);
                submitData.append(`openingHours[${day}][close]`, closeTime);
            });

            // Append contract
            submitData.append('contract[payoutSchedule]', formData.contract.payoutSchedule);

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
                    submitData.append(`address[type]`, formData.address.coordinates.type);
                    submitData.append(`address[coordinates][0]`, formData.address.coordinates.coordinates[0]);
                    submitData.append(`address[coordinates][1]`, formData.address.coordinates.coordinates[1]);
                } else {
                    submitData.append(`address[${key}]`, formData.address[key]);
                }
            });

            // Append opening hours
            Object.keys(formData.openingHours).forEach(day => {
                const openTime = formData.openingHours[day]?.open || "08:00";
                const closeTime = formData.openingHours[day]?.close || "20:00";
                submitData.append(`openingHours[${day}][open]`, openTime);
                submitData.append(`openingHours[${day}][close]`, closeTime);
            });

            // Append contract
            submitData.append('contract[payoutSchedule]', formData.contract.payoutSchedule);

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
        } catch (error) {
            console.error("Error deleting business:", error);
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
        } catch (error) {
            console.error("Error toggling business status:", error);
        }
    };

    // Open modal for edit
    const handleEdit = (business) => {
        const defaultOpeningHours = {
            mon: { open: "08:00", close: "20:00" },
            tue: { open: "08:00", close: "20:00" },
            wed: { open: "08:00", close: "20:00" },
            thur: { open: "08:00", close: "20:00" },
            fri: { open: "14:00", close: "20:00" },
            sat: { open: "08:00", close: "20:00" },
            sun: { open: "08:00", close: "18:00" }
        };

        // Merge business openingHours with defaults to ensure all fields are defined
        const mergedOpeningHours = { ...defaultOpeningHours };
        if (business.openingHours) {
            Object.keys(business.openingHours).forEach(day => {
                if (business.openingHours[day]) {
                    mergedOpeningHours[day] = {
                        open: business.openingHours[day].open || defaultOpeningHours[day].open,
                        close: business.openingHours[day].close || defaultOpeningHours[day].close
                    };
                }
            });
        }

        setSelectedBusiness(business);
        setFormData({
            ownerName: business.ownerName || "",
            businessName: business.businessName || "",
            category: business.category || "",
            primaryStaffAccount: business.primaryStaffAccount._id || "",
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
            openingHours: mergedOpeningHours,
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
                    {/* Agreement Download */}
                    <PDFDownloadLink
                        document={<AgreementPdf business={row} />}
                        fileName={`Kamacaash-Agreement-${row.businessName}.pdf`}
                    >
                        {({ loading }) => (
                            <Button
                                color="outline-success"
                                size="sm"
                                className="btn-icon"
                                title="Download Agreement"
                                disabled={loading}
                            >
                                <i className="ri-file-download-line" />
                            </Button>
                        )}
                    </PDFDownloadLink>
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
                                            { value: 'all', label: 'All' },
                                            { value: 'PENDING', label: 'Pending' },
                                            { value: 'APPROVED', label: 'Approved' },
                                            { value: 'REJECTED', label: 'Rejected' }
                                        ]}
                                        value={{
                                            value: filters.status,
                                            label: filters.status === 'all' ? 'All' : filters.status
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
                                            { value: 'all', label: 'All' },
                                            ...categories
                                        ]}
                                        value={{
                                            value: filters.category,
                                            label: filters.category === 'all' ? 'All' :
                                                categories.find(cat => cat.value === filters.category)?.label || 'All'
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
                                // highlightOnHover
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
                                            // backgroundColor: '#f8f9fa',
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
            <Modal isOpen={modal} toggle={handleModalClose} unmountOnClose={false} size="xl" centered scrollable>
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


                                                <FormGroup>
                                                    <Label>Primary Staff Account <span className="text-danger">*</span></Label>
                                                    <Select
                                                        options={staffOptions}
                                                        value={staffOptions.find(opt => opt.value === formData.primaryStaffAccount)}
                                                        onChange={(opt) => setFormData(prev => ({ ...prev, primaryStaffAccount: opt.value }))}
                                                        placeholder="Select category"
                                                        className="react-select"
                                                        classNamePrefix="select"
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
            <Modal isOpen={viewModal} toggle={() => setViewModal(false)} unmountOnClose={false} size="xl" centered scrollable>
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