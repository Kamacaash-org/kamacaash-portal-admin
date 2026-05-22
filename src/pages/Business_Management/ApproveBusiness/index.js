import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Form,
  FormFeedback,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
} from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import DataTable from "react-data-table-component";
import Select from "react-select";
import { useFormik } from "formik";
import * as Yup from "yup";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import Loader from "../../../Components/Common/Loader";
import NoDataFound from "../../../Components/Common/NoDataFound";
import {
  approveBusiness,
  getBusinessesByVerificationStatus,
  rejectBusiness,
} from "../../../slices/thunks";
import { ToastContainer } from "react-toastify";

const selectBusinessVerificationState = createSelector(
  (state) => state.BusinessManagement,
  (businessState) => ({
    businesses: businessState.businessesByVerificationStatus || [],
  }),
);

const verificationOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
];

const ApproveBusinessPage = () => {
  document.title = "Business Verification | Kamacaash";

  const dispatch = useDispatch();
  const { businesses } = useSelector(selectBusinessVerificationState);

  const [loading, setLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);

  const selectedStatusOption =
    verificationOptions.find((option) => option.value === statusFilter) ||
    verificationOptions[0];

  useEffect(() => {
    const loadBusinesses = async () => {
      setLoading(true);
      try {
        await dispatch(getBusinessesByVerificationStatus(statusFilter));
      } finally {
        setLoading(false);
      }
    };

    loadBusinesses();
  }, [dispatch, statusFilter]);

  const filteredBusinesses = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return businesses;

    return businesses.filter((item) => {
      return [
        item.display_name,
        item.owner_name,
        item.phone_e164,
        item.city,
        item.category_name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [businesses, search]);

  const handleApprove = async (business) => {
    await dispatch(approveBusiness(business.id)).unwrap();
    await dispatch(getBusinessesByVerificationStatus(statusFilter));
  };

  const openApproveModal = (business) => {
    setSelectedBusiness(business);
    setApproveModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedBusiness) return;

    setApproveLoading(true);
    try {
      await handleApprove(selectedBusiness);
      setApproveModal(false);
      setSelectedBusiness(null);
    } catch (error) {
      console.error("Approve business error:", error);
    } finally {
      setApproveLoading(false);
    }
  };

  const rejectionFormik = useFormik({
    initialValues: {
      reason: "",
    },
    validationSchema: Yup.object({
      reason: Yup.string().trim().required("Rejection reason is required"),
    }),
    onSubmit: async (values, { resetForm }) => {
      if (!selectedBusiness) return;

      setRejectLoading(true);
      try {
        await dispatch(
          rejectBusiness({
            id: selectedBusiness.id,
            reason: values.reason.trim(),
          }),
        ).unwrap();

        resetForm();
        setRejectModal(false);
        setSelectedBusiness(null);
        await dispatch(getBusinessesByVerificationStatus(statusFilter));
      } finally {
        setRejectLoading(false);
      }
    },
  });

  const openRejectModal = (business) => {
    setSelectedBusiness(business);
    rejectionFormik.resetForm();
    setRejectModal(true);
  };

  const columns = [
    {
      name: "#",
      cell: (row, index) => index + 1,
    },
    {
      name: "Business",
      cell: (row) => (
        <div>
          <div className="fw-semibold">{row.display_name || "-"}</div>
        </div>
      ),
    },

    {
      name: "Primary Staff",
      selector: (row) => row.primary_staff_name || "-",
    },

    {
      name: "Category",
      selector: (row) => row.category_name || "-",
    },
    {
      name: "City",
      selector: (row) => row.city_name || "-",
    },
    {
      name: "Phone",
      selector: (row) => row.phone || "-",
    },
    {
      name: "Status",
      cell: (row) => (
        <Badge
          color={
            row.verification_status === "VERIFIED"
              ? "success"
              : row.verification_status === "REJECTED"
                ? "danger"
                : "warning"
          }
        >
          {row.verification_status}
        </Badge>
      ),
    },
    {
      name: "Created",
      selector: (row) =>
        row.created_at ? new Date(row.created_at).toLocaleDateString() : "-",
    },
    {
      name: "Actions",
      width: "140px",
      cell: (row) => (
        <div className="d-flex align-items-center gap-1">
          {row.verification_status !== "VERIFIED" && (
            <Button
              color="outline-success"
              size="sm"
              className="btn-icon"
              onClick={() => openApproveModal(row)}
              title="Approve business"
            >
              <i className="ri-check-line" />
            </Button>
          )}
          {row.verification_status !== "REJECTED" && (
            <Button
              color="outline-danger"
              size="sm"
              className="btn-icon"
              onClick={() => openRejectModal(row)}
              title="Reject business"
            >
              <i className="ri-close-line" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? "#40c637" : "#ced4da",
      boxShadow: state.isFocused ? "0 0 0 1px #40c637" : "none",
      "&:hover": {
        borderColor: "#40c637",
      },
      minHeight: "38px",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#40c637"
        : state.isFocused
          ? "#e8f8f0"
          : "#fff",
      color: state.isSelected ? "#fff" : "#333",
      "&:active": {
        backgroundColor: "#40c637",
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
        <BreadCrumb title="Business Verification" pageTitle="Business" />

        <Card className="mb-3">
          <CardBody>
            <Row className="g-3 align-items-end">
              <Col md={4}>
                <Label className="form-label">Verification Status</Label>
                <Select
                  styles={customSelectStyles}
                  options={verificationOptions}
                  value={selectedStatusOption}
                  onChange={(option) =>
                    setStatusFilter(option?.value || verificationOptions[0].value)
                  }
                  placeholder="Select status"
                  className="react-select"
                  classNamePrefix="select"
                />
              </Col>
              <Col md={8}>
                <Label className="form-label">Search</Label>
                <Input
                  type="text"
                  placeholder="Search by business, category, city, or phone"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Col>
            </Row>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h5 className="card-title mb-0">Verification Queue</h5>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Loader />
            ) : (
              <DataTable
                columns={columns}
                data={filteredBusinesses}
                pagination
                responsive
                noDataComponent={
                  <NoDataFound message="No businesses found for the selected verification status" />
                }
              />
            )}
          </CardBody>
        </Card>
      </Container>

      <Modal isOpen={rejectModal} toggle={() => setRejectModal(false)} centered>
        <ModalHeader toggle={() => setRejectModal(false)}>
          Reject Business
        </ModalHeader>
        <Form onSubmit={rejectionFormik.handleSubmit}>
          <ModalBody>
            <div className="mb-3">
              <Label className="form-label" htmlFor="reason">
                Rejection Reason <span className="text-danger">*</span>
              </Label>
              <Input
                id="reason"
                name="reason"
                type="textarea"
                rows={4}
                placeholder="Enter a clear reason for rejecting this business"
                value={rejectionFormik.values.reason}
                onChange={rejectionFormik.handleChange}
                onBlur={rejectionFormik.handleBlur}
                invalid={
                  rejectionFormik.touched.reason &&
                  Boolean(rejectionFormik.errors.reason)
                }
              />
              {rejectionFormik.touched.reason &&
                rejectionFormik.errors.reason ? (
                <FormFeedback>{rejectionFormik.errors.reason}</FormFeedback>
              ) : null}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="light"
              onClick={() => setRejectModal(false)}
              disabled={rejectLoading}
            >
              Cancel
            </Button>
            <Button color="danger" type="submit" disabled={rejectLoading}>
              {rejectLoading ? "Rejecting..." : "Confirm Reject"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <Modal
        isOpen={approveModal}
        toggle={() => setApproveModal(false)}
        centered
      >
        <ModalHeader toggle={() => setApproveModal(false)}>
          Approve Business
        </ModalHeader>
        <ModalBody>
          <p className="mb-0">
            Are you sure you want to approve
            <span className="fw-semibold">
              {` ${selectedBusiness?.display_name || "this business"}`}
            </span>
            ?
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            color="light"
            onClick={() => setApproveModal(false)}
            disabled={approveLoading}
          >
            No
          </Button>
          <Button color="success" onClick={confirmApprove} disabled={approveLoading}>
            {approveLoading ? "Approving..." : "Yes, Approve"}
          </Button>
        </ModalFooter>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default ApproveBusinessPage;
