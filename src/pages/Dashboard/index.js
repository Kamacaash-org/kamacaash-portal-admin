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
  Row,
  Table,
} from "reactstrap";

import BreadCrumb from "../../Components/Common/BreadCrumb";
import Loader from "../../Components/Common/Loader";
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

  const summaryCards = useMemo(
    () => [
      {
        key: "users",
        title: "Total Users",
        value: overview.total_users || 0,
        icon: "ri-team-line",
        color: "primary",
      },
      {
        key: "staff",
        title: "Total Staff",
        value: overview.total_staff || 0,
        icon: "ri-user-star-line",
        color: "info",
      },
      {
        key: "businesses",
        title: "Businesses",
        value: overview.total_businesses || 0,
        icon: "ri-store-2-line",
        color: "success",
      },
      {
        key: "offers",
        title: "Offers",
        value: overview.total_offers || 0,
        icon: "ri-price-tag-3-line",
        color: "warning",
      },
      {
        key: "orders",
        title: "Orders",
        value: overview.total_orders || 0,
        icon: "ri-shopping-bag-3-line",
        color: "secondary",
      },
      {
        key: "published",
        title: "Published Offers",
        value: overview.published_offers || 0,
        icon: "ri-megaphone-line",
        color: "dark",
      },
    ],
    [overview],
  );

  const financeCards = useMemo(
    () => [
      {
        key: "today",
        title: "Today's Revenue",
        value: formatCurrencyFromMinor(finance.today_revenue_minor),
        icon: "ri-calendar-check-line",
        color: "primary",
      },
      {
        key: "month",
        title: "This Month",
        value: formatCurrencyFromMinor(finance.month_revenue_minor),
        icon: "ri-bar-chart-box-line",
        color: "success",
      },
      {
        key: "total",
        title: "Total Revenue",
        value: formatCurrencyFromMinor(finance.total_revenue_minor),
        icon: "ri-money-dollar-circle-line",
        color: "warning",
      },
      {
        key: "fees",
        title: "Platform Fees",
        value: formatCurrencyFromMinor(finance.total_platform_fees_minor),
        icon: "ri-bank-card-line",
        color: "info",
      },
    ],
    [finance],
  );

  const operationsCards = useMemo(
    () => [
      {
        key: "active",
        title: "Active Businesses",
        value: overview.active_businesses || 0,
        color: "success",
      },
      {
        key: "pendingStaff",
        title: "Pending Staff Approvals",
        value: operations.pending_staff_approvals || 0,
        color: "warning",
      },
      {
        key: "pendingBusiness",
        title: "Pending Business Verifications",
        value: operations.pending_business_verifications || 0,
        color: "info",
      },
      {
        key: "cancelled",
        title: "Cancelled Orders",
        value: operations.cancelled_orders || 0,
        color: "danger",
      },
      {
        key: "noShow",
        title: "No Show Orders",
        value: operations.no_show_orders || 0,
        color: "secondary",
      },
      {
        key: "confirmedPayments",
        title: "Confirmed Payments",
        value: finance.confirmed_payments || 0,
        color: "primary",
      },
    ],
    [finance.confirmed_payments, operations, overview.active_businesses],
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
            <Row className="mb-4 g-3">
              <Col lg={8}>
                <Card className="border-0 shadow-sm bg-primary h-100 text-white overflow-hidden">
                  <div className="position-absolute end-0 top-0 opacity-10">
                    <i className="ri-dashboard-2-line" style={{ fontSize: "120px" }}></i>
                  </div>
                  <CardBody className="p-4">
                    <h1 className="display-6 fw-bold mb-2 text-white">
                      Welcome back, {staffName}
                    </h1>
                    <p className="text-white-75 mb-4 fs-5">
                      Here's today's snapshot of your platform.
                    </p>
                    <div className="d-flex gap-3 flex-wrap">
                      <div className="bg-white-10 rounded-3 px-3 py-2">
                        <small className="text-white-75 d-block">Total Orders</small>
                        <span className="text-white fw-bold fs-4">
                          <CounterNumber value={overview.total_orders} />
                        </span>
                      </div>
                      <div className="bg-white-10 rounded-3 px-3 py-2">
                        <small className="text-white-75 d-block">Today's Revenue</small>
                        <span className="text-white fw-bold fs-4">
                          <CounterCurrencyFromMinor value={finance.today_revenue_minor} />
                        </span>
                      </div>
                      <div className="bg-white-10 rounded-3 px-3 py-2">
                        <small className="text-white-75 d-block">Active Businesses</small>
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
                        <h6 className="text-muted mb-0">Dashboard Refresh</h6>
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
                    <div className="mt-4">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Business Payouts</span>
                        <span className="fw-semibold">
                          <CounterCurrencyFromMinor
                            value={finance.total_business_payout_minor}
                          />
                        </span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Pending Reviews</span>
                        <span className="fw-semibold">
                          <CounterNumber value={operations.pending_reviews} />
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>

            <Row className="g-3 mb-4">
              {summaryCards.map((item) => (
                <Col xl={2} md={4} sm={6} key={item.key}>
                  <Card className="border-0 shadow-sm h-100">
                    <CardBody className="p-3">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className={`avatar-sm`}>
                          <div
                            className={`avatar-title bg-${item.color}-subtle text-${item.color} rounded-circle fs-4`}
                          >
                            <i className={item.icon}></i>
                          </div>
                        </div>
                      </div>
                      <p className="text-muted text-uppercase fs-12 mb-1">{item.title}</p>
                      <h4 className="mb-0 fw-bold">
                        <CounterNumber value={item.value} />
                      </h4>
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>

            <Row className="g-3 mb-4">
              {financeCards.map((item) => (
                <Col xl={3} md={6} key={item.key}>
                  <Card className="border-0 shadow-sm h-100">
                    <CardBody className="p-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <p className="text-muted text-uppercase fs-12 mb-1">
                            {item.title}
                          </p>
                          <h4 className="mb-0 fw-bold">
                            <CounterCurrencyFromMinor
                              value={
                                item.key === "today"
                                  ? finance.today_revenue_minor
                                  : item.key === "month"
                                    ? finance.month_revenue_minor
                                    : item.key === "total"
                                      ? finance.total_revenue_minor
                                      : finance.total_platform_fees_minor
                              }
                            />
                          </h4>
                        </div>
                        <div className={`avatar-sm`}>
                          <div
                            className={`avatar-title bg-${item.color}-subtle text-${item.color} rounded-circle fs-4`}
                          >
                            <i className={item.icon}></i>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>

            <Row className="g-3 mb-4">
              {operationsCards.map((item) => (
                <Col xl={2} md={4} sm={6} key={item.key}>
                  <Card className="border-0 shadow-sm h-100">
                    <CardBody className="p-3">
                      <p className="text-muted text-uppercase fs-12 mb-2">{item.title}</p>
                      <Badge
                        color={item.color}
                        className={`bg-${item.color}-subtle text-${item.color} border-0 px-3 py-2 rounded-pill`}
                      >
                        <CounterNumber value={item.value} />
                      </Badge>
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>

            <Row className="g-4">
              <Col xl={8}>
                <Card className="border-0 shadow-sm h-100">
                  <CardHeader className="bg-transparent border-0">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h5 className="card-title mb-1">Recent Orders</h5>
                        <p className="text-muted small mb-0">
                          Latest customer order activity
                        </p>
                      </div>
                      <Badge color="primary" className="rounded-pill px-3 py-2">
                        {recentActivity.recent_orders?.length || 0} Orders
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    {(recentActivity.recent_orders || []).length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        No recent orders found.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table className="align-middle mb-0">
                          <thead>
                            <tr>
                              <th>Order</th>
                              <th>Customer</th>
                              <th>Business</th>
                              <th>Status</th>
                              <th>Amount</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(recentActivity.recent_orders || []).map((item) => (
                              <tr key={item.id}>
                                <td className="fw-semibold">{item.order_number || "-"}</td>
                                <td>{item.customer_name || "-"}</td>
                                <td>{item.business_name || "-"}</td>
                                <td>
                                  <Badge
                                    color={getStatusColor(item.status)}
                                    className={`bg-${getStatusColor(item.status)}-subtle text-${getStatusColor(item.status)} border-0`}
                                  >
                                    {formatStatus(item.status)}
                                  </Badge>
                                </td>
                                <td>{formatCurrencyFromMinor(item.total_amount_minor)}</td>
                                <td>
                                  {item.created_at
                                    ? new Date(item.created_at).toLocaleString("en-US")
                                    : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>

              <Col xl={4}>
                <Card className="border-0 shadow-sm mb-4">
                  <CardHeader className="bg-transparent border-0">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h5 className="card-title mb-1">Recent Businesses</h5>
                        <p className="text-muted small mb-0">Latest registered businesses</p>
                      </div>
                      <Badge color="info" className="rounded-pill px-3 py-2">
                        {recentActivity.recent_businesses?.length || 0}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    {(recentActivity.recent_businesses || []).length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        No recent businesses found.
                      </div>
                    ) : (
                      <div className="list-group list-group-flush">
                        {(recentActivity.recent_businesses || []).map((item) => (
                          <div
                            key={item.id}
                            className="list-group-item border-0 px-0 py-3"
                          >
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-1">{item.display_name || "-"}</h6>
                                <small className="text-muted">
                                  {item.created_at
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
                          </div>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="bg-transparent border-0">
                    <h5 className="card-title mb-1">Recent Payments</h5>
                    <p className="text-muted small mb-0">Latest confirmed payments</p>
                  </CardHeader>
                  <CardBody className="pt-0">
                    {(recentActivity.recent_payments || []).length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        No recent payments found.
                      </div>
                    ) : (
                      <div className="list-group list-group-flush">
                        {(recentActivity.recent_payments || []).map((item, index) => (
                          <div
                            key={item.id || index}
                            className="list-group-item border-0 px-0 py-3"
                          >
                            <div className="fw-semibold">{item.reference || "-"}</div>
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
        .bg-white-10 {
          background-color: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
