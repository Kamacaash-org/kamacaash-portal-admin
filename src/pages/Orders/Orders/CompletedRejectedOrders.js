import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Nav,
  NavItem,
  NavLink,
  Row,
  TabContent,
  TabPane,
} from "reactstrap";
import DataTable from "react-data-table-component";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import Loader from "../../../Components/Common/Loader";
import NoDataFound from "../../../Components/Common/NoDataFound";
import useAuthUser from "../../../Components/Hooks/useAuthUser";
import {
  getCancelledOrdersByBusinessID as onGetCancelledOrders,
  getCompletedOrdersByBusinessID as onGetCompletedOrders,
  getNoShowOrdersByBusinessID as onGetNoShowOrders,
} from "../../../slices/thunks";

const selectCompletedOrdersData = createSelector(
  (state) => state.Orders,
  (ordersState) => ordersState.completedOrders || [],
);

const selectCancelledOrdersData = createSelector(
  (state) => state.Orders,
  (ordersState) => ordersState.cancelledOrders || [],
);

const selectNoShowOrdersData = createSelector(
  (state) => state.Orders,
  (ordersState) => ordersState.noShowOrders || [],
);

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const formatCurrency = (value) => currencyFormatter.format(Number(value) || 0);

const formatDateTime = (value, timezone) => {
  if (!value) return "N/A";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone || "Africa/Mogadishu",
  }).format(new Date(value));
};

const formatRelativeTime = (value) => {
  if (!value) return "N/A";

  const now = new Date();
  const date = new Date(value);
  const diffMinutes = Math.round((now.getTime() - date.getTime()) / 60000);

  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day ago`;
};

const toDisplayPaymentStatus = (status) => {
  switch (status) {
    case "CONFIRMED":
      return "Payment confirmed";
    case "REFUNDED":
      return "Payment refunded";
    case "PENDING":
      return "Payment pending";
    case "FAILED":
      return "Payment failed";
    default:
      return status
        ? status
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase())
        : "N/A";
  }
};

const getStatusBadge = (status) => {
  switch (status) {
    case "COLLECTED":
      return {
        color: "success",
        icon: "ri-checkbox-circle-line",
        text: "Collected",
      };
    case "CANCELLED":
    case "CANCELLED_BY_USER":
      return {
        color: "danger",
        icon: "ri-close-circle-line",
        text: "Cancelled by customer",
      };
    case "CANCELLED_BY_ADMIN":
      return {
        color: "danger",
        icon: "ri-admin-line",
        text: "Cancelled by admin",
      };
    case "EXPIRED":
      return {
        color: "warning",
        icon: "ri-time-line",
        text: "Expired",
      };
    case "NO_SHOW":
      return {
        color: "warning",
        icon: "ri-user-unfollow-line",
        text: "Customer did not show",
      };
    case "CLOSED":
      return {
        color: "dark",
        icon: "ri-lock-line",
        text: "Closed",
      };
    default:
      return {
        color: "secondary",
        icon: "ri-information-line",
        text: status
          ? status
              .replaceAll("_", " ")
              .toLowerCase()
              .replace(/\b\w/g, (char) => char.toUpperCase())
          : "Unknown",
      };
  }
};

const normalizeOrder = (order, type) => {
  const timezone = order?.timezone || "Africa/Mogadishu";
  const customerName =
    order?.user?.full_name ||
    order?.user?.email ||
    order?.user?.phone ||
    "Unknown customer";

  return {
    id: order?.id,
    orderNumber: order?.order_number || "N/A",
    quantity: Number(order?.quantity) || 0,
    unitPrice: Number(order?.unit_price) || 0,
    totalAmount: Number(order?.total_amount) || 0,
    status: order?.status || "UNKNOWN",
    paymentStatus: order?.payment_status || "N/A",
    pickupStartTime: order?.pickup_start_time,
    pickupEndTime: order?.pickup_end_time,
    timezone,
    createdAt: order?.created_at,
    collectedAt: order?.collected_at,
    cancelledAt: order?.cancelled_at,
    noShowAt: order?.no_show_at,
    cancellationReason: order?.cancellation_reason,
    isUrgent: Boolean(order?.is_urgent),
    customerName,
    customerPhone: order?.user?.phone || "N/A",
    customerEmail: order?.user?.email || "N/A",
    businessName: order?.business?.display_name || "N/A",
    offerTitle: order?.offer?.title || "Untitled offer",
    offerImage: order?.offer?.main_image_url || "",
    type,
    searchText: [
      order?.order_number,
      customerName,
      order?.user?.phone,
      order?.user?.email,
      order?.offer?.title,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
};

const getTodayDateString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 10);
};

const CompletedRejectedOrdersPage = () => {
  document.title = "Order History | Kamacaash";

  const dispatch = useDispatch();
  const userAuth = useAuthUser();
  const completedOrdersData = useSelector(selectCompletedOrdersData);
  const cancelledOrdersData = useSelector(selectCancelledOrdersData);
  const noShowOrdersData = useSelector(selectNoShowOrdersData);

  const [completedOrders, setCompletedOrders] = useState([]);
  const [cancelledOrders, setCancelledOrders] = useState([]);
  const [noShowOrders, setNoShowOrders] = useState([]);
  const [filteredCompletedOrders, setFilteredCompletedOrders] = useState([]);
  const [filteredCancelledOrders, setFilteredCancelledOrders] = useState([]);
  const [filteredNoShowOrders, setFilteredNoShowOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("completed");
  const today = useMemo(() => getTodayDateString(), []);
  const [filters, setFilters] = useState({
    search: "",
    amountRange: "all",
    startDate: today,
    endDate: today,
  });

  const businessId = userAuth?.businessId;

  const stats = useMemo(() => {
    const totalCompleted = completedOrders.length;
    const totalCancelled = cancelledOrders.length;
    const totalNoShow = noShowOrders.length;
    const totalOrders = totalCompleted + totalCancelled + totalNoShow;
    const totalRevenue = completedOrders.reduce(
      (sum, order) => sum + (Number(order.totalAmount) || 0),
      0,
    );
    const avgOrderValue =
      totalCompleted > 0 ? totalRevenue / totalCompleted : 0;
    const completionRate =
      totalOrders > 0 ? Math.round((totalCompleted / totalOrders) * 100) : 0;

    return {
      totalCompleted,
      totalCancelled,
      totalNoShow,
      totalRevenue,
      avgOrderValue,
      completionRate,
    };
  }, [cancelledOrders, completedOrders, noShowOrders]);

  const applyFilters = useCallback((completedList, cancelledList, noShowList, filterState) => {
    const searchValue = filterState.search.trim().toLowerCase();

    const matchesAmount = (order) => {
      const amount = Number(order.totalAmount) || 0;

      switch (filterState.amountRange) {
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

    const matchesSearch = (order) =>
      searchValue ? order.searchText.includes(searchValue) : true;

    setFilteredCompletedOrders(
      completedList.filter(
        (order) => matchesSearch(order) && matchesAmount(order),
      ),
    );
    setFilteredCancelledOrders(
      cancelledList.filter(
        (order) => matchesSearch(order) && matchesAmount(order),
      ),
    );
    setFilteredNoShowOrders(
      noShowList.filter(
        (order) => matchesSearch(order) && matchesAmount(order),
      ),
    );
  }, []);

  const fetchData = useCallback(async () => {
    if (!businessId) return;

    setLoading(true);
    try {
      await Promise.all([
        dispatch(
          onGetCompletedOrders({
            businessId,
            start: filters.startDate,
            end: filters.endDate,
          }),
        ),
        dispatch(
          onGetCancelledOrders({
            businessId,
            start: filters.startDate,
            end: filters.endDate,
          }),
        ),
        dispatch(
          onGetNoShowOrders({
            businessId,
            start: filters.startDate,
            end: filters.endDate,
          }),
        ),
      ]);
    } catch (error) {
      console.error("Error loading order history:", error);
    } finally {
      setLoading(false);
    }
  }, [businessId, dispatch, filters.endDate, filters.startDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setCompletedOrders(
      Array.isArray(completedOrdersData)
        ? completedOrdersData.map((order) => normalizeOrder(order, "completed"))
        : [],
    );
  }, [completedOrdersData]);

  useEffect(() => {
    setCancelledOrders(
      Array.isArray(cancelledOrdersData)
        ? cancelledOrdersData.map((order) => normalizeOrder(order, "cancelled"))
        : [],
    );
  }, [cancelledOrdersData]);

  useEffect(() => {
    setNoShowOrders(
      Array.isArray(noShowOrdersData)
        ? noShowOrdersData.map((order) => normalizeOrder(order, "no-show"))
        : [],
    );
  }, [noShowOrdersData]);

  useEffect(() => {
    applyFilters(completedOrders, cancelledOrders, noShowOrders, filters);
  }, [applyFilters, cancelledOrders, completedOrders, noShowOrders, filters]);

  const openViewModal = (order) => {
    setSelectedOrder(order);
    setViewModal(true);
  };

  const completedColumns = [
    {
      name: "#",
      width: "70px",
      cell: (_, index) => index + 1,
    },
    {
      name: "Order",
      grow: 1.4,
      cell: (row) => (
        <div className="py-2">
          <div className="fw-semibold text-success">{row.orderNumber}</div>
          <small className="text-muted">
            Placed: {formatDateTime(row.createdAt, row.timezone)}
          </small>
        </div>
      ),
    },
    {
      name: "Customer",
      grow: 1.4,
      cell: (row) => (
        <div className="py-2">
          <div className="fw-semibold">{row.customerName}</div>
          <small className="text-muted">{row.customerPhone}</small>
        </div>
      ),
    },
    {
      name: "Offer",
      grow: 1.8,
      cell: (row) => (
        <div className="d-flex align-items-center py-2">
          {row.offerImage ? (
            <img
              src={row.offerImage}
              alt={row.offerTitle}
              className="rounded me-3"
              style={{ width: "44px", height: "44px", objectFit: "cover" }}
            />
          ) : (
            <div
              className="rounded bg-light d-flex align-items-center justify-content-center me-3"
              style={{ width: "44px", height: "44px" }}
            >
              <i className="ri-image-line text-muted"></i>
            </div>
          )}
          <div>
            <div className="fw-semibold">{row.offerTitle}</div>
            <small className="text-muted">Qty: {row.quantity}</small>
          </div>
        </div>
      ),
    },
    {
      name: "Amount",
      minWidth: "140px",
      cell: (row) => formatCurrency(row.totalAmount),
    },
    {
      name: "Collected At",
      grow: 1.4,
      cell: (row) => (
        <div className="py-2">
          <div>{formatDateTime(row.collectedAt, row.timezone)}</div>
          <small className="text-muted">
            {formatRelativeTime(row.collectedAt)}
          </small>
        </div>
      ),
    },
    {
      name: "Actions",
      minWidth: "110px",
      cell: (row) => (
        <Button
          color="outline-info"
          size="sm"
          onClick={() => openViewModal(row)}
          className="btn-icon"
        >
          <i className="ri-eye-line" />
        </Button>
      ),
    },
  ];

  const cancelledColumns = [
    {
      name: "#",
      width: "70px",
      cell: (_, index) => index + 1,
    },
    {
      name: "Order",
      grow: 1.4,
      cell: (row) => (
        <div className="py-2">
          <div className="fw-semibold text-danger">{row.orderNumber}</div>
          <small className="text-muted">
            Placed: {formatDateTime(row.createdAt, row.timezone)}
          </small>
        </div>
      ),
    },
    {
      name: "Customer",
      grow: 1.4,
      cell: (row) => (
        <div className="py-2">
          <div className="fw-semibold">{row.customerName}</div>
          <small className="text-muted">{row.customerPhone}</small>
        </div>
      ),
    },
    {
      name: "Offer",
      grow: 1.8,
      cell: (row) => (
        <div className="d-flex align-items-center py-2">
          {row.offerImage ? (
            <img
              src={row.offerImage}
              alt={row.offerTitle}
              className="rounded me-3"
              style={{ width: "44px", height: "44px", objectFit: "cover" }}
            />
          ) : (
            <div
              className="rounded bg-light d-flex align-items-center justify-content-center me-3"
              style={{ width: "44px", height: "44px" }}
            >
              <i className="ri-image-line text-muted"></i>
            </div>
          )}
          <div>
            <div className="fw-semibold">{row.offerTitle}</div>
            <small className="text-muted">Qty: {row.quantity}</small>
          </div>
        </div>
      ),
    },
    {
      name: "Amount",
      minWidth: "140px",
      cell: (row) => formatCurrency(row.totalAmount),
    },
    {
      name: "Cancelled At",
      grow: 1.4,
      cell: (row) => (
        <div className="py-2">
          <div>{formatDateTime(row.cancelledAt, row.timezone)}</div>
          <small className="text-muted">
            {formatRelativeTime(row.cancelledAt)}
          </small>
        </div>
      ),
    },
    {
      name: "Reason",
      grow: 1.5,
      cell: (row) => (
        <div
          className="text-truncate"
          style={{ maxWidth: "220px" }}
          title={row.cancellationReason || "No reason provided"}
        >
          {row.cancellationReason || "No reason provided"}
        </div>
      ),
    },
    {
      name: "Actions",
      minWidth: "110px",
      cell: (row) => (
        <Button
          color="outline-info"
          size="sm"
          onClick={() => openViewModal(row)}
          className="btn-icon"
        >
          <i className="ri-eye-line" />
        </Button>
      ),
    },
  ];

  const noShowColumns = [
    {
      name: "#",
      width: "70px",
      cell: (_, index) => index + 1,
    },
    {
      name: "Order",
      grow: 1.4,
      cell: (row) => (
        <div className="py-2">
          <div className="fw-semibold text-warning">{row.orderNumber}</div>
          <small className="text-muted">
            Placed: {formatDateTime(row.createdAt, row.timezone)}
          </small>
        </div>
      ),
    },
    {
      name: "Customer",
      grow: 1.4,
      cell: (row) => (
        <div className="py-2">
          <div className="fw-semibold">{row.customerName}</div>
          <small className="text-muted">{row.customerPhone}</small>
        </div>
      ),
    },
    {
      name: "Offer",
      grow: 1.8,
      cell: (row) => (
        <div className="d-flex align-items-center py-2">
          {row.offerImage ? (
            <img
              src={row.offerImage}
              alt={row.offerTitle}
              className="rounded me-3"
              style={{ width: "44px", height: "44px", objectFit: "cover" }}
            />
          ) : (
            <div
              className="rounded bg-light d-flex align-items-center justify-content-center me-3"
              style={{ width: "44px", height: "44px" }}
            >
              <i className="ri-image-line text-muted"></i>
            </div>
          )}
          <div>
            <div className="fw-semibold">{row.offerTitle}</div>
            <small className="text-muted">Qty: {row.quantity}</small>
          </div>
        </div>
      ),
    },
    {
      name: "Amount",
      minWidth: "140px",
      cell: (row) => formatCurrency(row.totalAmount),
    },
    {
      name: "No-Show At",
      grow: 1.4,
      cell: (row) => (
        <div className="py-2">
          <div>{formatDateTime(row.noShowAt, row.timezone)}</div>
          <small className="text-muted">
            {formatRelativeTime(row.noShowAt)}
          </small>
        </div>
      ),
    },
    {
      name: "Actions",
      minWidth: "110px",
      cell: (row) => (
        <Button
          color="outline-info"
          size="sm"
          onClick={() => openViewModal(row)}
          className="btn-icon"
        >
          <i className="ri-eye-line" />
        </Button>
      ),
    },
  ];

  const customStyles = {
    headCells: {
      style: {
        fontWeight: "600",
        fontSize: "0.875rem",
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
                      No-Show Orders
                    </p>
                    <h4 className="mb-0">{stats.totalNoShow}</h4>
                    <p className="text-warning mb-0">
                      Customers who missed pickup
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="avatar-sm">
                      <span className="avatar-title bg-warning-subtle text-warning rounded-circle fs-2">
                        <i className="ri-user-unfollow-line"></i>
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
                    <h4 className="mb-0">{formatCurrency(stats.totalRevenue)}</h4>
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
                    <h4 className="mb-0">
                      {formatCurrency(stats.avgOrderValue)}
                    </h4>
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
              <NavItem>
                <NavLink
                  className={activeTab === "no-show" ? "active" : ""}
                  onClick={() => setActiveTab("no-show")}
                >
                  <i className="ri-user-unfollow-line me-1"></i>
                  No-Show Orders
                  <Badge color="warning" className="ms-2 text-dark">
                    {filteredNoShowOrders.length}
                  </Badge>
                </NavLink>
              </NavItem>
            </Nav>

            <div className="p-3 border-bottom">
              <Row className="g-3 align-items-end">
                <Col md={6}>
                  <FormGroup className="mb-0">
                    <Label className="form-label">Search Orders</Label>
                    <Input
                      type="text"
                      name="search"
                      placeholder="Search by order number, customer, phone, email, or offer..."
                      value={filters.search}
                      onChange={(event) =>
                        setFilters((prev) => ({
                          ...prev,
                          search: event.target.value,
                        }))
                      }
                    />
                  </FormGroup>
                </Col>
                <Col md={2}>
                  <FormGroup className="mb-0">
                    <Label className="form-label">Start Date</Label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      max={filters.endDate}
                      onChange={(event) =>
                        setFilters((prev) => ({
                          ...prev,
                          startDate: event.target.value,
                        }))
                      }
                    />
                  </FormGroup>
                </Col>
                <Col md={2}>
                  <FormGroup className="mb-0">
                    <Label className="form-label">End Date</Label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      min={filters.startDate}
                      onChange={(event) =>
                        setFilters((prev) => ({
                          ...prev,
                          endDate: event.target.value,
                        }))
                      }
                    />
                  </FormGroup>
                </Col>
                <Col md={2}>
                  <FormGroup className="mb-0">
                    <Label className="form-label">Amount Range</Label>
                    <Input
                      type="select"
                      value={filters.amountRange}
                      onChange={(event) =>
                        setFilters((prev) => ({
                          ...prev,
                          amountRange: event.target.value,
                        }))
                      }
                    >
                      <option value="all">All Amounts</option>
                      <option value="0-5">$0 - $5</option>
                      <option value="5-10">$5 - $10</option>
                      <option value="10+">$10+</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <div className="d-flex gap-2 justify-content-end">
                    <Button color="primary" onClick={fetchData} disabled={loading}>
                      <i className="ri-filter-3-line me-1"></i>
                      Apply
                    </Button>
                    <Button
                      color="light"
                      onClick={() =>
                        setFilters({
                          search: "",
                          amountRange: "all",
                          startDate: today,
                          endDate: today,
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

            <TabContent activeTab={activeTab}>
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
                    customStyles={customStyles}
                    noDataComponent={
                      <NoDataFound
                        message={
                          filters.search || filters.amountRange !== "all"
                            ? "Try adjusting your search criteria."
                            : "No completed orders found for the selected date range."
                        }
                      />
                    }
                  />
                )}
              </TabPane>

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
                    customStyles={customStyles}
                    noDataComponent={
                      <NoDataFound
                        message={
                          filters.search || filters.amountRange !== "all"
                            ? "Try adjusting your search criteria."
                            : "No cancelled orders found for the selected date range."
                        }
                      />
                    }
                  />
                )}
              </TabPane>

              <TabPane tabId="no-show">
                {loading ? (
                  <div className="text-center py-5">
                    <Loader />
                  </div>
                ) : (
                  <DataTable
                    columns={noShowColumns}
                    data={filteredNoShowOrders}
                    pagination
                    responsive
                    customStyles={customStyles}
                    noDataComponent={
                      <NoDataFound
                        message={
                          filters.search || filters.amountRange !== "all"
                            ? "Try adjusting your search criteria."
                            : "No no-show orders found for the selected date range."
                        }
                      />
                    }
                  />
                )}
              </TabPane>
            </TabContent>
          </CardBody>
        </Card>
      </Container>

      <Modal
        isOpen={viewModal}
        toggle={() => setViewModal(false)}
        size="lg"
        centered
      >
        <ModalHeader toggle={() => setViewModal(false)} className="bg-light">
          <i className="ri-eye-line me-2"></i>
          Order Details
        </ModalHeader>
        <ModalBody>
          {selectedOrder ? (
            <Row className="g-3">
              <Col md={6}>
                <h6>Customer</h6>
                <div className="border rounded p-3 h-100">
                  <p className="mb-2">
                    <strong>Name:</strong> {selectedOrder.customerName}
                  </p>
                  <p className="mb-2">
                    <strong>Phone:</strong> {selectedOrder.customerPhone}
                  </p>
                  <p className="mb-0">
                    <strong>Email:</strong> {selectedOrder.customerEmail}
                  </p>
                </div>
              </Col>

              <Col md={6}>
                <h6>Order Summary</h6>
                <div className="border rounded p-3 h-100">
                  <p className="mb-2">
                    <strong>Order Number:</strong> {selectedOrder.orderNumber}
                  </p>
                  <p className="mb-2">
                    <strong>Offer:</strong> {selectedOrder.offerTitle}
                  </p>
                  <p className="mb-2">
                    <strong>Quantity:</strong> {selectedOrder.quantity}
                  </p>
                  <p className="mb-0">
                    <strong>Total Amount:</strong>{" "}
                    {formatCurrency(selectedOrder.totalAmount)}
                  </p>
                </div>
              </Col>

              <Col md={6}>
                <h6>Pickup Details</h6>
                <div className="border rounded p-3 h-100">
                  <p className="mb-2">
                    <strong>Pickup Start:</strong>{" "}
                    {formatDateTime(
                      selectedOrder.pickupStartTime,
                      selectedOrder.timezone,
                    )}
                  </p>
                  <p className="mb-2">
                    <strong>Pickup End:</strong>{" "}
                    {formatDateTime(
                      selectedOrder.pickupEndTime,
                      selectedOrder.timezone,
                    )}
                  </p>
                  <p className="mb-0">
                    <strong>Business:</strong> {selectedOrder.businessName}
                  </p>
                </div>
              </Col>

              <Col md={6}>
                <h6>
                  {selectedOrder.type === "completed"
                    ? "Completion Details"
                    : selectedOrder.type === "cancelled"
                    ? "Cancellation Details"
                    : "No-Show Details"}
                </h6>
                <div className="border rounded p-3 h-100">
                  <p className="mb-2">
                    <strong>Status:</strong>
                    <Badge
                      color={getStatusBadge(selectedOrder.status).color}
                      className="ms-2"
                    >
                      <i
                        className={`${getStatusBadge(selectedOrder.status).icon} me-1`}
                      ></i>
                      {getStatusBadge(selectedOrder.status).text}
                    </Badge>
                  </p>
                  <p className="mb-2">
                    <strong>Payment Status:</strong>{" "}
                    {toDisplayPaymentStatus(selectedOrder.paymentStatus)}
                  </p>
                  {selectedOrder.type === "completed" ? (
                    <>
                      <p className="mb-2">
                        <strong>Collected At:</strong>{" "}
                        {formatDateTime(
                          selectedOrder.collectedAt,
                          selectedOrder.timezone,
                        )}
                      </p>
                      <p className="mb-0">
                        <strong>Time Since Collection:</strong>{" "}
                        {formatRelativeTime(selectedOrder.collectedAt)}
                      </p>
                    </>
                  ) : selectedOrder.type === "cancelled" ? (
                    <>
                      <p className="mb-2">
                        <strong>Cancelled At:</strong>{" "}
                        {formatDateTime(
                          selectedOrder.cancelledAt,
                          selectedOrder.timezone,
                        )}
                      </p>
                      <p className="mb-0">
                        <strong>Reason:</strong>{" "}
                        {selectedOrder.cancellationReason ||
                          "No reason provided"}
                      </p>
                      <Alert color="info" className="mt-3 mb-0">
                        <i className="ri-information-line me-2"></i>
                        This order was cancelled in the selected date range.
                      </Alert>
                    </>
                  ) : (
                    <>
                      <p className="mb-2">
                        <strong>No-Show At:</strong>{" "}
                        {formatDateTime(
                          selectedOrder.noShowAt,
                          selectedOrder.timezone,
                        )}
                      </p>
                      <p className="mb-0">
                        <strong>Time Since Missed Pickup:</strong>{" "}
                        {formatRelativeTime(selectedOrder.noShowAt)}
                      </p>
                      <Alert color="warning" className="mt-3 mb-0">
                        <i className="ri-alert-line me-2"></i>
                        Customer failed to pick up this package within the required window.
                      </Alert>
                    </>
                  )}
                </div>
              </Col>
            </Row>
          ) : null}
        </ModalBody>
        <ModalFooter className="bg-light">
          <Button color="light" onClick={() => setViewModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default CompletedRejectedOrdersPage;
