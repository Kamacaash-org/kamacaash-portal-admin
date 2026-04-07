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

const selectBusinessVerificationState = createSelector(
  (state) => state.BusinessManagement,
  (businessState) => ({
    businesses: businessState.businessesByVerificationStatus || [],
  }),
);

const verificationOptions = ["PENDING", "VERIFIED", "REJECTED"];

const ApproveBusinessPage = () => {
  document.title = "Business Verification | Kamacaash";

  const dispatch = useDispatch();
  const { businesses } = useSelector(selectBusinessVerificationState);

  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);

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
    await dispatch(approveBusiness(business.id));
    await dispatch(getBusinessesByVerificationStatus(statusFilter));
  };

  const openApproveModal = (business) => {
    setSelectedBusiness(business);
    setApproveModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedBusiness) return;
    await handleApprove(selectedBusiness);
    setApproveModal(false);
    setSelectedBusiness(null);
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

      await dispatch(
        rejectBusiness({
          id: selectedBusiness.id,
          reason: values.reason.trim(),
        }),
      );

      resetForm();
      setRejectModal(false);
      setSelectedBusiness(null);
      await dispatch(getBusinessesByVerificationStatus(statusFilter));
    },
  });

  const openRejectModal = (business) => {
    setSelectedBusiness(business);
    rejectionFormik.resetForm();
    setRejectModal(true);
  };

  const columns = useMemo(
    () => [
      {
        name: "Business",
        cell: (row) => (
          <div>
            <div className="fw-semibold">{row.display_name || "-"}</div>
            <small className="text-muted">Owner: {row.owner_name || "-"}</small>
          </div>
        ),
      },
      {
        name: "Category",
        selector: (row) => row.category_name || "-",
      },
      {
        name: "City",
        selector: (row) => row.city || "-",
      },
      {
        name: "Phone",
        selector: (row) => row.phone_e164 || "-",
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
        width: "230px",
        cell: (row) => (
          <div className="d-flex align-items-center flex-nowrap gap-2">
            {row.verification_status !== "VERIFIED" && (
              <Button
                color="success"
                outline
                size="sm"
                onClick={() => openApproveModal(row)}
                className="d-inline-flex align-items-center justify-content-center fw-semibold px-3"
                style={{
                  minWidth: 100,
                  whiteSpace: "nowrap",
                  borderRadius: 10,
                }}
              >
                <i className="ri-check-line me-1" />
                Approve
              </Button>
            )}
            {row.verification_status !== "REJECTED" && (
              <Button
                color="danger"
                outline
                size="sm"
                onClick={() => openRejectModal(row)}
                className="d-inline-flex align-items-center justify-content-center fw-semibold px-3"
                style={{
                  minWidth: 100,
                  whiteSpace: "nowrap",
                  borderRadius: 10,
                }}
              >
                <i className="ri-close-line me-1" />
                Reject
              </Button>
            )}
          </div>
        ),
      },
    ],
    [statusFilter],
  );

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Business Verification" pageTitle="Business" />

        <Card className="mb-3">
          <CardBody>
            <Row className="g-3 align-items-end">
              <Col md={4}>
                <Label className="form-label">Verification Status</Label>
                <Input
                  type="select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {verificationOptions.map((status) => (
                    <option value={status} key={status}>
                      {status}
                    </option>
                  ))}
                </Input>
              </Col>
              <Col md={8}>
                <Label className="form-label">Search</Label>
                <Input
                  type="text"
                  placeholder="Search by business, owner, category, city, or phone"
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
            <Button color="light" onClick={() => setRejectModal(false)}>
              Cancel
            </Button>
            <Button color="danger" type="submit">
              Confirm Reject
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
          <Button color="light" onClick={() => setApproveModal(false)}>
            No
          </Button>
          <Button color="success" onClick={confirmApprove}>
            Yes, Approve
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ApproveBusinessPage;
