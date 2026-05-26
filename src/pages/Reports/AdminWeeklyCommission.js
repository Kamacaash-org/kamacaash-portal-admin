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

const AdminWeeklyCommission = () => {
  const [adminWeeklyData, setAdminWeeklyData] = useState([]);
  const [adminWeeklyLoading, setAdminWeeklyLoading] = useState(false);
  const lastAdminWeeklyRef = useRef(false);

  const loadAdminWeekly = useCallback(async (force = false) => {
    if (!force && lastAdminWeeklyRef.current) {
      return;
    }
    setAdminWeeklyLoading(true);
    try {
      const res = await AnalyticsAPI.getAdminWeekly();
      if (res?.success) {
        setAdminWeeklyData(res.data);
        lastAdminWeeklyRef.current = true;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminWeeklyLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminWeekly();
  }, [loadAdminWeekly]);

  // Aggregate stats on the fly
  const totalOrders = adminWeeklyData.reduce((sum, row) => sum + (row.orders_count || 0), 0);
  const totalGross = adminWeeklyData.reduce((sum, row) => sum + (row.gross_minor || 0), 0);
  const totalCommission = adminWeeklyData.reduce((sum, row) => sum + (row.commission_minor || 0), 0);
  const totalNet = adminWeeklyData.reduce((sum, row) => sum + (row.net_minor || 0), 0);

  const formatCurrency = (minor) => {
    return `$${(minor / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Reports" pageTitle="Weekly Commission Rollup" />

        {adminWeeklyLoading ? (
          <Loader />
        ) : (
          <>
            {adminWeeklyData.length > 0 && (
              <Row className="g-3 mb-4">
                <Col xl={3} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        8-Week Platform Commissions
                      </small>
                      <h3 className="fw-bold text-danger mb-0">{formatCurrency(totalCommission)}</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={3} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        8-Week Gross Volume
                      </small>
                      <h3 className="fw-bold text-dark mb-0">{formatCurrency(totalGross)}</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={3} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        8-Week Vendors Share
                      </small>
                      <h3 className="fw-bold text-success mb-0">{formatCurrency(totalNet)}</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={3} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Total Confirmed Orders
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
                    <h5 className="card-title mb-0">8-Week Platform Commission Summary</h5>
                  </CardHeader>
                  <CardBody className="pt-0">
                    {adminWeeklyData.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        No weekly data found.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table className="align-middle mb-0">
                          <thead>
                            <tr>
                              <th style={{ width: "80px" }}>SQN</th>
                              <th>Week Start Date</th>
                              <th>Total Confirmed Orders</th>
                              <th>Average Orders / Day</th>
                              <th>Average Order Volume</th>
                              <th>Total Gross Volume</th>
                              <th>Platform Commission Slice</th>
                              <th>Vendors Share</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminWeeklyData.slice(0, 10).map((row, idx) => {
                              const avgDailyOrders = (row.orders_count / 7).toFixed(1);
                              const avgOrderValueMinor = row.orders_count > 0 
                                ? Math.round(row.gross_minor / row.orders_count) 
                                : 0;
                              return (
                                <tr key={idx}>
                                  <td className="text-muted">{idx + 1}</td>
                                  <td className="fw-semibold">{row.week_start}</td>
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

export default AdminWeeklyCommission;
