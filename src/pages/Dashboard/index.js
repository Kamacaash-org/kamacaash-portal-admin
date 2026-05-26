import React, { useCallback, useEffect, useMemo, useState } from "react";
import CountUp from "react-countup";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row
} from "reactstrap";

import BreadCrumb from "../../Components/Common/BreadCrumb";
import Loader from "../../Components/Common/Loader";
import TableContainer from "../../Components/Common/TableContainer";
import useAuthUser from "../../Components/Hooks/useAuthUser";
import { setAuthorization } from "../../helpers/api_helper";
import { getDashboardOverview } from "../../helpers/backend_helper";

const defaultOverview = {
  overview: {
    total_users: 0,
    total_staff: 0,
    total_businesses: 0,
    total_offers: 0,
    total_orders: 0,
    active_businesses: 0,
    published_offers: 0,
  },
  finance: {
    confirmed_payments: 0,
    total_revenue_minor: 0,
    total_platform_fees_minor: 0,
    total_business_payout_minor: 0,
    today_revenue_minor: 0,
    month_revenue_minor: 0,
  },
  operations: {
    pending_business_verifications: 0,
    pending_staff_approvals: 0,
    pending_reviews: 0,
    cancelled_orders: 0,
    no_show_orders: 0,
  },
  recent_activity: {
    recent_orders: [],
    recent_payments: [],
    recent_businesses: [],
  },
};

const formatCurrencyFromMinor = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((Number(value || 0) || 0) / 100);

const CounterNumber = ({ value, decimals = 0, prefix = "", suffix = "" }) => (
  <CountUp
    end={Number(value || 0)}
    duration={1.2}
    separator=","
    decimals={decimals}
    prefix={prefix}
    suffix={suffix}
    preserveValue
  />
);

const CounterCurrencyFromMinor = ({ value }) => (
  <CountUp
    end={(Number(value || 0) || 0) / 100}
    duration={1.2}
    separator=","
    decimals={2}
    decimal="."
    prefix="$"
    preserveValue
  />
);

const formatStatus = (value) => {
  const labels = {
    PAID: "Paid",
    READY_FOR_PICKUP: "Ready for pickup",
    COLLECTED: "Collected",
    EXPIRED: "Expired",
    CANCELLED: "Cancelled",
    CANCELLED_BY_USER: "Cancelled by customer",
    CANCELLED_BY_ADMIN: "Cancelled by admin",
    NO_SHOW: "No show",
    CLOSED: "Closed",
    VERIFIED: "Verified",
    PENDING: "Pending",
    REJECTED: "Rejected",
  };

  return labels[value] || String(value || "-").replaceAll("_", " ");
};

const getStatusColor = (value) => {
  switch (value) {
    case "COLLECTED":
    case "VERIFIED":
      return "success";
    case "PAID":
    case "READY_FOR_PICKUP":
      return "info";
    case "CANCELLED":
    case "CANCELLED_BY_ADMIN":
    case "CANCELLED_BY_USER":
      return "danger";
    case "PENDING":
      return "warning";
    default:
      return "secondary";
  }
};

const Dashboard = () => {
  document.title = "Dashboard | Kamacaash";

  const authUser = useAuthUser();
  const authSession = JSON.parse(sessionStorage.getItem("authUser") || "{}");
  const staffName =
    authSession?.data?.user?.firstName ||
    authSession?.data?.user?.fullName ||
    "Admin";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(defaultOverview);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getDashboardOverview();
      if (!response?.success) {
        throw new Error(response?.message || "Failed to load dashboard");
      }

      setDashboard({
        ...defaultOverview,
        ...(response?.data || {}),
      });
    } catch (err) {
      setError(err?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authUser?.token) {
      setAuthorization(authUser.token);
    }
    fetchOverview();
  }, [authUser?.token, fetchOverview]);

  const overview = dashboard?.overview || defaultOverview.overview;
  const finance = dashboard?.finance || defaultOverview.finance;
  const operations = dashboard?.operations || defaultOverview.operations;
  const recentActivity =
    dashboard?.recent_activity || defaultOverview.recent_activity;

  // React Table Columns definitions for Recent Orders
  const orderColumns = useMemo(
    () => [
      {
        header: "Order Number",
        accessorKey: "order_number",
        cell: (cell) => <span className="fw-semibold text-primary">{cell.getValue() || "-"}</span>,
        enableColumnFilter: false,
      },
      {
        header: "Customer",
        accessorKey: "customer_name",
        cell: (cell) => cell.getValue() || "-",
        enableColumnFilter: false,
      },
      {
        header: "Business Display",
        accessorKey: "business_name",
        cell: (cell) => <span className="fw-semibold text-dark">{cell.getValue() || "-"}</span>,
        enableColumnFilter: false,
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: (cell) => (
          <Badge
            color={getStatusColor(cell.getValue())}
            className={`bg-${getStatusColor(cell.getValue())}-subtle text-${getStatusColor(cell.getValue())} border-0`}
          >
            {formatStatus(cell.getValue())}
          </Badge>
        ),
        enableColumnFilter: false,
      },
      {
        header: "Amount",
        accessorKey: "total_amount_minor",
        cell: (cell) => <span className="fw-bold">{formatCurrencyFromMinor(cell.getValue())}</span>,
        enableColumnFilter: false,
      },
      {
        header: "Created Date",
        accessorKey: "created_at",
        cell: (cell) =>
          cell.getValue()
            ? new Date(cell.getValue()).toLocaleString("en-US", {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "-",
        enableColumnFilter: false,
      },
    ],
    []
  );

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Dashboard" pageTitle="Overview" />

        {loading ? (
          <Loader />
        ) : error ? (
          <Card className="border-0 shadow-sm">
            <CardBody className="text-center py-5">
              <div className="avatar-lg mx-auto mb-3">
                <div className="avatar-title bg-danger-subtle text-danger rounded-circle fs-1">
                  <i className="ri-error-warning-line"></i>
                </div>
              </div>
              <h5 className="mb-2">Failed to Load Dashboard</h5>
              <p className="text-muted mb-3">{error}</p>
              <Button color="primary" onClick={fetchOverview}>
                <i className="ri-refresh-line me-2"></i>
                Try Again
              </Button>
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Row 1: Welcome and Snapshot Quick Stats */}
            <Row className="mb-4 g-3">
              <Col lg={8}>
                <Card className="border-0 shadow-sm bg-primary text-white overflow-hidden h-100">
                  <div className="position-absolute end-0 top-0 opacity-10">
                    <i className="ri-dashboard-2-line" style={{ fontSize: "150px" }}></i>
                  </div>
                  <CardBody className="p-4 d-flex flex-column justify-content-between">
                    <div>
                      <h1 className="display-6 fw-bold mb-2 text-white">
                        Welcome back, {staffName}
                      </h1>
                      <p className="text-white-75 mb-4 fs-5">
                        Here's the snapshot of the platform aggregates.
                      </p>
                    </div>
                    <div className="d-flex gap-3 flex-wrap mt-auto">
                      <div className="bg-white-10 rounded-3 px-3 py-2">
                        <small className="text-white-75 d-block text-uppercase fs-11">Total Orders</small>
                        <span className="text-white fw-bold fs-4">
                          <CounterNumber value={overview.total_orders} />
                        </span>
                      </div>
                      <div className="bg-white-10 rounded-3 px-3 py-2">
                        <small className="text-white-75 d-block text-uppercase fs-11">Today's Revenue</small>
                        <span className="text-white fw-bold fs-4">
                          <CounterCurrencyFromMinor value={finance.today_revenue_minor} />
                        </span>
                      </div>
                      <div className="bg-white-10 rounded-3 px-3 py-2">
                        <small className="text-white-75 d-block text-uppercase fs-11">Active Businesses</small>
                        <span className="text-white fw-bold fs-4">
                          <CounterNumber value={overview.active_businesses} />
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col lg={4}>
                <Card className="border-0 shadow-sm h-100">
                  <CardBody className="p-4 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="text-muted mb-0">System Snapshot</h6>
                        <Button
                          color="light"
                          size="sm"
                          onClick={fetchOverview}
                          disabled={loading}
                          className="rounded-pill"
                        >
                          <i className="ri-refresh-line me-1"></i>
                          Refresh
                        </Button>
                      </div>
                      <div className="avatar-sm mb-3">
                        <div className="avatar-title bg-light text-primary rounded-circle">
                          <i className="ri-time-line fs-4"></i>
                        </div>
                      </div>
                      <h5 className="mb-1">
                        {new Date().toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </h5>
                      <p className="text-muted small mb-0">
                        {new Date().toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="mt-4 border-top pt-3">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Business Payouts</span>
                        <span className="fw-semibold text-success">
                          <CounterCurrencyFromMinor
                            value={finance.total_business_payout_minor}
                          />
                        </span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Pending Reviews</span>
                        <span className="fw-semibold text-warning">
                          <CounterNumber value={operations.pending_reviews} />
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>

            {/* Row 2: Financial Panel & Growth Stats Panel */}
            <Row className="mb-4 g-3">
              {/* Financial Dashboard Summary Card */}
              <Col lg={4}>
                <Card className="border-0 shadow-sm h-100 bg-light-subtle">
                  <CardHeader className="bg-transparent border-0 pb-0">
                    <h5 className="card-title mb-0">Financial Summary</h5>
                  </CardHeader>
                  <CardBody className="d-flex flex-column justify-content-around">
                    <div className="mb-3 text-center">
                      <p className="text-muted text-uppercase fs-12 mb-1">
                        Total Platform Revenue
                      </p>
                      <h2 className="fw-bold text-dark">
                        <CounterCurrencyFromMinor value={finance.total_revenue_minor} />
                      </h2>
                    </div>

                    <div className="border-top pt-3">
                      <Row className="g-2 text-center">
                        <Col xs={6} className="border-end">
                          <small className="text-muted text-uppercase fs-10 d-block">
                            Platform Fees Collected
                          </small>
                          <span className="fw-semibold text-info fs-6">
                            <CounterCurrencyFromMinor value={finance.total_platform_fees_minor} />
                          </span>
                        </Col>
                        <Col xs={6}>
                          <small className="text-muted text-uppercase fs-10 d-block">
                            This Month Revenue
                          </small>
                          <span className="fw-semibold text-success fs-6">
                            <CounterCurrencyFromMinor value={finance.month_revenue_minor} />
                          </span>
                        </Col>
                      </Row>
                    </div>
                  </CardBody>
                </Card>
              </Col>

              {/* Growth Stats Card (6 items in a grid layout) */}
              <Col lg={8}>
                <Card className="border-0 shadow-sm h-100">
                  <CardHeader className="bg-transparent border-0 pb-0">
                    <h5 className="card-title mb-0">Platform Growth & Stats</h5>
                  </CardHeader>
                  <CardBody>
                    <Row className="g-3 text-center">
                      <Col xs={4} className="border-bottom border-end pb-3">
                        <div className="avatar-xs mx-auto mb-2">
                          <div className="avatar-title bg-primary-subtle text-primary rounded-circle fs-5">
                            <i className="ri-team-line"></i>
                          </div>
                        </div>
                        <small className="text-muted text-uppercase fs-11 d-block mb-1">Total Users</small>
                        <h4 className="mb-0 fw-bold"><CounterNumber value={overview.total_users} /></h4>
                      </Col>
                      <Col xs={4} className="border-bottom border-end pb-3">
                        <div className="avatar-xs mx-auto mb-2">
                          <div className="avatar-title bg-info-subtle text-info rounded-circle fs-5">
                            <i className="ri-user-star-line"></i>
                          </div>
                        </div>
                        <small className="text-muted text-uppercase fs-11 d-block mb-1">Staff Accounts</small>
                        <h4 className="mb-0 fw-bold"><CounterNumber value={overview.total_staff} /></h4>
                      </Col>
                      <Col xs={4} className="border-bottom pb-3">
                        <div className="avatar-xs mx-auto mb-2">
                          <div className="avatar-title bg-success-subtle text-success rounded-circle fs-5">
                            <i className="ri-store-2-line"></i>
                          </div>
                        </div>
                        <small className="text-muted text-uppercase fs-11 d-block mb-1">Businesses Registered</small>
                        <h4 className="mb-0 fw-bold"><CounterNumber value={overview.total_businesses} /></h4>
                      </Col>
                      <Col xs={4} className="border-end pt-2">
                        <div className="avatar-xs mx-auto mb-2">
                          <div className="avatar-title bg-warning-subtle text-warning rounded-circle fs-5">
                            <i className="ri-price-tag-3-line"></i>
                          </div>
                        </div>
                        <small className="text-muted text-uppercase fs-11 d-block mb-1">Total surplus packages</small>
                        <h4 className="mb-0 fw-bold"><CounterNumber value={overview.total_offers} /></h4>
                      </Col>
                      <Col xs={4} className="border-end pt-2">
                        <div className="avatar-xs mx-auto mb-2">
                          <div className="avatar-title bg-dark-subtle text-dark rounded-circle fs-5">
                            <i className="ri-megaphone-line"></i>
                          </div>
                        </div>
                        <small className="text-muted text-uppercase fs-11 d-block mb-1">Published Offers</small>
                        <h4 className="mb-0 fw-bold"><CounterNumber value={overview.published_offers} /></h4>
                      </Col>
                      <Col xs={4} className="pt-2">
                        <div className="avatar-xs mx-auto mb-2">
                          <div className="avatar-title bg-secondary-subtle text-secondary rounded-circle fs-5">
                            <i className="ri-shopping-bag-3-line"></i>
                          </div>
                        </div>
                        <small className="text-muted text-uppercase fs-11 d-block mb-1">Total Orders</small>
                        <h4 className="mb-0 fw-bold"><CounterNumber value={overview.total_orders} /></h4>
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
              </Col>
            </Row>

            {/* Row 3: Operations Actions Panel & Recent Orders Table Container */}
            <Row className="mb-4 g-3">
              {/* Operations Action Alert Panel */}
              <Col lg={4}>
                <Card className="border-0 shadow-sm h-100 bg-danger-subtle text-danger overflow-hidden">
                  <CardHeader className="bg-transparent border-0 pb-0">
                    <h5 className="card-title mb-0 text-danger">Operational Tasks</h5>
                  </CardHeader>
                  <CardBody className="p-4 d-flex flex-column justify-content-between">
                    <div>
                      <p className="text-danger-85 mb-4">
                        Items requiring immediate platform moderation:
                      </p>
                      
                      <div className="d-flex flex-column gap-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <span>Pending Business Verification</span>
                          <Badge color="warning" className="px-3 py-2 fs-6 bg-warning-subtle text-warning">
                            {operations.pending_business_verifications}
                          </Badge>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span>Pending Staff Approvals</span>
                          <Badge color="info" className="px-3 py-2 fs-6 bg-info-subtle text-info">
                            {operations.pending_staff_approvals}
                          </Badge>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span>Cancelled Orders</span>
                          <Badge color="danger" className="px-3 py-2 fs-6 bg-danger text-white">
                            {operations.cancelled_orders}
                          </Badge>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span>No-Show Order Expiries</span>
                          <Badge color="secondary" className="px-3 py-2 fs-6 bg-secondary-subtle text-secondary">
                            {operations.no_show_orders}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>

              {/* Redesigned Searchable/Paginated Recent Orders using TableContainer */}
              <Col lg={8}>
                <Card className="border-0 shadow-sm mb-0">
                  <CardHeader className="bg-transparent border-0 pb-0">
                    <h5 className="card-title mb-0">Recent Orders</h5>
                  </CardHeader>
                  <CardBody className="pt-0">
                    {(() => {
                      const filteredOrders = (recentActivity.recent_orders || [])
                        .filter(order => ["PAID", "READY_FOR_PICKUP", "COLLECTED", "NO_SHOW"].includes(order.status))
                        .slice(0, 10);
                      return filteredOrders.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                          No recent orders found.
                        </div>
                      ) : (
                        <TableContainer
                          columns={orderColumns}
                          data={filteredOrders}
                          isGlobalFilter={true}
                          customPageSize={10}
                          tableClass="align-middle table-nowrap mb-0"
                          theadClass="table-light"
                          divClass="table-responsive"
                          SearchPlaceholder="Search recent orders..."
                        />
                      );
                    })()}
                  </CardBody>
                </Card>
              </Col>
            </Row>

            {/* Row 4: Recent Businesses and Payments Side-by-Side Rollup */}
            <Row className="g-3 mb-5">
              <Col lg={6}>
                <Card className="border-0 shadow-sm h-100">
                  <CardHeader className="bg-transparent border-0 pb-0">
                    <h5 className="card-title mb-0">Recent Registered Businesses</h5>
                  </CardHeader>
                  <CardBody>
                    {(recentActivity.recent_businesses || []).length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        No recent businesses found.
                      </div>
                    ) : (
                      <div className="list-group list-group-flush">
                        {(recentActivity.recent_businesses || []).slice(0, 10).map((item) => (
                          <div
                            key={item.id}
                            className="list-group-item border-0 px-0 py-2 d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <h6 className="mb-0 fw-semibold text-dark">{item.display_name || "-"}</h6>
                              <small className="text-muted">
                                Registered: {item.created_at
                                  ? new Date(item.created_at).toLocaleDateString("en-US")
                                  : "-"}
                              </small>
                            </div>
                            <Badge
                              color={getStatusColor(item.verification_status)}
                              className={`bg-${getStatusColor(item.verification_status)}-subtle text-${getStatusColor(item.verification_status)} border-0`}
                            >
                              {formatStatus(item.verification_status)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>

              <Col lg={6}>
                <Card className="border-0 shadow-sm h-100">
                  <CardHeader className="bg-transparent border-0 pb-0">
                    <h5 className="card-title mb-0">Recent Confirmed Payments</h5>
                  </CardHeader>
                  <CardBody>
                    {(recentActivity.recent_payments || []).length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        No recent payments found.
                      </div>
                    ) : (
                      <div className="list-group list-group-flush">
                        {(recentActivity.recent_payments || []).slice(0, 10).map((item, index) => (
                          <div
                            key={item.id || index}
                            className="list-group-item border-0 px-0 py-2 d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <h6 className="mb-0 fw-semibold text-dark">
                                {item.payment_number || "Payment"}
                              </h6>
                              <small className="text-muted">
                                {item.business_name ? `${item.business_name} • ` : ""}
                                {formatCurrencyFromMinor(item.amount_minor)}
                              </small>
                            </div>
                            <Badge color="success" className="bg-success-subtle text-success border-0">
                              Confirmed
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>

      <style jsx>{`
        .text-white-75 {
          color: rgba(255, 255, 255, 0.75);
        }
        .text-danger-85 {
          color: rgba(220, 53, 69, 0.85);
        }
        .bg-white-10 {
          background-color: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
        }
        .fs-11 {
          font-size: 11px;
        }
        .fs-12 {
          font-size: 12px;
        }
        .fs-10 {
          font-size: 10px;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
