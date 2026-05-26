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

const AdminDailyCommission = () => {
  const [adminDailyDate, setAdminDailyDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [adminDailyData, setAdminDailyData] = useState(null);
  const [adminDailyLoading, setAdminDailyLoading] = useState(false);
  const lastAdminDailyDateRef = useRef(null);

  const loadAdminDaily = useCallback(async (force = false) => {
    if (!force && lastAdminDailyDateRef.current === adminDailyDate) {
      console.log("Skip admin daily fetch: Filter date did not change.");
      return;
    }
    setAdminDailyLoading(true);
    try {
      const res = await AnalyticsAPI.getAdminDaily(adminDailyDate);
      if (res?.success) {
        setAdminDailyData(res.data);
        lastAdminDailyDateRef.current = adminDailyDate;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminDailyLoading(false);
    }
  }, [adminDailyDate]);

  useEffect(() => {
    loadAdminDaily();
  }, [loadAdminDaily]);

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Reports" pageTitle="Daily Commission Ledger" />

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
                value={adminDailyDate}
                onChange={([d]) => {
                  if (d) setAdminDailyDate(d.toISOString().split("T")[0]);
                }}
              />
            </div>
          </Col>
          <Col md={2}>
            <Button color="primary" onClick={() => loadAdminDaily(true)}>
              <i className="ri-filter-3-line align-bottom me-1"></i> Filter
            </Button>
          </Col>
        </Row>

        {adminDailyLoading ? (
          <Loader />
        ) : adminDailyData ? (
          <>
            <Row className="g-3 mb-4">
              <Col xl={4} md={6}>
                <Card className="border-0 shadow-sm bg-light-subtle">
                  <CardBody className="p-3">
                    <small className="text-muted text-uppercase d-block mb-1">
                      Today's Commission Slice
                    </small>
                    <h3 className="fw-bold text-danger mb-0">
                      {adminDailyData.summary?.total_platform_commission_formatted}
                    </h3>
                  </CardBody>
                </Card>
              </Col>
              <Col xl={4} md={6}>
                <Card className="border-0 shadow-sm bg-light-subtle">
                  <CardBody className="p-3">
                    <small className="text-muted text-uppercase d-block mb-1">
                      Today's Gross Volume
                    </small>
                    <h3 className="fw-bold text-dark mb-0">
                      {adminDailyData.summary?.total_gross_revenue_formatted}
                    </h3>
                  </CardBody>
                </Card>
              </Col>
              <Col xl={4} md={6}>
                <Card className="border-0 shadow-sm bg-light-subtle">
                  <CardBody className="p-3">
                    <small className="text-muted text-uppercase d-block mb-1">
                      Total Confirmed Orders
                    </small>
                    <h3 className="fw-bold text-info mb-0">
                      {adminDailyData.summary?.total_confirmed_orders}
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
                {adminDailyData.details?.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    No platform transactions recorded for this date.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table className="align-middle mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: "80px" }}>SQN</th>
                          <th>Time</th>
                          <th>Order Number</th>
                          <th>Business/Provider</th>
                          <th>Gross Amount</th>
                          <th>Platform Commission Slice</th>
                          <th>Vendor Payout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminDailyData.details?.slice(0, 10).map((row, idx) => (
                          <tr key={idx}>
                            <td className="text-muted">{idx + 1}</td>
                            <td>{row.time}</td>
                            <td className="fw-semibold text-primary">{row.order_number}</td>
                            <td>{row.business_name}</td>
                            <td>{row.gross_formatted}</td>
                            <td className="text-danger fw-semibold">
                              {row.commission_formatted}
                            </td>
                            <td className="text-success">{row.net_formatted}</td>
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
            Select filter to load daily commission reports.
          </div>
        )}
      </Container>
    </div>
  );
};

export default AdminDailyCommission;
