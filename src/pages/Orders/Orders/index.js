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
  Form,
  FormGroup,
  Input,
  InputGroup,
  InputGroupText,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
} from "reactstrap";
import DataTable from "react-data-table-component";
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import Loader from "../../../Components/Common/Loader";
import NoDataFound from "../../../Components/Common/NoDataFound";
import useAuthUser from "../../../Components/Hooks/useAuthUser";
import {
  cancelOrder as onCancelOrder,
  completeOrder as onCompleteOrder,
  getPendingOrdersByBusinessID as onGetPendingOrders,
} from "../../../slices/thunks";

const selectOrdersData = createSelector(
  (state) => state.Orders,
  (ordersState) => ordersState.pendingOrdersData || [],
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

const formatTimeOnly = (value, timezone) => {
  if (!value) return "N/A";

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone || "Africa/Mogadishu",
  }).format(new Date(value));
};

const formatRelativeTime = (value) => {
  if (!value) return "N/A";

  const now = new Date();
  const date = new Date(value);
  const diffMinutes = Math.round((date.getTime() - now.getTime()) / 60000);
  const absMinutes = Math.abs(diffMinutes);

  if (absMinutes < 1) return "Now";
  if (absMinutes < 60) {
    return diffMinutes > 0 ? `In ${absMinutes} min` : `${absMinutes} min ago`;
  }

  const absHours = Math.round(absMinutes / 60);
  if (absHours < 24) {
    return diffMinutes > 0 ? `In ${absHours} hr` : `${absHours} hr ago`;
  }

  const absDays = Math.round(absHours / 24);
  return diffMinutes > 0 ? `In ${absDays} day` : `${absDays} day ago`;
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
      return status ? status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) : "N/A";
  }
};

const toDisplayStatus = (status) => {
  switch (status) {
    case "PAID":
      return {
        color: "primary",
        icon: "ri-secure-payment-line",
        text: "Paid",
      };
    case "READY_FOR_PICKUP":
      return {
        color: "success",
        icon: "ri-shopping-bag-line",
        text: "Ready for pickup",
      };
    case "COLLECTED":
      return {
        color: "success",
        icon: "ri-checkbox-circle-line",
        text: "Collected",
      };
    case "EXPIRED":
      return {
        color: "warning",
        icon: "ri-time-line",
        text: "Expired",
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

const normalizeOrder = (order) => {
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
    subtotal: Number(order?.subtotal) || 0,
    totalAmount: Number(order?.total_amount) || 0,
    discount: Number(order?.discount) || 0,
    taxMinor: Number(order?.tax_minor) || 0,
    status: order?.status || "UNKNOWN",
    paymentStatus: order?.payment_status || "N/A",
    pickupStartTime: order?.pickup_start_time,
    pickupEndTime: order?.pickup_end_time,
    timezone,
    createdAt: order?.created_at,
    collectedAt: order?.collected_at,
    cancelledAt: order?.cancelled_at,
    cancellationReason: order?.cancellation_reason,
    isUrgent: Boolean(order?.is_urgent),
    customerName,
    customerPhone: order?.user?.phone || "N/A",
    customerEmail: order?.user?.email || "N/A",
    businessName: order?.business?.display_name || "N/A",
    offerTitle: order?.offer?.title || "Untitled offer",
    offerImage: order?.offer?.main_image_url || "",
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

const OrdersPage = () => {
  document.title = "Pending Orders | Kamacaash";

  const dispatch = useDispatch();
  const ordersData = useSelector(selectOrdersData);
  const userAuth = useAuthUser();

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [completeModal, setCompleteModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pinCode, setPinCode] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
  });

  const businessId = userAuth?.businessId;

  const stats = useMemo(() => {
    const total = orders.length;
    const totalAmount = orders.reduce(
      (sum, order) => sum + (Number(order.totalAmount) || 0),
      0,
    );
    const paid = orders.filter((order) => order.status === "PAID").length;
    const readyForPickup = orders.filter(
      (order) => order.status === "READY_FOR_PICKUP",
    ).length;
    const urgent = orders.filter((order) => order.isUrgent).length;

    return {
      total,
      totalAmount,
      paid,
      readyForPickup,
      urgent,
    };
  }, [orders]);

  const applyFilters = useCallback((orderList, filterSettings) => {
    const searchValue = filterSettings.search.trim().toLowerCase();

    const filtered = orderList.filter((order) => {
      const matchesSearch = searchValue
        ? order.searchText.includes(searchValue)
        : true;
      const matchesStatus =
        filterSettings.status === "all"
          ? true
          : order.status === filterSettings.status;

      return matchesSearch && matchesStatus;
    });

    setFilteredOrders(filtered);
  }, []);

  const fetchData = useCallback(async () => {
    if (!businessId) return;

    setLoading(true);
    try {
      await dispatch(onGetPendingOrders(businessId));
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  }, [businessId, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const normalizedOrders = Array.isArray(ordersData)
      ? ordersData.map(normalizeOrder)
      : [];

    setOrders(normalizedOrders);
  }, [ordersData]);

  useEffect(() => {
    applyFilters(orders, filters);
  }, [applyFilters, filters, orders]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const openViewModal = (order) => {
    setSelectedOrder(order);
    setViewModal(true);
  };

  const openCompleteModal = (order) => {
    setSelectedOrder(order);
    setPinCode("");
    setCompleteModal(true);
  };

  const openCancelModal = (order) => {
    setSelectedOrder(order);
    setCancellationReason("");
    setCancelModal(true);
  };

  const handleComplete = async () => {
    if (!selectedOrder?.id || !pinCode.trim()) {
      toast.warning("Please enter the PIN code before completing the order.");
      return;
    }

    setActionLoading(true);
    try {
      await dispatch(
        onCompleteOrder({
          orderId: selectedOrder.id,
          orderNumber: selectedOrder.orderNumber,
          orderLabel: selectedOrder.orderNumber,
          pinCode: pinCode.trim(),
        }),
      );

      setCompleteModal(false);
      setPinCode("");
      fetchData();
    } catch (error) {
      console.error("Error completing order:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedOrder?.id || !cancellationReason.trim()) {
      toast.warning("Please provide a reason for cancelling this order.");
      return;
    }

    setActionLoading(true);
    try {
      await dispatch(
        onCancelOrder({
          orderId: selectedOrder.id,
          orderNumber: selectedOrder.orderNumber,
          orderLabel: selectedOrder.orderNumber,
          cancellationReason: cancellationReason.trim(),
        }),
      );

      setCancelModal(false);
      setCancellationReason("");
      fetchData();
    } catch (error) {
      console.error("Error cancelling order:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      name: "#",
      width: "70px",
      cell: (_, index) => index + 1,
    },
    {
      name: "Order",
      grow: 1.5,
      cell: (row) => (
        <div className="py-2">
          <div className="fw-semibold text-primary">{row.orderNumber}</div>
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
      name: "Pickup Time",
      grow: 1.4,
      cell: (row) => (
        <div className="py-2">
          <div className="fw-semibold">
            {formatTimeOnly(row.pickupStartTime, row.timezone)} -{" "}
            {formatTimeOnly(row.pickupEndTime, row.timezone)}
          </div>
          <small className="text-muted">
            Starts {formatRelativeTime(row.pickupStartTime)}
          </small>
        </div>
      ),
    },
    {
      name: "Amount",
      minWidth: "140px",
      cell: (row) => (
        <div className="py-2">
          <div className="fw-semibold">{formatCurrency(row.totalAmount)}</div>
          <small className="text-muted">
            {formatCurrency(row.unitPrice)} each
          </small>
        </div>
      ),
    },
    {
      name: "Status",
      minWidth: "170px",
      cell: (row) => {
        const status = toDisplayStatus(row.status);

        return (
          <div className="py-2">
            <Badge color={status.color} className="fs-6">
              <i className={`${status.icon} me-1`}></i>
              {status.text}
            </Badge>
            <div className="mt-1">
              <small className="text-muted">
                {toDisplayPaymentStatus(row.paymentStatus)}
              </small>
              {row.isUrgent ? (
                <Badge color="danger" pill className="ms-2">
                  Urgent
                </Badge>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      name: "Actions",
      minWidth: "180px",
      cell: (row) => (
        <div className="d-flex gap-1">
          <Button
            color="outline-info"
            size="sm"
            onClick={() => openViewModal(row)}
            title="View order"
            className="btn-icon"
          >
            <i className="ri-eye-line" />
          </Button>
          <Button
            color="outline-success"
            size="sm"
            onClick={() => openCompleteModal(row)}
            title="Complete order"
            className="btn-icon"
          >
            <i className="ri-check-double-line" />
          </Button>
          <Button
            color="outline-danger"
            size="sm"
            onClick={() => openCancelModal(row)}
            title="Cancel order"
            className="btn-icon"
          >
            <i className="ri-close-line" />
          </Button>
        </div>
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
        <BreadCrumb title="Pending Orders" pageTitle="Orders" />

        <Row className="mb-4">
          <Col xl={3} md={6}>
            <Card className="card-animate">
              <CardBody>
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <p className="text-uppercase fw-medium text-muted mb-0">
                      Total Pending
                    </p>
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
                    <p className="text-uppercase fw-medium text-muted mb-0">
                      Paid Orders
                    </p>
                    <h4 className="mb-0">{stats.paid}</h4>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="avatar-sm">
                      <span className="avatar-title bg-success-subtle text-success rounded-circle fs-2">
                        <i className="ri-secure-payment-line"></i>
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
                      Ready for Pickup
                    </p>
                    <h4 className="mb-0">{stats.readyForPickup}</h4>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="avatar-sm">
                      <span className="avatar-title bg-info-subtle text-info rounded-circle fs-2">
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
                    <p className="text-uppercase fw-medium text-muted mb-0">
                      Total Amount
                    </p>
                    <h4 className="mb-0">{formatCurrency(stats.totalAmount)}</h4>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="avatar-sm">
                      <span className="avatar-title bg-warning-subtle text-warning rounded-circle fs-2">
                        <i className="ri-money-dollar-circle-line"></i>
                      </span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Card className="mb-4">
          <CardBody>
            <Row className="g-3 align-items-end">
              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Search Orders</Label>
                  <Input
                    type="text"
                    name="search"
                    placeholder="Search by order number, customer, phone, email, or offer..."
                    value={filters.search}
                    onChange={handleFilterChange}
                  />
                </FormGroup>
              </Col>

              <Col md={4}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Order Status</Label>
                  <Select
                    options={[
                      { value: "all", label: "All statuses" },
                      { value: "PAID", label: "Paid" },
                      { value: "READY_FOR_PICKUP", label: "Ready for pickup" },
                    ]}
                    value={{
                      value: filters.status,
                      label:
                        filters.status === "all"
                          ? "All statuses"
                          : filters.status === "PAID"
                            ? "Paid"
                            : "Ready for pickup",
                    }}
                    onChange={(option) =>
                      setFilters((prev) => ({
                        ...prev,
                        status: option?.value || "all",
                      }))
                    }
                    className="react-select"
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>

              <Col md={1}>
                <div className="d-grid gap-2  mb-3">
                  <Button color="light" onClick={fetchData} disabled={loading}>
                    <i className="ri-refresh-line me-1"></i>
                    Refresh
                  </Button>

                </div>
              </Col>

              <Col md={1}>
                <div className="d-grid gap-2 mb-3">

                  <Button
                    color="light"
                    onClick={() => setFilters({ search: "", status: "all" })}
                  >
                    <i className="ri-eraser-line me-1"></i>
                    Clear
                  </Button>
                </div>
              </Col>

            </Row>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center bg-light">
            <h5 className="card-title mb-0 flex-grow-1">
              <i className="ri-shopping-cart-line align-middle me-2"></i>
              Today's Pending Orders
              <Badge color="primary" className="ms-2">
                {filteredOrders.length}
              </Badge>
            </h5>
            <div className="d-flex gap-2">
              <Badge color="primary" className="fs-6">
                Paid: {stats.paid}
              </Badge>
              <Badge color="info" className="fs-6">
                Ready: {stats.readyForPickup}
              </Badge>
              <Badge color="danger" className="fs-6">
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
                customStyles={customStyles}
                noDataComponent={
                  <NoDataFound
                    message={
                      filters.search || filters.status !== "all"
                        ? "Try adjusting your search criteria."
                        : "No pending orders found for today."
                    }
                  />
                }
                conditionalRowStyles={[
                  {
                    when: (row) => row.isUrgent,
                    style: {
                      backgroundColor: "rgba(220, 53, 69, 0.05)",
                      borderLeft: "4px solid #dc3545",
                    },
                  },
                ]}
              />
            )}
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
                  <p className="mb-2">
                    <strong>Total Amount:</strong>{" "}
                    {formatCurrency(selectedOrder.totalAmount)}
                  </p>
                  <p className="mb-0">
                    <strong>Placed At:</strong>{" "}
                    {formatDateTime(
                      selectedOrder.createdAt,
                      selectedOrder.timezone,
                    )}
                  </p>
                </div>
              </Col>

              <Col md={6}>
                <h6>Pickup Details</h6>
                <div className="border rounded p-3 h-100">
                  <p className="mb-2">
                    <strong>Pickup Window:</strong>{" "}
                    {formatDateTime(
                      selectedOrder.pickupStartTime,
                      selectedOrder.timezone,
                    )}{" "}
                    -{" "}
                    {formatTimeOnly(
                      selectedOrder.pickupEndTime,
                      selectedOrder.timezone,
                    )}
                  </p>
                  <p className="mb-2">
                    <strong>Timezone:</strong> {selectedOrder.timezone}
                  </p>
                  <p className="mb-0">
                    <strong>Business:</strong> {selectedOrder.businessName}
                  </p>
                </div>
              </Col>

              <Col md={6}>
                <h6>Status</h6>
                <div className="border rounded p-3 h-100">
                  <p className="mb-2">
                    <strong>Order Status:</strong>
                    <Badge
                      color={toDisplayStatus(selectedOrder.status).color}
                      className="ms-2"
                    >
                      <i
                        className={`${toDisplayStatus(selectedOrder.status).icon} me-1`}
                      ></i>
                      {toDisplayStatus(selectedOrder.status).text}
                    </Badge>
                  </p>
                  <p className="mb-2">
                    <strong>Payment Status:</strong>{" "}
                    {toDisplayPaymentStatus(selectedOrder.paymentStatus)}
                  </p>
                  <p className="mb-0">
                    <strong>Priority:</strong>{" "}
                    {selectedOrder.isUrgent ? "Urgent" : "Normal"}
                  </p>
                </div>
              </Col>
            </Row>
          ) : null}
        </ModalBody>
        <ModalFooter className="bg-light">
          <Button color="light" onClick={() => setViewModal(false)}>
            Close
          </Button>
          <Button
            color="success"
            onClick={() => {
              setViewModal(false);
              setTimeout(() => openCompleteModal(selectedOrder), 250);
            }}
          >
            <i className="ri-check-double-line me-1"></i>
            Complete Order
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={completeModal}
        toggle={() => setCompleteModal(false)}
        centered
      >
        <ModalHeader
          toggle={() => setCompleteModal(false)}
          className="bg-light"
        >
          <i className="ri-check-double-line me-2 text-success"></i>
          Complete Order
        </ModalHeader>
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            handleComplete();
          }}
        >
          <ModalBody>
            {selectedOrder ? (
              <div>
                <div className="text-center mb-4">
                  <div className="avatar-lg mx-auto mb-3">
                    <div className="avatar-title bg-success-subtle text-success rounded-circle">
                      <i className="ri-checkbox-circle-line display-4"></i>
                    </div>
                  </div>
                  <h5>{selectedOrder.orderNumber}</h5>
                  <p className="text-muted mb-0">
                    Confirm pickup for <strong>{selectedOrder.customerName}</strong>
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
                      onChange={(event) => setPinCode(event.target.value)}
                      placeholder="Enter customer PIN code"
                      required
                    />
                  </InputGroup>
                </FormGroup>

                <Alert color="info" className="mt-3 mb-0">
                  <i className="ri-information-line me-2"></i>
                  This will mark the order as collected.
                </Alert>
              </div>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button
              color="light"
              onClick={() => setCompleteModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              color="success"
              type="submit"
              disabled={actionLoading || !pinCode.trim()}
            >
              {actionLoading ? "Completing..." : "Complete Order"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <Modal isOpen={cancelModal} toggle={() => setCancelModal(false)} centered>
        <ModalHeader toggle={() => setCancelModal(false)} className="bg-light">
          <i className="ri-close-line me-2 text-danger"></i>
          Cancel Order
        </ModalHeader>
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            handleCancel();
          }}
        >
          <ModalBody>
            {selectedOrder ? (
              <div>
                <div className="text-center mb-4">
                  <div className="avatar-lg mx-auto mb-3">
                    <div className="avatar-title bg-danger-subtle text-danger rounded-circle">
                      <i className="ri-close-circle-line display-4"></i>
                    </div>
                  </div>
                  <h5>{selectedOrder.orderNumber}</h5>
                  <p className="text-muted mb-0">
                    Cancel order for <strong>{selectedOrder.customerName}</strong>
                  </p>
                </div>

                <FormGroup>
                  <Label className="form-label">
                    Cancellation Reason <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="textarea"
                    rows="4"
                    value={cancellationReason}
                    onChange={(event) =>
                      setCancellationReason(event.target.value)
                    }
                    placeholder="Please explain why this order is being cancelled..."
                    required
                  />
                </FormGroup>

                <Alert color="warning" className="mt-3 mb-0">
                  <i className="ri-alert-line me-2"></i>
                  Please make sure the reason is clear before continuing.
                </Alert>
              </div>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button
              color="light"
              onClick={() => setCancelModal(false)}
              disabled={actionLoading}
            >
              Keep Order
            </Button>
            <Button
              color="danger"
              type="submit"
              disabled={actionLoading || !cancellationReason.trim()}
            >
              {actionLoading ? "Cancelling..." : "Cancel Order"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default OrdersPage;
