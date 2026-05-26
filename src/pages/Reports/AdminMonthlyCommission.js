import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Table,
  Button,
  Input
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import Loader from "../../Components/Common/Loader";
import { AnalyticsAPI } from "../../helpers/backend_helper";

const AdminMonthlyCommission = () => {
  const [adminMonthlyYear, setAdminMonthlyYear] = useState(
    new Date().getFullYear()
  );
  const [adminMonthlyData, setAdminMonthlyData] = useState([]);
  const [adminMonthlyLoading, setAdminMonthlyLoading] = useState(false);
  const lastAdminMonthlyYearRef = useRef(null);

  const loadAdminMonthly = useCallback(async (force = false) => {
    if (!force && lastAdminMonthlyYearRef.current === adminMonthlyYear) {
      return;
    }
    setAdminMonthlyLoading(true);
    try {
      const res = await AnalyticsAPI.getAdminMonthly(adminMonthlyYear);
      if (res?.success) {
        setAdminMonthlyData(res.data);
        lastAdminMonthlyYearRef.current = adminMonthlyYear;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminMonthlyLoading(false);
    }
  }, [adminMonthlyYear]);

  useEffect(() => {
    loadAdminMonthly();
  }, [loadAdminMonthly]);

  // Aggregate stats on the fly
  const totalOrders = adminMonthlyData.reduce((sum, row) => sum + (row.orders_count || 0), 0);
  const totalGross = adminMonthlyData.reduce((sum, row) => sum + (row.gross_minor || 0), 0);
  const totalCommission = adminMonthlyData.reduce((sum, row) => sum + (row.commission_minor || 0), 0);
  const totalNet = adminMonthlyData.reduce((sum, row) => sum + (row.net_minor || 0), 0);

  const formatCurrency = (minor) => {
    return `$${(minor / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Reports" pageTitle="Monthly Commission Statement" />

        <Row className="mb-3 align-items-center">
          <Col md={2}>
            <div className="d-flex align-items-center gap-2">
              <label className="text-muted mb-0 text-nowrap">Choose Year:</label>
              <Input
                type="number"
                className="form-control"
                value={adminMonthlyYear}
                onChange={(e) => setAdminMonthlyYear(Number(e.target.value))}
              />
            </div>
          </Col>
          <Col md={2}>
            <Button color="primary" onClick={() => loadAdminMonthly(true)}>
              <i className="ri-filter-3-line align-bottom me-1"></i> Filter
            </Button>
          </Col>
        </Row>

        {adminMonthlyLoading ? (
          <Loader />
        ) : (
          <>
            {adminMonthlyData.length > 0 && (
              <Row className="g-3 mb-4">
                <Col xl={3} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Annual Platform Commissions ({adminMonthlyYear})
                      </small>
                      <h3 className="fw-bold text-danger mb-0">{formatCurrency(totalCommission)}</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={3} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Annual Gross Volume ({adminMonthlyYear})
                      </small>
                      <h3 className="fw-bold text-dark mb-0">{formatCurrency(totalGross)}</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={3} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Annual Vendors Share ({adminMonthlyYear})
                      </small>
                      <h3 className="fw-bold text-success mb-0">{formatCurrency(totalNet)}</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={3} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Annual Orders Filled
                      </small>
                      <h3 className="fw-bold text-info mb-0">{totalOrders}</h3>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            )}

            <Row>
              <Col lg={12}>
                <Card className="border-0 shadow-sm mb-4">
                  <CardHeader className="bg-transparent border-0">
                    <h5 className="card-title mb-0">
                      Monthly Commission Rollup ({adminMonthlyYear})
                    </h5>
                  </CardHeader>
                  <CardBody className="pt-0">
                    {adminMonthlyData.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        No monthly commission data found for this year.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table className="align-middle mb-0">
                          <thead>
                            <tr>
                              <th style={{ width: "80px" }}>SQN</th>
                              <th>Month</th>
                              <th>Total Confirmed Orders</th>
                              <th>Average Orders / Day</th>
                              <th>Average Order Volume</th>
                              <th>Total Gross Volume</th>
                              <th>Platform Commission Slice</th>
                              <th>Vendors Share</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminMonthlyData.slice(0, 10).map((row, idx) => {
                              const avgDailyOrders = (row.orders_count / 30).toFixed(1);
                              const avgOrderValueMinor = row.orders_count > 0 
                                ? Math.round(row.gross_minor / row.orders_count) 
                                : 0;
                              return (
                                <tr key={idx}>
                                  <td className="text-muted">{idx + 1}</td>
                                  <td className="fw-semibold">{row.month_name}</td>
                                  <td>{row.orders_count} orders</td>
                                  <td>{avgDailyOrders} orders/day</td>
                                  <td>{formatCurrency(avgOrderValueMinor)}</td>
                                  <td>{row.gross_formatted}</td>
                                  <td className="text-danger fw-bold">{row.commission_formatted}</td>
                                  <td className="text-success">{row.net_formatted}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>
    </div>
  );
};

export default AdminMonthlyCommission;
