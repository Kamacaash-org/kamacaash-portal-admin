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

const TopSavers = () => {
  const [topSavers, setTopSavers] = useState([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const loadSavers = useCallback(async (force = false) => {
    if (!force && fetchedRef.current) {
      return;
    }
    setLoading(true);
    try {
      const res = await AnalyticsAPI.getAdminSavers();
      if (res?.success) {
        setTopSavers(res.data);
        fetchedRef.current = true;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSavers();
  }, [loadSavers]);

  // Aggregate stats on the fly
  const totalRescued = topSavers.reduce((sum, row) => sum + (row.total_offers_rescued || 0), 0);
  const totalSpent = topSavers.reduce((sum, row) => sum + (row.total_spent_minor || 0), 0);
  const leadingSaverName = topSavers[0]?.user_name || "N/A";

  const formatCurrency = (minor) => {
    return `$${(minor / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Reports" pageTitle="Top Savers Leaderboard" />

        {loading ? (
          <Loader />
        ) : (
          <>
            {topSavers.length > 0 && (
              <Row className="g-3 mb-4">
                <Col xl={4} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Total Rescued Packages
                      </small>
                      <h3 className="fw-bold text-info mb-0">{totalRescued} packages</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={4} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Total Volume Rescued
                      </small>
                      <h3 className="fw-bold text-success mb-0">{formatCurrency(totalSpent)}</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={4} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Most Active Saver
                      </small>
                      <h3 className="fw-bold text-primary mb-0">{leadingSaverName}</h3>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            )}

            <Row>
              <Col lg={12}>
                <Card className="border-0 shadow-sm mb-4">
                  <CardHeader className="bg-transparent border-0">
                    <h5 className="card-title mb-0">Top Impact Savers</h5>
                  </CardHeader>
                  <CardBody className="pt-0">
                    {topSavers.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        No saver data found.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table className="align-middle mb-0">
                          <thead>
                            <tr>
                              <th style={{ width: "80px" }}>SQN</th>
                              <th>Customer</th>
                              <th>Total Orders Placed</th>
                              <th>Surplus Packages Rescued</th>
                              <th>Average Rescued / Order</th>
                              <th>Total Amount Spent</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topSavers.slice(0, 10).map((row, idx) => {
                              const avgRescued = row.total_orders_count > 0 
                                ? (row.total_offers_rescued / row.total_orders_count).toFixed(1) 
                                : "0.0";
                              return (
                                <tr key={idx}>
                                  <td className="text-muted">{idx + 1}</td>
                                  <td>
                                    <div className="d-flex align-items-center gap-2">
                                      {row.profile_image_url ? (
                                        <img
                                          src={row.profile_image_url}
                                          className="rounded-circle"
                                          alt=""
                                          style={{ width: 28, height: 28, objectFit: "cover" }}
                                        />
                                      ) : (
                                        <div
                                          className="avatar-xs rounded-circle bg-light d-flex align-items-center justify-content-center fw-bold"
                                          style={{ width: 28, height: 28 }}
                                        >
                                          {row.user_name?.charAt(0)}
                                        </div>
                                      )}
                                      <div>
                                        <div className="fw-semibold">{row.user_name}</div>
                                        <small className="text-muted">{row.user_email}</small>
                                      </div>
                                    </div>
                                  </td>
                                  <td>{row.total_orders_count} orders</td>
                                  <td className="fw-semibold text-info">
                                    {row.total_offers_rescued} offers rescued
                                  </td>
                                  <td>{avgRescued} offers/order</td>
                                  <td className="fw-bold">{row.total_spent_formatted} spent</td>
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

export default TopSavers;
