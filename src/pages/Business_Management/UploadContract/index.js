import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, CardHeader, CardBody,
    Col, Container, Row,
    Form, Input, Label, FormGroup,
    Modal, ModalBody, ModalFooter, ModalHeader,
    Button, Badge, Nav, NavItem, NavLink, TabContent, TabPane, Alert,
    Progress
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
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';

// Register the plugins
registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview, FilePondPluginFileValidateType);

import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';

// Redux thunks
import {
    getBusinessesData as onGetBusinesses,
    signContract as onSignContract
} from "../../../slices/thunks";

// Selectors
const selectBusinessesData = createSelector(
    (state) => state.Business,
    (businessesData) => businessesData.businessesData.businesses || []
);

const UploadContractPage = () => {
    document.title = "Upload Contracts | simad University";

    const dispatch = useDispatch();
    const businessesData = useSelector(selectBusinessesData);

    // State management
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadModal, setUploadModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [filteredBusinesses, setFilteredBusinesses] = useState([]);
    const [activeTab, setActiveTab] = useState('1');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // File state
    const [contractFiles, setContractFiles] = useState([]);

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        contractStatus: 'unsigned' // 'all', 'signed', 'unsigned'
    });

    // Stats state
    const [stats, setStats] = useState({
        total: 0,
        signed: 0,
        unsigned: 0,
        signedPercentage: 0
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
        const signed = initialBusinesses.filter(b => b.contract?.isSigned).length;
        const unsigned = total - signed;
        const signedPercentage = total > 0 ? Math.round((signed / total) * 100) : 0;

        setStats({
            total,
            signed,
            unsigned,
            signedPercentage
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
                business.email?.toLowerCase().includes(filterSettings.search.toLowerCase())
            );
        }

        // Contract status filter
        if (filterSettings.contractStatus !== 'all') {
            filtered = filtered.filter(business =>
                filterSettings.contractStatus === 'signed'
                    ? business.contract?.isSigned
                    : !business.contract?.isSigned
            );
        }

        setFilteredBusinesses(filtered);
    };

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
    };

    // Handle file upload for contract
    const handleContractFileUpdate = (fileItems) => {
        setContractFiles(fileItems);
    };

    // Reset form
    const resetForm = () => {
        setContractFiles([]);
        setSelectedBusiness(null);
        setUploadProgress(0);
    };

    // Handle modal close
    const handleModalClose = () => {
        setUploadModal(false);
        resetForm();
    };

    // Upload contract
    const uploadContract = async (e) => {
        e.preventDefault();
        if (!selectedBusiness || contractFiles.length === 0) {
            toast.warning('Please select a contract file to upload');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            const submitData = new FormData();
            submitData.append('contractFile', contractFiles[0].file);
            submitData.append('businessId', selectedBusiness._id);

            await dispatch(onSignContract({
                id: selectedBusiness._id,
                file: contractFiles[0].file
            }));

            clearInterval(progressInterval);
            setUploadProgress(100);

            setTimeout(() => {
                handleModalClose();
                fetchData();
                toast.success("Contract uploaded and signed successfully!");
                setUploading(false);
            }, 500);

        } catch (error) {
            console.error("Error uploading contract:", error);
            toast.error("Failed to upload contract");
            setUploading(false);
            setUploadProgress(0);
        }
    };

    // Open modal for upload
    const handleUpload = (business) => {
        setSelectedBusiness(business);
        setUploadModal(true);
    };

    // Open modal for view
    const handleView = (business) => {
        setSelectedBusiness(business);
        setViewModal(true);
    };

    // Download contract
    const handleDownloadContract = (business) => {
        if (business.contract?.agreementPdf) {
            window.open(business.contract.agreementPdf, '_blank');
        } else {
            toast.warning('No contract document available for download');
        }
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

    // Get contract status badge
    const getContractBadge = (business) => {
        if (business.contract?.isSigned) {
            return <Badge color="success" className="fs-6">
                <i className="ri-checkbox-circle-line me-1"></i>
                Signed
            </Badge>;
        } else {
            return <Badge color="warning" className="fs-6">
                <i className="ri-time-line me-1"></i>
                Unsigned
            </Badge>;
        }
    };

    // Get row class based on contract status
    const getRowClass = (business) => {
        if (!business.contract?.isSigned) {
            return 'unsigned-contract-row';
        }
        return '';
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
            name: 'Status',
            cell: (row) => (
                <div>
                    <Badge color={getStatusBadge(row.status)} className="me-1">
                        {row.status}
                    </Badge>
                    {getContractBadge(row)}
                </div>
            ),
        },
        {
            name: 'Contract Signed',
            cell: (row) => row.contract?.signedDate ? new Date(row.contract.signedDate).toLocaleDateString() : 'N/A',
            width: '140px'
        },
        {
            name: 'Actions',
            cell: (row) => (
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

                    {row.contract?.isSigned ? (
                        <Button
                            color="outline-success"
                            size="sm"
                            onClick={() => handleDownloadContract(row)}
                            title="Download Contract"
                            className="btn-icon"
                        >
                            <i className="ri-download-line" />
                        </Button>
                    ) : (
                        <Button
                            color="primary"
                            size="sm"
                            onClick={() => handleUpload(row)}
                            title="Upload Contract"
                            className="btn-icon"
                        >
                            <i className="ri-upload-line" />
                        </Button>
                    )}
                </div>
            ),
            width: '150px'
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
        rows: {
            style: {
                cursor: 'pointer',
            },
        },
    };

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Upload Contracts" pageTitle="Business Management" />

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
                                        <p className="text-uppercase fw-medium text-muted mb-0">Contracts Signed</p>
                                        <h4 className="mb-0">{stats.signed}</h4>
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">Pending Contracts</p>
                                        <h4 className="mb-0">{stats.unsigned}</h4>
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">Completion Rate</p>
                                        <h4 className="mb-0">{stats.signedPercentage}%</h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-info-subtle text-info rounded-circle fs-2">
                                                <i className="ri-progress-4-line"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Progress Bar */}
                <Card className="mb-4">
                    <CardBody>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="card-title mb-0">Contract Completion Progress</h6>
                            <span className="text-muted">{stats.signed} of {stats.total} businesses</span>
                        </div>
                        <Progress
                            value={stats.signedPercentage}
                            color={stats.signedPercentage === 100 ? 'success' : 'primary'}
                            className="mb-2"
                            style={{ height: '8px' }}
                        />
                        <div className="d-flex justify-content-between">
                            <small className="text-muted">
                                {stats.unsigned} businesses remaining without signed contracts
                            </small>
                            <small className="text-muted">{stats.signedPercentage}% complete</small>
                        </div>
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
                                        placeholder="Search by business name, owner, or email..."
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                        className="form-control"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup className="mb-0">
                                    <Label className="form-label">Contract Status</Label>
                                    <Select
                                        options={[
                                            { value: 'all', label: 'All Contracts' },
                                            { value: 'signed', label: 'Signed Contracts' },
                                            { value: 'unsigned', label: 'Unsigned Contracts' }
                                        ]}
                                        value={{
                                            value: filters.contractStatus,
                                            label: filters.contractStatus === 'all' ? 'All Contracts' :
                                                filters.contractStatus === 'signed' ? 'Signed Contracts' : 'Unsigned Contracts'
                                        }}
                                        onChange={(opt) => setFilters(prev => ({ ...prev, contractStatus: opt.value }))}
                                        className="react-select"
                                        classNamePrefix="select"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={2}>
                                <Button
                                    color="light"
                                    className="w-100 mb-3"
                                    onClick={fetchData}
                                    disabled={loading}
                                >
                                    <i className="ri-refresh-line me-1"></i>
                                    Refresh
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Businesses Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center bg-light">
                        <h5 className="card-title mb-0 flex-grow-1">
                            <i className="ri-contract-line align-middle me-2"></i>
                            Business Contracts
                            <Badge color="primary" className="ms-2">{filteredBusinesses.length}</Badge>
                        </h5>
                        <div className="d-flex gap-2">
                            <Badge color="success" className="fs-6">
                                <i className="ri-checkbox-circle-line me-1"></i>
                                Signed: {stats.signed}
                            </Badge>
                            <Badge color="warning" className="fs-6">
                                <i className="ri-time-line me-1"></i>
                                Unsigned: {stats.unsigned}
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
                                        <p className="text-muted">Try adjusting your search criteria.</p>
                                    </div>
                                }
                                customStyles={customStyles}
                                conditionalRowStyles={[
                                    {
                                        when: row => !row.contract?.isSigned,
                                        style: {
                                            backgroundColor: 'rgba(255, 193, 7, 0.1)',
                                            borderLeft: '4px solid #ffc107'
                                        },
                                    },
                                ]}
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Upload Contract Modal */}
            <Modal isOpen={uploadModal} toggle={handleModalClose} centered>
                <ModalHeader toggle={handleModalClose} className="bg-light">
                    <i className="ri-upload-line me-2"></i>
                    Upload Contract
                </ModalHeader>
                <Form noValidate onSubmit={uploadContract}>
                    <ModalBody>
                        {selectedBusiness && (
                            <div className="text-center mb-4">
                                <div className="avatar-lg mx-auto mb-3">
                                    {selectedBusiness.logo ? (
                                        <img
                                            src={selectedBusiness.logo}
                                            alt={selectedBusiness.businessName}
                                            className="avatar-title bg-light rounded-circle"
                                            style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div className="avatar-title bg-light text-secondary rounded-circle" style={{ width: '80px', height: '80px' }}>
                                            <i className="ri-store-line display-4"></i>
                                        </div>
                                    )}
                                </div>
                                <h5>{selectedBusiness.businessName}</h5>
                                <p className="text-muted">Owner: {selectedBusiness.ownerName}</p>
                                <Badge color="warning" className="fs-6">
                                    <i className="ri-time-line me-1"></i>
                                    Contract Pending Signature
                                </Badge>
                            </div>
                        )}

                        <FormGroup>
                            <Label className="form-label">
                                Contract Document <span className="text-danger">*</span>
                            </Label>
                            <FilePond
                                files={contractFiles}
                                onupdatefiles={handleContractFileUpdate}
                                allowMultiple={false}
                                maxFiles={1}
                                name="contractFile"
                                labelIdle='<div class="text-center"><i class="ri-file-text-line display-4 text-muted"></i><p class="mt-2">Drag & Drop contract file or <span class="filepond--label-action">Browse</span></p></div>'
                                acceptedFileTypes={['application/pdf']}
                                credits={false}
                                className="filepond-border"
                                required
                            />
                            <small className="text-muted">
                                Accepted format: PDF only. Maximum file size: 10MB
                            </small>
                        </FormGroup>

                        {uploading && (
                            <div className="mt-3">
                                <div className="d-flex justify-content-between mb-1">
                                    <small>Uploading contract...</small>
                                    <small>{uploadProgress}%</small>
                                </div>
                                <Progress value={uploadProgress} color="primary" />
                            </div>
                        )}

                        <Alert color="info" className="mt-3">
                            <i className="ri-information-line me-2"></i>
                            Once uploaded, the contract will be marked as signed and the signed date will be recorded automatically.
                        </Alert>
                    </ModalBody>
                    <ModalFooter className="bg-light">
                        <Button color="light" onClick={handleModalClose} disabled={uploading}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            type="submit"
                            disabled={uploading || contractFiles.length === 0}
                        >
                            {uploading ? (
                                <>
                                    <i className="ri-loader-4-line spin me-1"></i>
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <i className="ri-upload-line me-1"></i>
                                    Upload & Sign Contract
                                </>
                            )}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* View Business Modal */}
            <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="lg" centered>
                <ModalHeader toggle={() => setViewModal(false)} className="bg-light">
                    <i className="ri-store-line me-2"></i>
                    Business Details - {selectedBusiness?.businessName}
                </ModalHeader>
                <ModalBody>
                    {selectedBusiness && (
                        <Row>
                            <Col md={4} className="text-center mb-4">
                                {selectedBusiness.logo ? (
                                    <img
                                        src={selectedBusiness.logo}
                                        alt={selectedBusiness.businessName}
                                        className="rounded-circle img-thumbnail mb-3"
                                        style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center mb-3"
                                        style={{ width: '120px', height: '120px', margin: '0 auto' }}>
                                        <i className="ri-store-line display-4 text-muted"></i>
                                    </div>
                                )}
                                <h5>{selectedBusiness.businessName}</h5>
                                <p className="text-muted">{selectedBusiness.ownerName}</p>
                                {getContractBadge(selectedBusiness)}
                            </Col>
                            <Col md={8}>
                                <h6>Contract Information</h6>
                                {selectedBusiness.contract?.isSigned ? (
                                    <div>
                                        <p><strong>Status:</strong> <Badge color="success">Signed</Badge></p>
                                        <p><strong>Signed Date:</strong> {new Date(selectedBusiness.contract.signedDate).toLocaleDateString()}</p>
                                        <p><strong>Payout Schedule:</strong> {selectedBusiness.contract.payoutSchedule}</p>
                                        <p><strong>Commission Rate:</strong> {selectedBusiness.contract.commissionRate}%</p>

                                        {selectedBusiness.contract.agreementPdf && (
                                            <Button
                                                color="primary"
                                                size="sm"
                                                onClick={() => handleDownloadContract(selectedBusiness)}
                                                className="mt-2"
                                            >
                                                <i className="ri-download-line me-1"></i>
                                                Download Contract
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <p><strong>Status:</strong> <Badge color="warning">Not Signed</Badge></p>
                                        <p className="text-muted">No contract has been uploaded for this business.</p>
                                        <Button
                                            color="primary"
                                            size="sm"
                                            onClick={() => {
                                                setViewModal(false);
                                                setTimeout(() => handleUpload(selectedBusiness), 300);
                                            }}
                                        >
                                            <i className="ri-upload-line me-1"></i>
                                            Upload Contract Now
                                        </Button>
                                    </div>
                                )}
                            </Col>
                        </Row>
                    )}
                </ModalBody>
                <ModalFooter className="bg-light">
                    <Button color="light" onClick={() => setViewModal(false)}>
                        Close
                    </Button>
                </ModalFooter>
            </Modal>

            <ToastContainer />

            {/* Custom CSS for highlighting unsigned contracts */}
            <style jsx>{`
                .unsigned-contract-row {
                    background-color: rgba(255, 193, 7, 0.1) !important;
                    border-left: 4px solid #ffc107;
                }
                
                .filepond-border {
                    border: 2px dashed #dee2e6;
                    border-radius: 0.375rem;
                    padding: 1rem;
                }
                
                .filepond-border .filepond--panel-root {
                    border-radius: 0.375rem;
                }
            `}</style>
        </div>
    );
};

export default UploadContractPage;