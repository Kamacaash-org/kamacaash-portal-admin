import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
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
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Alert,
} from "reactstrap";
import DataTable from "react-data-table-component";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import Loader from "../../../Components/Common/Loader";
import useAuthUser from "../../../Components/Hooks/useAuthUser";
import { setAuthorization } from "../../../helpers/api_helper";
import {
  approveReviewRequest,
  getReviewRequestsByStatus,
  rejectReviewRequest,
} from "../../../helpers/backend_helper";

const ReviewRequests = () => {
  document.title = "Review Requests | Kamacash";

  const authUser = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [actionModal, setActionModal] = useState(false);
  const [actionType, setActionType] = useState("approve");
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState("1");

  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    status: "PENDING",
  });

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    pendingPercentage: 0,
  });

  // Fetch data
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      if (authUser?.token) {
        setAuthorization(authUser.token);
      }

      const response = await getReviewRequestsByStatus(filters.status);
      const list = response?.data || [];

      if (response?.success) {
        setRequests(Array.isArray(list) ? list : []);
        // Apply search filter if exists
        applyFilters(list, filters);
      } else {
        toast.error(response?.message || "Failed to load review requests");
      }
    } catch (error) {
      console.error("Error loading review requests:", error);
      toast.error(error?.message || "Failed to load review requests");
    } finally {
      setLoading(false);
    }
  }, [authUser?.token, filters.status]);

  // Initial load
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Update stats and apply filters when requests change
  useEffect(() => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === "PENDING").length;
    const approved = requests.filter(r => r.status === "APPROVED").length;
    const rejected = requests.filter(r => r.status === "REJECTED").length;
    const pendingPercentage = total > 0 ? Math.round((pending / total) * 100) : 0;

    setStats({
      total,
      pending,
      approved,
      rejected,
      pendingPercentage,
    });

    applyFilters(requests, filters);
  }, [requests, filters]);

  // Apply filters
  const applyFilters = (requestList, filterSettings) => {
    let filtered = [...requestList];

    // Search filter
    if (filterSettings.search) {
      const searchTerm = filterSettings.search.toLowerCase();
      filtered = filtered.filter(request =>
        request.business?.businessName?.toLowerCase().includes(searchTerm) ||
        request.requestedByStaff?.fullName?.toLowerCase().includes(searchTerm) ||
        request.reviewIds?.[0]?.reviewerName?.toLowerCase().includes(searchTerm) ||
        request.reviewIds?.[0]?.comment?.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter already applied in API call
    setFilteredRequests(filtered);
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
  };

  // Handle actions
  const handleAction = async () => {
    if (!selectedRequest) return;

    if (actionType === "reject" && !rejectionReason.trim()) {
      toast.warning("Please provide a rejection reason");
      return;
    }

    try {
      if (actionType === "approve") {
        await approveReviewRequest(selectedRequest._id);
        toast.success("Review request approved successfully");
      } else {
        await rejectReviewRequest(selectedRequest._id, {
          rejectionReason: rejectionReason.trim(),
        });
        toast.success("Review request rejected successfully");
      }

      setActionModal(false);
      setRejectionReason("");
      fetchRequests();
    } catch (error) {
      console.error(`Error ${actionType}ing review request:`, error);
      toast.error(error?.message || `Failed to ${actionType} review request`);
    }
  };

  // Open view modal
  const handleView = (request) => {
    setSelectedRequest(request);
    setViewModal(true);
    setActiveTab("1");
  };

  // Open action modal
  const handleActionClick = (type, request) => {
    setSelectedRequest(request);
    setActionType(type);
    setActionModal(true);
    if (type === "reject") setRejectionReason("");
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return {
          color: "success",
          icon: "ri-checkbox-circle-line",
          text: "Approved",
        };
      case "REJECTED":
        return {
          color: "danger",
          icon: "ri-close-circle-line",
          text: "Rejected",
        };
      default:
        return {
          color: "warning",
          icon: "ri-time-line",
          text: "Pending Review",
        };
    }
  };

  // Get rating badge
  const getRatingBadge = (rating) => {
    if (rating >= 4) return { color: "success", text: `${rating} ⭐` };
    if (rating >= 3) return { color: "warning", text: `${rating} ⭐` };
    return { color: "danger", text: `${rating} ⭐` };
  };

  // Table columns
  const columns = useMemo(() => [
    {
      name: "#",
      cell: (row, index) => index + 1,
      width: "60px",
    },
    {
      name: "Business",
      cell: (row) => (
        <div className="d-flex align-items-center">
          <div className="avatar-xs me-3">
            {row.business?.logo ? (
              <img
                src={row.business.logo}
                alt={row.business?.businessName || "Business"}
                className="avatar-title bg-light rounded-circle"
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            ) : (
              <div className="avatar-title bg-light text-secondary rounded-circle">
                <i className="ri-store-line" />
              </div>
            )}
          </div>
          <div>
            <h6 className="mb-0">{row.business?.businessName || "—"}</h6>
            <small className="text-muted">{row.business?.ownerName || "—"}</small>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      name: "Review Details",
      cell: (row) => {
        const review = row.reviewIds?.[0];
        return (
          <div>
            <div className="fw-medium">{review?.reviewerName || "—"}</div>
            {review?.rating && (
              <Badge color={getRatingBadge(review.rating).color} className="mt-1">
                {getRatingBadge(review.rating).text}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      name: "Comment",
      cell: (row) => {
        const comment = row.reviewIds?.[0]?.comment;
        return (
          <div className="text-truncate" style={{ maxWidth: "200px" }} title={comment}>
            {comment || "—"}
          </div>
        );
      },
    },
    {
      name: "Requested By",
      cell: (row) => (
        <div>
          <div>{row.requestedByStaff?.fullName || "—"}</div>
          {row.requestedByStaff?.phone && (
            <small className="text-muted">{row.requestedByStaff.phone}</small>
          )}
        </div>
      ),
    },
    {
      name: "Engagement",
      cell: (row) => {
        const review = row.reviewIds?.[0];
        return (
          <div className="d-flex gap-2">
            <Badge color="success" className="rounded-pill">
              <i className="ri-thumb-up-line me-1"></i>
              {review?.no_of_likes || 0}
            </Badge>
            <Badge color="danger" className="rounded-pill">
              <i className="ri-thumb-down-line me-1"></i>
              {review?.no_of_dis_likes || 0}
            </Badge>
          </div>
        );
      },
      width: "140px",
    },
    {
      name: "Status",
      cell: (row) => {
        const status = getStatusBadge(row.status);
        return (
          <Badge color={status.color} className="d-inline-flex align-items-center">
            <i className={`${status.icon} me-1`}></i>
            {status.text}
          </Badge>
        );
      },
      width: "140px",
    },
    {
      name: "Date",
      cell: (row) => new Date(row.createdAt || row.updatedAt).toLocaleDateString(),
      width: "120px",
    },
    {
      name: "Actions",
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

            {row.status === "PENDING" && (
              <>
                <Button
                  color="outline-success"
                  size="sm"
                  onClick={() => handleActionClick("approve", row)}
                  title="Approve Review"
                  className="btn-icon"
                >
                  <i className="ri-check-line" />
                </Button>
                <Button
                  color="outline-danger"
                  size="sm"
                  onClick={() => handleActionClick("reject", row)}
                  title="Reject Review"
                  className="btn-icon"
                >
                  <i className="ri-close-line" />
                </Button>
              </>
            )}

            {row.status === "REJECTED" && (
              <Button
                color="outline-success"
                size="sm"
                onClick={() => handleActionClick("approve", row)}
                title="Approve Review"
                className="btn-icon"
              >
                <i className="ri-check-line" />
              </Button>
            )}
          </div>
        );
      },
      width: "180px",
    },
  ], []);

  // Custom styles for DataTable
  const customStyles = {
    headCells: {
      style: {
        fontWeight: "600",
        fontSize: "0.875rem",
        backgroundColor: "#f8f9fa",
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
        <BreadCrumb title="Review Requests" pageTitle="Business Management" />

        {/* Stats Cards */}
        <Row className="mb-4">
          <Col xl={3} md={6}>
            <Card className="card-animate">
              <CardBody>
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <p className="text-uppercase fw-medium text-muted mb-0">Total Requests</p>
                    <h4 className="mb-0">{stats.total}</h4>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="avatar-sm">
                      <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-2">
                        <i className="ri-chat-review-line"></i>
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
                  {stats.pending} review requests waiting for your approval
                </p>
              </Col>
              <Col md={6} className="text-end">
                <Button
                  color="light"
                  onClick={fetchRequests}
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
                  <Label className="form-label">Search Review Requests</Label>
                  <Input
                    type="text"
                    name="search"
                    placeholder="Search by business, reviewer, or comment..."
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
                      { value: "all", label: "All" },
                      { value: "PENDING", label: "Pending Review" },
                      { value: "APPROVED", label: "Approved" },
                      { value: "REJECTED", label: "Rejected" },
                    ]}
                    value={{
                      value: filters.status,
                      label:
                        filters.status === "all"
                          ? "All"
                          : filters.status === "PENDING"
                            ? "Pending Review"
                            : filters.status === "APPROVED"
                              ? "Approved"
                              : "Rejected",
                    }}
                    onChange={(opt) =>
                      setFilters((prev) => ({ ...prev, status: opt.value }))
                    }
                    className="react-select"
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
              <Col md={2}>
                <div className="d-grid mb-3">
                  <Button
                    color="primary"
                    onClick={() => setFilters({ search: "", status: "PENDING" })}
                  >
                    <i className="ri-filter-line me-1"></i>
                    Show Pending
                  </Button>
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* Review Requests Table */}
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center bg-light">
            <h5 className="card-title mb-0 flex-grow-1">
              <i className="ri-chat-review-line align-middle me-2"></i>
              Review Requests Queue
              <Badge color="primary" className="ms-2">
                {filteredRequests.length}
              </Badge>
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
                data={filteredRequests}
                pagination
                // responsive
                // highlightOnHover
                noDataComponent={
                  <div className="text-center py-5">
                    <i className="ri-inbox-line display-4 text-muted"></i>
                    <h5 className="mt-3">No review requests found</h5>
                    <p className="text-muted">
                      {filters.status === "PENDING"
                        ? "No pending review requests for review. Great job!"
                        : "Try adjusting your search criteria."}
                    </p>
                  </div>
                }
                customStyles={customStyles}
              // conditionalRowStyles={[
              //   {
              //     when: (row) => row.status === "PENDING",
              //     style: {
              //       backgroundColor: "rgba(255, 193, 7, 0.1)",
              //       borderLeft: "4px solid #ffc107",
              //     },
              //   },
              //   {
              //     when: (row) => row.status === "REJECTED",
              //     style: {
              //       backgroundColor: "rgba(220, 53, 69, 0.05)",
              //       borderLeft: "4px solid #dc3545",
              //     },
              //   },
              // ]}
              />
            )}
          </CardBody>
        </Card>
      </Container>

      {/* View Review Request Modal */}
      {/* View Review Request Modal */}
      <Modal
        isOpen={viewModal}
        toggle={() => setViewModal(false)}
        size="lg"
        centered
        scrollable
      >
        <ModalHeader toggle={() => setViewModal(false)} className="bg-light">
          <i className="ri-chat-review-line me-2"></i>
          Review Request Details
        </ModalHeader>
        <ModalBody style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {selectedRequest && (
            <>
              {/* Header Summary */}
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h5 className="mb-1">Review Request</h5>
                  <div className="d-flex align-items-center gap-2">
                    <Badge color={getStatusBadge(selectedRequest.status).color}>
                      <i className={`${getStatusBadge(selectedRequest.status).icon} me-1`} />
                      {getStatusBadge(selectedRequest.status).text}
                    </Badge>

                    {selectedRequest.reviewIds?.[0]?.rating != null && (
                      <Badge color={getRatingBadge(selectedRequest.reviewIds[0].rating).color}>
                        {getRatingBadge(selectedRequest.reviewIds[0].rating).text}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Small business logo on right */}
                {selectedRequest.business?.logo ? (
                  <img
                    src={selectedRequest.business.logo}
                    alt={selectedRequest.business.businessName}
                    style={{ width: 46, height: 46, borderRadius: 10, objectFit: "cover" }}
                  />
                ) : null}
              </div>

              {/* Business + Requester */}
              <Row className="g-3 mb-3">
                <Col md={6}>
                  <div className="border rounded p-3 h-100">
                    <small className="text-muted d-block mb-1">Business</small>
                    <div className="fw-semibold">
                      {selectedRequest.business?.businessName || "—"}
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="border rounded p-3 h-100">
                    <small className="text-muted d-block mb-1">Requested by</small>
                    <div className="fw-semibold">
                      {selectedRequest.requestedByStaff?.fullName || "—"}
                    </div>
                    <small className="text-muted">
                      {(selectedRequest.requestedByStaff?.countryCode || "") +
                        (selectedRequest.requestedByStaff?.phone || "") || ""}
                    </small>
                  </div>
                </Col>
              </Row>

              {/* Review */}
              <div className="border rounded p-3 mb-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div>
                    <small className="text-muted d-block">Reviewer</small>
                    <div className="fw-semibold">
                      {selectedRequest.reviewIds?.[0]?.reviewerName || "—"}
                    </div>
                  </div>

                  <div className="text-end">
                    <small className="text-muted d-block">Rating</small>
                    <div className="fw-semibold">
                      {selectedRequest.reviewIds?.[0]?.rating ?? "—"} / 5
                    </div>
                  </div>
                </div>

                <small className="text-muted d-block mb-1">Comment</small>
                <div className="bg-light rounded p-2">
                  {selectedRequest.reviewIds?.[0]?.comment || "No comment provided"}
                </div>

                <div className="d-flex align-items-center gap-3 mt-3">
                  <div className="d-flex align-items-center gap-2">
                    <i className="ri-thumb-up-line text-success" />
                    <span className="fw-semibold">
                      {selectedRequest.reviewIds?.[0]?.no_of_likes ?? 0}
                    </span>
                    <small className="text-muted">Likes</small>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <i className="ri-thumb-down-line text-danger" />
                    <span className="fw-semibold">
                      {selectedRequest.reviewIds?.[0]?.no_of_dis_likes ?? 0}
                    </span>
                    <small className="text-muted">Dislikes</small>
                  </div>

                  <div className="ms-auto">
                    <Badge color={selectedRequest.reviewIds?.[0]?.isVisible ? "success" : "secondary"}>
                      {selectedRequest.reviewIds?.[0]?.isVisible ? "Visible" : "Hidden"}
                    </Badge>
                    <Badge
                      className="ms-2"
                      color={selectedRequest.reviewIds?.[0]?.isFeatured ? "primary" : "secondary"}
                    >
                      {selectedRequest.reviewIds?.[0]?.isFeatured ? "Featured" : "Not Featured"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Key Dates only */}
              <Row className="g-3">
                <Col md={6}>
                  <div className="border rounded p-3">
                    <small className="text-muted d-block mb-1">Request date</small>
                    <div className="fw-semibold">
                      {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString() : "—"}
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="border rounded p-3">
                    <small className="text-muted d-block mb-1">Review date</small>
                    <div className="fw-semibold">
                      {selectedRequest.reviewIds?.[0]?.createdAt
                        ? new Date(selectedRequest.reviewIds[0].createdAt).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Rejection reason only when rejected */}
              {selectedRequest.status === "REJECTED" && selectedRequest.rejectionReason && (
                <Alert color="danger" className="mt-3 mb-0">
                  <div className="fw-semibold mb-1">
                    <i className="ri-alert-line me-2" />
                    Rejection reason
                  </div>
                  <div>{selectedRequest.rejectionReason}</div>
                </Alert>
              )}
            </>
          )}
        </ModalBody>

        <ModalFooter className="bg-light">
          {selectedRequest?.status === "PENDING" ? (
            <>
              <Button
                color="success"
                onClick={() => {
                  setViewModal(false);
                  setTimeout(() => handleActionClick("approve", selectedRequest), 300);
                }}
              >
                <i className="ri-check-line me-1"></i>
                Approve
              </Button>

              <Button
                color="danger"
                onClick={() => {
                  setViewModal(false);
                  setTimeout(() => handleActionClick("reject", selectedRequest), 300);
                }}
              >
                <i className="ri-close-line me-1"></i>
                Reject
              </Button>

              <Button color="light" onClick={() => setViewModal(false)} className="ms-auto">
                Close
              </Button>
            </>
          ) : (
            <Button color="light" onClick={() => setViewModal(false)} className="ms-auto">
              Close
            </Button>
          )}
        </ModalFooter>

      </Modal>

      {/* Action Confirmation Modal */}
      <Modal isOpen={actionModal} toggle={() => setActionModal(false)} centered>
        <ModalHeader toggle={() => setActionModal(false)} className="bg-light">
          <i
            className={`me-2 ${actionType === "approve" ? "ri-check-line text-success" : "ri-close-line text-danger"}`}
          ></i>
          {actionType === "approve" ? "Confirm Approval" : "Confirm Rejection"}
        </ModalHeader>
        {actionType === "approve" ? (
          <ModalBody>
            <div className="text-center">
              <div className="avatar-lg mx-auto mb-3">
                <div className="avatar-title bg-success-subtle text-success rounded-circle">
                  <i className="ri-checkbox-circle-line display-4"></i>
                </div>
              </div>
              <h5>Approve Review Request</h5>
              <p className="text-muted">
                Are you sure you want to approve this review request?
              </p>
              <p className="text-muted mb-0">
                This will change the request status to{" "}
                <Badge color="success">APPROVED</Badge> and the review will be published.
              </p>
            </div>
          </ModalBody>
        ) : (
          <Form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              handleAction();
            }}
          >
            <ModalBody>
              <div className="text-center mb-3">
                <div className="avatar-lg mx-auto mb-3">
                  <div className="avatar-title bg-danger-subtle text-danger rounded-circle">
                    <i className="ri-close-circle-line display-4"></i>
                  </div>
                </div>
                <h5>Reject Review Request</h5>
                <p className="text-muted">
                  Are you sure you want to reject this review request?
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
                  placeholder="Please provide a clear reason for rejecting this review request..."
                  rows="4"
                  required
                />
                <small className="text-muted">
                  This reason will be visible to the staff member who requested the review.
                </small>
              </FormGroup>

              <Alert color="warning" className="mt-3">
                <i className="ri-alert-line me-2"></i>
                This action cannot be undone. The request status will be changed to{" "}
                <Badge color="danger">REJECTED</Badge>.
              </Alert>
            </ModalBody>
            <ModalFooter>
              <Button color="light" onClick={() => setActionModal(false)}>
                Cancel
              </Button>
              <Button
                color="danger"
                type="submit"
                disabled={!rejectionReason.trim()}
              >
                <i className="ri-close-line me-1"></i>
                Reject Request
              </Button>
            </ModalFooter>
          </Form>
        )}
        {actionType === "approve" && (
          <ModalFooter>
            <Button color="light" onClick={() => setActionModal(false)}>
              Cancel
            </Button>
            <Button color="success" onClick={handleAction}>
              <i className="ri-check-line me-1"></i>
              Yes, Approve Request
            </Button>
          </ModalFooter>
        )}
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default ReviewRequests;
// import React, { useEffect, useMemo, useState } from "react";
// import {
//   Badge,
//   Button,
//   ButtonGroup,
//   Card,
//   CardBody,
//   CardHeader,
//   Col,
//   Container,
//   FormGroup,
//   Input,
//   Label,
//   Modal,
//   ModalBody,
//   ModalFooter,
//   ModalHeader,
//   Row,
//   Spinner,
// } from "reactstrap";
// import DataTable from "react-data-table-component";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import BreadCrumb from "../../../Components/Common/BreadCrumb";
// import useAuthUser from "../../../Components/Hooks/useAuthUser";
// import { setAuthorization } from "../../../helpers/api_helper";
// import {
//   approveReviewRequest,
//   getReviewRequestsByStatus,
//   rejectReviewRequest,
// } from "../../../helpers/backend_helper";

// const ReviewRequests = () => {
//   document.title = "Review Requests | Kamacash";

//   const authUser = useAuthUser();
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [requests, setRequests] = useState([]);
//   const [statusFilter, setStatusFilter] = useState("PENDING");
//   const [actionModalOpen, setActionModalOpen] = useState(false);
//   const [actionType, setActionType] = useState("approve");
//   const [selectedRequestId, setSelectedRequestId] = useState("");
//   const [rejectionReason, setRejectionReason] = useState("");
//   const [actionLoading, setActionLoading] = useState(false);

//   useEffect(() => {
//     if (authUser?.token) {
//       setAuthorization(authUser.token);
//     }

//     let isMounted = true;

//     const fetchRequests = async () => {
//       setLoading(true);
//       setError("");

//       try {
//         const response = await getReviewRequestsByStatus(statusFilter);
//         const list = response?.data || [];
//         if (response?.success && isMounted) {
//           setRequests(Array.isArray(list) ? list : []);
//         } else if (isMounted) {
//           setError(response?.message || "Failed to load review requests");
//         }
//       } catch (err) {
//         if (isMounted) {
//           setError(err?.message || "Failed to load review requests");
//         }
//       } finally {
//         if (isMounted) {
//           setLoading(false);
//         }
//       }
//     };

//     fetchRequests();

//     return () => {
//       isMounted = false;
//     };
//   }, [authUser?.token, statusFilter]);

//   const openActionModal = (type, requestId) => {
//     setActionType(type);
//     setSelectedRequestId(requestId || "");
//     setRejectionReason("");
//     setActionModalOpen(true);
//   };

//   const closeActionModal = () => {
//     if (actionLoading) return;
//     setActionModalOpen(false);
//     setSelectedRequestId("");
//     setRejectionReason("");
//   };

//   const handleActionSubmit = async () => {
//     if (!selectedRequestId) {
//       setError("Request ID is missing.");
//       setActionModalOpen(false);
//       return;
//     }

//     if (actionType === "reject" && !rejectionReason.trim()) {
//       setError("Please enter a rejection reason.");
//       return;
//     }

//     setActionLoading(true);
//     setError("");

//     try {
//       if (actionType === "approve") {
//         await approveReviewRequest(selectedRequestId);
//         toast.success("Request approved successfully");
//       } else {
//         await rejectReviewRequest(selectedRequestId, {
//           rejectionReason: rejectionReason.trim(),
//         });
//         toast.success("Request rejected successfully");
//       }

//       const response = await getReviewRequestsByStatus(statusFilter);
//       const list = response?.data || [];
//       if (response?.success) {
//         setRequests(Array.isArray(list) ? list : []);
//       } else {
//         setError(response?.message || "Failed to refresh requests");
//       }
//     } catch (err) {
//       setError(err?.message || "Failed to update request");
//       toast.error(err?.message || "Failed to update request");
//     } finally {
//       setActionLoading(false);
//       setActionModalOpen(false);
//       setSelectedRequestId("");
//     }
//   };

//   const statusBadge = (status) => {
//     switch (status) {
//       case "APPROVED":
//         return <Badge color="success">Approved</Badge>;
//       case "REJECTED":
//         return <Badge color="danger">Rejected</Badge>;
//       default:
//         return <Badge color="primary">Pending</Badge>;
//     }
//   };

//   const columns = useMemo(() => {
//     const baseColumns = [
//       {
//         name: "#",
//         width: "70px",
//         cell: (row, index) => index + 1, // works if DataTable passes index
//       },
//       {
//         name: "Business",
//         grow: 1.5,
//         wrap: true,
//         cell: (row) => (
//           <div className="d-flex align-items-center gap-2">
//             {row.business?.logo ? (
//               <img
//                 src={row.business.logo}
//                 alt={row.business?.businessName || "Business"}
//                 style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover" }}
//               />
//             ) : (
//               <div style={{ width: 34, height: 34, borderRadius: 8, background: "#eee" }} />
//             )}
//             <div className="d-flex flex-column">
//               <span className="fw-semibold">{row.business?.businessName || "—"}</span>
//               <small className="text-muted">{row.businessId ? "Business" : ""}</small>
//             </div>
//           </div>
//         ),
//       },
//       {
//         name: "Requested By",
//         wrap: true,
//         cell: (row) => (
//           <div className="d-flex flex-column">
//             <span className="fw-semibold">{row.requestedByStaff?.fullName || "—"}</span>
//             <small className="text-muted">
//               {(row.requestedByStaff?.countryCode || "") + (row.requestedByStaff?.phone || "") || ""}
//             </small>
//           </div>
//         ),
//       },
//       {
//         name: "Reviewer",
//         wrap: true,
//         cell: (row) => (
//           <span>
//             {row.reviewIds?.[0]?.reviewerName ||
//               row.reviewerName ||
//               row.userName ||
//               "—"}
//           </span>
//         ),
//       },
//       {
//         name: "Rate",
//         width: "90px",
//         cell: (row) => {
//           const rating = row.reviewIds?.[0]?.rating;
//           return (
//             <Badge
//               color={rating >= 4 ? "success" : rating >= 3 ? "warning" : "danger"}
//             >
//               {rating ?? "—"}
//             </Badge>
//           );
//         },
//       },
//       {
//         name: "Comment",
//         grow: 2,
//         wrap: true,
//         selector: (row) => row.reviewIds?.[0]?.comment || "—",
//       },
//       {
//         name: "Likes",
//         width: "90px",
//         selector: (row) => row.reviewIds?.[0]?.no_of_likes ?? 0,
//       },
//       {
//         name: "Dislikes",
//         width: "100px",
//         selector: (row) => row.reviewIds?.[0]?.no_of_dis_likes ?? 0,
//       },
//     ];

//     if (statusFilter === "REJECTED") {
//       baseColumns.push({
//         name: "Rejection Reason",
//         grow: 1.5,
//         wrap: true,
//         selector: (row) => row.rejectionReason || "—",
//       });
//     }

//     baseColumns.push({
//       name: "Status",
//       width: "120px",
//       cell: (row) => statusBadge(row.status),
//     });

//     if (statusFilter === "PENDING") {
//       baseColumns.push({
//         name: "Action",
//         width: "170px",
//         cell: (row) => (
//           <div className="d-flex gap-2">
//             <Button
//               color="success"
//               size="sm"
//               onClick={() => openActionModal("approve", row._id)}
//             >
//               Approve
//             </Button>
//             <Button
//               color="danger"
//               size="sm"
//               onClick={() => openActionModal("reject", row._id)}
//             >
//               Reject
//             </Button>
//           </div>
//         ),
//       });
//     }

//     return baseColumns;
//   }, [statusFilter]);


//   return (
//     <div className="page-content">
//       <Container fluid>
//         <BreadCrumb title="Review Requests" pageTitle="Business Mngmnt" />
//         <ToastContainer position="top-right" />

//         <Row>
//           <Col lg={12}>
//             <Card>
//               <CardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-2">
//                 <h5 className="card-title mb-0">Review Requests</h5>
//                 <ButtonGroup>
//                   <Button
//                     color={statusFilter === "PENDING" ? "primary" : "light"}
//                     onClick={() => setStatusFilter("PENDING")}
//                   >
//                     Pending
//                   </Button>
//                   <Button
//                     color={statusFilter === "APPROVED" ? "primary" : "light"}
//                     onClick={() => setStatusFilter("APPROVED")}
//                   >
//                     Approved
//                   </Button>
//                   <Button
//                     color={statusFilter === "REJECTED" ? "primary" : "light"}
//                     onClick={() => setStatusFilter("REJECTED")}
//                   >
//                     Rejected
//                   </Button>
//                 </ButtonGroup>
//               </CardHeader>
//               <CardBody>
//                 {loading ? (
//                   <div className="d-flex justify-content-center py-5">
//                     <Spinner color="primary">Loading...</Spinner>
//                   </div>
//                 ) : (
//                   <>
//                     {error ? (
//                       <div className="text-danger mb-3">{error}</div>
//                     ) : null}
//                     <DataTable
//                       columns={columns}
//                       data={requests}
//                       pagination
//                       highlightOnHover
//                       responsive
//                       noDataComponent={`No ${statusFilter.toLowerCase()} requests`}
//                     />
//                   </>
//                 )}
//               </CardBody>
//             </Card>
//           </Col>
//         </Row>
//       </Container>

//       <Modal isOpen={actionModalOpen} toggle={closeActionModal} centered>
//         <ModalHeader toggle={closeActionModal}>
//           {actionType === "approve" ? "Approve Request" : "Reject Request"}
//         </ModalHeader>
//         <ModalBody>
//           {actionType === "approve" ? (
//             <p className="mb-0">
//               Are you sure you want to approve this review request?
//             </p>
//           ) : (
//             <FormGroup>
//               <Label for="rejectionReason">Rejection Reason</Label>
//               <Input
//                 id="rejectionReason"
//                 type="text"
//                 value={rejectionReason}
//                 onChange={(event) => setRejectionReason(event.target.value)}
//                 placeholder="Enter reason"
//               />
//             </FormGroup>
//           )}
//         </ModalBody>
//         <ModalFooter>
//           <Button
//             color="light"
//             onClick={closeActionModal}
//             disabled={actionLoading}
//           >
//             Cancel
//           </Button>
//           <Button
//             color={actionType === "approve" ? "success" : "danger"}
//             onClick={handleActionSubmit}
//             disabled={actionLoading}
//           >
//             {actionLoading
//               ? "Saving..."
//               : actionType === "approve"
//                 ? "Approve"
//                 : "Reject"}
//           </Button>
//         </ModalFooter>
//       </Modal>
//     </div>
//   );
// };

// export default ReviewRequests;
