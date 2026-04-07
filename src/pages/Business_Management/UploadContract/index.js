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

const UploadContractPage = () => {
  document.title = "Business Contracts | Kamacaash";

  const dispatch = useDispatch();
  const { withoutContract, withContract } = useSelector(selectContractState);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("without");
  const [uploadModal, setUploadModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  const loadContractLists = async () => {
    setLoading(true);
    try {
      await Promise.all([
        dispatch(getBusinessesWithoutContract()),
        dispatch(getBusinessesWithContract()),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContractLists();
  }, [dispatch]);

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
      name: "Business",
      cell: (row) => (
        <div>
          <div className="fw-semibold">{row.display_name || "-"}</div>
          <small className="text-muted">Owner: {row.owner_name || "-"}</small>
        </div>
      ),
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
      name: "Primary Staff",
      cell: (row) =>
        `${row.primary_staff?.name || "-"} (${row.primary_staff?.phone || "-"})`,
    },
    {
      name: "Action",
      cell: (row) => (
        <Button color="primary" size="sm" onClick={() => openUploadModal(row)}>
          Upload Contract
        </Button>
      ),
    },
  ];

  const withContractColumns = [
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
            className="btn btn-sm btn-light"
          >
            View PDF
          </a>
        ) : (
          "-"
        ),
    },
  ];

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
              <Col md={4}>
                <Button color="light" onClick={loadContractLists} className="w-100">
                  Refresh Lists
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">Contracts</h5>
            <div className="d-flex gap-2">
              <Button
                color={activeTab === "without" ? "primary" : "light"}
                onClick={() => setActiveTab("without")}
              >
                Without Contract ({withoutContractList.length})
              </Button>
              <Button
                color={activeTab === "with" ? "primary" : "light"}
                onClick={() => setActiveTab("with")}
              >
                With Contract ({withContractList.length})
              </Button>
            </div>
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
    </div>
  );
};

export default UploadContractPage;
