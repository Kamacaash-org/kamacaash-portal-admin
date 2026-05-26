import React, { useState, useEffect, useCallback } from "react";
import DataTable from "react-data-table-component";
import {
  Card,
  CardHeader,
  CardBody,
  Col,
  Container,
  Row,
  Input,
  Label,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Button,
  Badge,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import Loader from "../../Components/Common/Loader";
import NoDataFound from "../../Components/Common/NoDataFound";
import { PaymentsAPI } from "../../helpers/backend_helper";

const PaymentDiagnostics = () => {
  document.title = "Payment Diagnostics | Kamacaash";

  const [paymentsList, setPaymentsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [diagnosticsData, setDiagnosticsData] = useState(null);

  // Set default date filters to last 7 days
  const [filters, setFilters] = useState(() => {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    return {
      from: lastWeek.toISOString().split("T")[0],
      to: today.toISOString().split("T")[0],
    };
  });

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = {};
      if (filters.from) {
        queryParams.from = new Date(filters.from + "T00:00:00.000Z").toISOString();
      }
      if (filters.to) {
        const toDate = new Date(filters.to + "T23:59:59.999Z");
        queryParams.to = toDate.toISOString();
      }
      const response = await PaymentsAPI.list(queryParams);
      if (response && response.success) {
        setPaymentsList(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      from: "",
      to: "",
    });
  };

  const handleViewDiagnostics = async (paymentId) => {
    setModal(true);
    setModalLoading(true);
    setDiagnosticsData(null);
    try {
      const response = await PaymentsAPI.getDiagnostics(paymentId);
      if (response && response.success) {
        setDiagnosticsData(response.data);
      }
    } catch (error) {
      console.error("Error loading payment diagnostics:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "CONFIRMED":
      case "SUCCESS":
        return "success";
      case "PROCESSING":
      case "INITIATED":
        return "warning";
      case "FAILED":
      case "REJECTED":
        return "danger";
      default:
        return "secondary";
    }
  };

  const getLogTypeBadgeColor = (type) => {
    switch (type) {
      case "REQUEST":
        return "info";
      case "RESPONSE":
        return "success";
      case "ERROR":
        return "danger";
      default:
        return "secondary";
    }
  };

  const getEventTypeBadgeColor = (type) => {
    switch (type) {
      case "INITIATED":
        return "info";
      case "RETRIED":
        return "warning";
      case "PUSH_SENT":
        return "primary";
      case "CONFIRMED":
        return "success";
      case "FAILED":
      case "REJECTED":
        return "danger";
      default:
        return "secondary";
    }
  };

  const columns = [
    {
      name: "#",
      cell: (row, index) => index + 1,
      width: "60px",
    },
    {
      name: "Order Number",
      selector: (row) => row.order?.order_number || "-",
      sortable: true,
    },
    {
      name: "Reference ID",
      selector: (row) => row.reference_id || "-",
      sortable: true,
    },
    {
      name: "Amount",
      cell: (row) => `${row.currency_code || "USD"} ${(row.amount_minor / 100).toFixed(2)}`,
      sortable: true,
    },
    {
      name: "Status",
      cell: (row) => (
        <Badge color={getStatusBadgeColor(row.status)}>
          {row.status}
        </Badge>
      ),
      sortable: true,
    },
    {
      name: "Created At",
      cell: (row) => new Date(row.created_at).toLocaleString(),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <Button
          color="soft-primary"
          size="sm"
          onClick={() => handleViewDiagnostics(row.id)}
        >
          <i className="ri-eye-line me-1" /> View Trace
        </Button>
      ),
    },
  ];

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Diagnostics" pageTitle="Payments" />

        <Card className="mb-3">
          <CardBody>
            <Row className="align-items-end">
              <Col md={4}>
                <FormGroup className="mb-0">
                  <Label for="from">From Date</Label>
                  <Input
                    type="date"
                    name="from"
                    id="from"
                    value={filters.from}
                    onChange={handleFilterChange}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup className="mb-0">
                  <Label for="to">To Date</Label>
                  <Input
                    type="date"
                    name="to"
                    id="to"
                    value={filters.to}
                    onChange={handleFilterChange}
                  />
                </FormGroup>
              </Col>
              <Col md={4} className="d-flex gap-2">
                <Button
                  color="primary"
                  className="w-50"
                  onClick={fetchPayments}
                  disabled={loading}
                >
                  <i className="ri-filter-line me-1" /> Filter
                </Button>
                <Button
                  color="soft-secondary"
                  className="w-50"
                  onClick={handleClearFilters}
                  disabled={loading}
                >
                  Clear
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Payment Attempts & Transactions</h5>
            <Button
              color="soft-primary"
              size="sm"
              onClick={fetchPayments}
              disabled={loading}
            >
              <i className="ri-refresh-line me-1" /> Refresh
            </Button>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Loader />
            ) : (
              <DataTable
                columns={columns}
                data={paymentsList}
                pagination
                highlightOnHover
                responsive
                noDataComponent={<NoDataFound message="No payment records found for the selected date range." />}
              />
            )}
          </CardBody>
        </Card>
      </Container>

      <Modal isOpen={modal} toggle={() => setModal(false)} size="xl" scrollable>
        <ModalHeader toggle={() => setModal(false)}>
          Payment Diagnostics Audit Trace
        </ModalHeader>
        <ModalBody style={{ backgroundColor: "#f8f9fa", minHeight: "500px" }}>
          {modalLoading ? (
            <div className="d-flex align-items-center justify-content-center" style={{ height: "400px" }}>
              <Loader />
            </div>
          ) : diagnosticsData ? (
            <div className="px-2">
              {/* Summary Block */}
              <Card className="mb-4 shadow-sm border-0">
                <CardBody className="bg-white rounded border border-light">
                  <Row>
                    <Col md={3}>
                      <span className="text-muted d-block fs-11 text-uppercase">Payment ID</span>
                      <strong className="text-dark fs-13">{diagnosticsData.payment?.id}</strong>
                    </Col>
                    <Col md={2}>
                      <span className="text-muted d-block fs-11 text-uppercase">Reference ID</span>
                      <strong className="text-dark fs-13">{diagnosticsData.payment?.reference_id}</strong>
                    </Col>
                    <Col md={2}>
                      <span className="text-muted d-block fs-11 text-uppercase">Amount</span>
                      <strong className="text-primary fs-14">
                        {diagnosticsData.payment?.currency_code || "USD"}{" "}
                        {(diagnosticsData.payment?.amount_minor / 100).toFixed(2)}
                      </strong>
                    </Col>
                    <Col md={2}>
                      <span className="text-muted d-block fs-11 text-uppercase">Current Status</span>
                      <Badge color={getStatusBadgeColor(diagnosticsData.payment?.status)} className="mt-1 fs-12 px-2 py-1">
                        {diagnosticsData.payment?.status}
                      </Badge>
                    </Col>
                    <Col md={3}>
                      <span className="text-muted d-block fs-11 text-uppercase">Created At</span>
                      <span className="text-dark fs-13">
                        {new Date(diagnosticsData.payment?.created_at).toLocaleString()}
                      </span>
                    </Col>
                  </Row>
                </CardBody>
              </Card>

              {/* Side by side Chronological Views */}
              <Row>
                {/* WAAFI API Logs */}
                <Col md={6}>
                  <Card className="shadow-sm border-0 mb-4" style={{ height: "calc(100vh - 350px)", minHeight: "500px" }}>
                    <CardHeader className="bg-soft-info border-bottom-0">
                      <div className="d-flex align-items-center gap-2">
                        <i className="ri-terminal-window-line text-info fs-18" />
                        <h6 className="mb-0 text-info">WAAFI API Payloads & Logs</h6>
                      </div>
                    </CardHeader>
                    <CardBody className="overflow-auto bg-white p-3">
                      {diagnosticsData.logs && diagnosticsData.logs.length > 0 ? (
                        diagnosticsData.logs.map((log) => (
                          <div
                            key={log.id}
                            className={`mb-4 p-3 rounded border border-light`}
                            style={{
                              backgroundColor: log.type === "ERROR" ? "#fff5f5" : "#fdfdfd",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.01)"
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <div className="d-flex align-items-center gap-2">
                                <Badge color={getLogTypeBadgeColor(log.type)}>
                                  {log.type}
                                </Badge>
                                {log.status_code && (
                                  <Badge color={log.status_code >= 400 ? "danger" : "light"} className="text-dark">
                                    HTTP {log.status_code}
                                  </Badge>
                                )}
                              </div>
                              <small className="text-muted fs-11">
                                {new Date(log.created_at).toLocaleTimeString()}
                              </small>
                            </div>

                            <div className="mb-2">
                              <small className="text-muted d-block">Endpoint</small>
                              <code className="text-break fs-11 text-secondary">{log.endpoint || "-"}</code>
                            </div>

                            {log.error_message && (
                              <div className="mb-2">
                                <small className="text-danger d-block fw-semibold">Error Message</small>
                                <span className="text-danger fs-11">{log.error_message}</span>
                              </div>
                            )}

                            {log.request_payload && (
                              <div className="mb-2">
                                <small className="text-muted d-block">Request Payload</small>
                                <pre
                                  className="p-2 rounded bg-light text-dark fs-10 mb-0 border"
                                  style={{ maxHeight: "120px", overflow: "auto" }}
                                >
                                  {JSON.stringify(log.request_payload, null, 2)}
                                </pre>
                              </div>
                            )}

                            {log.response_payload && (
                              <div>
                                <small className="text-muted d-block">Response Payload</small>
                                <pre
                                  className="p-2 rounded bg-light text-dark fs-10 mb-0 border"
                                  style={{ maxHeight: "120px", overflow: "auto" }}
                                >
                                  {JSON.stringify(log.response_payload, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-5">
                          <p className="text-muted">No API request logs exist for this payment intent.</p>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </Col>

                {/* State Events */}
                <Col md={6}>
                  <Card className="shadow-sm border-0 mb-4" style={{ height: "calc(100vh - 350px)", minHeight: "500px" }}>
                    <CardHeader className="bg-soft-primary border-bottom-0">
                      <div className="d-flex align-items-center gap-2">
                        <i className="ri-history-line text-primary fs-18" />
                        <h6 className="mb-0 text-primary">State Machine Events</h6>
                      </div>
                    </CardHeader>
                    <CardBody className="overflow-auto bg-white p-3">
                      {diagnosticsData.events && diagnosticsData.events.length > 0 ? (
                        <div className="timeline-trail ps-2 border-start border-2 border-light ms-2 py-1">
                          {diagnosticsData.events.map((evt) => (
                            <div key={evt.id} className="position-relative mb-4 ps-4">
                              {/* Chronological Bullet Node */}
                              <div
                                className={`position-absolute rounded-circle border border-white`}
                                style={{
                                  left: "-9px",
                                  top: "4px",
                                  width: "16px",
                                  height: "16px",
                                  backgroundColor:
                                    evt.status === "CONFIRMED"
                                      ? "#34c38f"
                                      : evt.status === "FAILED" || evt.status === "REJECTED"
                                      ? "#f46a6a"
                                      : "#f1b44c",
                                }}
                              />
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <div className="d-flex align-items-center gap-2">
                                  <span className="fw-semibold text-dark fs-13">{evt.type}</span>
                                  <Badge color={getStatusBadgeColor(evt.status)} className="fs-10">
                                    {evt.status}
                                  </Badge>
                                </div>
                                <small className="text-muted fs-11">
                                  {new Date(evt.created_at).toLocaleTimeString()}
                                </small>
                              </div>

                              <p className="text-muted fs-12 mb-2">{evt.note || "State updated."}</p>

                              {evt.payload && Object.keys(evt.payload).length > 0 && (
                                <pre
                                  className="p-2 rounded bg-light text-muted fs-10 mb-0 border"
                                  style={{ maxHeight: "100px", overflow: "auto" }}
                                >
                                  {JSON.stringify(evt.payload, null, 2)}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-5">
                          <p className="text-muted">No state transition events recorded for this payment intent.</p>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">Could not retrieve audit trace data.</p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={() => setModal(false)}>
            Close Trace
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default PaymentDiagnostics;
