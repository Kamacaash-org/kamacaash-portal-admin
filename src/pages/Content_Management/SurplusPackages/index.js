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
    getSurplusPackages as onGetSurplusPackagesData,
    addSurplusPackage as onAddNewSurplusPackage,
    updateSurplusPackage as onUpdateSurplusPackage,
    deleteSurplusPackage as onDeleteSurplusPackage,
    activateSurplusPackage as onActivateSurplusPackage,
    getBusinessesData as onGetBusinessesData
} from "../../../slices/thunks";

// Formik
import * as Yup from "yup";
import { useFormik } from "formik";

const SurplusPackages = () => {
    document.title = "Surplus Packages | Test 001";

    const dispatch = useDispatch();

    const selectPackagesData = createSelector(
        (state) => state.ContentManagement,
        (packagesData) => packagesData.packagesData
    );

    const selectBusinessesData = createSelector(
        (state) => state.BusinessManagement,
        (businessesData) => businessesData.businessesData
    );

    const packagesData = useSelector(selectPackagesData);
    const businessesData = useSelector(selectBusinessesData);
    const [packagesList, setPackagesList] = useState([]);
    const [businessesList, setBusinessesList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [fileUploadError, setFileUploadError] = useState(null);

    // Static business ID (replace with your actual static business ID)
    const staticBusinessId = "68c71567e482ac5308aef13c";

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        businessId: ''
    });

    // Options for selects
    const statusOptions = [
        { value: "", label: "All Statuses" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" }
    ];

    // Fetch packages with filters
    const fetchPackages = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetSurplusPackagesData());
        } catch (error) {
            console.error("Error loading packages:", error);
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    // Fetch businesses
    const fetchBusinesses = useCallback(async () => {
        try {
            await Promise.all([
                dispatch(onGetBusinessesData())
            ]);
        } catch (error) {
            console.error("Error loading data:", error);
        }
    }, [dispatch]);

    // Update data when changes
    useEffect(() => {
        fetchPackages();
        fetchBusinesses();
    }, [fetchPackages, fetchBusinesses]);

    useEffect(() => {
        setPackagesList(packagesData?.packages || []);
    }, [packagesData]);

    useEffect(() => {
        setBusinessesList(businessesData?.businesses || []);
    }, [businessesData]);

    // Prepare business options for dropdown
    const businessOptions = businessesList
        .filter(business => business.isActive)
        .map(business => ({
            value: business._id,
            label: business.businessName
        }));

    // Handle image upload
    const handlePackageImgUpload = async (file) => {
        setUploading(true);
        setFileUploadError(null);
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('http://localhost:4000/api/v1/upload/upload-image', {
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

            return data.data?.image?.filePath || data.data?.imageUrl;

        } catch (error) {
            console.error('Upload failed:', error);
            setFileUploadError(error.message);
            throw error;
        } finally {
            setUploading(false);
        }
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

    // Filter packages based on filters
    const filteredPackages = packagesList.filter(pkg => {
        return (
            (filters.search === '' ||
                pkg.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                pkg.description?.toLowerCase().includes(filters.search.toLowerCase())) &&
            (filters.status === '' ||
                (filters.status === 'Active' ? pkg.isActive : !pkg.isActive)) &&
            (filters.businessId === '' || pkg.businessId === filters.businessId)
        );
    });

    // Open modal for view details
    const handleView = (pkg) => {
        setSelectedPackage(pkg);
        setViewModal(true);
    };

    // Open modal for edit
    const handleEdit = (pkg) => {
        setSelectedPackage(pkg);
        setIsEdit(true);
        setModal(true);
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedPackage(null);
        setIsEdit(false);
        setModal(true);
    };

    // Delete Package
    const onClickDelete = (pkg) => {
        setSelectedPackage(pkg);
        setDeleteModal(true);
    };

    const handleDeletePackage = () => {
        if (selectedPackage) {
            dispatch(onDeleteSurplusPackage(selectedPackage._id));
            setDeleteModal(false);
        }
    };

    // Activate Package
    const handleActivatePackage = (pkg) => {
        dispatch(onActivateSurplusPackage(pkg._id));
    };

    // formats JS Date for <input type="datetime-local">
    const formatForDateTimeLocal = (date) => {
        const d = new Date(date);
        // adjust for timezone offset so it shows correctly in local time
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
    }


    // Form validation
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            businessId: staticBusinessId, // Use static business ID
            packageImg: selectedPackage?.packageImg || "",
            title: selectedPackage?.title || "",
            description: selectedPackage?.description || "",
            items: selectedPackage?.items && selectedPackage.items.length > 0 ? selectedPackage.items : [""],
            originalPrice: selectedPackage?.originalPrice || 0,
            offerPrice: selectedPackage?.offerPrice || 0,
            quantityAvailable: selectedPackage?.quantityAvailable || 0,
            pickupStart: selectedPackage?.pickupStart ? formatForDateTimeLocal(selectedPackage.pickupStart) : "",
            pickupEnd: selectedPackage?.pickupEnd ? formatForDateTimeLocal(selectedPackage.pickupEnd) : "",
            isActive: selectedPackage?.isActive ?? true
        },
        validationSchema: Yup.object({
            title: Yup.string().required("Title is required").trim(),
            description: Yup.string().trim(),
            items: Yup.array().of(Yup.string().trim()),
            originalPrice: Yup.number()
                .required("Original price is required")
                .min(0, "Price must be positive"),
            offerPrice: Yup.number()
                .required("Offer price is required")
                .min(0, "Price must be positive")
                .test('offer-less-than-original', 'Offer price must be less than original price', function (value) {
                    const { originalPrice } = this.parent;
                    return value <= originalPrice;
                }),
            quantityAvailable: Yup.number()
                .required("Quantity is required")
                .min(0, "Quantity must be positive"),
            pickupStart: Yup.date()
                .required("Pickup start date is required")
                .min(new Date(), "Pickup start must be in the future"),
            pickupEnd: Yup.date()
                .required("Pickup end date is required")
                .min(Yup.ref('pickupStart'), "Pickup end must be after pickup start"),
            isActive: Yup.boolean()
        }),
        onSubmit: async (values) => {
            if (isEdit) {
                const updatePackageData = {
                    _id: selectedPackage ? selectedPackage._id : 0,
                    ...values
                };
                dispatch(onUpdateSurplusPackage(updatePackageData));
            } else {
                const newPackageData = {
                    ...values
                };
                dispatch(onAddNewSurplusPackage(newPackageData));
            }
            setModal(false);
        },
    });

    // Handle image file selection
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const imageUrl = await handlePackageImgUpload(file);
                validation.setFieldValue('packageImg', imageUrl);
            } catch (error) {
                console.error('Error uploading image:', error);
            }
        }
    };

    // Handle array input changes (items)
    const handleItemChange = (index, value) => {
        const newItems = [...validation.values.items];
        newItems[index] = value;
        validation.setFieldValue('items', newItems);
    };

    // Add new item field
    const addItemField = () => {
        validation.setFieldValue('items', [...validation.values.items, ""]);
    };

    // Remove item field
    const removeItemField = (index) => {
        const newItems = validation.values.items.filter((_, i) => i !== index);
        validation.setFieldValue('items', newItems);
    };

    // Format date with time for display
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Table columns
    const columns = [
        {
            name: '#',
            cell: (row, index) => index + 1
        },
        {
            name: 'Image',
            cell: row => (
                row.packageImg ? (
                    <img
                        src={`http://localhost:4000${row.packageImg}`}
                        alt={''}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                ) : (
                    <div style={{
                        width: '50px',
                        height: '50px',
                        backgroundColor: '#f8f9fa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px'
                    }}>
                        <i className="ri-image-line" style={{ fontSize: '20px', color: '#6c757d' }}></i>
                    </div>
                )
            )
        },
        {
            name: 'Title',
            selector: row => row.title,
            wrap: true
        },
        {
            name: 'Business',
            selector: row => row.businessId?.businessName || 'N/A'
        },
        {
            name: 'Price',
            cell: row => (
                <div>
                    <span className="text-decoration-line-through text-muted me-2">
                        ${row.originalPrice}
                    </span>
                    <span className="text-success fw-bold">
                        ${row.offerPrice}
                    </span>
                </div>
            )
        },
        {
            name: 'Quantity',
            selector: row => row.quantityAvailable,
        },
        {
            name: 'Pickup Date/Time',
            cell: row => (
                <div>
                    <div>{formatDateTime(row.pickupStart)}</div>
                    <div>to {formatDateTime(row.pickupEnd)}</div>
                </div>
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
                    <Button color="soft-primary" size="sm" onClick={() => handleEdit(row)}>
                        <i className="ri-pencil-line" />
                    </Button>
                    {row.isActive ? (
                        <Button color="soft-warning" size="sm" onClick={() => handleActivatePackage(row)}>
                            <i className="ri-close-circle-line" />
                        </Button>
                    ) : (
                        <Button color="soft-success" size="sm" onClick={() => handleActivatePackage(row)}>
                            <i className="ri-checkbox-circle-line" />
                        </Button>
                    )}
                    <Button color="soft-danger" size="sm" onClick={() => onClickDelete(row)}>
                        <i className="ri-delete-bin-line" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Surplus Packages" pageTitle="Food Surplus" />

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
                                        placeholder="Search by title or description"
                                        value={filters.search}
                                        onChange={handleFilterChange}
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
                        </Row>
                    </CardBody>
                </Card>

                {/* Data Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Surplus Packages List</h5>
                        <Button color="primary" onClick={handleCreate}>
                            <i className="ri-add-line me-1" /> Add Package
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredPackages}
                                pagination
                                highlightOnHover
                                responsive
                                noDataComponent="No packages found matching your criteria"
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Add/Edit Modal */}
            <Modal isOpen={modal} toggle={() => setModal(false)} size="lg">
                <ModalHeader toggle={() => setModal(false)}>
                    {isEdit ? 'Edit Surplus Package' : 'Add New Surplus Package'}
                </ModalHeader>
                <Form onSubmit={validation.handleSubmit}>
                    <ModalBody>
                        <Row>
                            <Col lg={12}>
                                <FormGroup>
                                    <Label>Package Image</Label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        disabled={uploading}
                                    />
                                    {uploading && <small className="text-muted">Uploading image...</small>}
                                    {fileUploadError && <small className="text-danger">{fileUploadError}</small>}
                                    {validation.values.packageImg && (
                                        <div className="mt-2">
                                            <img
                                                src={`http://localhost:4000${validation.values.packageImg}`}
                                                alt="Preview"
                                                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                            />
                                        </div>
                                    )}
                                </FormGroup>

                                <FormGroup>
                                    <Label>Title <span className="text-danger">*</span></Label>
                                    <Input
                                        name="title"
                                        value={validation.values.title}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        invalid={validation.touched.title && !!validation.errors.title}
                                    />
                                    <FormFeedback>{validation.errors.title}</FormFeedback>
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

                                <FormGroup>
                                    <Label>Items</Label>
                                    {validation.values.items.map((item, index) => (
                                        <div key={index} className="mb-2 d-flex align-items-center">
                                            <Input
                                                value={item}
                                                onChange={(e) => handleItemChange(index, e.target.value)}
                                                placeholder={`Item ${index + 1}`}
                                            />
                                            {validation.values.items.length > 1 && (
                                                <Button
                                                    color="danger"
                                                    size="sm"
                                                    className="ms-2"
                                                    onClick={() => removeItemField(index)}
                                                >
                                                    <i className="ri-delete-bin-line" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button color="outline-primary" size="sm" onClick={addItemField}>
                                        <i className="ri-add-line me-1" /> Add Item
                                    </Button>
                                </FormGroup>

                                <Row>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Original Price ($) <span className="text-danger">*</span></Label>
                                            <Input
                                                type="number"
                                                name="originalPrice"
                                                min="0"
                                                step="0.01"
                                                value={validation.values.originalPrice}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.originalPrice && !!validation.errors.originalPrice}
                                            />
                                            <FormFeedback>{validation.errors.originalPrice}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Offer Price ($) <span className="text-danger">*</span></Label>
                                            <Input
                                                type="number"
                                                name="offerPrice"
                                                min="0"
                                                step="0.01"
                                                value={validation.values.offerPrice}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.offerPrice && !!validation.errors.offerPrice}
                                            />
                                            <FormFeedback>{validation.errors.offerPrice}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Quantity Available <span className="text-danger">*</span></Label>
                                            <Input
                                                type="number"
                                                name="quantityAvailable"
                                                min="0"
                                                value={validation.values.quantityAvailable}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.quantityAvailable && !!validation.errors.quantityAvailable}
                                            />
                                            <FormFeedback>{validation.errors.quantityAvailable}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Pickup Start <span className="text-danger">*</span></Label>
                                            <Input
                                                type="datetime-local"
                                                name="pickupStart"
                                                value={validation.values.pickupStart}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.pickupStart && !!validation.errors.pickupStart}
                                            />
                                            <FormFeedback>{validation.errors.pickupStart}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Pickup End <span className="text-danger">*</span></Label>
                                            <Input
                                                type="datetime-local"
                                                name="pickupEnd"
                                                value={validation.values.pickupEnd}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.pickupEnd && !!validation.errors.pickupEnd}
                                            />
                                            <FormFeedback>{validation.errors.pickupEnd}</FormFeedback>
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
                                        Active Package
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

            {/* View Details Modal */}
            <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="lg">
                <ModalHeader toggle={() => setViewModal(false)}>
                    Package Details
                </ModalHeader>
                <ModalBody>
                    {selectedPackage && (
                        <Row>
                            <Col md={4} className="mb-3">
                                {selectedPackage.packageImg ? (
                                    <img
                                        src={`http://localhost:4000${selectedPackage.packageImg}`}
                                        alt={selectedPackage.title}
                                        style={{ width: '100%', borderRadius: '8px' }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%',
                                        height: '200px',
                                        backgroundColor: '#f8f9fa',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '8px'
                                    }}>
                                        <i className="ri-image-line" style={{ fontSize: '40px', color: '#6c757d' }}></i>
                                    </div>
                                )}
                            </Col>
                            <Col md={8}>
                                <h4>{selectedPackage.title}</h4>
                                <p className="text-muted">{selectedPackage.description}</p>

                                <h6 className="mt-4">Items Included:</h6>
                                <ul>
                                    {selectedPackage.items && selectedPackage.items.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>

                                <Row className="mt-3">
                                    <Col md={6}>
                                        <strong>Original Price:</strong> ${selectedPackage.originalPrice}
                                    </Col>
                                    <Col md={6}>
                                        <strong>Offer Price:</strong> ${selectedPackage.offerPrice}
                                    </Col>
                                </Row>

                                <Row className="mt-2">
                                    <Col md={6}>
                                        <strong>Quantity Available:</strong> {selectedPackage.quantityAvailable}
                                    </Col>
                                    <Col md={6}>
                                        <strong>Status:</strong>
                                        <Badge color={selectedPackage.isActive ? 'success' : 'danger'} className="ms-2">
                                            {selectedPackage.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </Col>
                                </Row>

                                <Row className="mt-2">
                                    <Col md={6}>
                                        <strong>Pickup Start:</strong> {formatDateTime(selectedPackage.pickupStart)}
                                    </Col>
                                    <Col md={6}>
                                        <strong>Pickup End:</strong> {formatDateTime(selectedPackage.pickupEnd)}
                                    </Col>
                                </Row>

                                <Row className="mt-2">
                                    <Col md={6}>
                                        <strong>Business:</strong> {selectedPackage.businessId?.businessName || 'N/A'}
                                    </Col>
                                    <Col md={6}>
                                        <strong>Total Orders:</strong> {selectedPackage.totalOrders || 0}
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
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
                onDeleteClick={handleDeletePackage}
                onCloseClick={() => setDeleteModal(false)}
                confirmationText="Are you sure you want to delete this package? This action cannot be undone."
            />

            <ToastContainer />
        </div>
    );
};

export default SurplusPackages;