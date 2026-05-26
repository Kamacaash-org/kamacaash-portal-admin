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

const MonthlyStatement = () => {
  const [vendorMonthlyYear, setVendorMonthlyYear] = useState(
    new Date().getFullYear()
  );
  const [vendorMonthlyData, setVendorMonthlyData] = useState([]);
  const [vendorMonthlyLoading, setVendorMonthlyLoading] = useState(false);
  const lastMonthlyYearRef = useRef(null);

  const loadVendorMonthly = useCallback(async (force = false) => {
    if (!force && lastMonthlyYearRef.current === vendorMonthlyYear) {
      return;
    }
    setVendorMonthlyLoading(true);
    try {
      const res = await AnalyticsAPI.getVendorMonthly(vendorMonthlyYear);
      if (res?.success) {
        setVendorMonthlyData(res.data);
        lastMonthlyYearRef.current = vendorMonthlyYear;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVendorMonthlyLoading(false);
    }
  }, [vendorMonthlyYear]);

  useEffect(() => {
    loadVendorMonthly();
  }, [loadVendorMonthly]);

  // Aggregate stats on the fly
  const totalOrders = vendorMonthlyData.reduce((sum, row) => sum + (row.orders_count || 0), 0);
  const totalGross = vendorMonthlyData.reduce((sum, row) => sum + (row.gross_minor || 0), 0);
  const totalCommission = vendorMonthlyData.reduce((sum, row) => sum + (row.commission_minor || 0), 0);
  const totalNet = vendorMonthlyData.reduce((sum, row) => sum + (row.net_minor || 0), 0);

  const formatCurrency = (minor) => {
    return `$${(minor / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Reports" pageTitle="Monthly Statement" />

        <Row className="mb-3 align-items-center">
          <Col md={2}>
            <div className="d-flex align-items-center gap-2">
              <label className="text-muted mb-0 text-nowrap">Choose Year:</label>
              <Input
                type="number"
                className="form-control"
                value={vendorMonthlyYear}
                onChange={(e) => setVendorMonthlyYear(Number(e.target.value))}
              />
            </div>
          </Col>
          <Col md={2}>
            <Button color="primary" onClick={() => loadVendorMonthly(true)}>
              <i className="ri-filter-3-line align-bottom me-1"></i> Filter
            </Button>
          </Col>
        </Row>

        {vendorMonthlyLoading ? (
          <Loader />
        ) : (
          <>
            {vendorMonthlyData.length > 0 && (
              <Row className="g-3 mb-4">
                <Col xl={3} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Annual Gross Volume ({vendorMonthlyYear})
                      </small>
                      <h3 className="fw-bold text-dark mb-0">{formatCurrency(totalGross)}</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={3} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Annual Commission ({vendorMonthlyYear})
                      </small>
                      <h3 className="fw-bold text-danger mb-0">{formatCurrency(totalCommission)}</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={3} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Annual Net Payout ({vendorMonthlyYear})
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
                      Monthly Statement Summary ({vendorMonthlyYear})
                    </h5>
                  </CardHeader>
                  <CardBody className="pt-0">
                    {vendorMonthlyData.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        No monthly statements found for this year.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table className="align-middle mb-0">
                          <thead>
                            <tr>
                              <th style={{ width: "80px" }}>SQN</th>
                              <th>Month</th>
                              <th>Orders Filled</th>
                              <th>Average Order Value (AOV)</th>
                              <th>Gross Volume</th>
                              <th>Platform Commission</th>
                              <th>Net Revenue Payout</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vendorMonthlyData.slice(0, 10).map((row, idx) => {
                              const aovMinor = row.orders_count > 0 
                                ? Math.round(row.gross_minor / row.orders_count) 
                                : 0;
                              return (
                                <tr key={idx}>
                                  <td className="text-muted">{idx + 1}</td>
                                  <td className="fw-semibold">{row.month_name}</td>
                                  <td>{row.orders_count} orders</td>
                                  <td>{formatCurrency(aovMinor)}</td>
                                  <td>{row.gross_formatted}</td>
                                  <td className="text-danger">{row.commission_formatted}</td>
                                  <td className="text-success fw-bold">{row.net_formatted}</td>
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

export default MonthlyStatement;
