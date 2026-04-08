import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Col,
  Container,
  Row,
  Form,
  Input,
  Label,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Button,
  Badge,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Alert,
} from "reactstrap";
import DataTable from "react-data-table-component";
import Select from "react-select";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import Loader from "../../../Components/Common/Loader";
import NoDataFound from "../../../Components/Common/NoDataFound";

import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";

// Redux thunks
import {
  getCompletedOrdersByBusinessID as onGetCompletedOrders,
  getCancelledOrdersByBusinessID as onGetCancelledOrders,
} from "../../../slices/thunks";
import useAuthUser from "../../../Components/Hooks/useAuthUser";

// Selectors
const selectCompletedOrdersData = createSelector(
  (state) => state.Orders,
  (completedOrders) => completedOrders.completedOrders || [],
);

const selectCancelledOrdersData = createSelector(
  (state) => state.Orders,
  (cancelledOrders) => cancelledOrders.cancelledOrders || [],
);

const CompletedRejectedOrdersPage = () => {
  document.title = "Order History | Kamacaash";

  const dispatch = useDispatch();
  const completedOrdersData = useSelector(selectCompletedOrdersData);
  const cancelledOrdersData = useSelector(selectCancelledOrdersData);

  // State management
  const [completedOrders, setCompletedOrders] = useState([]);
  const [cancelledOrders, setCancelledOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("completed");
  const [filteredCompletedOrders, setFilteredCompletedOrders] = useState([]);
  const [filteredCancelledOrders, setFilteredCancelledOrders] = useState([]);

  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    dateRange: "all", // 'all', 'today', 'week', 'month'
    amountRange: "all", // 'all', '0-50', '50-100', '100+'
  });

  // Stats state
  const [stats, setStats] = useState({
    totalCompleted: 0,
    totalCancelled: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    completionRate: 0,
  });
  const userAuth = useAuthUser();

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const businessId = userAuth.businessId; // Replace with actual business ID
      await Promise.all([
        dispatch(onGetCompletedOrders(businessId)),
        dispatch(onGetCancelledOrders(businessId)),
      ]);
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
    const initialCompleted = Array.isArray(completedOrdersData)
      ? completedOrdersData
      : [];
    const initialCancelled = Array.isArray(cancelledOrdersData)
      ? cancelledOrdersData
      : [];

    setCompletedOrders(initialCompleted);
    setCancelledOrders(initialCancelled);

    // Calculate stats
    const totalCompleted = initialCompleted.length;
    const totalCancelled = initialCancelled.length;
    const totalOrders = totalCompleted + totalCancelled;
    const totalRevenue = initialCompleted.reduce(
      (sum, order) => sum + (order.amount || 0),
      0,
    );
    const avgOrderValue =
      totalCompleted > 0 ? totalRevenue / totalCompleted : 0;
    const completionRate =
      totalOrders > 0 ? (totalCompleted / totalOrders) * 100 : 0;

    setStats({
      totalCompleted,
      totalCancelled,
      totalRevenue,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      completionRate: Math.round(completionRate),
    });

    // Apply filters
    applyFilters(initialCompleted, initialCancelled, filters);
  }, [completedOrdersData, cancelledOrdersData, filters]);

  // Apply filters
  const applyFilters = (completedList, cancelledList, filterSettings) => {
    let filteredCompleted = completedList;
    let filteredCancelled = cancelledList;

    // Search filter
    if (filterSettings.search) {
      const searchTerm = filterSettings.search.toLowerCase();
      const searchFilter = (order) =>
        order.user?.fullName?.toLowerCase().includes(searchTerm) ||
        order.user?.phoneNumber?.includes(searchTerm) ||
        order.orderId?.toLowerCase().includes(searchTerm) ||
        order.package?.title?.toLowerCase().includes(searchTerm);

      filteredCompleted = filteredCompleted.filter(searchFilter);
      filteredCancelled = filteredCancelled.filter(searchFilter);
    }

    // Date range filter
    if (filterSettings.dateRange !== "all") {
      const now = new Date();
      const dateFilter = (order) => {
        const orderDate = new Date(
          order.completedAt || order.cancelledAt || order.createdAt,
        );
        switch (filterSettings.dateRange) {
          case "today":
            return orderDate.toDateString() === now.toDateString();
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return orderDate >= weekAgo;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return orderDate >= monthAgo;
          default:
            return true;
        }
      };

      filteredCompleted = filteredCompleted.filter(dateFilter);
      filteredCancelled = filteredCancelled.filter(dateFilter);
    }

    // Amount range filter
    if (filterSettings.amountRange !== "all") {
      const amountFilter = (order) => {
        const amount = order.amount || 0;
        switch (filterSettings.amountRange) {
          case "0-5":
            return amount <= 5;
          case "5-10":
            return amount > 5 && amount <= 10;
          case "10+":
            return amount > 10;
          default:
            return true;
        }
      };

      filteredCompleted = filteredCompleted.filter(amountFilter);
      filteredCancelled = filteredCancelled.filter(amountFilter);
    }

    setFilteredCompletedOrders(filteredCompleted);
    setFilteredCancelledOrders(filteredCancelled);
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  // Open modal for view
  const handleView = (order, type) => {
    setSelectedOrder({ ...order, type });
    setViewModal(true);
  };

  // Get status badge color and icon
  const getStatusBadge = (status, type) => {
    if (type === "cancelled") {
      return {
        color: "danger",
        icon: "ri-close-circle-line",
        text: "CANCELLED",
      };
    }

    switch (status) {
      case "COMPLETED":
        return {
          color: "success",
          icon: "ri-checkbox-circle-line",
          text: "COMPLETED",
        };
      case "CANCELLED":
        return {
          color: "danger",
          icon: "ri-close-circle-line",
          text: "CANCELLED",
        };
      default:
        return {
          color: "secondary",
          icon: "ri-question-line",
          text: status,
        };
    }
  };

  // Format date with time
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  // Completed Orders columns
  const completedColumns = [
    {
      name: "#",
      cell: (row, index) => index + 1,
    },
    {
      name: "ORDER ID",
      selector: (row) => row.orderId,
      cell: (row) => <strong className="text-success">#{row.orderId}</strong>,
    },
    {
      name: "CUSTOMER",
      cell: (row) => (
        <div>
          <div className="fw-semibold">{row.user?.fullName || "N/A"}</div>
          <small className="text-muted">{row.user?.phoneNumber || "N/A"}</small>
        </div>
      ),
    },
    {
      name: "PACKAGE",
      cell: (row) => (
        <div className="d-flex align-items-center">
          {row.package?.packageImg ? (
            <img
              src={row.package.packageImg}
              alt={row.package.title}
              className="rounded me-3"
              style={{ width: "40px", height: "40px", objectFit: "cover" }}
            />
          ) : (
            <div
              className="rounded bg-light d-flex align-items-center justify-content-center me-3"
              style={{ width: "40px", height: "40px" }}
            >
              <i className="ri-gift-line text-muted"></i>
            </div>
          )}
          <div>
            <div
              className="fw-semibold text-truncate"
              style={{ maxWidth: "200px" }}
            >
              {row.package?.title || "N/A"}
            </div>
            <small className="text-muted">Qty: {row.quantity}</small>
          </div>
        </div>
      ),
    },
    {
      name: "AMOUNT",
      cell: (row) => `$${row.amount || 0}`,
      // sortable: true,
    },
    {
      name: "COMPLETED AT",
      cell: (row) => (
        <div>
          <div>{formatDateTime(row.completedAt)}</div>
          <small className="text-muted">
            {formatRelativeTime(row.completedAt)}
          </small>
        </div>
      ),
      // sortable: true
    },
    // {
    //     name: 'COMPLETED BY',
    //     cell: row => row.completedBy || 'System',
    // },
    {
      name: "ACTIONS",
      cell: (row) => (
        <Button
          color="outline-info"
          size="sm"
          onClick={() => handleView(row, "completed")}
          title="View Details"
          className="btn-icon"
        >
          <i className="ri-eye-line" />
        </Button>
      ),
    },
  ];

  // Cancelled Orders columns
  const cancelledColumns = [
    {
      name: "#",
      cell: (row, index) => index + 1,
    },
    {
      name: "ORDER ID",
      selector: (row) => row.orderId,
      cell: (row) => <strong className="text-danger">#{row.orderId}</strong>,
    },
    {
      name: "CUSTOMER",
      cell: (row) => (
        <div>
          <div className="fw-semibold">{row.user?.fullName || "N/A"}</div>
          <small className="text-muted">{row.user?.phoneNumber || "N/A"}</small>
        </div>
      ),
    },
    {
      name: "PACKAGE",
      cell: (row) => (
        <div className="d-flex align-items-center">
          {row.package?.packageImg ? (
            <img
              src={row.package.packageImg}
              alt={row.package.title}
              className="rounded me-3"
              style={{ width: "40px", height: "40px", objectFit: "cover" }}
            />
          ) : (
            <div
              className="rounded bg-light d-flex align-items-center justify-content-center me-3"
              style={{ width: "40px", height: "40px" }}
            >
              <i className="ri-gift-line text-muted"></i>
            </div>
          )}
          <div>
            <div
              className="fw-semibold text-truncate"
              style={{ maxWidth: "200px" }}
            >
              {row.package?.title || "N/A"}
            </div>
            <small className="text-muted">Qty: {row.quantity}</small>
          </div>
        </div>
      ),
    },
    {
      name: "AMOUNT",
      cell: (row) => `$${row.amount || 0}`,
      // sortable: true,
    },
    {
      name: "CANCELLED AT",
      cell: (row) => (
        <div>
          <div>{formatDateTime(row.cancelledAt)}</div>
          <small className="text-muted">
            {formatRelativeTime(row.cancelledAt)}
          </small>
        </div>
      ),
      // sortable: true
    },
    {
      name: "REASON",
      cell: (row) => (
        <div
          className="text-truncate"
          style={{ maxWidth: "200px" }}
          title={row.cancellationReason}
        >
          {row.cancellationReason || "No reason provided"}
        </div>
      ),
    },
    {
      name: "ACTIONS",
      cell: (row) => (
        <Button
          color="outline-info"
          size="sm"
          onClick={() => handleView(row, "cancelled")}
          title="View Details"
          className="btn-icon"
        >
          <i className="ri-eye-line" />
        </Button>
      ),
    },
  ];

  // Custom styles for DataTable
  const customStyles = {
    headCells: {
      style: {
        fontWeight: "600",
        fontSize: "0.875rem",
        // backgroundColor: '#f8f9fa',
      },
    },
    cells: {
      style: {
        fontSize: "0.875rem",
        padding: "12px 8px",
      },
    },
  };

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Order History" pageTitle="Orders" />

        {/* Stats Cards */}
        <Row className="mb-4">
          <Col xl={3} md={6}>
            <Card className="card-animate">
              <CardBody>
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <p className="text-uppercase fw-medium text-muted mb-0">
                      Completed Orders
                    </p>
                    <h4 className="mb-0">{stats.totalCompleted}</h4>
                    <p className="text-success mb-0">
                      <i className="ri-arrow-up-line align-middle"></i>
                      {stats.completionRate}% completion rate
                    </p>
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
                    <p className="text-uppercase fw-medium text-muted mb-0">
                      Cancelled Orders
                    </p>
                    <h4 className="mb-0">{stats.totalCancelled}</h4>
                    <p className="text-danger mb-0">
                      <i className="ri-arrow-down-line align-middle"></i>
                      {100 - stats.completionRate}% cancellation rate
                    </p>
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
          <Col xl={3} md={6}>
            <Card className="card-animate">
              <CardBody>
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <p className="text-uppercase fw-medium text-muted mb-0">
                      Total Revenue
                    </p>
                    <h4 className="mb-0">${stats.totalRevenue}</h4>
                    <p className="text-muted mb-0">From completed orders</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="avatar-sm">
                      <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-2">
                        <i className="ri-money-dollar-circle-line"></i>
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
                    <p className="text-uppercase fw-medium text-muted mb-0">
                      Avg Order Value
                    </p>
                    <h4 className="mb-0">${stats.avgOrderValue}</h4>
                    <p className="text-muted mb-0">Per completed order</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="avatar-sm">
                      <span className="avatar-title bg-info-subtle text-info rounded-circle fs-2">
                        <i className="ri-line-chart-line"></i>
                      </span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Main Content */}
        <Card>
          <CardHeader className="bg-light">
            <Row className="align-items-center">
              <Col md={6}>
                <h5 className="card-title mb-0">
                  <i className="ri-history-line align-middle me-2"></i>
                  Order History
                </h5>
              </Col>
              <Col md={6} className="text-end">
                <Button color="light" onClick={fetchData} disabled={loading}>
                  <i className="ri-refresh-line me-1"></i>
                  Refresh
                </Button>
              </Col>
            </Row>
          </CardHeader>
          <CardBody className="p-0">
            {/* Tabs Navigation */}
            <Nav className="nav-pills nav-justified bg-light" role="tablist">
              <NavItem>
                <NavLink
                  className={activeTab === "completed" ? "active" : ""}
                  onClick={() => setActiveTab("completed")}
                >
                  <i className="ri-checkbox-circle-line me-1"></i>
                  Completed Orders
                  <Badge color="success" className="ms-2">
                    {filteredCompletedOrders.length}
                  </Badge>
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={activeTab === "cancelled" ? "active" : ""}
                  onClick={() => setActiveTab("cancelled")}
                >
                  <i className="ri-close-circle-line me-1"></i>
                  Cancelled Orders
                  <Badge color="danger" className="ms-2">
                    {filteredCancelledOrders.length}
                  </Badge>
                </NavLink>
              </NavItem>
            </Nav>

            {/* Filter Controls */}
            <div className="p-3 border-bottom">
              <Row className="g-3 align-items-end">
                <Col md={4}>
                  <FormGroup className="mb-0">
                    <Label className="form-label">Search Orders</Label>
                    <Input
                      type="text"
                      name="search"
                      placeholder="Search by customer, order ID, or package..."
                      value={filters.search}
                      onChange={handleFilterChange}
                      className="form-control"
                    />
                  </FormGroup>
                </Col>
                <Col md={3}>
                  <FormGroup className="mb-0">
                    <Label className="form-label">Date Range</Label>
                    <Select
                      options={[
                        { value: "all", label: "All Time" },
                        { value: "today", label: "Today" },
                        { value: "week", label: "Last 7 Days" },
                        { value: "month", label: "Last 30 Days" },
                      ]}
                      value={{
                        value: filters.dateRange,
                        label:
                          filters.dateRange === "all"
                            ? "All Time"
                            : filters.dateRange === "today"
                              ? "Today"
                              : filters.dateRange === "week"
                                ? "Last 7 Days"
                                : "Last 30 Days",
                      }}
                      onChange={(opt) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: opt.value,
                        }))
                      }
                      placeholder="Select date range"
                      className="react-select"
                      classNamePrefix="select"
                    />
                  </FormGroup>
                </Col>
                <Col md={3}>
                  <FormGroup className="mb-0">
                    <Label className="form-label">Amount Range</Label>
                    <Select
                      options={[
                        { value: "all", label: "All Amounts" },
                        { value: "0-5", label: "$0 - $5" },
                        { value: "5-10", label: "$5 - $10" },
                        { value: "10+", label: "$10+" },
                      ]}
                      value={{
                        value: filters.amountRange,
                        label:
                          filters.amountRange === "all"
                            ? "All Amounts"
                            : filters.amountRange === "0-5"
                              ? "$0 - $5"
                              : filters.amountRange === "5-10"
                                ? "$5 - $10"
                                : "$10+",
                      }}
                      onChange={(opt) =>
                        setFilters((prev) => ({
                          ...prev,
                          amountRange: opt.value,
                        }))
                      }
                      placeholder="Select amount range"
                      className="react-select"
                      classNamePrefix="select"
                    />
                  </FormGroup>
                </Col>
                <Col md={2}>
                  <div className="d-grid mb-3">
                    <Button
                      color="light"
                      onClick={() =>
                        setFilters({
                          search: "",
                          dateRange: "all",
                          amountRange: "all",
                        })
                      }
                    >
                      <i className="ri-eraser-line me-1"></i>
                      Clear
                    </Button>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Tab Content */}
            <TabContent activeTab={activeTab}>
              {/* Completed Orders Tab */}
              <TabPane tabId="completed">
                {loading ? (
                  <div className="text-center py-5">
                    <Loader />
                  </div>
                ) : (
                  <DataTable
                    columns={completedColumns}
                    data={filteredCompletedOrders}
                    pagination
                    responsive
                    // highlightOnHover
                    noDataComponent={
                      <NoDataFound
                        message={
                          filters.search ||
                          filters.dateRange !== "all" ||
                          filters.amountRange !== "all"
                            ? "Try adjusting your search criteria."
                            : "No orders have been completed yet."
                        }
                      />
                    }
                    customStyles={customStyles}
                  />
                )}
              </TabPane>

              {/* Cancelled Orders Tab */}
              <TabPane tabId="cancelled">
                {loading ? (
                  <div className="text-center py-5">
                    <Loader />
                  </div>
                ) : (
                  <DataTable
                    columns={cancelledColumns}
                    data={filteredCancelledOrders}
                    pagination
                    responsive
                    // highlightOnHover
                    noDataComponent={
                      <NoDataFound
                        message={
                          filters.search ||
                          filters.dateRange !== "all" ||
                          filters.amountRange !== "all"
                            ? "Try adjusting your search criteria."
                            : "No orders have been cancelled yet."
                        }
                      />
                    }
                    customStyles={customStyles}
                  />
                )}
              </TabPane>
            </TabContent>
          </CardBody>
        </Card>
      </Container>

      {/* View Order Modal */}
      <Modal
        isOpen={viewModal}
        toggle={() => setViewModal(false)}
        size="lg"
        centered
      >
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
                  <p>
                    <strong>Name:</strong>{" "}
                    {selectedOrder.user?.fullName || "N/A"}
                  </p>
                  <p>
                    <strong>Phone:</strong>{" "}
                    {selectedOrder.user?.phoneNumber || "N/A"}
                  </p>
                  {/* <p><strong>User ID:</strong> {selectedOrder.user?.userId || 'N/A'}</p> */}
                </div>

                <h6>Order Information</h6>
                <div className="border rounded p-3">
                  <p>
                    <strong>Order ID:</strong> #{selectedOrder.orderId}
                  </p>
                  <p>
                    <strong>Quantity:</strong> {selectedOrder.quantity}
                  </p>
                  <p>
                    <strong>Amount:</strong> ${selectedOrder.amount || 0}
                  </p>
                  <p>
                    <strong>Status:</strong>
                    <Badge
                      color={
                        getStatusBadge(selectedOrder.status, selectedOrder.type)
                          .color
                      }
                      className="ms-2"
                    >
                      <i
                        className={`${getStatusBadge(selectedOrder.status, selectedOrder.type).icon} me-1`}
                      ></i>
                      {
                        getStatusBadge(selectedOrder.status, selectedOrder.type)
                          .text
                      }
                    </Badge>
                  </p>
                  {/* <p><strong>Payment Status:</strong> {selectedOrder.paymentStatus}</p>
                                    <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod || 'N/A'}</p> */}
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
                        style={{ maxHeight: "150px", maxWidth: "100%" }}
                      />
                    </div>
                  )}
                  <p>
                    <strong>Title:</strong>{" "}
                    {selectedOrder.package?.title || "N/A"}
                  </p>
                  <p>
                    <strong>Pickup Start:</strong>{" "}
                    {selectedOrder.package?.pickupStart
                      ? formatDateTime(selectedOrder.package.pickupStart)
                      : "N/A"}
                  </p>
                  <p>
                    <strong>Pickup End:</strong>{" "}
                    {selectedOrder.package?.pickupEnd
                      ? formatDateTime(selectedOrder.package.pickupEnd)
                      : "N/A"}
                  </p>
                </div>

                <h6>
                  {selectedOrder.type === "completed"
                    ? "Completion Details"
                    : "Cancellation Details"}
                </h6>
                <div className="border rounded p-3">
                  {selectedOrder.type === "completed" ? (
                    <>
                      <p>
                        <strong>Completed At:</strong>{" "}
                        {formatDateTime(selectedOrder.completedAt)}
                      </p>
                      <p>
                        <strong>Completed By:</strong>{" "}
                        {selectedOrder.completedBy || "System"}
                      </p>
                      <p>
                        <strong>Time Since Completion:</strong>{" "}
                        {formatRelativeTime(selectedOrder.completedAt)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        <strong>Cancelled At:</strong>{" "}
                        {formatDateTime(selectedOrder.cancelledAt)}
                      </p>
                      <p>
                        <strong>Cancellation Reason:</strong>{" "}
                        {selectedOrder.cancellationReason ||
                          "No reason provided"}
                      </p>
                      <p>
                        <strong>Time Since Cancellation:</strong>{" "}
                        {formatRelativeTime(selectedOrder.cancelledAt)}
                      </p>
                      <Alert color="info" className="mt-2 mb-0">
                        <i className="ri-information-line me-2"></i>
                        This order was refunded and package quantity was
                        restored.
                      </Alert>
                    </>
                  )}
                </div>
              </Col>
            </Row>
          )}
        </ModalBody>
        <ModalFooter className="bg-light">
          <Button color="light" onClick={() => setViewModal(false)}>
            <i className="ri-close-line me-1"></i>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default CompletedRejectedOrdersPage;
