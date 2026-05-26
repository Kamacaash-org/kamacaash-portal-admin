import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Table,
  Button
} from "reactstrap";
import Flatpickr from "react-flatpickr";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import Loader from "../../Components/Common/Loader";
import { AnalyticsAPI } from "../../helpers/backend_helper";

const DailyLedger = () => {
  const [vendorDailyDate, setVendorDailyDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [vendorDailyData, setVendorDailyData] = useState(null);
  const [vendorDailyLoading, setVendorDailyLoading] = useState(false);
  const lastDailyDateRef = useRef(null);

  const loadVendorDaily = useCallback(async (force = false) => {
    if (!force && lastDailyDateRef.current === vendorDailyDate) {
      console.log("Skip vendor daily fetch: Filter date did not change.");
      return;
    }
    setVendorDailyLoading(true);
    try {
      const res = await AnalyticsAPI.getVendorDaily(vendorDailyDate);
      if (res?.success) {
        setVendorDailyData(res.data);
        lastDailyDateRef.current = vendorDailyDate;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVendorDailyLoading(false);
    }
  }, [vendorDailyDate]);

  useEffect(() => {
    loadVendorDaily();
  }, [loadVendorDaily]);

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Reports" pageTitle="Daily Ledger" />
        <Row className="mb-3 align-items-center">
          <Col md={3}>
            <div className="d-flex align-items-center gap-2">
              <label className="text-muted mb-0 text-nowrap">Choose Date:</label>
              <Flatpickr
                className="form-control"
                placeholder="Select Date"
                options={{
                  altInput: true,
                  altFormat: "F j, Y",
                  dateFormat: "Y-m-d"
                }}
                value={vendorDailyDate}
                onChange={([d]) => {
                  if (d) setVendorDailyDate(d.toISOString().split("T")[0]);
                }}
              />
            </div>
          </Col>
          <Col md={2}>
            <Button color="primary" onClick={() => loadVendorDaily(true)}>
              <i className="ri-filter-3-line align-bottom me-1"></i> Filter
            </Button>
          </Col>
        </Row>

        {vendorDailyLoading ? (
          <Loader />
        ) : vendorDailyData ? (
          <>
            <Row className="g-3 mb-4">
              <Col xl={3} md={6}>
                <Card className="border-0 shadow-sm bg-light-subtle">
                  <CardBody className="p-3">
                    <small className="text-muted text-uppercase d-block mb-1">Gross Revenue</small>
                    <h3 className="fw-bold text-dark mb-0">
                      {vendorDailyData.summary?.total_gross_revenue_formatted}
                    </h3>
                  </CardBody>
                </Card>
              </Col>
              <Col xl={3} md={6}>
                <Card className="border-0 shadow-sm bg-light-subtle">
                  <CardBody className="p-3">
                    <small className="text-muted text-uppercase d-block mb-1">Platform Commission</small>
                    <h3 className="fw-bold text-danger mb-0">
                      {vendorDailyData.summary?.total_platform_commission_formatted}
                    </h3>
                  </CardBody>
                </Card>
              </Col>
              <Col xl={3} md={6}>
                <Card className="border-0 shadow-sm bg-light-subtle">
                  <CardBody className="p-3">
                    <small className="text-muted text-uppercase d-block mb-1">Net Revenue Payout</small>
                    <h3 className="fw-bold text-success mb-0">
                      {vendorDailyData.summary?.total_net_revenue_formatted}
                    </h3>
                  </CardBody>
                </Card>
              </Col>
              <Col xl={3} md={6}>
                <Card className="border-0 shadow-sm bg-light-subtle">
                  <CardBody className="p-3">
                    <small className="text-muted text-uppercase d-block mb-1">Orders Filled</small>
                    <h3 className="fw-bold text-info mb-0">
                      {vendorDailyData.summary?.total_orders_filled}
                    </h3>
                  </CardBody>
                </Card>
              </Col>
            </Row>

            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-transparent border-0">
                <h5 className="mb-0 card-title">Chronological Transaction Details</h5>
              </CardHeader>
              <CardBody className="pt-0">
                {vendorDailyData.details?.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    No transactions filled for this date.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table className="align-middle mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: "80px" }}>SQN</th>
                          <th>Time</th>
                          <th>Order Number</th>
                          <th>Gross amount</th>
                          <th>Platform Commission</th>
                          <th>Net Payout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorDailyData.details?.slice(0, 10).map((row, idx) => (
                          <tr key={idx}>
                            <td className="text-muted">{idx + 1}</td>
                            <td>{row.time}</td>
                            <td className="fw-semibold text-primary">{row.order_number}</td>
                            <td>{row.gross_formatted}</td>
                            <td className="text-danger">{row.commission_formatted}</td>
                            <td className="text-success fw-bold">{row.net_formatted}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </CardBody>
            </Card>
          </>
        ) : (
          <div className="text-center py-5 text-muted">
            Select filter to load daily reports.
          </div>
        )}
      </Container>
    </div>
  );
};

export default DailyLedger;
