import React, { useEffect, useMemo, useState } from "react";
import {
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
  Row,
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
  getBusinessReviews,
  getStaffProfile,
  requestTopReviewApproval,
} from "../../../helpers/backend_helper";

const BusinessReviews = () => {
  document.title = "Business Reviews | Kamacash";

  const authUser = useAuthUser();
  const businessId = authUser?.businessId;

  const [resolvedBusinessId, setResolvedBusinessId] = useState(businessId || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    rating: "all",
  });

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
  }, [authUser?.staffId, authUser?.token, businessId]);

  useEffect(() => {
    let isMounted = true;

    const fetchReviews = async () => {
      if (!resolvedBusinessId) return;

      setLoading(true);
      setError("");

      try {
        const response = await getBusinessReviews(resolvedBusinessId);

        if (response?.success && isMounted) {
          const reviewList = Array.isArray(response.data?.reviews)
            ? response.data.reviews
            : [];
          setReviews(reviewList);
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

  useEffect(() => {
    let data = [...reviews];

    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      data = data.filter(
        (review) =>
          review?.reviewerName?.toLowerCase().includes(searchTerm) ||
          review?.userId?.toLowerCase().includes(searchTerm) ||
          review?.comment?.toLowerCase().includes(searchTerm),
      );
    }

    if (filters.rating !== "all") {
      if (filters.rating === "4") {
        data = data.filter((review) => Number(review?.rating || 0) >= 4);
      } else if (filters.rating === "3") {
        data = data.filter(
          (review) =>
            Number(review?.rating || 0) >= 3 && Number(review?.rating || 0) < 4,
        );
      } else {
        data = data.filter((review) => Number(review?.rating || 0) < 3);
      }
    }

    setFilteredReviews(data);
  }, [reviews, filters]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const featured = reviews.filter((review) => review?.isFeatured).length;
    const positive = reviews.filter((review) => Number(review?.rating || 0) >= 4).length;
    const averageRating =
      total > 0
        ? (
          reviews.reduce((acc, review) => acc + Number(review?.rating || 0), 0) / total
        ).toFixed(1)
        : "0.0";

    return {
      total,
      featured,
      positive,
      averageRating,
    };
  }, [reviews]);

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

  const getRatingBadge = (rating) => {
    if (rating >= 4) return { color: "success", text: `${rating} Star` };
    if (rating >= 3) return { color: "warning", text: `${rating} Star` };
    return { color: "danger", text: `${rating} Star` };
  };

  const columns = [
    {
      name: "#",
      cell: (row, index) => index + 1,
      // width: "60px",
    },
    {
      name: "Reviewer",
      cell: (row) => (
        <div>
          <div className="fw-medium">{row.reviewerName || "-"}</div>
          {/* <small className="text-muted">{row.userId || "-"}</small> */}
        </div>
      ),
      sortable: true,
      wrap: true,
    },
    {
      name: "Rating",
      cell: (row) => {
        const ratingInfo = getRatingBadge(Number(row.rating || 0));
        return <Badge color={ratingInfo.color}>{ratingInfo.text}</Badge>;
      },
      // width: "110px",
    },
    {
      name: "Comment",
      cell: (row) => (
        <div

          title={row.comment || "-"}
        >
          {row.comment || "-"}
        </div>
      ),
      grow: 2,
    },
    {
      name: "Engagement",
      cell: (row) => (
        <div className="d-flex gap-2">
          <Badge color="success" className="rounded-pill">
            <i className="ri-thumb-up-line me-1"></i>
            {row.no_of_likes ?? 0}
          </Badge>
          <Badge color="danger" className="rounded-pill">
            <i className="ri-thumb-down-line me-1"></i>
            {row.no_of_dis_likes ?? 0}
          </Badge>
        </div>
      ),
      // width: "160px",
    },
    {
      name: "Date",
      cell: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-",
      // width: "120px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-1">
          <Button
            color="outline-primary"
            size="sm"
            className="btn-icon"
            onClick={() => openConfirm(row._id)}
            title={"Send feature request"}
          >
            <i className={"ri-send-plane-line"} />
          </Button>
        </div>
      ),
      // width: "100px",
    },
  ];

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

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? "#338427" : "#338427",
      boxShadow: state.isFocused ? "0 0 0 1px #338427" : "none",
      "&:hover": {
        borderColor: "#338427",
      },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#338427"
        : state.isFocused
          ? "#e8f8f0"
          : "white",
      color: state.isSelected ? "#fff" : "#333",
      "&:active": {
        backgroundColor: "#338427",
      },
    }),
    singleValue: (base) => ({
      ...base,
      fontWeight: 500,
    }),
  };

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Business Reviews" pageTitle="Reviews" />

        <Row className="mb-4">
          <Col xl={3} md={6}>
            <Card className="card-animate">
              <CardBody>
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <p className="text-uppercase fw-medium text-muted mb-0">Total Reviews</p>
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
                    <p className="text-uppercase fw-medium text-muted mb-0">Featured</p>
                    <h4 className="mb-0">{stats.featured}</h4>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="avatar-sm">
                      <span className="avatar-title bg-warning-subtle text-warning rounded-circle fs-2">
                        <i className="ri-star-line"></i>
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
                    <p className="text-uppercase fw-medium text-muted mb-0">Avg Rating</p>
                    <h4 className="mb-0">{stats.averageRating}</h4>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="avatar-sm">
                      <span className="avatar-title bg-success-subtle text-success rounded-circle fs-2">
                        <i className="ri-medal-line"></i>
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
                    <p className="text-uppercase fw-medium text-muted mb-0">Positive</p>
                    <h4 className="mb-0">{stats.positive}</h4>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="avatar-sm">
                      <span className="avatar-title bg-info-subtle text-info rounded-circle fs-2">
                        <i className="ri-thumb-up-line"></i>
                      </span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Card className="mb-4">
          <CardBody className="p-3">
            <Row className="g-3 align-items-end">
              <Col md={8}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Search Reviews</Label>
                  <Input
                    type="text"
                    name="search"
                    placeholder="Search by reviewer, user ID, or comment..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, search: e.target.value }))
                    }
                  />
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Rating</Label>
                  <Select
                    styles={customSelectStyles}
                    options={[
                      { value: "all", label: "All" },
                      { value: "4", label: "4 Star & Above" },
                      { value: "3", label: "3 to 3.9 Star" },
                      { value: "2", label: "Below 3 Star" },
                    ]}
                    value={[
                      { value: "all", label: "All" },
                      { value: "4", label: "4 Star & Above" },
                      { value: "3", label: "3 to 3.9 Star" },
                      { value: "2", label: "Below 3 Star" },
                    ].find((option) => option.value === filters.rating)}
                    onChange={(option) =>
                      setFilters((prev) => ({
                        ...prev,
                        rating: option?.value || "all",
                      }))
                    }
                    className="react-select"
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
              <Col md={1}>
                <div className="d-grid mb-3">
                  <Button
                    color="primary"
                    onClick={() => setFilters({ search: "", rating: "all" })}
                  >
                    <i className="ri-refresh-line"></i>
                  </Button>
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center bg-light">
            <h5 className="card-title mb-0 flex-grow-1">
              <i className="ri-chat-review-line align-middle me-2"></i>
              All Reviews
              <Badge color="primary" className="ms-2">
                {filteredReviews.length}
              </Badge>
            </h5>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Loader />
            ) : (
              <>
                {error ? <div className="text-danger mb-3">{error}</div> : null}
                <DataTable
                  columns={columns}
                  data={filteredReviews}
                  pagination
                  noDataComponent={
                    <div className="text-center py-5">
                      <i className="ri-inbox-line display-4 text-muted"></i>
                      <h5 className="mt-3">No reviews found</h5>
                      <p className="text-muted">
                        Try adjusting your search or rating filter.
                      </p>
                    </div>
                  }
                  customStyles={customStyles}
                />
              </>
            )}
          </CardBody>
        </Card>
      </Container>

      <Modal isOpen={confirmOpen} toggle={closeConfirm} centered>
        <ModalHeader toggle={closeConfirm} className="bg-light">
          <i className="ri-shield-star-line me-2 text-primary"></i>
          Confirm Feature Request
        </ModalHeader>
        <ModalBody>
          <div className="text-center">
            <div className="avatar-lg mx-auto mb-3">
              <div className="avatar-title bg-primary-subtle text-primary rounded-circle">
                <i className="ri-send-plane-line display-6"></i>
              </div>
            </div>
            <h5 className="mb-2">Send Review For Approval</h5>
            <p className="text-muted mb-0">
              This will create a featured review request and send it to admin for approval.
            </p>
          </div>

          <div className="alert alert-warning mt-3 mb-0" role="alert">
            <i className="ri-information-line me-2"></i>
            You should only submit high-quality reviews for featuring.
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="light" type="button" onClick={closeConfirm} disabled={requestLoading}>
            Cancel
          </Button>
          <Button
            color="success"
            type="button"
            onClick={handleSendRequest}
            disabled={requestLoading}
          >
            {requestLoading ? (
              <>
                <i className="ri-loader-4-line spin me-1"></i>
                Sending...
              </>
            ) : (
              <>
                <i className="ri-check-line me-1"></i>
                Yes, Send Request
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>

      <ToastContainer position="top-right" />
    </div>
  );
};

export default BusinessReviews;
