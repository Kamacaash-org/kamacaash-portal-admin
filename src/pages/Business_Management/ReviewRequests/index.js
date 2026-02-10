import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  ButtonGroup,
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
  Row,
  Spinner,
} from "reactstrap";
import DataTable from "react-data-table-component";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
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
  const [error, setError] = useState("");
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState("approve");
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (authUser?.token) {
      setAuthorization(authUser.token);
    }

    let isMounted = true;

    const fetchRequests = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getReviewRequestsByStatus(statusFilter);
        const list = response?.data || [];
        if (response?.success && isMounted) {
          setRequests(Array.isArray(list) ? list : []);
        } else if (isMounted) {
          setError(response?.message || "Failed to load review requests");
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || "Failed to load review requests");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRequests();

    return () => {
      isMounted = false;
    };
  }, [authUser?.token, statusFilter]);

  const openActionModal = (type, requestId) => {
    setActionType(type);
    setSelectedRequestId(requestId || "");
    setRejectionReason("");
    setActionModalOpen(true);
  };

  const closeActionModal = () => {
    if (actionLoading) return;
    setActionModalOpen(false);
    setSelectedRequestId("");
    setRejectionReason("");
  };

  const handleActionSubmit = async () => {
    if (!selectedRequestId) {
      setError("Request ID is missing.");
      setActionModalOpen(false);
      return;
    }

    if (actionType === "reject" && !rejectionReason.trim()) {
      setError("Please enter a rejection reason.");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      if (actionType === "approve") {
        await approveReviewRequest(selectedRequestId);
        toast.success("Request approved successfully");
      } else {
        await rejectReviewRequest(selectedRequestId, {
          rejectionReason: rejectionReason.trim(),
        });
        toast.success("Request rejected successfully");
      }

      const response = await getReviewRequestsByStatus(statusFilter);
      const list = response?.data || [];
      if (response?.success) {
        setRequests(Array.isArray(list) ? list : []);
      } else {
        setError(response?.message || "Failed to refresh requests");
      }
    } catch (err) {
      setError(err?.message || "Failed to update request");
      toast.error(err?.message || "Failed to update request");
    } finally {
      setActionLoading(false);
      setActionModalOpen(false);
      setSelectedRequestId("");
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return <Badge color="primary">Approved</Badge>;
      case "REJECTED":
        return <Badge color="danger">Rejected</Badge>;
      default:
        return <Badge color="secondary">Pending</Badge>;
    }
  };

  const columns = useMemo(() => {
    const baseColumns = [
      {
        name: "Review ID",
        selector: (row) => row.reviewIds?.[0]?._id || row._id || "-",
        wrap: true,
      },
      {
        name: "Business ID",
        selector: (row) => row.businessId || row.business?._id || "-",
        wrap: true,
      },
      {
        name: "User",
        selector: (row) =>
          row.reviewIds?.[0]?.reviewerName ||
          row.reviewerName ||
          row.userName ||
          row.reviewIds?.[0]?.userId ||
          "-",
        wrap: true,
      },
      {
        name: "Rate",
        cell: (row) => (
          <Badge
            color={
              row.reviewIds?.[0]?.rating >= 4
                ? "success"
                : row.reviewIds?.[0]?.rating >= 3
                  ? "warning"
                  : "danger"
            }
          >
            {row.reviewIds?.[0]?.rating ?? "-"}
          </Badge>
        ),
        width: "90px",
      },
      {
        name: "Comment",
        selector: (row) => row.reviewIds?.[0]?.comment || "-",
        wrap: true,
        grow: 2,
      },
      {
        name: "Likes",
        selector: (row) => row.reviewIds?.[0]?.no_of_likes ?? 0,
        width: "90px",
      },
      {
        name: "Dislikes",
        selector: (row) => row.reviewIds?.[0]?.no_of_dis_likes ?? 0,
        width: "100px",
      },
    ];

    if (statusFilter === "REJECTED") {
      baseColumns.push({
        name: "Rejection Reason",
        selector: (row) => row.rejectionReason || "-",
        wrap: true,
      });
    }

    if (statusFilter === "PENDING") {
      baseColumns.push({
        name: "Action",
        cell: (row) => (
          <div className="d-flex gap-2">
            <Button
              color="success"
              size="sm"
              onClick={() => openActionModal("approve", row._id)}
            >
              Approve
            </Button>
            <Button
              color="danger"
              size="sm"
              onClick={() => openActionModal("reject", row._id)}
            >
              Reject
            </Button>
          </div>
        ),
        width: "160px",
      });
    }

    baseColumns.push({
      name: "Status",
      cell: (row) => statusBadge(row.status),
      width: "110px",
    });

    return baseColumns;
  }, [statusFilter]);

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Review Requests" pageTitle="Business Mngmnt" />
        <ToastContainer position="top-right" />

        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <h5 className="card-title mb-0">Review Requests</h5>
                <ButtonGroup>
                  <Button
                    color={statusFilter === "PENDING" ? "primary" : "light"}
                    onClick={() => setStatusFilter("PENDING")}
                  >
                    Pending
                  </Button>
                  <Button
                    color={statusFilter === "APPROVED" ? "primary" : "light"}
                    onClick={() => setStatusFilter("APPROVED")}
                  >
                    Approved
                  </Button>
                  <Button
                    color={statusFilter === "REJECTED" ? "primary" : "light"}
                    onClick={() => setStatusFilter("REJECTED")}
                  >
                    Rejected
                  </Button>
                </ButtonGroup>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <div className="d-flex justify-content-center py-5">
                    <Spinner color="primary">Loading...</Spinner>
                  </div>
                ) : (
                  <>
                    {error ? (
                      <div className="text-danger mb-3">{error}</div>
                    ) : null}
                    <DataTable
                      columns={columns}
                      data={requests}
                      pagination
                      highlightOnHover
                      responsive
                      noDataComponent={`No ${statusFilter.toLowerCase()} requests`}
                    />
                  </>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal isOpen={actionModalOpen} toggle={closeActionModal} centered>
        <ModalHeader toggle={closeActionModal}>
          {actionType === "approve" ? "Approve Request" : "Reject Request"}
        </ModalHeader>
        <ModalBody>
          {actionType === "approve" ? (
            <p className="mb-0">
              Are you sure you want to approve this review request?
            </p>
          ) : (
            <FormGroup>
              <Label for="rejectionReason">Rejection Reason</Label>
              <Input
                id="rejectionReason"
                type="text"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Enter reason"
              />
            </FormGroup>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            color="light"
            onClick={closeActionModal}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            color={actionType === "approve" ? "success" : "danger"}
            onClick={handleActionSubmit}
            disabled={actionLoading}
          >
            {actionLoading
              ? "Saving..."
              : actionType === "approve"
                ? "Approve"
                : "Reject"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ReviewRequests;
