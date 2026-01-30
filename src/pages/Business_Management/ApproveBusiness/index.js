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

import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';

// Redux thunks
import {
    getBusinessesData as onGetBusinesses,
    approveBusiness as onApproveBusiness,
    rejectBusiness as onRejectBusiness
} from "../../../slices/thunks";

// Selectors
const selectBusinessesData = createSelector(
    (state) => state.BusinessManagement,
    (businessesData) => businessesData.businessesData.businesses || []
);

const ApproveBusinessPage = () => {
    document.title = "Approve Businesses | Kamacaash";

    const dispatch = useDispatch();
    const businessesData = useSelector(selectBusinessesData);

    // State management
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [approveModal, setApproveModal] = useState(false);
    const [rejectModal, setRejectModal] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [filteredBusinesses, setFilteredBusinesses] = useState([]);
    const [activeTab, setActiveTab] = useState('1');
    const [rejectionReason, setRejectionReason] = useState('');

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        status: 'PENDING' // 'all', 'PENDING', 'APPROVED', 'REJECTED'
    });

    // Stats state
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        pendingPercentage: 0
    });

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetBusinesses());
        } catch (error) {
            console.error("Error loading businesses:", error);
            toast.error("Failed to load businesses");
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    // Load data
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Update lists and stats when data changes
    useEffect(() => {
        const initialBusinesses = Array.isArray(businessesData) ? businessesData : [];
        setBusinesses(initialBusinesses);

        // Calculate stats
        const total = initialBusinesses.length;
        const pending = initialBusinesses.filter(b => b.status === 'PENDING').length;
        const approved = initialBusinesses.filter(b => b.status === 'APPROVED').length;
        const rejected = initialBusinesses.filter(b => b.status === 'REJECTED').length;
        const pendingPercentage = total > 0 ? Math.round((pending / total) * 100) : 0;

        setStats({
            total,
            pending,
            approved,
            rejected,
            pendingPercentage
        });

        // Apply filters
        applyFilters(initialBusinesses, filters);
    }, [businessesData, filters]);

    // Apply filters
    const applyFilters = (businessList, filterSettings) => {
        let filtered = businessList;

        // Search filter
        if (filterSettings.search) {
            filtered = filtered.filter(business =>
                business.businessName?.toLowerCase().includes(filterSettings.search.toLowerCase()) ||
                business.ownerName?.toLowerCase().includes(filterSettings.search.toLowerCase()) ||
                business.email?.toLowerCase().includes(filterSettings.search.toLowerCase()) ||
                business.phoneNumber?.includes(filterSettings.search)
            );
        }

        // Status filter
        if (filterSettings.status !== 'all') {
            filtered = filtered.filter(business => business.status === filterSettings.status);
        }

        setFilteredBusinesses(filtered);
    };

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
    };

    // Handle approve business
    const handleApprove = async () => {
        if (!selectedBusiness) return;

        try {
            await dispatch(onApproveBusiness(selectedBusiness._id));
            setApproveModal(false);
        } catch (error) {
            console.error("Error approving business:", error);
            toast.error("Failed to approve business");
        }
    };

    // Handle reject business
    const handleReject = async () => {
        if (!selectedBusiness || !rejectionReason.trim()) {
            toast.warning('Please provide a rejection reason');
            return;
        }

        try {
            await dispatch(onRejectBusiness({
                id: selectedBusiness._id,
                rejectionReason: rejectionReason.trim()
            }));
            setRejectModal(false);
            setRejectionReason('');
        } catch (error) {
            console.error("Error rejecting business:", error);
            toast.error("Failed to reject business");
        }
    };

    // Open modal for view
    const handleView = (business) => {
        setSelectedBusiness(business);
        setViewModal(true);
        setActiveTab('1');
    };

    // Open modal for approve
    const handleApproveClick = (business) => {
        setSelectedBusiness(business);
        setApproveModal(true);
    };

    // Open modal for reject
    const handleRejectClick = (business) => {
        setSelectedBusiness(business);
        setRejectModal(true);
        setRejectionReason('');
    };

    // Get status badge color and icon
    const getStatusBadge = (status) => {
        switch (status) {
            case 'APPROVED':
                return {
                    color: 'success',
                    icon: 'ri-checkbox-circle-line',
                    text: 'Approved'
                };
            case 'PENDING':
                return {
                    color: 'warning',
                    icon: 'ri-time-line',
                    text: 'Pending Review'
                };
            case 'REJECTED':
                return {
                    color: 'danger',
                    icon: 'ri-close-circle-line',
                    text: 'Rejected'
                };
            default:
                return {
                    color: 'secondary',
                    icon: 'ri-question-line',
                    text: 'Unknown'
                };
        }
    };

    // Get active status badge
    const getActiveBadge = (isActive) => {
        return {
            color: isActive ? 'success' : 'danger',
            text: isActive ? 'Active' : 'Inactive'
        };
    };

    // Table columns
    const columns = [
        {
            name: '#',
            cell: (row, index) => index + 1,
            width: '60px'
        },
        {
            name: 'Business',
            cell: (row) => (
                <div className="d-flex align-items-center">
                    <div className="avatar-xs me-3">
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
                    <div>
                        <h6 className="mb-0">{row.businessName}</h6>
                        <small className="text-muted">{row.ownerName}</small>
                    </div>
                </div>
            ),
            sortable: true,
        },
        {
            name: 'Contact',
            cell: (row) => (
                <div>
                    <div>{row.phoneNumber}</div>
                    {row.email && <small className="text-muted">{row.email}</small>}
                </div>
            ),
        },
        {
            name: 'Location',
            cell: (row) => row.address?.city || 'N/A',
        },
        {
            name: 'Status',
            cell: (row) => {
                const status = getStatusBadge(row.status);
                const active = getActiveBadge(row.isActive);
                return (
                    <div>
                        <Badge color={status.color} className="me-1 mb-1">
                            <i className={`${status.icon} me-1`}></i>
                            {status.text}
                        </Badge>
                        <Badge color={active.color} className="mb-1">
                            {active.text}
                        </Badge>
                        {row.rejectionReason && (
                            <div className="mt-1">
                                <small className="text-danger">
                                    <i className="ri-alert-line me-1"></i>
                                    Rejected
                                </small>
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            name: 'Created',
            cell: (row) => new Date(row.createdAt).toLocaleDateString(),
            width: '120px'
        },
        {
            name: 'Actions',
            cell: (row) => {
                const status = getStatusBadge(row.status);
                return (
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

                        {row.status === 'PENDING' && (
                            <>
                                <Button
                                    color="outline-success"
                                    size="sm"
                                    onClick={() => handleApproveClick(row)}
                                    title="Approve Business"
                                    className="btn-icon"
                                >
                                    <i className="ri-check-line" />
                                </Button>
                                <Button
                                    color="outline-danger"
                                    size="sm"
                                    onClick={() => handleRejectClick(row)}
                                    title="Reject Business"
                                    className="btn-icon"
                                >
                                    <i className="ri-close-line" />
                                </Button>
                            </>
                        )}

                        {row.status === 'REJECTED' && (
                            <Button
                                color="outline-success"
                                size="sm"
                                onClick={() => handleApproveClick(row)}
                                title="Approve Business"
                                className="btn-icon"
                            >
                                <i className="ri-check-line" />
                            </Button>
                        )}
                    </div>
                );
            },
            width: '180px'
        }
    ];

    // Custom styles for DataTable
    const customStyles = {
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
    };

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Approve Businesses" pageTitle="Business Management" />

                {/* Stats Cards */}
                <Row className="mb-4">
                    <Col xl={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <p className="text-uppercase fw-medium text-muted mb-0">Total Businesses</p>
                                        <h4 className="mb-0">{stats.total}</h4>
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">Pending Review</p>
                                        <h4 className="mb-0">{stats.pending}</h4>
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
                                        <h4 className="mb-0">{stats.approved}</h4>
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">Rejected</p>
                                        <h4 className="mb-0">{stats.rejected}</h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-danger-subtle text-danger rounded-circle fs-2">
                                                <i className="ri-close-circle-line"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Quick Actions */}
                <Card className="mb-4">
                    <CardBody>
                        <Row className="g-3 align-items-center">
                            <Col md={6}>
                                <h6 className="card-title mb-0">Pending Review Actions</h6>
                                <p className="text-muted mb-0">
                                    {stats.pending} businesses waiting for your approval
                                </p>
                            </Col>
                            <Col md={6} className="text-end">
                                <Button
                                    color="light"
                                    onClick={fetchData}
                                    disabled={loading}
                                    className="me-2"
                                >
                                    <i className="ri-refresh-line me-1"></i>
                                    Refresh
                                </Button>
                                <Badge color="warning" className="fs-6 p-2">
                                    <i className="ri-information-line me-1"></i>
                                    {stats.pendingPercentage}% Pending
                                </Badge>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Filter Controls */}
                <Card className="mb-4">
                    <CardBody className="p-3">
                        <Row className="g-3 align-items-end">
                            <Col md={6}>
                                <FormGroup className="mb-0">
                                    <Label className="form-label">Search Businesses</Label>
                                    <Input
                                        type="text"
                                        name="search"
                                        placeholder="Search by business name, owner, email, or phone..."
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                        className="form-control"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup className="mb-0">
                                    <Label className="form-label">Status Filter</Label>
                                    <Select
                                        options={[
                                            { value: 'all', label: 'All Statuses' },
                                            { value: 'PENDING', label: 'Pending Review' },
                                            { value: 'APPROVED', label: 'Approved' },
                                            { value: 'REJECTED', label: 'Rejected' }
                                        ]}
                                        value={{
                                            value: filters.status,
                                            label: filters.status === 'all' ? 'All Statuses' :
                                                filters.status === 'PENDING' ? 'Pending Review' :
                                                    filters.status === 'APPROVED' ? 'Approved' : 'Rejected'
                                        }}
                                        onChange={(opt) => setFilters(prev => ({ ...prev, status: opt.value }))}
                                        className="react-select"
                                        classNamePrefix="select"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={2}>
                                <div className="d-grid mb-3">
                                    <Button
                                        color="primary"
                                        onClick={() => setFilters({ search: '', status: 'PENDING' })}
                                    >
                                        <i className="ri-filter-line me-1"></i>
                                        Show Pending
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Businesses Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center bg-light">
                        <h5 className="card-title mb-0 flex-grow-1">
                            <i className="ri-shield-check-line align-middle me-2"></i>
                            Business Approval Queue
                            <Badge color="primary" className="ms-2">{filteredBusinesses.length}</Badge>
                        </h5>
                        <div className="d-flex gap-2">
                            <Badge color="warning" className="fs-6">
                                <i className="ri-time-line me-1"></i>
                                Pending: {stats.pending}
                            </Badge>
                            <Badge color="success" className="fs-6">
                                <i className="ri-checkbox-circle-line me-1"></i>
                                Approved: {stats.approved}
                            </Badge>
                            <Badge color="danger" className="fs-6">
                                <i className="ri-close-circle-line me-1"></i>
                                Rejected: {stats.rejected}
                            </Badge>
                        </div>
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
                                        <p className="text-muted">
                                            {filters.status === 'PENDING'
                                                ? "No pending businesses for review. Great job!"
                                                : "Try adjusting your search criteria."
                                            }
                                        </p>
                                    </div>
                                }
                                customStyles={customStyles}
                                conditionalRowStyles={[
                                    {
                                        when: row => row.status === 'PENDING',
                                        style: {
                                            backgroundColor: 'rgba(255, 193, 7, 0.1)',
                                            borderLeft: '4px solid #ffc107'
                                        },
                                    },
                                    {
                                        when: row => row.status === 'REJECTED',
                                        style: {
                                            backgroundColor: 'rgba(220, 53, 69, 0.05)',
                                            borderLeft: '4px solid #dc3545'
                                        },
                                    },
                                ]}
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* View Business Modal */}
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
                                            <i className="ri-bank-card-line me-1" /> Business Details
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
                                                <Badge color={getStatusBadge(selectedBusiness.status).color} className="me-1 fs-6">
                                                    <i className={`${getStatusBadge(selectedBusiness.status).icon} me-1`}></i>
                                                    {getStatusBadge(selectedBusiness.status).text}
                                                </Badge>
                                                <Badge color={getActiveBadge(selectedBusiness.isActive).color} className="fs-6">
                                                    {getActiveBadge(selectedBusiness.isActive).text}
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

                                            {selectedBusiness.rejectionReason && (
                                                <Alert color="danger" className="mt-3">
                                                    <h6><i className="ri-alert-line me-2"></i>Rejection Reason</h6>
                                                    <p className="mb-0">{selectedBusiness.rejectionReason}</p>
                                                </Alert>
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

                                            {selectedBusiness.bannerImage && (
                                                <div className="mt-4">
                                                    <h5>Business Banner</h5>
                                                    <img
                                                        src={selectedBusiness.bannerImage}
                                                        alt="Banner"
                                                        className="img-fluid rounded"
                                                        style={{ maxHeight: '200px', objectFit: 'cover', width: '100%' }}
                                                    />
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
                    {selectedBusiness?.status === 'PENDING' && (
                        <div className="me-auto">
                            <Button
                                color="success"
                                onClick={() => {
                                    setViewModal(false);
                                    setTimeout(() => handleApproveClick(selectedBusiness), 300);
                                }}
                                className="me-2"
                            >
                                <i className="ri-check-line me-1"></i>
                                Approve
                            </Button>
                            <Button
                                color="danger"
                                onClick={() => {
                                    setViewModal(false);
                                    setTimeout(() => handleRejectClick(selectedBusiness), 300);
                                }}
                            >
                                <i className="ri-close-line me-1"></i>
                                Reject
                            </Button>
                        </div>
                    )}
                    <Button color="light" onClick={() => setViewModal(false)}>
                        <i className="ri-close-line me-1"></i>
                        Close
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Approve Confirmation Modal */}
            <Modal isOpen={approveModal} toggle={() => setApproveModal(false)} centered>
                <ModalHeader toggle={() => setApproveModal(false)} className="bg-light">
                    <i className="ri-check-line me-2 text-success"></i>
                    Confirm Approval
                </ModalHeader>
                <ModalBody>
                    {selectedBusiness && (
                        <div className="text-center">
                            <div className="avatar-lg mx-auto mb-3">
                                <div className="avatar-title bg-success-subtle text-success rounded-circle">
                                    <i className="ri-checkbox-circle-line display-4"></i>
                                </div>
                            </div>
                            <h5>Approve Business</h5>
                            <p className="text-muted">
                                Are you sure you want to approve <strong>"{selectedBusiness.businessName}"</strong>?
                            </p>
                            <p className="text-muted mb-0">
                                This will change the business status to <Badge color="success">APPROVED</Badge> and
                                the business will become active in the system.
                            </p>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="light" onClick={() => setApproveModal(false)}>
                        Cancel
                    </Button>
                    <Button color="success" onClick={handleApprove}>
                        <i className="ri-check-line me-1"></i>
                        Yes, Approve Business
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Reject Confirmation Modal */}
            <Modal isOpen={rejectModal} toggle={() => setRejectModal(false)} centered>
                <ModalHeader toggle={() => setRejectModal(false)} className="bg-light">
                    <i className="ri-close-line me-2 text-danger"></i>
                    Confirm Rejection
                </ModalHeader>
                <Form noValidate onSubmit={(e) => { e.preventDefault(); handleReject(); }}>
                    <ModalBody>
                        {selectedBusiness && (
                            <div>
                                <div className="text-center mb-3">
                                    <div className="avatar-lg mx-auto mb-3">
                                        <div className="avatar-title bg-danger-subtle text-danger rounded-circle">
                                            <i className="ri-close-circle-line display-4"></i>
                                        </div>
                                    </div>
                                    <h5>Reject Business</h5>
                                    <p className="text-muted">
                                        Are you sure you want to reject <strong>"{selectedBusiness.businessName}"</strong>?
                                    </p>
                                </div>

                                <FormGroup>
                                    <Label className="form-label">
                                        Rejection Reason <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        type="textarea"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Please provide a clear reason for rejecting this business application..."
                                        rows="4"
                                        required
                                    />
                                    <small className="text-muted">
                                        This reason will be visible to the business owner.
                                    </small>
                                </FormGroup>

                                <Alert color="warning" className="mt-3">
                                    <i className="ri-alert-line me-2"></i>
                                    This action cannot be undone. The business status will be changed to <Badge color="danger">REJECTED</Badge>.
                                </Alert>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="light" onClick={() => setRejectModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            color="danger"
                            type="submit"
                            disabled={!rejectionReason.trim()}
                        >
                            <i className="ri-close-line me-1"></i>
                            Reject Business
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            <ToastContainer />

            {/* Custom CSS for highlighting status */}
            <style jsx>{`
                .pending-row {
                    background-color: rgba(255, 193, 7, 0.1) !important;
                    border-left: 4px solid #ffc107;
                }
                
                .rejected-row {
                    background-color: rgba(220, 53, 69, 0.05) !important;
                    border-left: 4px solid #dc3545;
                }
            `}</style>
        </div>
    );
};

export default ApproveBusinessPage;