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
  getBusinessesWithContract,
  getBusinessesWithoutContract,
  uploadBusinessContract,
} from "../../../slices/thunks";

const selectContractState = createSelector(
  (state) => state.BusinessManagement,
  (businessState) => ({
    withoutContract: businessState.businessesWithoutContract || [],
    withContract: businessState.businessesWithContract || [],
  }),
);

const contractViewOptions = [
  { value: "without", label: "Without Contract" },
  { value: "with", label: "With Contract" },
];

const UploadContractPage = () => {
  document.title = "Business Contracts | Kamacaash";

  const dispatch = useDispatch();
  const { withoutContract, withContract } = useSelector(selectContractState);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("without");
  const [uploadModal, setUploadModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [selectedContractRecord, setSelectedContractRecord] = useState(null);

  const selectedContractView =
    contractViewOptions.find((option) => option.value === activeTab) ||
    contractViewOptions[0];

  const loadContracts = async (type) => {
    setLoading(true);
    try {
      if (type === "without" && withoutContract.length === 0) {
        await dispatch(getBusinessesWithoutContract());
      }

      if (type === "with" && withContract.length === 0) {
        await dispatch(getBusinessesWithContract());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts(activeTab); // only one API call
  }, []);

  const uploadFormik = useFormik({
    initialValues: {
      version: "v1",
      contractDocument: null,
    },
    validationSchema: Yup.object({
      version: Yup.string().trim().required("Version is required"),
      contractDocument: Yup.mixed().required("Contract document is required"),
    }),
    onSubmit: async (values, { resetForm }) => {
      if (!selectedBusiness?.id) return;

      await dispatch(
        uploadBusinessContract({
          businessId: selectedBusiness.id,
          contractDocument: values.contractDocument,
          version: values.version.trim(),
        }),
      );

      resetForm();
      setUploadModal(false);
      setSelectedBusiness(null);
    },
  });

  const openUploadModal = (business) => {
    setSelectedBusiness(business);
    uploadFormik.resetForm({
      values: {
        version: "v1",
        contractDocument: null,
      },
    });
    setUploadModal(true);
  };

  const openViewModal = (record) => {
    setSelectedContractRecord(record);
    setViewModal(true);
  };

  const filterBySearch = (items) => {
    const term = search.trim().toLowerCase();
    if (!term) return items;

    return items.filter((item) => {
      const business = item.business || item;
      return [
        business.display_name,
        business.owner_name,
        business.city,
        business.phone_e164,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  };

  const withoutContractList = useMemo(
    () => filterBySearch(withoutContract),
    [withoutContract, search],
  );

  const withContractList = useMemo(
    () => filterBySearch(withContract),
    [withContract, search],
  );

  const withoutContractColumns = [
    {
      name: "#",
      cell: (row, index) => index + 1,
      width: "70px",
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
      name: "City",
      selector: (row) => row.city || "-",
    },
    {
      name: "Phone",
      selector: (row) => row.phone || "-",
    },
    {
      name: "Verified Name",
      selector: (row) => row.verified_by_name || "-",
    },

    {
      name: "Verified At",
      selector: (row) =>
        row.verified_at
          ? new Date(row.verified_at).toLocaleString()
          : "-",
    },

    {
      name: "Primary Staff",
      cell: (row) =>
        `${row.primary_staff?.name || "-"} (${row.primary_staff?.phone || "-"})`,
    },
    {
      name: "Action",
      width: "100px",
      cell: (row) => (
        <Button
          color="outline-primary"
          size="sm"
          className="btn-icon"
          onClick={() => openUploadModal(row)}
          title="Upload contract"
        >
          <i className="ri-upload-2-line" />
        </Button>
      ),
    },
  ];

  const withContractColumns = [
    {
      name: "#",
      cell: (row, index) => index + 1,
      width: "70px",
    },
    {
      name: "Business",
      cell: (row) => (
        <div>
          <div className="fw-semibold">{row.business?.display_name || "-"}</div>
          <small className="text-muted">Owner: {row.business?.owner_name || "-"}</small>
        </div>
      ),
    },
    {
      name: "Contract Number",
      selector: (row) => row.contract?.contract_number || "-",
    },
    {
      name: "Version",
      selector: (row) => row.contract?.version || "-",
    },
    {
      name: "Signed",
      cell: (row) => (
        <Badge color={row.contract?.is_signed ? "success" : "warning"}>
          {row.contract?.is_signed ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      name: "PDF",
      cell: (row) =>
        row.contract?.agreement_pdf_url ? (
          <a
            href={row.contract.agreement_pdf_url}
            target="_blank"
            rel="noreferrer"
            className="btn btn-sm btn-outline-secondary btn-icon"
            title="View contract PDF"
          >
            <i className="ri-file-pdf-line" />
          </a>
        ) : (
          "-"
        ),
    },
    {
      name: "Action",
      width: "100px",
      cell: (row) => (
        <Button
          color="outline-info"
          size="sm"
          className="btn-icon"
          onClick={() => openViewModal(row)}
          title="View details"
        >
          <i className="ri-eye-line" />
        </Button>
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
        <BreadCrumb title="Business Contracts" pageTitle="Business" />

        <Card className="mb-3">
          <CardBody>
            <Row className="g-3 align-items-end">
              <Col md={8}>
                <Label className="form-label">Search</Label>
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by business, owner, city, or phone"
                />
              </Col>
              <Col md={2}>
                <Label className="form-label">View</Label>
                <Select
                  styles={customSelectStyles}
                  options={contractViewOptions}
                  value={selectedContractView}
                  onChange={(option) => {
                    const value = option?.value || "without";
                    setActiveTab(value);
                    loadContracts(value); // fetch only selected type
                  }}
                  placeholder="Select view"
                  className="react-select"
                  classNamePrefix="select"
                />
              </Col>
              <Col md={2}>
                <Button color="light" onClick={loadContracts} className="w-100">
                  Refresh Lists
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              {activeTab === "without"
                ? `Without Contract (${withoutContractList.length})`
                : `With Contract (${withContractList.length})`}
            </h5>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Loader />
            ) : activeTab === "without" ? (
              <DataTable
                columns={withoutContractColumns}
                data={withoutContractList}
                pagination
                responsive
                noDataComponent={
                  <NoDataFound message="No businesses found without contract" />
                }
              />
            ) : (
              <DataTable
                columns={withContractColumns}
                data={withContractList}
                pagination
                responsive
                noDataComponent={
                  <NoDataFound message="No businesses found with contract" />
                }
              />
            )}
          </CardBody>
        </Card>
      </Container>

      <Modal isOpen={uploadModal} toggle={() => setUploadModal(false)} centered>
        <ModalHeader toggle={() => setUploadModal(false)}>
          Upload Contract
        </ModalHeader>
        <Form onSubmit={uploadFormik.handleSubmit}>
          <ModalBody>
            <div className="mb-3">
              <Label className="form-label">Business</Label>
              <Input
                type="text"
                value={selectedBusiness?.display_name || ""}
                disabled
                placeholder="Selected business name"
              />
            </div>

            <div className="mb-3">
              <Label className="form-label" htmlFor="version">
                Version <span className="text-danger">*</span>
              </Label>
              <Input
                id="version"
                name="version"
                type="text"
                value={uploadFormik.values.version}
                onChange={uploadFormik.handleChange}
                onBlur={uploadFormik.handleBlur}
                placeholder="Enter contract version (default: v1)"
                invalid={
                  uploadFormik.touched.version &&
                  Boolean(uploadFormik.errors.version)
                }
              />
              {uploadFormik.touched.version && uploadFormik.errors.version ? (
                <FormFeedback>{uploadFormik.errors.version}</FormFeedback>
              ) : null}
            </div>

            <div className="mb-0">
              <Label className="form-label" htmlFor="contractDocument">
                Contract Document <span className="text-danger">*</span>
              </Label>
              <Input
                id="contractDocument"
                name="contractDocument"
                type="file"
                accept="application/pdf"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0] || null;
                  uploadFormik.setFieldValue("contractDocument", file);
                }}
                onBlur={uploadFormik.handleBlur}
                placeholder="Choose contract PDF file"
                invalid={
                  uploadFormik.touched.contractDocument &&
                  Boolean(uploadFormik.errors.contractDocument)
                }
              />
              {uploadFormik.touched.contractDocument &&
                uploadFormik.errors.contractDocument ? (
                <FormFeedback>{uploadFormik.errors.contractDocument}</FormFeedback>
              ) : null}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="light" onClick={() => setUploadModal(false)}>
              Cancel
            </Button>
            <Button color="primary" type="submit">
              Upload Contract
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="xl">
        <ModalHeader toggle={() => setViewModal(false)}>
          Contract Details
        </ModalHeader>
        <ModalBody>
          {selectedContractRecord ? (
            <>
              <div className="d-flex flex-wrap gap-2 mb-4">
                <Badge color="primary" pill className="px-3 py-2">
                  <i className="ri-store-2-line me-1" />
                  {selectedContractRecord.business?.display_name || "-"}
                </Badge>
                <Badge color="dark" pill className="px-3 py-2">
                  <i className="ri-file-text-line me-1" />
                  {selectedContractRecord.contract?.contract_number || "-"}
                </Badge>
                <Badge color="info" pill className="px-3 py-2">
                  <i className="ri-calendar-check-line me-1" />
                  {selectedContractRecord.contract?.payout_schedule || "-"}
                </Badge>
                <Badge
                  color={
                    selectedContractRecord.contract?.is_signed
                      ? "success"
                      : "warning"
                  }
                  pill
                  className="px-3 py-2"
                >
                  <i className="ri-shield-check-line me-1" />
                  {selectedContractRecord.contract?.is_signed ? "Signed" : "Pending"}
                </Badge>
              </div>

              <Row className="g-4">
                <Col md={6}>
                  <Card className="border shadow-none h-100 mb-0">
                    <CardHeader>
                      <h6 className="mb-0">
                        <i className="ri-building-line me-2 text-primary" />
                        Business Information
                      </h6>
                    </CardHeader>
                    <CardBody>
                      <p>
                        <strong>Business:</strong>{" "}
                        {selectedContractRecord.business?.display_name || "-"}
                      </p>
                      <p>
                        <strong>Phone:</strong>{" "}
                        {selectedContractRecord.business?.phone || "-"}
                      </p>
                      <p>
                        <strong>City:</strong>{" "}
                        {selectedContractRecord.business?.city || "-"}
                      </p>
                      <p>
                        <strong>Currency Symbol:</strong>{" "}
                        {selectedContractRecord.business?.currency_symbol || "-"}
                      </p>
                      <p>
                        <strong>Verified At:</strong>{" "}
                        {selectedContractRecord.business?.verified_at
                          ? new Date(
                            selectedContractRecord.business.verified_at,
                          ).toLocaleString()
                          : "-"}
                      </p>
                      <p>
                        <strong>Verified By:</strong>{" "}
                        {selectedContractRecord.business?.verified_by_name || "-"}
                      </p>
                      <p className="mb-0">
                        <strong>Primary Staff:</strong>{" "}
                        {selectedContractRecord.business?.primary_staff?.name || "-"}
                        {" / "}
                        {selectedContractRecord.business?.primary_staff?.phone || "-"}
                      </p>
                    </CardBody>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="border shadow-none h-100 mb-0">
                    <CardHeader>
                      <h6 className="mb-0">
                        <i className="ri-file-list-3-line me-2 text-success" />
                        Contract Information
                      </h6>
                    </CardHeader>
                    <CardBody>
                      <p>
                        <strong>Contract Number:</strong>{" "}
                        {selectedContractRecord.contract?.contract_number || "-"}
                      </p>
                      <p>
                        <strong>Version:</strong>{" "}
                        {selectedContractRecord.contract?.version || "-"}
                      </p>
                      <p>
                        <strong>Signed:</strong>{" "}
                        <Badge
                          color={
                            selectedContractRecord.contract?.is_signed
                              ? "success"
                              : "warning"
                          }
                        >
                          {selectedContractRecord.contract?.is_signed ? "Yes" : "No"}
                        </Badge>
                      </p>
                      <p>
                        <strong>Signed At:</strong>{" "}
                        {selectedContractRecord.contract?.signed_at
                          ? new Date(
                            selectedContractRecord.contract.signed_at,
                          ).toLocaleString()
                          : "-"}
                      </p>
                      <p>
                        <strong>Signed IP:</strong>{" "}
                        {selectedContractRecord.contract?.signed_by_ip || "-"}
                      </p>
                      <p className="mb-0">
                        <strong>PDF:</strong>{" "}
                        {selectedContractRecord.contract?.agreement_pdf_url ? (
                          <a
                            href={selectedContractRecord.contract.agreement_pdf_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View PDF
                          </a>
                        ) : (
                          "-"
                        )}
                      </p>
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              <Row className="g-4 mt-1">
                <Col md={6}>
                  <Card className="border shadow-none h-100 mb-0">
                    <CardHeader>
                      <h6 className="mb-0">
                        <i className="ri-coins-line me-2 text-warning" />
                        Payout & Commission
                      </h6>
                    </CardHeader>
                    <CardBody>
                      <Row className="g-3">
                        <Col sm={6}>
                          <div className="rounded-3 border bg-primary bg-opacity-10 p-3">
                            <small className="text-muted d-block">Payout Schedule</small>
                            <span className="fw-bold text-primary">
                              {selectedContractRecord.contract?.payout_schedule || "-"}
                            </span>
                          </div>
                        </Col>
                        <Col sm={6}>
                          <div className="rounded-3 border bg-success bg-opacity-10 p-3">
                            <small className="text-muted d-block">Commission Rate</small>
                            <span className="fw-bold text-success">
                              {selectedContractRecord.contract?.commission_rate || "-"}
                            </span>
                          </div>
                        </Col>
                        <Col sm={6}>
                          <div className="rounded-3 border bg-info bg-opacity-10 p-3">
                            <small className="text-muted d-block">Fixed Commission</small>
                            <span className="fw-bold text-info">
                              {selectedContractRecord.contract?.fixed_commission || "-"}
                            </span>
                          </div>
                        </Col>
                        <Col sm={6}>
                          <div className="rounded-3 border bg-warning bg-opacity-10 p-3">
                            <small className="text-muted d-block">Minimum Payout</small>
                            <span className="fw-bold text-warning">
                              {selectedContractRecord.contract?.minimum_payout || "-"}
                            </span>
                          </div>
                        </Col>
                      </Row>
                    </CardBody>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="border shadow-none h-100 mb-0">
                    <CardHeader>
                      <h6 className="mb-0">
                        <i className="ri-history-line me-2 text-dark" />
                        Contract Lifecycle
                      </h6>
                    </CardHeader>
                    <CardBody>
                      <p>
                        <strong>Effective From:</strong>{" "}
                        {selectedContractRecord.contract?.effective_from
                          ? new Date(
                            selectedContractRecord.contract.effective_from,
                          ).toLocaleString()
                          : "-"}
                      </p>
                      <p>
                        <strong>Effective To:</strong>{" "}
                        {selectedContractRecord.contract?.effective_to
                          ? new Date(
                            selectedContractRecord.contract.effective_to,
                          ).toLocaleString()
                          : "-"}
                      </p>
                      <p className="mb-0">
                        <strong>Auto Renew:</strong>{" "}
                        {selectedContractRecord.contract?.auto_renew ? "Yes" : "No"}
                      </p>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={() => setViewModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default UploadContractPage;
