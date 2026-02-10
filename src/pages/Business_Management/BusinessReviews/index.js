import React, { useEffect, useState } from "react";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Spinner,
  Button,
} from "reactstrap";
import DataTable from "react-data-table-component";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import useAuthUser from "../../../Components/Hooks/useAuthUser";
import { setAuthorization } from "../../../helpers/api_helper";
import {
  getBusinessReviews,
  getStaffProfile,
  requestTopReviewApproval,
} from "../../../helpers/backend_helper";

const BusinessReviews = () => {
  document.title = "Business Reviews | Kamacash";

  const authUser = useAuthUser();
  const businessId = authUser?.businessId;

  const [resolvedBusinessId, setResolvedBusinessId] = useState(
    businessId || "",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);

  useEffect(() => {
    if (authUser?.token) {
      setAuthorization(authUser.token);
    }

    let isMounted = true;

    const resolveBusinessId = async () => {
      if (businessId) {
        setResolvedBusinessId(businessId);
        return;
      }

      if (!authUser?.staffId) {
        setError("Business ID not found. Please sign in again.");
        setLoading(false);
        return;
      }

      try {
        const staffResponse = await getStaffProfile(authUser.staffId);
        const staffBusinessId = staffResponse?.data?.business?._id || "";
        if (staffBusinessId && isMounted) {
          setResolvedBusinessId(staffBusinessId);
        } else if (isMounted) {
          setError("Business ID not found. Please sign in again.");
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || "Failed to resolve business ID");
          setLoading(false);
        }
      }
    };

    resolveBusinessId();

    return () => {
      isMounted = false;
    };
  }, [authUser?.staffId, businessId]);

  useEffect(() => {
    let isMounted = true;

    const fetchReviews = async () => {
      if (!resolvedBusinessId) return;

      setLoading(true);
      setError("");

      try {
        const response = await getBusinessReviews(resolvedBusinessId);
        if (response?.success && isMounted) {
          setReviews(response.data?.reviews || []);
        } else if (isMounted) {
          setError(response?.message || "Failed to load reviews");
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || "Failed to load reviews");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReviews();

    return () => {
      isMounted = false;
    };
  }, [resolvedBusinessId]);

  const openConfirm = (reviewId) => {
    setSelectedReviewId(reviewId || "");
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (requestLoading) return;
    setConfirmOpen(false);
    setSelectedReviewId("");
  };

  const handleSendRequest = async () => {
    if (!resolvedBusinessId || !selectedReviewId) {
      setError("Missing business or review ID.");
      setConfirmOpen(false);
      return;
    }

    setRequestLoading(true);
    setError("");

    try {
      const response = await requestTopReviewApproval({
        businessId: resolvedBusinessId,
        reviewIds: [selectedReviewId],
      });
      if (response?.success) {
        toast.success("Request sent to admin successfully");
      } else {
        setError(response?.message || "Failed to send request");
        toast.error(response?.message || "Failed to send request");
      }
    } catch (err) {
      setError(err?.message || "Failed to send request");
      toast.error(err?.message || "Failed to send request");
    } finally {
      setRequestLoading(false);
      setConfirmOpen(false);
      setSelectedReviewId("");
    }
  };

  const columns = [
    {
      name: "User",
      selector: (row) => row.reviewerName || row.userId || "-",
      wrap: true,
    },
    {
      name: "Rate",
      cell: (row) => (
        <Badge
          color={
            row.rating >= 4 ? "success" : row.rating >= 3 ? "warning" : "danger"
          }
        >
          {row.rating}
        </Badge>
      ),
      width: "90px",
    },
    {
      name: "Comment",
      selector: (row) => row.comment || "-",
      wrap: true,
      grow: 2,
    },
    {
      name: "Likes",
      selector: (row) => row.no_of_likes ?? 0,
      width: "90px",
    },
    {
      name: "Dislikes",
      selector: (row) => row.no_of_dis_likes ?? 0,
      width: "100px",
    },
    {
      name: "Action",
      cell: (row) => (
        <div className="d-flex gap-1">
          <button
            type="button"
            className="btn btn-soft-primary btn-sm"
            onClick={() => openConfirm(row._id)}
          >
            <i className="ri-edit-line"></i>
          </button>
        </div>
      ),
      width: "110px",
    },
  ];

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Business Reviews" pageTitle="Business Mngmnt" />
        <ToastContainer position="top-right" />

        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader>
                <h5 className="card-title mb-0">Reviews</h5>
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
                      data={reviews}
                      pagination
                      highlightOnHover
                      responsive
                      noDataComponent="No reviews yet"
                    />
                  </>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal isOpen={confirmOpen} toggle={closeConfirm} centered>
        <ModalHeader toggle={closeConfirm}>Send Request</ModalHeader>
        <ModalBody>
          Are you sure you want to send this review to admin for approval?
        </ModalBody>
        <ModalFooter>
          <Button
            color="light"
            type="button"
            onClick={closeConfirm}
            disabled={requestLoading}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            type="button"
            onClick={handleSendRequest}
            disabled={requestLoading}
          >
            {requestLoading ? "Sending..." : "Yes, Send"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default BusinessReviews;
