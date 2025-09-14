import React, { useState, useEffect, useCallback } from 'react';
import DataTable from "react-data-table-component";
import Select from "react-select";
import {
    Card, CardHeader, CardBody,
    Col, Container, Row,
    Form, Input, Label, FormGroup,
    Modal, ModalBody, ModalFooter, ModalHeader,
    Button, Badge, FormFeedback, TabContent, TabPane, Nav, NavItem, NavLink
} from "reactstrap";
import classnames from 'classnames';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';

//redux
import {
    getBusinessesData as onGetBusinessesData,
    addBusiness as onAddNewBusiness,
    updateBusiness as onUpdateBusiness,
    deleteBusiness as onDeleteBusiness,
    activateBusiness as onActivateBusiness,
    signContract as onSignContract,
    getStaffs as onGetStaffData
} from "../../../slices/thunks";

// Formik
import * as Yup from "yup";
import { useFormik } from "formik";

const Businesses = () => {
    document.title = "Businesses | Test 001";

    const dispatch = useDispatch();

    const selectBusinessesData = createSelector(
        (state) => state.BusinessManagement,
        (businessesData) => businessesData.businessesData
    );

    const selectStaffData = createSelector(
        (state) => state.UserManagement,
        (staffData) => staffData.staffData
    );

    const businessesData = useSelector(selectBusinessesData);
    const staffData = useSelector(selectStaffData);
    const [businessesList, setBusinessesList] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [contractModal, setContractModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [activeTab, setActiveTab] = useState('1');
    const [uploading, setUploading] = useState(false);
    const [fileUploadError, setFileUploadError] = useState(null);

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        contractStatus: ''
    });

    // Form state
    const [formData, setFormData] = useState({
        ownerName: "",
        businessName: "",
        phoneNumber: "",
        email: "",
        address: {
            street: "",
            city: "",
            state: "",
            country: "SOMALIA",
            postcode: ""
        },
        description: "",
        logo: "",
        bannerImage: "",
        primaryStaffAccount: "",
        isActive: true
    });

    // Contract form state
    const [contractFormData, setContractFormData] = useState({
        isSigned: false,
        signedDate: new Date().toISOString().split('T')[0],
        agreementPdf: "",
        payoutSchedule: "WEEKLY",
        commissionRate: 10
    });

    // File state (separate from Formik)
    const [selectedFile, setSelectedFile] = useState(null);

    // Options for selects
    const statusOptions = [
        { value: "", label: "All Statuses" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" }
    ];

    const contractStatusOptions = [
        { value: "", label: "All Contract Statuses" },
        { value: "Signed", label: "Contract Signed" },
        { value: "Unsigned", label: "Contract Unsigned" }
    ];

    const payoutOptions = [
        { value: "DAILY", label: "Daily" },
        { value: "WEEKLY", label: "Weekly" },
        { value: "MONTHLY", label: "Monthly" },
        { value: "YEARLY", label: "Yearly" }
    ];

    // Fetch businesses with filters
    const fetchBusinesses = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetBusinessesData());
        } catch (error) {
            console.error("Error loading businesses:", error);
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    // Fetch staff data
    const fetchStaff = useCallback(async () => {
        try {
            await dispatch(onGetStaffData());
        } catch (error) {
            console.error("Error loading staff:", error);
        }
    }, [dispatch]);

    // Update businesses list when data changes
    useEffect(() => {
        fetchBusinesses();
        fetchStaff();
    }, [fetchBusinesses, fetchStaff]);

    useEffect(() => {
        setBusinessesList(businessesData?.businesses || []);
    }, [businessesData]);

    useEffect(() => {
        setStaffList(staffData?.staff || []);
    }, [staffData]);

    // Prepare staff options for dropdown
    const staffOptions = staffList
        .filter(staff => staff.isActive)
        .map(staff => ({
            value: staff._id,
            label: `${staff.firstName} ${staff.lastName} (${staff.email})`
        }));

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.includes('address.')) {
            const addressField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [addressField]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    // Handle contract form changes
    const handleContractInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setContractFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle file selection
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        setSelectedFile(file);
        setFileUploadError(null);

        // Validate file
        if (file) {
            if (file.type !== 'application/pdf') {
                setFileUploadError('Only PDF files are allowed');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setFileUploadError('File size must be less than 10MB');
                return;
            }
        }
    };

    // Handle select changes
    const handleSelectChange = (name, selectedOption) => {
        setFormData(prev => ({
            ...prev,
            [name]: selectedOption?.value || ""
        }));
    };

    // Handle contract select changes
    const handleContractSelectChange = (name, selectedOption) => {
        setContractFormData(prev => ({
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

    // Filter businesses based on filters
    const filteredBusinesses = businessesList.filter(business => {
        return (
            (filters.search === '' ||
                business.businessName.toLowerCase().includes(filters.search.toLowerCase()) ||
                business.ownerName.toLowerCase().includes(filters.search.toLowerCase()) ||
                business.email.toLowerCase().includes(filters.search.toLowerCase()) ||
                business.phoneNumber.toLowerCase().includes(filters.search.toLowerCase())) &&
            (filters.status === '' ||
                (filters.status === 'Active' ? business.isActive : !business.isActive)) &&
            (filters.contractStatus === '' ||
                (filters.contractStatus === 'Signed' ? business.contract?.isSigned : !business.contract?.isSigned))
        );
    });

    // Open modal for edit
    const handleEdit = (business) => {
        setSelectedBusiness(business);
        setFormData({
            ownerName: business.ownerName || "",
            businessName: business.businessName || "",
            phoneNumber: business.phoneNumber || "",
            email: business.email || "",
            address: business.address || {
                street: "",
                city: "",
                state: "",
                country: "SOMALIA",
                postcode: ""
            },
            description: business.description || "",
            logo: business.logo || "",
            bannerImage: business.bannerImage || "",
            primaryStaffAccount: business.primaryStaffAccount || "",
            isActive: business.isActive || true
        });
        setIsEdit(true);
        setModal(true);
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedBusiness(null);
        setFormData({
            ownerName: "",
            businessName: "",
            phoneNumber: "",
            email: "",
            address: {
                street: "",
                city: "",
                state: "",
                country: "SOMALIA",
                postcode: ""
            },
            description: "",
            logo: "",
            bannerImage: "",
            primaryStaffAccount: "",
            isActive: true
        });
        setIsEdit(false);
        setModal(true);
    };

    // Open view modal
    const handleView = (business) => {
        setSelectedBusiness(business);
        setViewModal(true);
    };

    // Open contract modal
    const handleContract = (business) => {
        setSelectedBusiness(business);
        setContractFormData({
            isSigned: business.contract?.isSigned || false,
            signedDate: business.contract?.signedDate ?
                new Date(business.contract.signedDate).toISOString().split('T')[0] :
                new Date().toISOString().split('T')[0],
            agreementPdf: business.contract?.agreementPdf || "",
            payoutSchedule: business.contract?.payoutSchedule || "WEEKLY",
            commissionRate: business.contract?.commissionRate || 10
        });
        setSelectedFile(null);
        setFileUploadError(null);
        setContractModal(true);
    };

    // Handle PDF upload
    const handlePdfUpload = async (file) => {
        setUploading(true);
        setFileUploadError(null);
        try {
            const formData = new FormData();
            formData.append('contract', file);

            const response = await fetch('http://localhost:4000/api/v1/upload/contract', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Upload failed');
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Upload failed');
            }

            return data.data?.file?.filePath;

        } catch (error) {
            console.error('Upload failed:', error);
            setFileUploadError(error.message);
            throw error;
        } finally {
            setUploading(false);
        }
    };

    // Delete Business
    const onClickDelete = (business) => {
        setSelectedBusiness(business);
        setDeleteModal(true);
    };

    const handleDeleteBusiness = () => {
        if (selectedBusiness) {
            dispatch(onDeleteBusiness(selectedBusiness._id));
            setDeleteModal(false);
        }
    };

    // Activate Business
    const handleActivateBusiness = (business) => {
        dispatch(onActivateBusiness(business._id));
    };

    // Form validation
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            ownerName: formData.ownerName,
            businessName: formData.businessName,
            phoneNumber: formData.phoneNumber,
            email: formData.email,
            address: formData.address,
            description: formData.description,
            logo: formData.logo,
            bannerImage: formData.bannerImage,
            primaryStaffAccount: formData.primaryStaffAccount,
            isActive: formData.isActive
        },
        validationSchema: Yup.object({
            ownerName: Yup.string()
                .required("Owner name is required")
                .trim(),
            businessName: Yup.string()
                .required("Business name is required")
                .trim(),
            phoneNumber: Yup.string()
                .required("Phone number is required")
                .trim(),
            email: Yup.string()
                .email("Invalid email format")
                .required("Email is required")
                .trim()
                .lowercase(),
            'address.street': Yup.string().trim(),
            'address.city': Yup.string().trim(),
            'address.state': Yup.string().trim(),
            'address.country': Yup.string().trim(),
            'address.postcode': Yup.string().trim(),
            description: Yup.string().trim(),
            logo: Yup.string().trim(),
            bannerImage: Yup.string().trim(),
            primaryStaffAccount: Yup.string().required("Primary staff account is required"),
            isActive: Yup.boolean()
        }),
        onSubmit: (values) => {
            if (isEdit) {
                const updateBusinessData = {
                    id: selectedBusiness ? selectedBusiness._id : 0,
                    ...values
                };
                dispatch(onUpdateBusiness(updateBusinessData));
            } else {
                const newBusinessData = {
                    ...values
                };
                dispatch(onAddNewBusiness(newBusinessData));
            }
            setModal(false);
        },
    });

    // Contract form validation
    const contractValidation = useFormik({
        enableReinitialize: true,
        initialValues: contractFormData,
        validationSchema: Yup.object({
            signedDate: Yup.date().required("Signed date is required"),
            payoutSchedule: Yup.string().required("Payout schedule is required"),
            commissionRate: Yup.number()
                .min(0, "Commission rate must be at least 0%")
                .max(100, "Commission rate cannot exceed 100%")
                .required("Commission rate is required"),
        }),
        onSubmit: async (values) => {
            try {
                let agreementPdfPath = values.agreementPdf;

                // Upload new file if provided
                if (selectedFile) {
                    agreementPdfPath = await handlePdfUpload(selectedFile);
                }

                if (!agreementPdfPath && values.isSigned) {
                    throw new Error("Agreement PDF is required when signing contract");
                }

                if (selectedBusiness) {
                    const contractData = {
                        id: selectedBusiness._id,
                        ...values,
                        agreementPdf: agreementPdfPath,
                        isSigned: true,
                        signedDate: new Date(values.signedDate).toISOString()
                    };

                    dispatch(onSignContract(contractData));
                }
                setContractModal(false);
            } catch (error) {
                console.error('Failed to save contract:', error);
                alert(`Failed to save contract: ${error.message}`);
            }
        },
    });

    // Table columns
    const columns = [
        {
            name: '#',
            cell: (row, index) => index + 1
        },
        {
            name: 'Business Name',
            selector: row => row.businessName,
        },
        {
            name: 'Owner',
            selector: row => row.ownerName,
        },
        {
            name: 'Email',
            selector: row => row.email,
        },
        {
            name: 'Phone',
            selector: row => row.phoneNumber,
        },
        {
            name: 'Contract Status',
            cell: row => (
                <Badge color={row.contract?.isSigned ? 'success' : 'warning'}>
                    {row.contract?.isSigned ? 'Signed' : 'Unsigned'}
                </Badge>
            ),
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
                    <Button color="soft-primary" size="sm" onClick={() => handleContract(row)}>
                        <i className="ri-file-text-line" />
                    </Button>
                    <Button color="soft-primary" size="sm" onClick={() => handleEdit(row)}>
                        <i className="ri-pencil-line" />
                    </Button>
                    {row.isActive ? (
                        <Button color="soft-warning" size="sm" onClick={() => handleActivateBusiness(row)}>
                            <i className="ri-close-circle-line" />
                        </Button>
                    ) : (
                        <Button color="soft-success" size="sm" onClick={() => handleActivateBusiness(row)}>
                            <i className="ri-checkbox-circle-line" />
                        </Button>
                    )}
                    <Button color="soft-danger" size="sm" onClick={() => onClickDelete(row)}>
                        <i className="ri-delete-bin-line" />
                    </Button>
                </div>
            ),
            width: '230px'
        }
    ];

    const toggleTab = (tab) => {
        if (activeTab !== tab) {
            setActiveTab(tab);
        }
    };

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Businesses" pageTitle="Partners" />

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
                                        placeholder="Search by business name, owner, email or phone"
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
                                    <Label>Contract Status</Label>
                                    <Select
                                        options={contractStatusOptions}
                                        value={contractStatusOptions.find(opt => opt.value === filters.contractStatus)}
                                        onChange={(opt) => handleSelectFilterChange('contractStatus', opt)}
                                        isClearable
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={2} className="d-flex align-items-end mb-3">
                                <Button color="primary" onClick={fetchBusinesses} disabled={loading}>
                                    {loading ? 'Filtering...' : 'Apply Filters'}
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Data Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Businesses List</h5>
                        <Button color="primary" onClick={handleCreate}>
                            <i className="ri-add-line me-1" /> Add Business
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
                                highlightOnHover
                                responsive
                                noDataComponent="No businesses found matching your criteria"
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Add/Edit Business Modal */}
            <Modal isOpen={modal} toggle={() => setModal(false)} size="lg">
                <ModalHeader toggle={() => setModal(false)}>
                    {isEdit ? 'Edit Business' : 'Add New Business'}
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
                                            <Label>Business Name <span className="text-danger">*</span></Label>
                                            <Input
                                                name="businessName"
                                                value={validation.values.businessName}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.businessName && !!validation.errors.businessName}
                                            />
                                            <FormFeedback>{validation.errors.businessName}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Owner Name <span className="text-danger">*</span></Label>
                                            <Input
                                                name="ownerName"
                                                value={validation.values.ownerName}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.ownerName && !!validation.errors.ownerName}
                                            />
                                            <FormFeedback>{validation.errors.ownerName}</FormFeedback>
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
                                            />
                                            <FormFeedback>{validation.errors.email}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Phone Number <span className="text-danger">*</span></Label>
                                            <Input
                                                name="phoneNumber"
                                                value={validation.values.phoneNumber}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.phoneNumber && !!validation.errors.phoneNumber}
                                            />
                                            <FormFeedback>{validation.errors.phoneNumber}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <FormGroup>
                                    <Label>Primary Staff Account <span className="text-danger">*</span></Label>
                                    <Select
                                        options={staffOptions}
                                        value={staffOptions.find(opt => opt.value === validation.values.primaryStaffAccount)}
                                        onChange={(opt) => handleSelectChange('primaryStaffAccount', opt)}
                                        isClearable
                                        placeholder="Select staff member"
                                    />
                                    <FormFeedback>
                                        {validation.touched.primaryStaffAccount && validation.errors.primaryStaffAccount}
                                    </FormFeedback>
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

                                <h6 className="mb-3">Address Information</h6>
                                <Row>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Street</Label>
                                            <Input
                                                name="address.street"
                                                value={validation.values.address.street}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>City</Label>
                                            <Input
                                                name="address.city"
                                                value={validation.values.address.city}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>State</Label>
                                            <Input
                                                name="address.state"
                                                value={validation.values.address.state}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Country</Label>
                                            <Input
                                                name="address.country"
                                                value={validation.values.address.country}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Postcode</Label>
                                            <Input
                                                name="address.postcode"
                                                value={validation.values.address.postcode}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                            />
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
                                        Active Business
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

            {/* Contract Modal */}
            <Modal isOpen={contractModal} toggle={() => setContractModal(false)} size="lg">
                <ModalHeader toggle={() => setContractModal(false)}>
                    Manage Contract - {selectedBusiness?.businessName}
                </ModalHeader>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    contractValidation.handleSubmit();
                }}>
                    <ModalBody>
                        <Row>
                            <Col lg={12}>
                                <Row>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Payout Schedule <span className="text-danger">*</span></Label>
                                            <Select
                                                options={payoutOptions}
                                                value={payoutOptions.find(opt => opt.value === contractValidation.values.payoutSchedule)}
                                                onChange={(opt) => handleContractSelectChange('payoutSchedule', opt)}
                                                isClearable
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Commission Rate (%) <span className="text-danger">*</span></Label>
                                            <Input
                                                type="number"
                                                name="commissionRate"
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                value={contractValidation.values.commissionRate}
                                                onChange={contractValidation.handleChange}
                                                onBlur={contractValidation.handleBlur}
                                                invalid={contractValidation.touched.commissionRate && !!contractValidation.errors.commissionRate}
                                            />
                                            <FormFeedback>{contractValidation.errors.commissionRate}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Signed Date <span className="text-danger">*</span></Label>
                                            <Input
                                                type="date"
                                                name="signedDate"
                                                value={contractValidation.values.signedDate}
                                                onChange={contractValidation.handleChange}
                                                onBlur={contractValidation.handleBlur}
                                                invalid={contractValidation.touched.signedDate && !!contractValidation.errors.signedDate}
                                            />
                                            <FormFeedback>{contractValidation.errors.signedDate}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <FormGroup>
                                    <Label>Agreement PDF <span className="text-danger">*</span></Label>
                                    <Input
                                        type="file"
                                        name="agreementFile"
                                        accept=".pdf"
                                        onChange={handleFileSelect}
                                    />
                                    <small className="form-text text-muted">
                                        Upload a PDF contract document (Max: 10MB)
                                    </small>

                                    {fileUploadError && (
                                        <div className="text-danger mt-1">
                                            <small>{fileUploadError}</small>
                                        </div>
                                    )}

                                    {uploading && (
                                        <div className="text-info mt-1">
                                            <small>Uploading file...</small>
                                        </div>
                                    )}

                                    {contractValidation.values.agreementPdf && (
                                        <div className="mt-2">
                                            <Label>Current Contract:</Label>
                                            <div>
                                                <Button
                                                    color="link"
                                                    size="sm"
                                                    onClick={() => window.open(contractValidation.values.agreementPdf, '_blank')}
                                                >
                                                    <i className="ri-file-pdf-line me-1" />
                                                    View Current Contract
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </FormGroup>

                                <FormGroup check className="mt-3">
                                    <Input
                                        type="checkbox"
                                        name="isSigned"
                                        checked={contractValidation.values.isSigned}
                                        onChange={contractValidation.handleChange}
                                        id="isSigned"
                                    />
                                    <Label for="isSigned" check>
                                        Contract Signed
                                    </Label>
                                </FormGroup>
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="light" onClick={() => setContractModal(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" type="submit" disabled={uploading || loading}>
                            {uploading ? 'Uploading...' : loading ? 'Saving...' : 'Save Contract'}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* View Business Modal */}
            <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="xl">
                <ModalHeader toggle={() => setViewModal(false)}>
                    Business Details - {selectedBusiness?.businessName}
                </ModalHeader>
                <ModalBody>
                    {selectedBusiness && (
                        <>
                            <Nav tabs>
                                <NavItem>
                                    <NavLink
                                        className={classnames({ active: activeTab === '1' })}
                                        onClick={() => toggleTab('1')}
                                    >
                                        Business Info
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={classnames({ active: activeTab === '2' })}
                                        onClick={() => toggleTab('2')}
                                    >
                                        Contract Details
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={classnames({ active: activeTab === '3' })}
                                        onClick={() => toggleTab('3')}
                                    >
                                        Analytics
                                    </NavLink>
                                </NavItem>
                            </Nav>

                            <TabContent activeTab={activeTab} className="p-3">
                                <TabPane tabId="1">
                                    <Row>
                                        <Col md={6}>
                                            <h6>Basic Information</h6>
                                            <p><strong>Business Name:</strong> {selectedBusiness.businessName}</p>
                                            <p><strong>Owner:</strong> {selectedBusiness.ownerName}</p>
                                            <p><strong>Email:</strong> {selectedBusiness.email}</p>
                                            <p><strong>Phone:</strong> {selectedBusiness.phoneNumber}</p>
                                            <p><strong>Status:</strong>
                                                <Badge color={selectedBusiness.isActive ? 'success' : 'danger'} className="ms-2">
                                                    {selectedBusiness.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </p>
                                        </Col>
                                        <Col md={6}>
                                            <h6>Address</h6>
                                            <p>
                                                {selectedBusiness.address?.street}<br />
                                                {selectedBusiness.address?.city}, {selectedBusiness.address?.state}<br />
                                                {selectedBusiness.address?.country} {selectedBusiness.address?.postcode}
                                            </p>
                                        </Col>
                                    </Row>
                                    {selectedBusiness.description && (
                                        <>
                                            <h6>Description</h6>
                                            <p>{selectedBusiness.description}</p>
                                        </>
                                    )}
                                </TabPane>

                                <TabPane tabId="2">
                                    {selectedBusiness.contract ? (
                                        <>
                                            <Row>
                                                <Col md={6}>
                                                    <p><strong>Contract Status:</strong>
                                                        <Badge color={selectedBusiness.contract.isSigned ? 'success' : 'warning'} className="ms-2">
                                                            {selectedBusiness.contract.isSigned ? 'Signed' : 'Unsigned'}
                                                        </Badge>
                                                    </p>
                                                    {selectedBusiness.contract.signedDate && (
                                                        <p><strong>Signed Date:</strong> {new Date(selectedBusiness.contract.signedDate).toLocaleDateString()}</p>
                                                    )}
                                                    <p><strong>Payout Schedule:</strong> {selectedBusiness.contract.payoutSchedule}</p>
                                                    <p><strong>Commission Rate:</strong> {selectedBusiness.contract.commissionRate}%</p>
                                                </Col>
                                                <Col md={6}>
                                                    {selectedBusiness.contract.agreementPdf && (
                                                        <>
                                                            <h6>Contract Document</h6>
                                                            <Button
                                                                color="primary"
                                                                onClick={() => window.open(selectedBusiness.contract.agreementPdf, '_blank')}
                                                            >
                                                                <i className="ri-file-pdf-line me-1" />
                                                                View Contract PDF
                                                            </Button>
                                                        </>
                                                    )}
                                                </Col>
                                            </Row>
                                        </>
                                    ) : (
                                        <p>No contract information available.</p>
                                    )}
                                </TabPane>

                                <TabPane tabId="3">
                                    {selectedBusiness.analytics ? (
                                        <Row>
                                            <Col md={3}>
                                                <Card className="text-center">
                                                    <CardBody>
                                                        <h3>{selectedBusiness.analytics.totalOrders || 0}</h3>
                                                        <p className="text-muted mb-0">Total Orders</p>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                            <Col md={3}>
                                                <Card className="text-center">
                                                    <CardBody>
                                                        <h3>${selectedBusiness.analytics.totalEarnings || 0}</h3>
                                                        <p className="text-muted mb-0">Total Earnings</p>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                            <Col md={3}>
                                                <Card className="text-center">
                                                    <CardBody>
                                                        <h3>${selectedBusiness.analytics.totalPayout || 0}</h3>
                                                        <p className="text-muted mb-0">Total Payout</p>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                            <Col md={3}>
                                                <Card className="text-center">
                                                    <CardBody>
                                                        <h3>{selectedBusiness.analytics.totalFoodSaved || 0}</h3>
                                                        <p className="text-muted mb-0">Food Saved (kg)</p>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        </Row>
                                    ) : (
                                        <p>No analytics data available.</p>
                                    )}
                                </TabPane>
                            </TabContent>
                        </>
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
                onDeleteClick={handleDeleteBusiness}
                onCloseClick={() => setDeleteModal(false)}
                confirmationText="Are you sure you want to delete this business? This action cannot be undone."
            />

            <ToastContainer />
        </div>
    );
};

export default Businesses;