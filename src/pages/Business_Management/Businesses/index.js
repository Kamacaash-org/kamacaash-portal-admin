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
    getBusiness as onGetBusinessesData,
    addBusiness as onAddNewBusiness,
    updateBusiness as onUpdateBusiness,
    deleteBusiness as onDeleteBusiness,
    // activateBusiness as onActivateBusiness,
    // signContract as onSignContract,
} from "../../../slices/thunks";

// Formik
import * as Yup from "yup";
import { useFormik } from "formik";

const Businesses = () => {
    document.title = "Businesses | simad University";

    const dispatch = useDispatch();

    const selectBusinessesData = createSelector(
        (state) => state.BusinessManagement,
        (businessesData) => businessesData.businessesData
    );

    const businessesData = useSelector(selectBusinessesData);
    const [businessesList, setBusinessesList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [contractModal, setContractModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState(null);

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

    // Update businesses list when data changes
    useEffect(() => {
        fetchBusinesses();
    }, [fetchBusinesses]);

    useEffect(() => {
        setBusinessesList(businessesData?.businesses || []);
    }, [businessesData]);

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
        setContractModal(true);
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
        // dispatch(onActivateBusiness(business._id));
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
            agreementPdf: Yup.string().when('isSigned', (isSigned, schema) => {
                return isSigned ? schema.required("Agreement PDF is required when contract is signed") : schema
            })
        }),
        onSubmit: (values) => {
            if (selectedBusiness) {
                const contractData = {
                    ...values,
                    isSigned: true // Always set to true when submitting
                };
                // dispatch(onSignContract({
                //     id: selectedBusiness._id,
                //     ...contractData
                // }));
            }
            setContractModal(false);
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
            name: 'Business Name',
            selector: row => row.businessName,
            sortable: true
        },
        {
            name: 'Owner',
            selector: row => row.ownerName,
            sortable: true
        },
        {
            name: 'Email',
            selector: row => row.email,
            sortable: true
        },
        {
            name: 'Phone',
            selector: row => row.phoneNumber,
            sortable: true
        },
        {
            name: 'Contract Status',
            cell: row => (
                <Badge color={row.contract?.isSigned ? 'success' : 'warning'}>
                    {row.contract?.isSigned ? 'Signed' : 'Unsigned'}
                </Badge>
            ),
            sortable: true,
            width: '120px'
        },
        {
            name: 'Status',
            cell: row => (
                <Badge color={row.isActive ? 'success' : 'danger'}>
                    {row.isActive ? 'Active' : 'Inactive'}
                </Badge>
            ),
            sortable: true,
            width: '100px'
        },
        {
            name: 'Actions',
            cell: row => (
                <div className="d-flex gap-2">
                    <Button color="soft-info" size="sm" onClick={() => handleContract(row)}>
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
            width: '200px'
        }
    ];

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

                                <FormGroup>
                                    <Label>Primary Staff Account ID <span className="text-danger">*</span></Label>
                                    <Input
                                        name="primaryStaffAccount"
                                        value={validation.values.primaryStaffAccount}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        invalid={validation.touched.primaryStaffAccount && !!validation.errors.primaryStaffAccount}
                                    />
                                    <FormFeedback>{validation.errors.primaryStaffAccount}</FormFeedback>
                                </FormGroup>

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
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Agreement PDF URL <span className="text-danger">*</span></Label>
                                            <Input
                                                name="agreementPdf"
                                                placeholder="Enter PDF URL"
                                                value={contractValidation.values.agreementPdf}
                                                onChange={contractValidation.handleChange}
                                                onBlur={contractValidation.handleBlur}
                                                invalid={contractValidation.touched.agreementPdf && !!contractValidation.errors.agreementPdf}
                                            />
                                            <FormFeedback>{contractValidation.errors.agreementPdf}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                </Row>

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
                        <Button color="primary" type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Contract'}
                        </Button>
                    </ModalFooter>
                </Form>
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