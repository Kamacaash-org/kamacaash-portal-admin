import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, CardHeader, CardBody,
    Col, Container, Row,
    Form, Input, Label, FormGroup,
    Modal, ModalBody, ModalFooter, ModalHeader,
    Button, Badge, Nav, NavItem, NavLink, TabContent, TabPane, Alert,
    InputGroup, InputGroupText
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
    getPendingOrdersByBusinessID as onGetPendingOrders,
    cancelOrder as onCancelOrder,
    completeOrder as onCompleteOrder
} from "../../../slices/thunks";
import useAuthUser from '../../../Components/Hooks/useAuthUser';

// Selectors
const selectOrdersData = createSelector(
    (state) => state.Orders,
    (pendingOrdersData) => pendingOrdersData.pendingOrdersData.orders || []
);

const OrdersPage = () => {
    document.title = "Pending Orders | Kamacaash";

    const dispatch = useDispatch();
    const ordersData = useSelector(selectOrdersData);

    // State management
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [completeModal, setCompleteModal] = useState(false);
    const [cancelModal, setCancelModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [pinCode, setPinCode] = useState('');
    const [cancellationReason, setCancellationReason] = useState('');

    const userAuth = useAuthUser();
    const completedBy = userAuth.staffId;
    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        status: 'all', // 'all', 'PAID', 'READY_FOR_PICKUP'
        urgency: 'all' // 'all', 'urgent', 'normal'
    });

    // Stats state
    const [stats, setStats] = useState({
        total: 0,
        paid: 0,
        readyForPickup: 0,
        urgent: 0,
        totalAmount: 0
    });

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // In a real app, you would get businessId from auth or context
            const businessId = userAuth.businessId; // Replace with actual business ID
            await dispatch(onGetPendingOrders(businessId));
        } catch (error) {
            console.error("Error loading orders:", error);
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
        const initialOrders = Array.isArray(ordersData) ? ordersData : [];
        setOrders(initialOrders);

        // Calculate stats
        const total = initialOrders.length;
        const paid = initialOrders.filter(o => o.status === 'PAID').length;
        const readyForPickup = initialOrders.filter(o => o.status === 'READY_FOR_PICKUP').length;
        const urgent = initialOrders.filter(o => o.isUrgent).length;
        const totalAmount = initialOrders.reduce((sum, order) => sum + order.amount, 0);

        setStats({
            total,
            paid,
            readyForPickup,
            urgent,
            totalAmount
        });

        // Apply filters
        applyFilters(initialOrders, filters);
    }, [ordersData, filters]);

    // Apply filters
    const applyFilters = (orderList, filterSettings) => {
        let filtered = orderList;

        // Search filter
        if (filterSettings.search) {
            const searchTerm = filterSettings.search.toLowerCase();
            filtered = filtered.filter(order =>
                order.user?.fullName?.toLowerCase().includes(searchTerm) ||
                order.user?.phoneNumber?.includes(searchTerm) ||
                order.orderId?.toLowerCase().includes(searchTerm) ||
                order.package?.title?.toLowerCase().includes(searchTerm)
            );
        }

        // Status filter
        if (filterSettings.status !== 'all') {
            filtered = filtered.filter(order => order.status === filterSettings.status);
        }

        // Urgency filter
        if (filterSettings.urgency !== 'all') {
            filtered = filtered.filter(order =>
                filterSettings.urgency === 'urgent' ? order.isUrgent : !order.isUrgent
            );
        }

        setFilteredOrders(filtered);
    };

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
    };

    // Handle complete order
    const handleComplete = async () => {
        if (!selectedOrder || !pinCode || !completedBy) {
            toast.warning('Please fill all required fields');
            return;
        }

        setActionLoading(true);
        try {
            await dispatch(onCompleteOrder({
                orderId: selectedOrder.orderId,
                pinCode: pinCode,
                completedBy: completedBy
            }));

            setCompleteModal(false);
            setPinCode('');

            fetchData();

        } catch (error) {
            console.error("Error completing order:", error);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle cancel order
    const handleCancel = async () => {
        if (!selectedOrder || !cancellationReason.trim()) {
            toast.warning('Please provide a cancellation reason');
            return;
        }

        setActionLoading(true);
        try {
            await dispatch(onCancelOrder({
                orderId: selectedOrder.orderId,
                cancellationReason: cancellationReason.trim()
            }));

            setCancelModal(false);
            setCancellationReason('');
            fetchData();

        } catch (error) {
            console.error("Error cancelling order:", error);
        } finally {
            setActionLoading(false);
        }
    };

    // Open modal for complete
    const handleCompleteClick = (order) => {
        setSelectedOrder(order);
        setPinCode('');
        setCompleteModal(true);
    };

    // Open modal for cancel
    const handleCancelClick = (order) => {
        setSelectedOrder(order);
        setCancellationReason('');
        setCancelModal(true);
    };

    // Open modal for view
    const handleView = (order) => {
        setSelectedOrder(order);
        setViewModal(true);
    };

    // Get status badge color and icon
    const getStatusBadge = (status) => {
        switch (status) {
            case 'PAID':
                return {
                    color: 'primary',
                    icon: 'ri-money-dollar-circle-line',
                    text: 'ORDER PLACED'
                };
            case 'READY_FOR_PICKUP':
                return {
                    color: 'success',
                    icon: 'ri-shopping-bag-line',
                    text: 'READY FOR PICKUP'
                };
            case 'COMPLETED':
                return {
                    color: 'success',
                    icon: 'ri-checkbox-circle-line',
                    text: 'COMPLETED'
                };
            case 'CANCELLED':
                return {
                    color: 'danger',
                    icon: 'ri-close-circle-line',
                    text: 'CANCELLED'
                };
            default:
                return {
                    color: 'secondary',
                    icon: 'ri-question-line',
                    text: status
                };
        }
    };

    // Get urgency badge
    const getUrgencyBadge = (order) => {
        if (order.isUrgent) {
            return (
                <Badge color="danger" className="ms-1">
                    <i className="ri-alarm-warning-line me-1"></i>
                    URGENT
                </Badge>
            );
        }
        return null;
    };

    // Format time remaining
    const formatTimeRemaining = (order) => {
        if (order.remainingTimeMinutes === null) return 'N/A';

        if (order.remainingTimeMinutes <= 0) {
            return (
                <Badge color="warning" className="ms-1">
                    <i className="ri-time-line me-1"></i>
                    PICKUP TIME STARTED
                </Badge>
            );
        }

        const hours = Math.floor(order.remainingTimeMinutes / 60);
        const minutes = order.remainingTimeMinutes % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m left`;
        }
        return `${minutes}m left`;
    };

    // Table columns
    const columns = [
        {
            name: '#',
            cell: (row, index) => index + 1,
        },
        {
            name: 'ORDER ID',
            selector: row => row.orderId,
            cell: row => (
                <div>
                    <strong className="text-primary">#{row.orderId}</strong>
                    {getUrgencyBadge(row)}
                </div>
            )
        },
        {
            name: 'CUSTOMER',
            cell: (row) => (
                <div>
                    <div className="fw-semibold">{row.user?.fullName || 'N/A'}</div>
                    <small className="text-muted">{row.user?.phoneNumber || 'N/A'}</small>
                </div>
            ),
        },
        {
            name: 'PACKAGE',
            cell: (row) => (
                <div className="d-flex align-items-center">
                    {row.package?.packageImg ? (
                        <img
                            src={row.package.packageImg}
                            alt={row.package.title}
                            className="rounded me-3"
                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                        />
                    ) : (
                        <div className="rounded bg-light d-flex align-items-center justify-content-center me-3"
                            style={{ width: '40px', height: '40px' }}>
                            <i className="ri-gift-line text-muted"></i>
                        </div>
                    )}
                    <div>
                        <div className="fw-semibold text-truncate" style={{ maxWidth: '200px' }}>
                            {row.package?.title || 'N/A'}
                        </div>
                        <small className="text-muted">Qty: {row.quantity}</small>
                    </div>
                </div>
            ),
        },
        {
            name: 'AMOUNT',
            cell: row => `$${row.amount}`,
        },
        {
            name: 'STATUS',
            cell: (row) => {
                const status = getStatusBadge(row.status);
                return (
                    <Badge color={status.color} className="fs-6">
                        <i className={`${status.icon} me-1`}></i>
                        {status.text}
                    </Badge>
                );
            },
        },
        {
            name: 'TIME REMAINING',
            cell: (row) => (
                <div className="text-center">
                    <div className={`fw-bold ${row.isUrgent ? 'text-danger' : 'text-success'}`}>
                        {formatTimeRemaining(row)}
                    </div>
                    {row.package?.pickupStart && (
                        <small className="text-muted">
                            {new Date(row.package.pickupStart).toLocaleTimeString()}
                        </small>
                    )}
                </div>
            ),   //         width: '160px'
        },
        {
            name: 'ORDER AGE',
            cell: row => `${row.orderAge}`,
            // width: '120px'
        },
        {
            name: 'ACTIONS',
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

                    <Button
                        color="outline-success"
                        size="sm"
                        onClick={() => handleCompleteClick(row)}
                        title="Complete Order"
                        className="btn-icon"
                    >
                        <i className="ri-check-double-line" />
                    </Button>

                    <Button
                        color="outline-danger"
                        size="sm"
                        onClick={() => handleCancelClick(row)}
                        title="Cancel Order"
                        className="btn-icon"
                    >
                        <i className="ri-close-line" />
                    </Button>
                </div>
            ),
            //  width: '180px'
        }
    ];

    // Custom styles for DataTable
    const customStyles = {
        headCells: {
            style: {
                fontWeight: '600',
                fontSize: '0.875rem',
                //    backgroundColor: '#f8f9fa',
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
                <BreadCrumb title="Pending Orders" pageTitle="Order Management" />

                {/* Stats Cards */}
                <Row className="mb-4">
                    <Col xl={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <p className="text-uppercase fw-medium text-muted mb-0">Total Pending</p>
                                        <h4 className="mb-0">{stats.total}</h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-2">
                                                <i className="ri-shopping-cart-line"></i>
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">Ready for Pickup</p>
                                        <h4 className="mb-0">{stats.readyForPickup}</h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-success-subtle text-success rounded-circle fs-2">
                                                <i className="ri-shopping-bag-line"></i>
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">Urgent Orders</p>
                                        <h4 className="mb-0">{stats.urgent}</h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-danger-subtle text-danger rounded-circle fs-2">
                                                <i className="ri-alarm-warning-line"></i>
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">Total Amount</p>
                                        <h4 className="mb-0">${stats.totalAmount}</h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-info-subtle text-info rounded-circle fs-2">
                                                <i className="ri-money-dollar-circle-line"></i>
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
                                <h6 className="card-title mb-0">Order Management</h6>
                                <p className="text-muted mb-0">
                                    Manage pending orders, complete pickups, or cancel orders as needed
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
                                    Refresh Orders
                                </Button>
                                <Badge color="primary" className="fs-6 p-2">
                                    <i className="ri-information-line me-1"></i>
                                    {stats.urgent} Urgent Orders
                                </Badge>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Filter Controls */}
                <Card className="mb-4">
                    <CardBody className="p-3">
                        <Row className="g-3 align-items-end">
                            <Col md={4}>
                                <FormGroup className="mb-0">
                                    <Label className="form-label">Search Orders</Label>
                                    <Input
                                        type="text"
                                        name="search"
                                        placeholder="Search by customer name, phone, order ID, or package..."
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                        className="form-control"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={3}>
                                <FormGroup className="mb-0">
                                    <Label className="form-label">Order Status</Label>
                                    <Select
                                        options={[
                                            { value: 'all', label: 'All' },
                                            { value: 'PAID', label: 'Paid' },
                                            { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup' }
                                        ]}
                                        value={{
                                            value: filters.status,
                                            label: filters.status === 'all' ? 'All' :
                                                filters.status === 'PAID' ? 'Paid' : 'Ready for Pickup'
                                        }}
                                        onChange={(opt) => setFilters(prev => ({ ...prev, status: opt.value }))}
                                        className="react-select"
                                        classNamePrefix="select"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={3}>
                                <FormGroup className="mb-0">
                                    <Label className="form-label">Urgency</Label>
                                    <Select
                                        options={[
                                            { value: 'all', label: 'All Orders' },
                                            { value: 'urgent', label: 'Urgent Only' },
                                            { value: 'normal', label: 'Normal Only' }
                                        ]}
                                        value={{
                                            value: filters.urgency,
                                            label: filters.urgency === 'all' ? 'All Orders' :
                                                filters.urgency === 'urgent' ? 'Urgent Only' : 'Normal Only'
                                        }}
                                        onChange={(opt) => setFilters(prev => ({ ...prev, urgency: opt.value }))}
                                        className="react-select"
                                        classNamePrefix="select"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={2}>
                                <div className="d-grid mb-3">
                                    <Button
                                        color="primary"
                                        onClick={() => setFilters({ search: '', status: 'all', urgency: 'urgent' })}
                                    >
                                        <i className="ri-alarm-warning-line me-1"></i>
                                        Show Urgent
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Orders Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center bg-light">
                        <h5 className="card-title mb-0 flex-grow-1">
                            <i className="ri-shopping-cart-line align-middle me-2"></i>
                            Pending Orders
                            <Badge color="primary" className="ms-2">{filteredOrders.length}</Badge>
                        </h5>
                        <div className="d-flex gap-2">
                            <Badge color="primary" className="fs-6">
                                <i className="ri-money-dollar-circle-line me-1"></i>
                                Paid: {stats.paid}
                            </Badge>
                            <Badge color="success" className="fs-6">
                                <i className="ri-shopping-bag-line me-1"></i>
                                Ready: {stats.readyForPickup}
                            </Badge>
                            <Badge color="danger" className="fs-6">
                                <i className="ri-alarm-warning-line me-1"></i>
                                Urgent: {stats.urgent}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredOrders}
                                pagination
                                responsive
                                // highlightOnHover
                                noDataComponent={
                                    <div className="text-center py-5">
                                        <i className="ri-inbox-line display-4 text-muted"></i>
                                        <h5 className="mt-3">No pending orders found</h5>
                                        <p className="text-muted">
                                            {filters.search || filters.status !== 'all' || filters.urgency !== 'all'
                                                ? "Try adjusting your search criteria."
                                                : "All orders have been processed. Great job!"
                                            }
                                        </p>
                                    </div>
                                }
                                customStyles={customStyles}
                                conditionalRowStyles={[
                                    {
                                        when: row => row.isUrgent,
                                        style: {
                                            backgroundColor: 'rgba(220, 53, 69, 0.05)',
                                            borderLeft: '4px solid #dc3545'
                                        },
                                    },
                                    {
                                        when: row => row.status === 'READY_FOR_PICKUP',
                                        style: {
                                            backgroundColor: 'rgba(25, 135, 84, 0.05)',
                                        },
                                    },
                                ]}
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* View Order Modal */}
            <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="lg" centered>
                <ModalHeader toggle={() => setViewModal(false)} className="bg-light">
                    <i className="ri-shopping-cart-line me-2"></i>
                    Order Details - #{selectedOrder?.orderId}
                </ModalHeader>
                <ModalBody>
                    {selectedOrder && (
                        <Row>
                            <Col md={6}>
                                <h6>Customer Information</h6>
                                <div className="border rounded p-3 mb-3">
                                    <p><strong>Name:</strong> {selectedOrder.user?.fullName || 'N/A'}</p>
                                    <p><strong>Phone:</strong> {selectedOrder.user?.phoneNumber || 'N/A'}</p>
                                    {/* <p><strong>User ID:</strong> {selectedOrder.user?.userId || 'N/A'}</p> */}
                                </div>

                                <h6>Order Information</h6>
                                <div className="border rounded p-3">
                                    <p><strong>Order ID:</strong> #{selectedOrder.orderId}</p>
                                    <p><strong>Quantity:</strong> {selectedOrder.quantity}</p>
                                    <p><strong>Amount:</strong> ${selectedOrder.amount}</p>
                                    {/* <p><strong>PIN Code:</strong>
                                        <Badge color="info" className="ms-2">
                                            {selectedOrder.pinCode}
                                        </Badge>
                                    </p> */}
                                    <p><strong>Reserved At:</strong> {new Date(selectedOrder.reservedAt).toLocaleString()}</p>
                                    <p><strong>Order Age:</strong> {selectedOrder.orderAge}</p>
                                </div>
                            </Col>
                            <Col md={6}>
                                <h6>Package Information</h6>
                                <div className="border rounded p-3 mb-3">
                                    {selectedOrder.package?.packageImg && (
                                        <div className="text-center mb-3">
                                            <img
                                                src={selectedOrder.package.packageImg}
                                                alt={selectedOrder.package.title}
                                                className="rounded"
                                                style={{ maxHeight: '150px', maxWidth: '100%' }}
                                            />
                                        </div>
                                    )}
                                    <p><strong>Title:</strong> {selectedOrder.package?.title || 'N/A'}</p>
                                    <p><strong>Pickup Start:</strong> {selectedOrder.package?.pickupStart ? new Date(selectedOrder.package.pickupStart).toLocaleString() : 'N/A'}</p>
                                    <p><strong>Pickup End:</strong> {selectedOrder.package?.pickupEnd ? new Date(selectedOrder.package.pickupEnd).toLocaleString() : 'N/A'}</p>
                                </div>

                                <h6>Status & Timing</h6>
                                <div className="border rounded p-3">
                                    <p>
                                        <strong>Status:</strong>
                                        <Badge color={getStatusBadge(selectedOrder.status).color} className="ms-2">
                                            {getStatusBadge(selectedOrder.status).text}
                                        </Badge>
                                    </p>
                                    {/* <p><strong>Payment Status:</strong> {selectedOrder.paymentStatus}</p> */}
                                    {/* <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod || 'N/A'}</p> */}
                                    <p><strong>Time Remaining:</strong> {selectedOrder.readableRemaining || 'N/A'}</p>
                                    <p>
                                        <strong>Urgent:</strong>
                                        {selectedOrder.isUrgent ? (
                                            <Badge color="danger" className="ms-2">
                                                <i className="ri-alarm-warning-line me-1"></i>
                                                URGENT
                                            </Badge>
                                        ) : (
                                            <Badge color="success" className="ms-2">Normal</Badge>
                                        )}
                                    </p>
                                </div>
                            </Col>
                        </Row>
                    )}
                </ModalBody>
                <ModalFooter className="bg-light">
                    <Button color="light" onClick={() => setViewModal(false)}>
                        Close
                    </Button>
                    <Button
                        color="success"
                        onClick={() => {
                            setViewModal(false);
                            setTimeout(() => handleCompleteClick(selectedOrder), 300);
                        }}
                    >
                        <i className="ri-check-double-line me-1"></i>
                        Complete Order
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Complete Order Modal */}
            <Modal isOpen={completeModal} toggle={() => setCompleteModal(false)} centered>
                <ModalHeader toggle={() => setCompleteModal(false)} className="bg-light">
                    <i className="ri-check-double-line me-2 text-success"></i>
                    Complete Order
                </ModalHeader>
                <Form noValidate onSubmit={(e) => { e.preventDefault(); handleComplete(); }}>
                    <ModalBody>
                        {selectedOrder && (
                            <div>
                                <div className="text-center mb-4">
                                    <div className="avatar-lg mx-auto mb-3">
                                        <div className="avatar-title bg-success-subtle text-success rounded-circle">
                                            <i className="ri-checkbox-circle-line display-4"></i>
                                        </div>
                                    </div>
                                    <h5>Complete Order #{selectedOrder.orderId}</h5>
                                    <p className="text-muted">
                                        Confirm order completion for <strong>{selectedOrder.user?.fullName}</strong>
                                    </p>
                                </div>

                                <FormGroup>
                                    <Label className="form-label">
                                        PIN Code <span className="text-danger">*</span>
                                    </Label>
                                    <InputGroup>
                                        <InputGroupText>
                                            <i className="ri-lock-line"></i>
                                        </InputGroupText>
                                        <Input
                                            type="text"
                                            value={pinCode}
                                            onChange={(e) => setPinCode(e.target.value)}
                                            placeholder="Enter PIN code from customer"
                                            required
                                        />
                                    </InputGroup>
                                    <small className="text-muted">
                                        The customer should provide this PIN code for order verification.
                                    </small>
                                </FormGroup>



                                <Alert color="info" className="mt-3">
                                    <i className="ri-information-line me-2"></i>
                                    Completing this order will mark it as fulfilled and update package statistics.
                                </Alert>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="light" onClick={() => setCompleteModal(false)} disabled={actionLoading}>
                            Cancel
                        </Button>
                        <Button
                            color="success"
                            type="submit"
                            disabled={actionLoading || !pinCode || !completedBy}
                        >
                            {actionLoading ? (
                                <>
                                    <i className="ri-loader-4-line spin me-1"></i>
                                    Completing...
                                </>
                            ) : (
                                <>
                                    <i className="ri-check-double-line me-1"></i>
                                    Complete Order
                                </>
                            )}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Cancel Order Modal */}
            <Modal isOpen={cancelModal} toggle={() => setCancelModal(false)} centered>
                <ModalHeader toggle={() => setCancelModal(false)} className="bg-light">
                    <i className="ri-close-line me-2 text-danger"></i>
                    Cancel Order
                </ModalHeader>
                <Form noValidate onSubmit={(e) => { e.preventDefault(); handleCancel(); }}>
                    <ModalBody>
                        {selectedOrder && (
                            <div>
                                <div className="text-center mb-4">
                                    <div className="avatar-lg mx-auto mb-3">
                                        <div className="avatar-title bg-danger-subtle text-danger rounded-circle">
                                            <i className="ri-close-circle-line display-4"></i>
                                        </div>
                                    </div>
                                    <h5>Cancel Order #{selectedOrder.orderId}</h5>
                                    <p className="text-muted">
                                        Cancel order for <strong>{selectedOrder.user?.fullName}</strong>
                                    </p>
                                </div>

                                <FormGroup>
                                    <Label className="form-label">
                                        Cancellation Reason <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        type="textarea"
                                        value={cancellationReason}
                                        onChange={(e) => setCancellationReason(e.target.value)}
                                        placeholder="Please provide a clear reason for cancelling this order..."
                                        rows="4"
                                        required
                                    />
                                    <small className="text-muted">
                                        This reason will be recorded and may be shared with the customer.
                                    </small>
                                </FormGroup>

                                <Alert color="warning" className="mt-3">
                                    <h6><i className="ri-alert-line me-2"></i>Important Notes</h6>
                                    <ul className="mb-0 ps-3">
                                        <li>Order will be cancelled and payment will be refunded</li>
                                        <li>Package quantity will be restored</li>
                                        <li>This action cannot be undone</li>
                                    </ul>
                                </Alert>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="light" onClick={() => setCancelModal(false)} disabled={actionLoading}>
                            Keep Order
                        </Button>
                        <Button
                            color="danger"
                            type="submit"
                            disabled={actionLoading || !cancellationReason.trim()}
                        >
                            {actionLoading ? (
                                <>
                                    <i className="ri-loader-4-line spin me-1"></i>
                                    Cancelling...
                                </>
                            ) : (
                                <>
                                    <i className="ri-close-line me-1"></i>
                                    Cancel Order
                                </>
                            )}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            <ToastContainer />
        </div>
    );
};

export default OrdersPage;