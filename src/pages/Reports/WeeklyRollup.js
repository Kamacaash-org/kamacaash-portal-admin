import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Table
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import Loader from "../../Components/Common/Loader";
import { AnalyticsAPI } from "../../helpers/backend_helper";

const WeeklyRollup = () => {
  const [vendorWeeklyData, setVendorWeeklyData] = useState([]);
  const [vendorWeeklyLoading, setVendorWeeklyLoading] = useState(false);
  const lastWeeklyRef = useRef(false);

  const loadVendorWeekly = useCallback(async (force = false) => {
    if (!force && lastWeeklyRef.current) {
      return;
    }
    setVendorWeeklyLoading(true);
    try {
      const res = await AnalyticsAPI.getVendorWeekly();
      if (res?.success) {
        setVendorWeeklyData(res.data);
        lastWeeklyRef.current = true;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVendorWeeklyLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVendorWeekly();
  }, [loadVendorWeekly]);

  // Aggregate stats on the fly
  const totalOrders = vendorWeeklyData.reduce((sum, row) => sum + (row.orders_count || 0), 0);
  const totalGross = vendorWeeklyData.reduce((sum, row) => sum + (row.gross_minor || 0), 0);
  const totalCommission = vendorWeeklyData.reduce((sum, row) => sum + (row.commission_minor || 0), 0);
  const totalNet = vendorWeeklyData.reduce((sum, row) => sum + (row.net_minor || 0), 0);

  const formatCurrency = (minor) => {
    return `$${(minor / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Reports" pageTitle="Weekly Rollup" />

        {vendorWeeklyLoading ? (
          <Loader />
        ) : (
          <>
            {vendorWeeklyData.length > 0 && (
              <Row className="g-3 mb-4">
                <Col xl={3} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        8-Week Gross Revenue
                      </small>
                      <h3 className="fw-bold text-dark mb-0">{formatCurrency(totalGross)}</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={3} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        8-Week Commission Slice
                      </small>
                      <h3 className="fw-bold text-danger mb-0">{formatCurrency(totalCommission)}</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={3} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        8-Week Net Payout
                      </small>
                      <h3 className="fw-bold text-success mb-0">{formatCurrency(totalNet)}</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={3} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Total Orders Filled
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
                    <h5 className="card-title mb-0">Weekly Rollup Details</h5>
                  </CardHeader>
                  <CardBody className="pt-0">
                    {vendorWeeklyData.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        No weekly data recorded.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table className="align-middle mb-0">
                          <thead>
                            <tr>
                              <th style={{ width: "80px" }}>SQN</th>
                              <th>Week Start Date</th>
                              <th>Orders Filled</th>
                              <th>Average Order Value (AOV)</th>
                              <th>Gross Volume</th>
                              <th>Platform Commission</th>
                              <th>Net Revenue Payout</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vendorWeeklyData.slice(0, 10).map((row, idx) => {
                              const aovMinor = row.orders_count > 0 
                                ? Math.round(row.gross_minor / row.orders_count) 
                                : 0;
                              return (
                                <tr key={idx}>
                                  <td className="text-muted">{idx + 1}</td>
                                  <td className="fw-semibold">{row.week_start}</td>
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

export default WeeklyRollup;
