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

const TopProviders = () => {
  const [topProviders, setTopProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const loadProviders = useCallback(async (force = false) => {
    if (!force && fetchedRef.current) {
      return;
    }
    setLoading(true);
    try {
      const res = await AnalyticsAPI.getAdminProviders();
      if (res?.success) {
        setTopProviders(res.data);
        fetchedRef.current = true;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  // Aggregate stats on the fly
  const totalSupplied = topProviders.reduce((sum, row) => sum + (row.total_quantity_supplied || 0), 0);
  const topProviderName = topProviders[0]?.business_name || "N/A";
  const providersCount = topProviders.length;

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Reports" pageTitle="Top Providers Leaderboard" />

        {loading ? (
          <Loader />
        ) : (
          <>
            {topProviders.length > 0 && (
              <Row className="g-3 mb-4">
                <Col xl={4} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Total Offers Supplied
                      </small>
                      <h3 className="fw-bold text-dark mb-0">{totalSupplied} packages</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={4} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Leading Provider
                      </small>
                      <h3 className="fw-bold text-primary mb-0">{topProviderName}</h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col xl={4} md={6}>
                  <Card className="border-0 shadow-sm bg-light-subtle">
                    <CardBody className="p-3">
                      <small className="text-muted text-uppercase d-block mb-1">
                        Ranked Providers
                      </small>
                      <h3 className="fw-bold text-info mb-0">{providersCount} active</h3>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            )}

            <Row>
              <Col lg={12}>
                <Card className="border-0 shadow-sm mb-4">
                  <CardHeader className="bg-transparent border-0">
                    <h5 className="card-title mb-0">Top 10 High-Volume Providers</h5>
                  </CardHeader>
                  <CardBody className="pt-0">
                    {topProviders.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        No provider data found.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table className="align-middle mb-0">
                          <thead>
                            <tr>
                              <th style={{ width: "80px" }}>SQN</th>
                              <th>Provider Business</th>
                              <th>Unique Active Packages</th>
                              <th>Average Packages / Offer</th>
                              <th>Total Supplied Quantity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topProviders.slice(0, 10).map((row, idx) => {
                              const avgPackages = row.unique_offers_count > 0 
                                ? (row.total_quantity_supplied / row.unique_offers_count).toFixed(1) 
                                : "0.0";
                              return (
                                <tr key={idx}>
                                  <td className="text-muted">{idx + 1}</td>
                                  <td>
                                    <div className="d-flex align-items-center gap-2">
                                      {row.business_logo ? (
                                        <img
                                          src={row.business_logo}
                                          className="rounded-circle"
                                          alt=""
                                          style={{ width: 28, height: 28, objectFit: "cover" }}
                                        />
                                      ) : (
                                        <div
                                          className="avatar-xs rounded-circle bg-light d-flex align-items-center justify-content-center fw-bold"
                                          style={{ width: 28, height: 28 }}
                                        >
                                          {row.business_name?.charAt(0)}
                                        </div>
                                      )}
                                      <span className="fw-semibold">{row.business_name}</span>
                                    </div>
                                  </td>
                                  <td>{row.unique_offers_count} packages</td>
                                  <td>{avgPackages} packages/offer</td>
                                  <td className="fw-bold text-success">
                                    {row.total_quantity_supplied} units supplied
                                  </td>
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

export default TopProviders;
